const { Order, Product } = require("../db");
const { deleteAllCart } = require("../controllers/cartController");

const normalizeJsonValue = (value, fallback) => {
  if (value == null) {
    return fallback;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  return value;
};

const normalizeBuyerAddress = (address) => {
  const parsedAddress = normalizeJsonValue(address, {});

  return {
    address: parsedAddress?.address || "",
    state: parsedAddress?.state || "",
    city: parsedAddress?.city || "",
    country: parsedAddress?.country || "Argentina",
  };
};

const normalizeProductImage = (image) => {
  if (!image) {
    return null;
  }

  if (typeof image === "string") {
    return { secure_url: image };
  }

  if (image.secure_url) {
    return image;
  }

  if (image.url) {
    return {
      ...image,
      secure_url: image.url,
    };
  }

  return image;
};

const normalizeOrderProduct = (product = {}) => ({
  prodId: product.prodId,
  product_description: product.product_description || product.product_name || "",
  product_name: product.product_name || "",
  product_image: normalizeProductImage(product.product_image || product.image),
  product_amount: Number(product.product_amount || product.amount || 1),
  product_unit_price: Number(product.product_unit_price || product.price || 0),
});

const normalizeOrderProducts = (products = []) =>
  Array.isArray(products) ? products.map(normalizeOrderProduct) : [];

const serializeOrder = (order) => {
  const plainOrder = order?.toJSON ? order.toJSON() : { ...order };

  return {
    ...plainOrder,
    buyer_address: normalizeBuyerAddress(plainOrder.buyer_address),
    products: normalizeOrderProducts(plainOrder.products),
    payment_provider_data: normalizeJsonValue(plainOrder.payment_provider_data, {}),
    shipping_data: normalizeJsonValue(plainOrder.shipping_data, {}),
    invoice_data: normalizeJsonValue(plainOrder.invoice_data, {}),
  };
};

const serializeOrders = (orders = []) => orders.map(serializeOrder);

const buildCheckoutOrderPayload = ({
  user,
  cart,
  orderData = {},
  preferenceItems = [],
  paymentProvider = "mercadopago",
}) => {
  const normalizedProducts = normalizeOrderProducts(preferenceItems);
  const totalOrderPrice =
    Number(orderData.total_order_price) ||
    normalizedProducts.reduce(
      (acc, item) => acc + item.product_unit_price * item.product_amount,
      0
    );

  return {
    userId: user.id,
    cartId: cart.id,
    buyer_email: user.email,
    buyer_name: user.name,
    buyer_lastname: user.lastname,
    buyer_phone: user.phonenumber || "",
    buyer_address: normalizeBuyerAddress({
      address: user.address,
      city: user.city,
      country: user.country,
    }),
    products: normalizedProducts,
    total_order_price: totalOrderPrice,
    status: "pending",
    estadoEnvio: "pendiente",
    payment_provider: paymentProvider,
    payment_provider_data: {
      checkoutRequestedAt: new Date().toISOString(),
      checkoutSummary: {
        description: orderData.description || "",
        quantity: Number(orderData.quantity) || normalizedProducts.length,
        totalOrderPrice,
      },
    },
    invoice_status: "not_requested",
  };
};

const mergeObjects = (currentValue, nextValue) => ({
  ...normalizeJsonValue(currentValue, {}),
  ...normalizeJsonValue(nextValue, {}),
});

const buildOrderUpdatePayload = (currentOrder, payload = {}) => {
  const updates = {};
  const scalarFields = [
    "status",
    "estadoEnvio",
    "payment_type",
    "buyer_phone",
    "trackSeguimiento",
    "trackUrl",
    "trackCarrierName",
    "payment_provider",
    "payment_provider_reference",
    "shipping_provider",
    "invoice_provider",
    "invoice_status",
  ];

  scalarFields.forEach((field) => {
    if (payload[field] !== undefined) {
      updates[field] = payload[field];
    }
  });

  if (payload.buyer_address !== undefined) {
    updates.buyer_address = normalizeBuyerAddress(payload.buyer_address);
  }

  if (payload.payment_provider_data !== undefined) {
    updates.payment_provider_data = mergeObjects(
      currentOrder.payment_provider_data,
      payload.payment_provider_data
    );
  }

  if (payload.shipping_data !== undefined) {
    updates.shipping_data = mergeObjects(
      currentOrder.shipping_data,
      payload.shipping_data
    );
  }

  if (payload.invoice_data !== undefined) {
    updates.invoice_data = mergeObjects(
      currentOrder.invoice_data,
      payload.invoice_data
    );
  }

  const hasShippingTrackingUpdate =
    payload.trackSeguimiento !== undefined ||
    payload.trackUrl !== undefined ||
    payload.trackCarrierName !== undefined ||
    payload.estadoEnvio !== undefined ||
    payload.shipping_provider !== undefined;

  if (hasShippingTrackingUpdate) {
    updates.shipping_data = {
      ...normalizeJsonValue(currentOrder.shipping_data, {}),
      ...normalizeJsonValue(updates.shipping_data, {}),
      status:
        payload.estadoEnvio !== undefined
          ? payload.estadoEnvio
          : currentOrder.estadoEnvio,
      provider:
        payload.shipping_provider !== undefined
          ? payload.shipping_provider
          : currentOrder.shipping_provider || currentOrder.trackCarrierName || "",
      trackingCode:
        payload.trackSeguimiento !== undefined
          ? payload.trackSeguimiento
          : currentOrder.trackSeguimiento || "",
      trackingUrl:
        payload.trackUrl !== undefined ? payload.trackUrl : currentOrder.trackUrl || "",
      carrierName:
        payload.trackCarrierName !== undefined
          ? payload.trackCarrierName
          : currentOrder.trackCarrierName || "",
      updatedAt: new Date().toISOString(),
    };
  }

  return updates;
};

const updateOrderById = async (orderId, payload = {}) => {
  const order = await Order.findByPk(orderId);

  if (!order) {
    throw new Error("Orden no encontrada.");
  }

  const updates = buildOrderUpdatePayload(order, payload);

  if (!Object.keys(updates).length) {
    throw new Error("Los datos de actualizacion son obligatorios.");
  }

  await order.update(updates);

  return serializeOrder(order);
};

const getOrderByIdOrThrow = async (orderId) => {
  const order = await Order.findByPk(orderId);

  if (!order) {
    throw new Error("Orden no encontrada.");
  }

  return order;
};

const ensureOrderAccess = (order, requester) => {
  if (!requester) {
    throw new Error("Usuario no autenticado.");
  }

  const requesterUserId = requester.userId || requester.id;

  if (!requester.admin && order.userId !== requesterUserId) {
    const error = new Error("No tienes permisos para acceder a esta orden.");
    error.status = 403;
    throw error;
  }
};

const shouldFinalizeApprovedOrder = (currentStatus, nextStatus) =>
  currentStatus !== "approved" && nextStatus === "approved";

const decrementProductStock = async (prodId, productAmount) => {
  const product = await Product.findOne({ where: { id: prodId } });

  if (!product) {
    throw new Error(`Producto con ID ${prodId} no encontrado.`);
  }

  const newStock = product.stock - productAmount;

  if (newStock <= 0) {
    await Product.update({ status: false, stock: 0 }, { where: { id: prodId } });
    return;
  }

  await Product.update({ stock: newStock }, { where: { id: prodId } });
};

const finalizeApprovedOrder = async (order) => {
  for (const product of normalizeOrderProducts(order.products)) {
    await decrementProductStock(product.prodId, product.product_amount);
  }

  const paymentProviderData = normalizeJsonValue(order.payment_provider_data, {});

  if (paymentProviderData.source !== "chatbot") {
    await deleteAllCart(order.userId);
  }
};

module.exports = {
  normalizeBuyerAddress,
  normalizeProductImage,
  normalizeOrderProducts,
  serializeOrder,
  serializeOrders,
  buildCheckoutOrderPayload,
  buildOrderUpdatePayload,
  updateOrderById,
  getOrderByIdOrThrow,
  ensureOrderAccess,
  shouldFinalizeApprovedOrder,
  finalizeApprovedOrder,
};
