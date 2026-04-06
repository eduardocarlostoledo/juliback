const { Router } = require("express");
const { verificaToken } = require("../helpers/verificaToken");
const { verifyAdmin } = require("../helpers/verifyAdmin");
const {
  getShippingProviders,
  getShippingSchema,
  createShippingQuote,
  createShipment,
  getShipmentByOrder,
  updateShipmentTracking,
  getProviderCapabilities,
  receiveShippingWebhook,
} = require("../controllers/shippingController");

const shippingRouter = Router();

shippingRouter.get("/providers", verificaToken, getShippingProviders);
shippingRouter.get("/schema", verificaToken, getShippingSchema);
shippingRouter.get(
  "/providers/:provider/capabilities",
  verificaToken,
  getProviderCapabilities
);
shippingRouter.post("/quotes", verificaToken, createShippingQuote);
shippingRouter.post("/shipments", verificaToken, createShipment);
shippingRouter.get("/shipments/:orderId", verificaToken, getShipmentByOrder);
shippingRouter.patch(
  "/shipments/:orderId/tracking",
  verificaToken,
  verifyAdmin,
  updateShipmentTracking
);
shippingRouter.post("/webhooks/:provider", receiveShippingWebhook);

module.exports = { shippingRouter };
