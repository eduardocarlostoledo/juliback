const { Router } = require("express");
const orderRouter = Router();
const {
  postOrder,
  getOrders,
  getOrdersByUser,
  updateOrder,
  getOrderById,
} = require("../controllers/orderControllers");
const { verificaToken } = require("../helpers/verificaToken");
const { verifyAdmin } = require("../helpers/verifyAdmin");
const {
  ensureOrderAccess,
  getOrderByIdOrThrow,
} = require("../services/orderService");

orderRouter.patch("/:orderId", verificaToken, verifyAdmin, async (req, res) => {
  const { orderId } = req.params;

  if (!Object.keys(req.body).length) {
    return res
      .status(400)
      .json({ message: "Los datos de actualizacion son obligatorios." });
  }

  try {
    const updatedOrder = await updateOrder(orderId, req.body);
    return res.json(updatedOrder);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error al actualizar la orden", error: error.message });
  }
});

orderRouter.post("/", async (req, res) => {
  try {
    console.log("REQ.BODY POST ORDER", req.body);
    const newOrder = await postOrder(req.body);
    res.status(200).json(newOrder);
  } catch (error) {
    res.status(400).json(error.message);
  }
});

orderRouter.get("/", verificaToken, verifyAdmin, async (req, res) => {
  try {
    const response = await getOrders();
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json("Error Handler Get Order");
  }
});

orderRouter.get("/me", verificaToken, async (req, res) => {
  try {
    const response = await getOrdersByUser(req.user.userId);
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json("Error Handler Get Order");
  }
});

orderRouter.get("/getorderclient/:userId", verificaToken, async (req, res) => {
  const { userId } = req.params;

  try {
    if (!req.user.admin && req.user.userId !== userId) {
      return res
        .status(403)
        .json({ message: "No autorizado para ver estas ordenes." });
    }

    const response = await getOrdersByUser(userId);
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json("Error Handler Get Order");
  }
});

orderRouter.get("/getorderid/:id", verificaToken, async (req, res) => {
  const { id } = req.params;

  try {
    const order = await getOrderByIdOrThrow(id);
    ensureOrderAccess(order, req.user);
    const response = await getOrderById(id);
    res.status(200).json(response);
  } catch (error) {
    res.status(error.status || 400).json("Error Handler Get Order");
  }
});

orderRouter.get("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;

  try {
    const order = await getOrderByIdOrThrow(id);
    ensureOrderAccess(order, req.user);
    const response = await getOrderById(id);
    res.status(200).json(response);
  } catch (error) {
    res.status(error.status || 400).json("Error Handler Get Order");
  }
});

module.exports = { orderRouter };
