const { Router } = require("express");
const { verificaToken } = require("../helpers/verificaToken");
const { verifyAdmin } = require("../helpers/verifyAdmin");
const {
  getInvoiceProviders,
  getAfipSchema,
  previewAfipInvoice,
  createAfipInvoice,
  getInvoiceByOrder,
  validateTaxpayer,
} = require("../controllers/invoiceController");

const invoiceRouter = Router();

invoiceRouter.get("/providers", verificaToken, getInvoiceProviders);
invoiceRouter.get("/afip/schema", verificaToken, getAfipSchema);
invoiceRouter.post("/afip/taxpayer/validate", verificaToken, validateTaxpayer);
invoiceRouter.post("/afip/invoices/preview", verificaToken, previewAfipInvoice);
invoiceRouter.post(
  "/afip/invoices",
  verificaToken,
  verifyAdmin,
  createAfipInvoice
);
invoiceRouter.get("/afip/invoices/:orderId", verificaToken, getInvoiceByOrder);

module.exports = { invoiceRouter };
