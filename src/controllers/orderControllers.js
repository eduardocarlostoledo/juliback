const { Order } = require("../db");
const {
  serializeOrder,
  serializeOrders,
  updateOrderById,
} = require("../services/orderService");

async function postOrder(orderData) {
  try {
    const newOrder = await Order.create(orderData);
    console.log("Orden creada:", newOrder);
    return serializeOrder(newOrder);
  } catch (error) {
    console.error("Error creando orden:", error.message);
    throw new Error("No se pudo crear la orden: " + error.message);
  }
}

async function getOrderById(id) {
  try {
    const order = await Order.findByPk(id);
    if (!order) throw new Error("Orden no encontrada.");
    return serializeOrder(order);
  } catch (error) {
    console.error("Error obteniendo orden:", error.message);
    throw new Error("Error obteniendo orden: " + error.message);
  }
}

async function getOrders() {
  try {
    const allOrders = await Order.findAll();
    return serializeOrders(allOrders);
  } catch (error) {
    console.error("Error obteniendo ordenes:", error.message);
    throw new Error("Error obteniendo ordenes: " + error.message);
  }
}

async function getOrdersByUser(userId) {
  try {
    const userOrders = await Order.findAll({ where: { userId } });
    return serializeOrders(userOrders);
  } catch (error) {
    console.error("Error obteniendo ordenes del usuario:", error.message);
    throw new Error("Error obteniendo ordenes del usuario: " + error.message);
  }
}

async function updateOrder(orderId, payload) {
  try {
    const updatedOrder = await updateOrderById(orderId, payload);
    console.log(`Orden ID ${orderId} actualizada.`);
    return updatedOrder;
  } catch (error) {
    console.error(`Error actualizando orden ID ${orderId}:`, error.message);
    throw new Error("Error actualizando orden: " + error.message);
  }
}

module.exports = {
  postOrder,
  getOrders,
  getOrdersByUser,
  updateOrder,
  getOrderById,
};
