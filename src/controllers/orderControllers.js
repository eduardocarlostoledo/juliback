const { where } = require("sequelize");
const { Order, Product, User } = require("../db");

async function updateProductStock(prodId, product_amount) {
  try {
    const product = await Product.findOne({ where: { id: prodId } });
    if (!product) throw new Error(`Producto con ID ${prodId} no encontrado.`);

    const newStock = product.stock - product_amount;
    if (newStock <= 0) {
      await Product.update({ status: false, stock: 0 }, { where: { id: prodId } });
    } else {
      await Product.update({ stock: newStock }, { where: { id: prodId } });
    }
    console.log(`Stock actualizado para producto ID ${prodId}: ${newStock}`);
  } catch (error) {
    console.error(`Error actualizando stock para producto ID ${prodId}: ${error.message}`);
  }
}

async function postOrder(orderData) {
  try {
    const newOrder = await Order.create(orderData);
    console.log("Orden creada:", newOrder);
    return newOrder;
  } catch (error) {
    console.error("Error creando orden:", error.message);
    throw new Error("No se pudo crear la orden: " + error.message);
  }
}

async function getOrderById(id) { 

  try {
    const order = await Order.findByPk(id);
    if (!order) throw new Error("Orden no encontrada.");
    return order;
  } catch (error) {
    console.error("Error obteniendo orden:", error.message);
    throw new Error("Error obteniendo orden: " + error.message);
  }
}

async function getOrders() {
  try {
    const allOrders = await Order.findAll();
    if (!allOrders.length) throw new Error("No existen órdenes activas.");
    return allOrders;
  } catch (error) {
    console.error("Error obteniendo órdenes:", error.message);
    throw new Error("Error obteniendo órdenes: " + error.message);
  }
}

async function getOrdersByUser(userId) {
  try {
    const userOrders = await Order.findAll({ where: { userId } });
    if (!userOrders.length) throw new Error("El usuario no tiene órdenes activas.");
    return userOrders;
  } catch (error) {
    console.error("Error obteniendo órdenes del usuario:", error.message);
    throw new Error("Error obteniendo órdenes del usuario: " + error.message);
  }
}

async function updateOrder(orderId, status, estadoEnvio, payment_type, buyer_address, buyer_phone, trackSeguimiento, trackUrl, trackCarrierName) {
  try {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error("Orden no encontrada.");

    // Actualizar la orden correctamente
    await Order.update(
      {
        status,
        estadoEnvio,
        payment_type,
        buyer_address: JSON.stringify(buyer_address), // Convertir a string si usa JSON en la BD
        buyer_phone,
        trackSeguimiento,
        trackUrl,
        trackCarrierName,
      },
      { where: { id: orderId } } // Especificar la condición de actualización
    );

    console.log(`Orden ID ${orderId} actualizada:`, status, estadoEnvio, payment_type, buyer_address, buyer_phone, trackSeguimiento, trackUrl, trackCarrierName);

    return await Order.findByPk(orderId); // Retornar la orden actualizada
  } catch (error) {
    console.error(`Error actualizando orden ID ${orderId}:`, error.message);
    throw new Error("Error actualizando orden: " + error.message);
  }
}



module.exports = { postOrder, getOrders, updateProductStock, getOrdersByUser, updateOrder, getOrderById };


// reescrito 04-01-2025
// const { where } = require("sequelize");
// const { Order, Product, User } = require("../db");


// async function updateProductStock(prodId, product_amount) {
//   try {
//     const product = await Product.findOne({ where: { id: prodId } });

//     if (product) {
//       const newStock = product.stock - product_amount;

//       newStock <= 0 ? await Product.update({status: false}, { where: { id: prodId } }) : null

//       await Product.update({ stock: newStock }, { where: { id: prodId } });

//       console.log(
//         `El stock del producto con ID ${prodId} se ha actualizado a ${newStock}.`
//       );
//     } else {
//       console.log(`No se encontró un producto con ID ${prodId}.`);
//     }
//   } catch (error) {
//     console.log(
//       `Error al actualizar el stock del producto con ID ${prodId}: ${error.message}`
//     );
//   }
// }

// const postOrder = async (
//     paymentId,
//     statusId,
//     merchantOrderId,
//     product_description,     
//     total_order_price,      
//     prodId,
//     buyer_email,
//     product_name,
//     product_image,
//     product_amount,
//     product_unit_price) => {  

//   try {    

//     console.log("datos de la orden", paymentId,
//       statusId,
//       merchantOrderId,
//       product_description,     
//       total_order_price,      
//       prodId,
//       buyer_email,
//       product_name,
//       product_image,
//       product_amount,
//       product_unit_price);

//     const newOrder = await Order.create({
//         paymentId,
//         statusId,
//         merchantOrderId,
//         product_description,     
//         total_order_price,      
//         prodId,
//         buyer_email,
//         product_name,
//         product_image,
//         product_amount,
//         product_unit_price
//     });
//     console.log("POST CONTROLLER CREATED ORDER", newOrder);
//     return newOrder;
//   } catch (error) {
//     throw Error(error.message);
//   }
// };

// const getOrders = async () => {
//   try {
//     let allorders = await Order.findAll();     
//     // const result = allorders.map((order) => {
//     //   return {
//     //     id: order.id,
//     //     userId: order.userId,     
//     //     buyer_email: order.buyer_email,
//     //     buyer_name: order.buyer_name,
//     //     buyer_lastname: order.buyer_lastname,
//     //     buyer_phone: order.buyer_phone,
//     //     buyer_address: order.buyer_address,    
//     //     products: order.products,    
//     //     total_order_price: order.total_order_price,
//     //     payment_id: order.payment_id,
//     //     merchant_order_id: order.merchant_order_id,
//     //     status: order.statusId,
//     //     estadoEnvio: order.estadoEnvio,
//     //     createdAt: order.createdAt,        
//     //     total_order_price: order.total_order_price,
//     //     payment_type: order.payment_type,
//     //   };
//     // }
//     // );
//     // return result;
    
//     if (!allorders) {
//       throw new Error("El no existenordenes activas.");
//     }
// else return allorders;
//   } catch (error) {
//     throw new Error("Error retrieving orders: " + error.message);
//   }
// };


// const getOrdersByUser = async (userId) => {
//   try {
//     let allorders = await Order.findAll({where: {userId: userId}});  
    
//     if (!allorders) {
//       throw new Error("El usuario no tiene un ordenes activas.");
//     }


//     return allorders;
//   } catch (error) {
//     throw new Error("Error retrieving orders: " + error.message);
//   }
// };

// module.exports = { postOrder, getOrders, updateProductStock, getOrdersByUser };
