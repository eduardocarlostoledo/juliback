const { SHIPPING_PROVIDERS } = require("../constants/integrationProviders");
const {
  buildPendingIntegrationResponse,
  ensureSupportedProvider,
} = require("../helpers/integrationResponses");
const {
  getOrderByIdOrThrow,
  ensureOrderAccess,
  serializeOrder,
} = require("../services/orderService");

const SHIPPING_REQUIRED_FIELDS = [
  "orderId",
  "provider",
  "destination.name",
  "destination.address",
  "destination.city",
  "destination.country",
  "packages",
];

const SHIPPING_EXAMPLE = {
  orderId: "UUID-DE-LA-ORDEN",
  provider: "andreani",
  destination: {
    name: "Nombre Cliente",
    email: "cliente@mail.com",
    phone: "5491112345678",
    address: "Av. Siempre Viva 123",
    city: "Buenos Aires",
    state: "Buenos Aires",
    postalCode: "1000",
    country: "Argentina",
  },
  origin: {
    warehouseCode: "MAIN",
    postalCode: "1406",
  },
  packages: [
    {
      sku: "SKU-123",
      quantity: 1,
      weightKg: 0.8,
      widthCm: 20,
      heightCm: 10,
      lengthCm: 30,
      declaredValue: 15000,
    },
  ],
};

const getShippingProviders = (req, res) => {
  res.status(200).json({
    domain: "shipping",
    providers: SHIPPING_PROVIDERS,
  });
};

const getShippingSchema = (req, res) => {
  res.status(200).json({
    implemented: false,
    requiredFields: SHIPPING_REQUIRED_FIELDS,
    examplePayload: SHIPPING_EXAMPLE,
    flow: [
      "Cotizar segun origen, destino, bultos y valor declarado.",
      "Generar envio luego de pago aprobado.",
      "Persistir tracking, etiqueta y provider shipment id.",
      "Exponer tracking al panel admin y al front del cliente.",
    ],
  });
};

const createShippingQuote = (req, res) => {
  res.status(501).json(
    buildPendingIntegrationResponse({
      domain: "shipping",
      provider: req.body?.provider || "unknown",
      action: "create-quote",
      payload: req.body,
      requiredFields: SHIPPING_REQUIRED_FIELDS,
      examplePayload: SHIPPING_EXAMPLE,
      nextSteps: [
        "Normalizar peso y dimensiones desde productos / variantes.",
        "Definir deposito de origen y reglas por carrier.",
        "Persistir cotizaciones seleccionadas en checkout.",
      ],
    })
  );
};

const createShipment = async (req, res) => {
  try {
    const order = await getOrderByIdOrThrow(req.body.orderId);
    ensureOrderAccess(order, req.user);

    await order.update({
      shipping_provider: req.body.provider || null,
      shipping_data: {
        ...(order.shipping_data || {}),
        requestedAt: new Date().toISOString(),
        draftPayload: req.body,
        status: order.estadoEnvio || "pendiente",
      },
    });

    res.status(202).json({
      ...buildPendingIntegrationResponse({
        domain: "shipping",
        provider: req.body?.provider || "unknown",
        action: "create-shipment",
        payload: req.body,
        requiredFields: SHIPPING_REQUIRED_FIELDS,
        examplePayload: SHIPPING_EXAMPLE,
        nextSteps: [
          "Conectar carrier seleccionado luego de pago aprobado.",
          "Persistir shipmentId, tracking code, tracking url y etiqueta.",
        ],
      }),
      order: serializeOrder(order),
    });
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};

const getShipmentByOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await getOrderByIdOrThrow(orderId);
    ensureOrderAccess(order, req.user);

    res.status(200).json({
      orderId: order.id,
      provider: order.shipping_provider || order.trackCarrierName || null,
      status: order.estadoEnvio || "pendiente",
      trackingCode: order.trackSeguimiento || null,
      trackingUrl: order.trackUrl || null,
      carrierName: order.trackCarrierName || null,
      shipping: order.shipping_data || {},
    });
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};

const updateShipmentTracking = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await getOrderByIdOrThrow(orderId);

    await order.update({
      estadoEnvio: req.body.status || order.estadoEnvio,
      shipping_provider: req.body.provider || order.shipping_provider,
      trackSeguimiento: req.body.trackingCode || order.trackSeguimiento,
      trackUrl: req.body.trackingUrl || order.trackUrl,
      trackCarrierName: req.body.carrierName || order.trackCarrierName,
      shipping_data: {
        ...(order.shipping_data || {}),
        updatedAt: new Date().toISOString(),
        lastTrackingUpdate: req.body,
      },
    });

    res.status(200).json({
      message: "Tracking actualizado",
      order: serializeOrder(order),
    });
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};

const getProviderCapabilities = (req, res) => {
  const provider = ensureSupportedProvider(req.params.provider, SHIPPING_PROVIDERS);

  if (!provider) {
    return res.status(404).json({ error: "Proveedor de envios no soportado" });
  }

  return res.status(200).json(provider);
};

const receiveShippingWebhook = (req, res) => {
  const provider = ensureSupportedProvider(req.params.provider, SHIPPING_PROVIDERS);

  if (!provider) {
    return res.status(404).json({ error: "Proveedor de envios no soportado" });
  }

  return res.status(501).json(
    buildPendingIntegrationResponse({
      domain: "shipping",
      provider: provider.code,
      action: "receive-webhook",
      payload: req.body,
      nextSteps: [
        "Validar firma / secreto del carrier.",
        "Actualizar tracking y estado interno de la orden.",
        "Registrar payload crudo para auditoria.",
      ],
    })
  );
};

module.exports = {
  getShippingProviders,
  getShippingSchema,
  createShippingQuote,
  createShipment,
  getShipmentByOrder,
  updateShipmentTracking,
  getProviderCapabilities,
  receiveShippingWebhook,
};
