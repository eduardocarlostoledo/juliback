const { PAYMENT_PROVIDERS } = require("../constants/integrationProviders");
const {
  buildPendingIntegrationResponse,
  ensureSupportedProvider,
} = require("../helpers/integrationResponses");
const {
  getOrderByIdOrThrow,
  ensureOrderAccess,
  serializeOrder,
} = require("../services/orderService");

const PAYMENT_REQUIRED_FIELDS = [
  "orderId",
  "provider",
  "amount",
  "currency",
  "payer.email",
  "returnUrls.success",
  "returnUrls.failure",
  "returnUrls.pending",
];

const PAYMENT_EXAMPLE = {
  orderId: "UUID-DE-LA-ORDEN",
  provider: "mercadopago",
  amount: 12100,
  currency: "ARS",
  payer: {
    email: "cliente@mail.com",
    name: "Nombre Cliente",
    documentNumber: "30111222",
  },
  returnUrls: {
    success: "https://front.app/success",
    failure: "https://front.app/failure",
    pending: "https://front.app/pending",
  },
  metadata: {
    installments: 1,
    paymentMethod: "credit_card",
  },
};

const getPaymentProviders = (req, res) => {
  res.status(200).json({
    domain: "payment-providers",
    providers: PAYMENT_PROVIDERS,
  });
};

const getPaymentProviderCapabilities = (req, res) => {
  const provider = ensureSupportedProvider(
    req.params.provider,
    PAYMENT_PROVIDERS
  );

  if (!provider) {
    return res.status(404).json({ error: "Proveedor de pago no soportado" });
  }

  return res.status(200).json(provider);
};

const createPaymentIntent = async (req, res) => {
  try {
    const order = await getOrderByIdOrThrow(req.body.orderId);
    ensureOrderAccess(order, req.user);

    await order.update({
      payment_provider: req.body.provider || order.payment_provider,
      payment_provider_data: {
        ...(order.payment_provider_data || {}),
        requestedAt: new Date().toISOString(),
        intentPayload: req.body,
      },
    });

    res.status(202).json({
      ...buildPendingIntegrationResponse({
        domain: "payment-providers",
        provider: req.body?.provider || "unknown",
        action: "create-payment-intent",
        payload: req.body,
        requiredFields: PAYMENT_REQUIRED_FIELDS,
        examplePayload: PAYMENT_EXAMPLE,
        nextSteps: [
          "Separar orquestacion de pagos de la implementacion propia de Mercado Pago.",
          "Persistir payment provider, external id y estado por orden.",
          "Reutilizar esta capa para Mobbex, Todo Pago, Stripe o MODO.",
        ],
      }),
      order: serializeOrder(order),
    });
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};

const capturePayment = (req, res) => {
  res.status(501).json(
    buildPendingIntegrationResponse({
      domain: "payment-providers",
      provider: req.body?.provider || "unknown",
      action: "capture-payment",
      payload: req.body,
      requiredFields: ["provider", "paymentId", "amount"],
      nextSteps: [
        "Agregar soporte de captura manual si el proveedor lo permite.",
      ],
    })
  );
};

const refundPayment = (req, res) => {
  res.status(501).json(
    buildPendingIntegrationResponse({
      domain: "payment-providers",
      provider: req.body?.provider || "unknown",
      action: "refund-payment",
      payload: req.body,
      requiredFields: ["provider", "paymentId", "amount", "reason"],
      nextSteps: [
        "Registrar refund local e impacto sobre orden y facturacion.",
      ],
    })
  );
};

const receivePaymentWebhook = (req, res) => {
  const provider = ensureSupportedProvider(
    req.params.provider,
    PAYMENT_PROVIDERS
  );

  if (!provider) {
    return res.status(404).json({ error: "Proveedor de pago no soportado" });
  }

  return res.status(501).json(
    buildPendingIntegrationResponse({
      domain: "payment-providers",
      provider: provider.code,
      action: "receive-webhook",
      payload: req.body,
      nextSteps: [
        "Validar firma o token secreto del proveedor.",
        "Actualizar ordenes y registrar evento crudo para auditoria.",
      ],
    })
  );
};

module.exports = {
  getPaymentProviders,
  getPaymentProviderCapabilities,
  createPaymentIntent,
  capturePayment,
  refundPayment,
  receivePaymentWebhook,
};
