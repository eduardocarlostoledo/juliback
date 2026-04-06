const { AFIP_INVOICE_TYPES } = require("../constants/integrationProviders");
const {
  buildPendingIntegrationResponse,
} = require("../helpers/integrationResponses");
const {
  getOrderByIdOrThrow,
  ensureOrderAccess,
  serializeOrder,
} = require("../services/orderService");

const AFIP_REQUIRED_ENV = [
  "AFIP_CUIT",
  "AFIP_CERT_PATH",
  "AFIP_KEY_PATH",
  "AFIP_POINT_OF_SALE",
  "AFIP_ENVIRONMENT",
];

const AFIP_INVOICE_REQUIRED_FIELDS = [
  "orderId",
  "invoiceType",
  "pointOfSale",
  "concept",
  "customer.documentType",
  "customer.documentNumber",
  "customer.taxCondition",
  "totals.netAmount",
  "totals.vatAmount",
  "totals.totalAmount",
  "currency.code",
  "currency.rate",
  "items",
];

const AFIP_INVOICE_EXAMPLE = {
  orderId: "UUID-DE-LA-ORDEN",
  invoiceType: 6,
  pointOfSale: 1,
  concept: 1,
  customer: {
    name: "Nombre Cliente",
    email: "cliente@mail.com",
    documentType: 96,
    documentNumber: "30111222",
    taxCondition: "consumidor_final",
  },
  totals: {
    netAmount: 10000,
    vatAmount: 2100,
    exemptAmount: 0,
    tributesAmount: 0,
    totalAmount: 12100,
  },
  currency: {
    code: "PES",
    rate: 1,
  },
  items: [
    {
      productId: "UUID-PRODUCTO",
      description: "Producto facturable",
      quantity: 1,
      unitPrice: 10000,
      vatRate: 21,
    },
  ],
};

const getInvoiceProviders = (req, res) => {
  res.status(200).json({
    domain: "billing",
    providers: [
      {
        code: "afip",
        label: "AFIP WSFEv1",
        status: "planned",
        supportedInvoiceTypes: AFIP_INVOICE_TYPES,
      },
    ],
  });
};

const getAfipSchema = (req, res) => {
  res.status(200).json({
    provider: "afip",
    implemented: false,
    environmentVariables: AFIP_REQUIRED_ENV,
    requiredFields: AFIP_INVOICE_REQUIRED_FIELDS,
    examplePayload: AFIP_INVOICE_EXAMPLE,
    flow: [
      "Validar datos fiscales del cliente y la orden.",
      "Calcular importes gravados, IVA, exentos y tributos.",
      "Solicitar ultimo comprobante autorizado por punto de venta y tipo.",
      "Emitir comprobante via WSFEv1 y persistir CAE, vencimiento y numero.",
      "Asociar PDF / representacion impresa a la orden para el front.",
    ],
  });
};

const previewAfipInvoice = (req, res) => {
  res.status(501).json(
    buildPendingIntegrationResponse({
      domain: "billing",
      provider: "afip",
      action: "preview-invoice",
      payload: req.body,
      requiredFields: AFIP_INVOICE_REQUIRED_FIELDS,
      examplePayload: AFIP_INVOICE_EXAMPLE,
      nextSteps: [
        "Vincular ordenes pagadas con datos fiscales del comprador.",
        "Persistir snapshot fiscal por orden antes de emitir.",
        "Conectar autenticacion WSAA y emision WSFEv1.",
      ],
      notes: [
        "AFIP no usa webhooks; la emision es sincrona o por cola interna.",
        "Conviene guardar CAE, CAE vencimiento, numero de comprobante y PDF.",
      ],
    })
  );
};

const createAfipInvoice = async (req, res) => {
  try {
    const order = await getOrderByIdOrThrow(req.body.orderId);

    await order.update({
      invoice_provider: "afip",
      invoice_status: "pending",
      invoice_data: {
        ...(order.invoice_data || {}),
        requestedAt: new Date().toISOString(),
        draftPayload: req.body,
      },
    });

    res.status(202).json({
      ...buildPendingIntegrationResponse({
        domain: "billing",
        provider: "afip",
        action: "create-invoice",
        payload: req.body,
        requiredFields: AFIP_INVOICE_REQUIRED_FIELDS,
        examplePayload: AFIP_INVOICE_EXAMPLE,
        nextSteps: [
          "Agregar tabla de invoices o extender order con metadatos fiscales.",
          "Emitir comprobante luego de confirmar pago aprobado.",
          "Exponer al front el estado de facturacion y descarga PDF.",
        ],
      }),
      order: serializeOrder(order),
    });
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};

const getInvoiceByOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await getOrderByIdOrThrow(orderId);
    ensureOrderAccess(order, req.user);

    res.status(200).json({
      orderId: order.id,
      provider: order.invoice_provider || "afip",
      status: order.invoice_status || "not_requested",
      invoice: order.invoice_data || {},
    });
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};

const validateTaxpayer = (req, res) => {
  res.status(501).json(
    buildPendingIntegrationResponse({
      domain: "billing",
      provider: "afip",
      action: "validate-taxpayer",
      payload: req.body,
      requiredFields: ["documentNumber", "documentType"],
      examplePayload: {
        documentNumber: "20123456789",
        documentType: 80,
      },
      nextSteps: [
        "Consultar padron AFIP o servicio intermedio para validar CUIT/CUIL.",
        "Resolver condicion fiscal para automatizar tipo de comprobante.",
      ],
    })
  );
};

module.exports = {
  getInvoiceProviders,
  getAfipSchema,
  previewAfipInvoice,
  createAfipInvoice,
  getInvoiceByOrder,
  validateTaxpayer,
};
