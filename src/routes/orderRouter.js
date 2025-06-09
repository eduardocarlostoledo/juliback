const { Order } = require("../db");
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


orderRouter.patch("/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { status, estadoEnvio, payment_type, buyer_address, buyer_phone, trackSeguimiento, trackUrl, trackCarrierName } = req.body;

  console.log("orderId", orderId, status, estadoEnvio, payment_type, buyer_address, buyer_phone, trackSeguimiento, trackUrl, trackCarrierName);

  // Validar que el cuerpo de la petición no esté vacío
  if (!Object.keys(req.body).length) {
    return res.status(400).json({ message: "Los datos de actualización son obligatorios." });
  }

  try {
    const updatedOrder = await updateOrder(orderId, status, estadoEnvio, payment_type, buyer_address, buyer_phone, trackSeguimiento, trackUrl, trackCarrierName);
    return res.json(updatedOrder);
  } catch (error) {
    return res.status(500).json({ message: "Error al actualizar la orden", error: error.message });
  }
});




// orderRouter.post('/', async (req,res) => {
//     try {
//         console.log("REQ.BODY POST CART", req.body)
//         const newOrder=await postOrder(req.body)
//         res.status(200).json(newOrder)
//     } catch (error) {
//         res.status(400).json(error.message)
//     }
// })

/* Este post crea los orders por Insomia, después que se crean algunos, 
    comenten este post y descomenten el de arriba que funciona con payRouter*/

orderRouter.post("/", async (req, res) => {
  try {
    console.log("REQ.BODY POST CART", req.body);
    const { cartUserId, paymentId, statusId, merchantOrderId } = req.body;
    const newOrder = await postOrder(
      cartUserId,
      paymentId,
      statusId,
      merchantOrderId
    );
    res.status(200).json(newOrder);
  } catch (error) {
    res.status(400).json(error.message);
  }
});

orderRouter.get("/", verificaToken, verifyAdmin, async (req, res) => {
  console.log("solicitando ruta /getorder");
  try {
    const response = await getOrders();

    res.status(201).json(response);
  } catch (error) {
    res.status(400).json("Error Handler Get Order");
  }
});

//se solicitan todas las ordenes del cliente
orderRouter.get("/getorderclient/:userId", async (req, res) => {
  console.log("1 getorderclient /getorderclient/:userId", req.params.userId);
  const { userId } = req.params;
  try {
    const response = await getOrdersByUser(userId);
    res.status(201).json(response);
  } catch (error) {
    res.status(400).json("Error Handler Get Order");
  }
});

//se solicitan todas las ordenes del cliente
orderRouter.get("/getorderid/:id", async (req, res) => {
  console.log("1 getorderid ", req.params.id);
  const { id } = req.params;
  try {
    const response = await getOrderById(id);

    res.status(201).json(response);
  } catch (error) {
    res.status(400).json("Error Handler Get Order");
  }
});

module.exports = { orderRouter };
