const { Router } = require("express");
const { verificaToken } = require("../helpers/verificaToken");
const { verifyAdmin } = require("../helpers/verifyAdmin");
const {
  getPaymentProviders,
  getPaymentProviderCapabilities,
  createPaymentIntent,
  capturePayment,
  refundPayment,
  receivePaymentWebhook,
} = require("../controllers/paymentProviderController");

const paymentProviderRouter = Router();

paymentProviderRouter.get("/providers", verificaToken, getPaymentProviders);
paymentProviderRouter.get(
  "/providers/:provider/capabilities",
  verificaToken,
  getPaymentProviderCapabilities
);
paymentProviderRouter.post("/intents", verificaToken, createPaymentIntent);
paymentProviderRouter.post(
  "/capture",
  verificaToken,
  verifyAdmin,
  capturePayment
);
paymentProviderRouter.post(
  "/refunds",
  verificaToken,
  verifyAdmin,
  refundPayment
);
paymentProviderRouter.post("/webhooks/:provider", receivePaymentWebhook);

module.exports = { paymentProviderRouter };
