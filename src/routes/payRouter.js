const { Router } = require("express");
const { Preference } = require("mercadopago");
const payRouter = Router();
const mercadopago = require("mercadopago");
const { deleteAllCart } = require("../controllers/cartController");
//const enviarMail = require("../mail/nodemail");
const {
  postOrder,
  updateProductStock,
} = require("../controllers/orderControllers");
const { Cart } = require("../db");
const { User } = require("../db");
const { Order } = require("../db");
const { UUID, where } = require("sequelize");

// Configuración de MercadoPago
const ACCESS_TOKEN_MERCADOPAGO = process.env.ACCESS_TOKEN_MERCADOPAGO;

let mercadopagoClient;

if (ACCESS_TOKEN_MERCADOPAGO) {
  mercadopagoClient = new mercadopago.MercadoPagoConfig({
    accessToken: ACCESS_TOKEN_MERCADOPAGO,
  });
} else {
  console.error(
    "Error: ACCESS_TOKEN_MERCADOPAGO no está definido en el archivo .env"
  );
}

payRouter.post("/preference", (req, res) => {
  //console.log(mercadopago)
  //console.log("LLEGA REQ.BODY 0", req.body[0],"1", req.body[1]);

  // Extraer los datos correctamente
  const products = req.body.slice(0, -1); // Todos los elementos excepto el último
  const { total_order_price, datos_Comprador } = req.body[req.body.length - 1]; // El último elemento

  //console.log("APAREZCO!!!!!!!!!!! ", datos_Comprador);

  // Crear el objeto arrayPreference
  let arrayPreference = {
    product_description: "description",
    total_order_price,
    prodId: products[0]?.prodId, // Tomar el prodId del primer producto
    datos_Comprador,
    product_name: products[0]?.product_name,
    product_image: products[0]?.product_image,
    product_amount: products[0]?.product_amount,
    product_unit_price: products[0]?.product_unit_price,
  };

  //console.log("TENGO PREFERENCE", arrayPreference);

  // Crear el array de productos
  arrayProducts = products.map((prod) => ({
    id: prod.prodId,
    amount: prod.product_amount,
  }));

  //console.log("ACA ESTOY!!!!!!!!!", arrayProducts);

  res.status(200).json({ message: "Preference data received" });
});

payRouter.post("/create_preference", async (req, res) => {
  try {
    const { orderData, preferencia } = req.body;

    // Validar datos recibidos
    if (!orderData || !preferencia) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    // Buscar el usuario en la base de datos
    const user = await User.findOne({
      where: { email: orderData.datos_Comprador.email },
    });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Buscar el carrito del usuario
    const cart = await Cart.findOne({ where: { cartUserId: user.id } });
    if (!cart) {
      return res.status(404).json({ error: "Carrito no encontrado" });
    }

    // Crear la orden en la base de datos
    const newOrder = await Order.create({
      userId: user.id,
      cartId: cart.id,
      buyer_email: user.email,
      buyer_name: orderData.datos_Comprador.name,
      buyer_lastname: orderData.datos_Comprador.lastname,
      buyer_phone: orderData.datos_Comprador.phone,
      buyer_address: {
        address: orderData.datos_Comprador.address,
        state: orderData.datos_Comprador.state,
        city: orderData.datos_Comprador.city,
        country: orderData.datos_Comprador.country,
      },
      products: preferencia,
      total_order_price: orderData.total_order_price,
    });

    // Crear la preferencia de MercadoPago
    const instanciaPreferencia = new Preference(mercadopagoClient);
    
    const preferenciaPayload = {
      items: preferencia.map((prod) => ({
        id: prod.prodId,
        title: prod.product_name,
        quantity: prod.product_amount,
        unit_price: prod.product_unit_price,
      })),
      back_urls: {
        success: `${process.env.BACK}/pay/feedback/success`,
        failure: `${process.env.BACK}/pay/feedback/failure`,
        pending: `${process.env.BACK}/pay/feedback/pending`,
      },
      auto_return: "approved",
      external_reference: newOrder.id,
      payer: {
        phone: { area_code: "", number: orderData.datos_Comprador.phone },
        email: orderData.datos_Comprador.email,
        identification: { number: "", type: "" },
        name: orderData.datos_Comprador.name,
        surname: orderData.datos_Comprador.lastname,
      },
      shipments: {
        receiver_address: {
          address: orderData.datos_Comprador.address,
          state: orderData.datos_Comprador.state,
          city_name: orderData.datos_Comprador.city,
          country_name: orderData.datos_Comprador.country,
        },
      },
    };
    
    console.log("🟢 Payload enviado a MercadoPago:", JSON.stringify(preferenciaPayload, null, 2));
    
    const response = await mercadopago.preferences.create(preferenciaPayload);
    

    // Devolver el ID de la preferencia
    res.status(200).json({ id: response.id });
  } catch (error) {
    console.error("Error en /create_preference:", error);
    res.status(500).json({ error: "Error al crear la preferencia" });
  }
});

