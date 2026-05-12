const axios = require("axios");
const crypto = require("crypto");
const mercadopago = require("mercadopago");
const { Preference } = require("mercadopago");
const {
  normalizeBuyerAddress,
  normalizeOrderProducts,
} = require("./orderService");

const ACCESS_TOKEN_MERCADOPAGO = process.env.ACCESS_TOKEN_MERCADOPAGO;

const mercadopagoClient = ACCESS_TOKEN_MERCADOPAGO
  ? new mercadopago.MercadoPagoConfig({
      accessToken: ACCESS_TOKEN_MERCADOPAGO,
    })
  : null;

const ensureMercadoPagoConfigured = () => {
  if (!mercadopagoClient) {
    throw new Error("ACCESS_TOKEN_MERCADOPAGO no esta configurado.");
  }

  return mercadopagoClient;
};

const getPaymentIdFromWebhook = (req) =>
  req.body?.data?.id ||
  req.body?.id ||
  req.query?.["data.id"] ||
  req.query?.id ||
  null;

const getMercadoPagoPayment = async (paymentId) => {
  const response = await axios.get(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN_MERCADOPAGO}`,
      },
    }
  );

  return response.data;
};

const normalizeBaseUrl = (url) => url?.trim().replace(/\/$/, "") || "";

const isHttpsUrl = (url) => {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
};

const getMercadoPagoWebhookUrl = () => {
  const webhookUrl = normalizeBaseUrl(process.env.WEB_HOOK_MERCADOPAGO);

  if (isHttpsUrl(webhookUrl)) {
    return webhookUrl;
  }

  if (webhookUrl) {
    console.warn(
      "Mercado Pago: WEB_HOOK_MERCADOPAGO debe ser una URL HTTPS publica. Se ignora en este entorno."
    );
  }

  return "";
};

const buildMercadoPagoReturnConfig = () => {
  const backUrl = normalizeBaseUrl(process.env.BACK);
  const webhookUrl = getMercadoPagoWebhookUrl();

  if (!isHttpsUrl(backUrl)) {
    console.warn(
      "Mercado Pago: BACK debe ser una URL HTTPS publica para back_urls y auto_return. Se omiten en este entorno."
    );
    return webhookUrl ? { notification_url: webhookUrl } : {};
  }

  return {
    back_urls: {
      success: `${backUrl}/pay/feedback/success`,
      failure: `${backUrl}/pay/feedback/failure`,
      pending: `${backUrl}/pay/feedback/pending`,
    },
    ...(webhookUrl ? { notification_url: webhookUrl } : {}),
    auto_return: "approved",
  };
};

const parseMercadoPagoSignatureHeader = (signatureHeader = "") =>
  signatureHeader.split(",").reduce((acc, part) => {
    const [key, value] = part.split("=");

    if (key && value) {
      acc[key.trim()] = value.trim();
    }

    return acc;
  }, {});

const safeCompareHex = (currentHash, expectedHash) => {
  if (!currentHash || !expectedHash || currentHash.length !== expectedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(currentHash, "hex"),
    Buffer.from(expectedHash, "hex")
  );
};

const verifyMercadoPagoWebhookSignature = (req) => {
  const secret = process.env.WEB_HOOK_MERCADOPAGO_SECRET;

  if (!secret) {
    console.warn(
      "Mercado Pago: WEB_HOOK_MERCADOPAGO_SECRET no esta configurado. Se omite validacion de firma."
    );
    return true;
  }

  const xSignature = req.headers["x-signature"];
  const xRequestId = req.headers["x-request-id"];
  const { ts, v1 } = parseMercadoPagoSignatureHeader(xSignature);
  const dataId = req.query?.["data.id"] || req.body?.data?.id || req.body?.id;

  if (!dataId || !xRequestId || !ts || !v1) {
    return false;
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expectedHash = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return safeCompareHex(v1, expectedHash);
};

const buildMercadoPagoPreferenceBody = ({ order, user }) => {
  const buyerAddress = normalizeBuyerAddress(order.buyer_address);
  const normalizedProducts = normalizeOrderProducts(order.products);

  return {
    items: normalizedProducts.map((product) => ({
      id: String(product.prodId),
      title: product.product_name,
      quantity: product.product_amount,
      unit_price: product.product_unit_price,
      currency_id: "ARS",
    })),
    ...buildMercadoPagoReturnConfig(),
    external_reference: order.id,
    payer: {
      email: user.email,
      name: user.name || "",
      surname: user.lastname || "",
      phone: {
        area_code: "54",
        number: user.phonenumber || "",
      },
      identification: {
        type: "DNI",
        number: user.dni || "",
      },
      address: {
        street_name: buyerAddress.address || "",
        street_number: null,
        zip_code: user.zipcode || "",
      },
    },
    shipments: {
      receiver_address: {
        address_line: buyerAddress.address,
        city_name: buyerAddress.city,
        state_name: buyerAddress.state,
        country_name: buyerAddress.country,
      },
    },
  };
};

const createMercadoPagoPreference = async ({ order, user }) => {
  const preferenceClient = new Preference(ensureMercadoPagoConfigured());

  return preferenceClient.create({
    body: buildMercadoPagoPreferenceBody({ order, user }),
  });
};

const summarizeMercadoPagoPayment = (paymentData = {}) => ({
  id: paymentData.id?.toString() || null,
  externalReference: paymentData.external_reference || null,
  status: paymentData.status || null,
  statusDetail: paymentData.status_detail || null,
  paymentType: paymentData.payment_type_id || null,
  processingMode: paymentData.processing_mode || null,
  siteId: paymentData.site_id || null,
  merchantOrderId: paymentData.order?.id?.toString() || null,
  dateApproved: paymentData.date_approved || null,
  payerEmail: paymentData.payer?.email || null,
});

const buildMercadoPagoOrderUpdate = (paymentData = {}) => ({
  payment_provider: "mercadopago",
  payment_provider_reference: paymentData.id?.toString() || null,
  payment_provider_data: summarizeMercadoPagoPayment(paymentData),
  payment_id: paymentData.id?.toString() || null,
  merchant_order_id: paymentData.order?.id?.toString() || null,
  status: paymentData.status || null,
  payment_type: paymentData.payment_type_id || null,
  processing_mode: paymentData.processing_mode || null,
  site_id: paymentData.site_id || null,
});

module.exports = {
  getPaymentIdFromWebhook,
  getMercadoPagoPayment,
  createMercadoPagoPreference,
  buildMercadoPagoOrderUpdate,
  summarizeMercadoPagoPayment,
  verifyMercadoPagoWebhookSignature,
};
