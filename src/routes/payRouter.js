const { Router } = require("express");
const { Cart, User, Order } = require("../db");
const { verificaToken } = require("../helpers/verificaToken");
const {
  buildCheckoutOrderPayload,
  shouldFinalizeApprovedOrder,
  finalizeApprovedOrder,
} = require("../services/orderService");
const {
  getPaymentIdFromWebhook,
  getMercadoPagoPayment,
  createMercadoPagoPreference,
  buildMercadoPagoOrderUpdate,
  summarizeMercadoPagoPayment,
} = require("../services/mercadoPagoService");

const payRouter = Router();

payRouter.post("/preference", (req, res) => {
  res.status(410).json({
    message: "Ruta legacy fuera de uso. Utiliza /pay/create_preference.",
  });
});

payRouter.post("/create_preference", verificaToken, async (req, res) => {
  try {
    const { orderData, preferencia } = req.body;

    if (!orderData || !Array.isArray(preferencia) || preferencia.length === 0) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const cart = await Cart.findOne({ where: { cartUserId: user.id } });
    if (!cart) {
      return res.status(404).json({ error: "Carrito no encontrado" });
    }

    const newOrder = await Order.create(
      buildCheckoutOrderPayload({
        user,
        cart,
        orderData,
        preferenceItems: preferencia,
      })
    );

    const response = await createMercadoPagoPreference({
      order: newOrder,
      user,
    });

    await newOrder.update({
      preference_id: response.id,
      payment_provider_reference: response.id,
      payment_provider_data: {
        ...(newOrder.payment_provider_data || {}),
        preferenceId: response.id,
        lastPreferenceCreatedAt: new Date().toISOString(),
      },
    });

    res.status(200).json({ id: response.id, orderId: newOrder.id });
  } catch (error) {
    console.error("Error en /create_preference:", error);
    res.status(500).json({ error: "Error al crear la preferencia" });
  }
});

payRouter.post("/webhook", async (req, res) => {
  const paymentId = getPaymentIdFromWebhook(req);

  res.sendStatus(200);

  if (!paymentId || paymentId.toString() === "123456") {
    return;
  }

  try {
    const paymentData = await getMercadoPagoPayment(paymentId);
    const externalReference = paymentData.external_reference;

    if (!externalReference) {
      return;
    }

    const order = await Order.findOne({ where: { id: externalReference } });
    if (!order) {
      return;
    }

    const orderUpdate = buildMercadoPagoOrderUpdate(paymentData);
    const shouldFinalize = shouldFinalizeApprovedOrder(
      order.status,
      orderUpdate.status
    );

    await order.update(orderUpdate);

    if (shouldFinalize) {
      await finalizeApprovedOrder(order);
    }
  } catch (error) {
    console.error("Error en /webhook:", error.response?.data || error.message);
  }
});

payRouter.get("/feedback/success", async (req, res) => {
  try {
    const {
      payment_id,
      external_reference,
      merchant_order_id,
      preference_id,
    } = req.query;

    if (!external_reference) {
      throw new Error("Falta la referencia externa");
    }

    const order = await Order.findOne({ where: { id: external_reference } });
    if (!order) {
      throw new Error(`No se encontro la orden con ID: ${external_reference}`);
    }

    const paymentData = await getMercadoPagoPayment(payment_id);
    const orderUpdate = buildMercadoPagoOrderUpdate(paymentData);
    const verifiedStatus = orderUpdate.status;
    const shouldFinalize = shouldFinalizeApprovedOrder(
      order.status,
      verifiedStatus
    );

    await order.update({
      ...orderUpdate,
      preference_id,
      payment_provider_data: {
        ...(order.payment_provider_data || {}),
        ...summarizeMercadoPagoPayment(paymentData),
        successRedirectAt: new Date().toISOString(),
      },
    });

    if (shouldFinalize) {
      await finalizeApprovedOrder(order);
    }

    res.redirect(
      `${process.env.FRONT}/success?payment_id=${payment_id}&status=${verifiedStatus}&merchant_order_id=${orderUpdate.merchant_order_id || merchant_order_id || ""}&order_id=${external_reference}`
    );
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
      throw new Error(`No se encontro la orden con ID: ${external_reference}`);
    }

    await order.update({
      payment_id,
      merchant_order_id,
      status,
      preference_id,
      payment_type,
      processing_mode,
      site_id,
      payment_provider: "mercadopago",
      payment_provider_reference: payment_id || preference_id || null,
      payment_provider_data: {
        ...(order.payment_provider_data || {}),
        pendingRedirectAt: new Date().toISOString(),
        payment_id: payment_id || null,
        merchant_order_id: merchant_order_id || null,
      },
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
      throw new Error(`No se encontro la orden con ID: ${external_reference}`);
    }

    await order.update({
      payment_id,
      merchant_order_id,
      status,
      preference_id,
      payment_type,
      processing_mode,
      site_id,
      payment_provider: "mercadopago",
      payment_provider_reference: payment_id || preference_id || null,
      payment_provider_data: {
        ...(order.payment_provider_data || {}),
        failureRedirectAt: new Date().toISOString(),
        payment_id: payment_id || null,
        merchant_order_id: merchant_order_id || null,
      },
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
            <a className="failure_a" href="${process.env.FRONT}/Products">Intenta nuevamente</a>
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

module.exports = { payRouter };
