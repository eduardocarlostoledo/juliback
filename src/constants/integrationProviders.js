const AFIP_INVOICE_TYPES = [
  { code: 1, label: "Factura A" },
  { code: 6, label: "Factura B" },
  { code: 11, label: "Factura C" },
];

const SHIPPING_PROVIDERS = [
  {
    code: "mercadoenvios",
    label: "Mercado Envios",
    status: "planned",
    capabilities: ["quotes", "shipments", "tracking"],
  },
  {
    code: "correoargentino",
    label: "Correo Argentino",
    status: "planned",
    capabilities: ["quotes", "shipments", "tracking"],
  },
  {
    code: "andreani",
    label: "Andreani",
    status: "planned",
    capabilities: ["quotes", "shipments", "tracking"],
  },
];

const PAYMENT_PROVIDERS = [
  {
    code: "mercadopago",
    label: "Mercado Pago",
    status: "active",
    capabilities: ["checkout", "webhooks", "refunds"],
  },
  {
    code: "mobbex",
    label: "Mobbex",
    status: "planned",
    capabilities: ["checkout", "webhooks", "refunds"],
  },
  {
    code: "todo-pago",
    label: "Todo Pago",
    status: "planned",
    capabilities: ["checkout", "webhooks", "refunds"],
  },
  {
    code: "modo",
    label: "MODO / DEBIN",
    status: "planned",
    capabilities: ["checkout", "webhooks"],
  },
  {
    code: "stripe",
    label: "Stripe",
    status: "planned",
    capabilities: ["checkout", "webhooks", "refunds"],
  },
];

module.exports = {
  AFIP_INVOICE_TYPES,
  SHIPPING_PROVIDERS,
  PAYMENT_PROVIDERS,
};