payRouter.get("/feedback/success", async (req, res) => {
  try {
    const {
      collection_id,
      collection_status,
      payment_id,
      status,
      external_reference,
      payment_type,
      merchant_order_id,
      preference_id,
      site_id,
      processing_mode,
    } = req.query;

    // Validar que la referencia externa esté presente
    if (!external_reference) {
      throw new Error("Falta la referencia externa");
    }

    // Buscar la orden en la base de datos
    const order = await Order.findOne({ where: { id: external_reference } });
    if (!order) {
      throw new Error(`No se encontró la orden con ID: ${external_reference}`);
    }
console.log("ORDEN prev", order.products);
    // Actualizar la orden con los datos del pago
    await order.update({
      payment_id,
      merchant_order_id,
      status,
      preference_id,
      payment_type,
      processing_mode,
      site_id,
    });
    console.log("ORDEN post", order);
    // Actualizar el stock de los productos
    for (const product of order.products) {
      await updateProductStock(product.prodId, product.product_amount);
    }

    
    // Eliminar el carrito después de una compra exitosa
    await deleteAllCart(order.userId);
    
    // Renderizar la página de éxito
    res.redirect(`${process.env.FRONT}/success?payment_id=${payment_id}&status=${status}&merchant_order_id=${merchant_order_id}`);
    // res.send(`
    //   <!DOCTYPE html>
    //   <html>
    //     <head>
    //       <title>Pago Exitoso</title>
    //       <link rel="stylesheet" type="text/css" href="./payStyles/succes.css">
    //     </head>
    //     <body>
    //       <h1>¡Pago Exitoso!</h1>
    //       <p>ID del Pago: ${payment_id}</p>
    //       <p>Estado: ${status}</p>
    //       <p>ID de la Orden: ${merchant_order_id}</p>
    //     </body>
    //   </html>
    // `);

    
  } catch (error) {
    console.error("Error en /feedback/success:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

payRouter.get("/feedback/pending", async (req, res) => {
  try {
    const {
      payment_id,
      status,
      external_reference,
      merchant_order_id,
      preference_id,
      payment_type,
      site_id,
      processing_mode,
    } = req.query;

    if (!external_reference) {
      throw new Error("Falta la referencia externa");
    }

    const order = await Order.findOne({ where: { id: external_reference } });
    if (!order) {
      throw new Error(`No se encontró la orden con ID: ${external_reference}`);
    }

    await order.update({
      payment_id,
      merchant_order_id,
      status,
      preference_id,
      payment_type,
      processing_mode,
      site_id,
    });

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pago Pendiente</title>
          <link rel="stylesheet" type="text/css" href="./payStyles/pending.css">
        </head>
        <body style="background-color: #232326; display: flex; margin-top: 80px; flex-direction: column; align-items: center;">
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px solid black; border-radius: 20px; background-color: #ffffff; padding: 20px;">
            <a style="margin-bottom: 10px;" href="${process.env.FRONT}/">
              <svg className='pending_svg' width="20px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25">
                <path style="fill:#232326" d="M24 12.001H2.914l5.294-5.295-.707-.707L1 12.501l6.5 6.5.707-.707-5.293-5.293H24v-1z" data-name="Left"/>
              </svg>
            </a>
            <h1 className="pending_h1">Pago Pendiente</h1>
            <img className='pending_img' src="https://img.freepik.com/fotos-premium/simbolo-signo-exclamacion-azul-atencion-o-icono-signo-precaucion-fondo-problema-peligro-alerta-representacion-3d-senal-advertencia_256259-2831.jpg" alt="pendiente">
            <a className="pending_a" href="${process.env.FRONT}/Products">Sigue comprando</a>
            <p className="pending_p">GATO NEGRO STORE</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error en /feedback/pending:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// payRouter.get("/feedback/pending", async function (req, res) {
//   try {
//     const {
//       payment_id: paymentId,
//       status: statusId,
//       merchant_order_id: merchantOrderId,
//     } = req.query;
//     const {
//       product_description,
//       total_order_price,
//       prodId,
//       buyer_email,
//       product_name,
//       product_image,
//       product_amount,
//       product_unit_price,
//     } = arrayPreference;

//     const newOrder = await postOrder(
//       paymentId,
//       statusId,
//       merchantOrderId,
//       product_description,
//       total_order_price,
//       prodId,
//       buyer_email,
//       product_name,
//       product_image,
//       product_amount,
//       product_unit_price
//     );
//     //await enviarMail(product_description, total_order_price, buyer_email, statusId);
//     await updateProductStock(prodId, product_amount);
//     console.log("SE HA DESCONTADO", prodId, product_amount, "DEL STOCK");

//     console.log(newOrder, "FEEDBACK PENDING ORDEN REGISTRADA OK");

//     res.send(`
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <title>Mi página HTML</title>
//         <link rel="stylesheet" type="text/css" href="./payStyles/pending.css">
//       </head>
//       <body style="background-color: #232326; display: flex; margin-top: 80px; flex-direction: column; align-items: center;">
//         <div style="display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px solid black; border-radius: 20px; background-color: #ffffff; padding: 20px;"">
//           <a style="margin-bottom: 10px;" href="${process.env.FRONT}/"><svg className='pending_svg' width="20px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25"><path style="fill:#232326" d="M24 12.001H2.914l5.294-5.295-.707-.707L1 12.501l6.5 6.5.707-.707-5.293-5.293H24v-1z" data-name="Left"/></svg></a>
//           <h1 style="margin-bottom: 10px;" className="pending_h1"> PAGO PENDIENTE !</h1>
//           <img style="max-width: 100%; margin-bottom: 10px;" className='pending_img'src="https://img.freepik.com/fotos-premium/simbolo-signo-exclamacion-azul-atencion-o-icono-signo-precaucion-fondo-problema-peligro-alerta-representacion-3d-senal-advertencia_256259-2831.jpg" alt="">
//           <a style="margin-bottom: 10px;" className="pending_a" href="${process.env.FRONT}/Products">SIGUE COMPRANDO</a>
//           <p style="margin-bottom: 10px;" className="pending_p">GATO NEGRO STORE</p>
//         </div>
//       </body>
//     </html>
//       `);
//     await deleteAllCart(); // esto elimina el carrito al realizar una compra exitosa
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

payRouter.get("/feedback/failure", async (req, res) => {
  try {
    const {
      payment_id,
      status,
      external_reference,
      merchant_order_id,
      preference_id,
      payment_type,
      site_id,
      processing_mode,
    } = req.query;

    if (!external_reference) {
      throw new Error("Falta la referencia externa");
    }

    const order = await Order.findOne({ where: { id: external_reference } });
    if (!order) {
      throw new Error(`No se encontró la orden con ID: ${external_reference}`);
    }

    await order.update({
      payment_id,
      merchant_order_id,
      status,
      preference_id,
      payment_type,
      processing_mode,
      site_id,
    });

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pago Fallido</title>
          <link rel="stylesheet" type="text/css" href="./payStyles/failure.css">
        </head>
        <body style="background-color: #232326; display: flex; margin-top: 80px; flex-direction: column; align-items: center;">
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px solid black; border-radius: 20px; background-color: #ffffff; padding: 20px;">
            <a style="margin-bottom: 10px;" href="${process.env.FRONT}/">
              <svg className='failure_svg' width="30px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25">
                <path style="fill:#232326" d="M24 12.001H2.914l5.294-5.295-.707-.707L1 12.501l6.5 6.5.707-.707-5.293-5.293H24v-1z" data-name="Left"/>
              </svg>
            </a>
            <h1 className="failure_h1">Tu pago ha fallado</h1>
            <img className="failure_img" src="https://static.vecteezy.com/system/resources/thumbnails/017/178/563/small/cross-check-icon-symbol-on-transparent-background-free-png.png" alt="fallido">
            <a className="failure_a" href="${process.env.FRONT}/Products">Intentá nuevamente</a>
            <p className="failure_p">GATO NEGRO STORE</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error en /feedback/failure:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// payRouter.get("/feedback/failure", async function (req, res) {
//   try {
//     const {
//       payment_id: paymentId,
//       status: statusId,
//       merchant_order_id: merchantOrderId,
//     } = req.query;
//     const {
//       product_description,
//       total_order_price,
//       prodId,
//       buyer_email,
//       product_name,
//       product_image,
//       product_amount,
//       product_unit_price,
//     } = arrayPreference;

//     const newOrder = await postOrder(
//       paymentId,
//       statusId,
//       merchantOrderId,
//       product_description,
//       total_order_price,
//       prodId,
//       buyer_email,
//       product_name,
//       product_image,
//       product_amount,
//       product_unit_price
//     );

//     console.log(newOrder, "FEEDBACK FAILURE ORDEN REGISTRADA OK");

//     res.send(`
//     <!DOCTYPE html>
//     <html>
//       <head>
//       <title>Mi página HTML</title>
//       <link rel="stylesheet" type="text/css" href="./payStyles/failure.css">
//       </head>
//       <body style="background-color: #232326; display: flex; margin-top: 80px; flex-direction: column; align-items: center;">
//         <div style="display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px solid black; border-radius: 20px; background-color: #ffffff; padding: 20px;"">
//         <a style="margin-bottom: 10px;" href=${process.env.FRONT}><svg className='failure_svg' width="30px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25"><path style="fill:#232326" d="M24 12.001H2.914l5.294-5.295-.707-.707L1 12.501l6.5 6.5.707-.707-5.293-5.293H24v-1z" data-name="Left"/></svg></a>
//         <h1 style="margin-bottom: 10px;" className="failure_h1"> TU PAGO A FALLADO </h1>
//         <img style="max-width: 100%; margin-bottom: 10px;" className="failure_img" src="https://static.vecteezy.com/system/resources/thumbnails/017/178/563/small/cross-check-icon-symbol-on-transparent-background-free-png.png" alt="">
//         <a style="margin-bottom: 10px;" href="${process.env.FRONT}/Products" className="failure_a">INTENTALO NUEVAMENTE</a>
//         <p style="margin-bottom: 10px;" className="failure_p">GATO NEGRO STORE</p>
//       </div>
//       </body>
//   </html>
//               `);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

module.exports = { payRouter };
