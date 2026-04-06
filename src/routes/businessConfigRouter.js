const { Router } = require("express");
const { verificaToken } = require("../helpers/verificaToken");
const { verifyAdmin } = require("../helpers/verifyAdmin");
const {
  getBusinessConfig,
  updateBusinessConfig,
} = require("../controllers/businessConfigController");

const businessConfigRouter = Router();

businessConfigRouter.get("/", getBusinessConfig);

businessConfigRouter.put(
  "/",
  verificaToken,
  verifyAdmin,
  updateBusinessConfig
);

module.exports = { businessConfigRouter };
