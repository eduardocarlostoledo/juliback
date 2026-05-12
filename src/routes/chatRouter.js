const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Router } = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { Product, Type, Brand, User, Cart, Order } = require("../db");
const { buildLocalKnowledge } = require("../helpers/baseKnowledge.js");
const {
  getBusinessConfigRecord,
  mapBusinessConfig,
} = require("../controllers/businessConfigController");
const { buildCheckoutOrderPayload } = require("../services/orderService");
const { createMercadoPagoPreference } = require("../services/mercadoPagoService");

const chatRouter = Router();

function normalizeMessage(message = "") {
  return message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeHistory(history = []) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .slice(-8)
    .map((entry) => ({
      sender: entry?.sender === "bot" ? "bot" : "user",
      text: typeof entry?.text === "string" ? entry.text.trim() : "",
    }))
    .filter((entry) => entry.text);
}

function findLocalAnswer(message, localKnowledge) {
  const lowerMessage = normalizeMessage(message);

  for (const key in localKnowledge) {
    if (!Object.prototype.hasOwnProperty.call(localKnowledge, key)) {
      continue;
    }

    const entry = localKnowledge[key];
    const match = entry.keywords.some((keyword) =>
      lowerMessage.includes(normalizeMessage(keyword))
    );

    if (match) {
      return entry.response;
    }
  }

  return null;
}

const STOPWORDS = new Set([
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "de",
  "del",
  "al",
  "y",
  "o",
  "en",
  "para",
  "por",
  "con",
  "sin",
  "que",
  "me",
  "te",
  "se",
  "mi",
  "tu",
  "su",
  "es",
  "hay",
  "tenes",
  "tienen",
  "tiene",
  "quiero",
  "necesito",
  "busco",
  "mostrar",
  "mostrame",
  "decime",
  "dime",
  "cuanto",
  "cuesta",
  "sale",
  "precio",
  "stock",
  "color",
  "colores",
  "talle",
  "talles",
  "disponible",
  "disponibles",
  "info",
  "informacion",
  "sobre",
  "producto",
  "productos",
  "este",
  "esta",
  "estos",
  "estas",
  "ese",
  "esa",
  "esos",
  "esas",
  "como",
  "pagar",
  "pago",
  "comprar",
  "compra",
  "llevar",
  "quieras",
]);

const COMPARISON_KEYWORDS = [
  "este o este",
  "esta o esta",
  "cual me conviene",
  "cual conviene",
  "compar",
  "50 50",
  "50/50",
  "o este",
  "o esta",
  "entre los dos",
  "entre estas",
  "entre estos",
  "cual elijo",
];

const PURCHASE_KEYWORDS = [
  "me lo llevo",
  "me la llevo",
  "lo quiero",
  "la quiero",
  "quiero ese",
  "quiero esa",
  "quiero este",
  "quiero esta",
  "quiero comprar",
  "dale",
  "vamos con ese",
  "vamos con esa",
  "lo compro",
  "la compro",
];

const PAYMENT_KEYWORDS = [
  "pago",
  "pagar",
  "debito",
  "credito",
  "cuotas",
  "transferencia",
  "mercadopago",
  "mercado pago",
  "tarjeta",
  "efectivo",
];

const PRODUCT_SYNONYM_GROUPS = [
  [
    "cartera",
    "carteras",
    "bolso",
    "bolsos",
    "bag",
    "bags",
    "tote",
    "shopper",
    "bandolera",
    "bandoleras",
    "purse",
    "purses",
    "handbag",
    "handbags",
  ],
  ["mochila", "mochilas", "backpack", "backpacks"],
  ["billetera", "billeteras", "wallet", "wallets", "monedero", "monederos"],
  ["rinonera", "rinoneras", "riñonera", "riñoneras", "waistbag", "waistbags"],
  ["valija", "valijas", "equipaje", "maleta", "maletas", "luggage"],
  ["zapatilla", "zapatillas", "tenis", "sneaker", "sneakers"],
];

const PRODUCT_SYNONYM_INDEX = PRODUCT_SYNONYM_GROUPS.reduce((index, group) => {
  const normalizedGroup = [...new Set(group.map((term) => normalizeMessage(term)))];

  normalizedGroup.forEach((term) => {
    index.set(term, normalizedGroup.filter((item) => item !== term));
  });

  return index;
}, new Map());

function extractMeaningfulTokens(message = "") {
  const normalized = normalizeMessage(message);
  return [
    ...new Set(
      normalized
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3 && !STOPWORDS.has(token))
    ),
  ];
}

function expandTokensWithSynonyms(tokens = []) {
  const expandedTerms = new Map();

  tokens.forEach((token) => {
    expandedTerms.set(token, 1);

    const relatedTerms = PRODUCT_SYNONYM_INDEX.get(token) || [];
    relatedTerms.forEach((relatedTerm) => {
      if (!expandedTerms.has(relatedTerm)) {
        expandedTerms.set(relatedTerm, 0.72);
      }
    });
  });

  return [...expandedTerms.entries()].map(([value, weight]) => ({
    value,
    weight,
  }));
}

function extractAttributeValues(text = "", labels = []) {
  if (!text) {
    return null;
  }

  for (const label of labels) {
    const regex = new RegExp(`${label}\\s*:?\\s*([^.;\\n]+)`, "i");
    const match = text.match(regex);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function sectionListToPlainText(sections = [], limit = sections.length || 0) {
  return sections
    .filter((item) => item?.title || item?.content)
    .slice(0, limit || sections.length)
    .map((item) => {
      if (item.title && item.content) {
        return `${item.title}: ${item.content}`;
      }

      return item.title || item.content;
    })
    .join(" | ");
}

function formatPrice(value) {
  return `$${Number(value || 0).toLocaleString("es-AR")}`;
}

function truncateText(text = "", maxLength = 110) {
  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3).trim()}...`;
}

function getProductBrandName(product) {
  return product?.brand?.name || product?.Brand?.name || product?.brand || "";
}

function getProductTypeName(product) {
  return product?.type?.name || product?.Type?.name || product?.type || "";
}

function buildProductDetailPath(product) {
  return `/detail/${encodeURIComponent(product.name)}`;
}

function getProductText(product) {
  return [
    product.name,
    product.description,
    product.info_adicional,
    getProductBrandName(product),
    getProductTypeName(product),
  ]
    .filter(Boolean)
    .join(" | ");
}

function getProductColors(product) {
  const productText = getProductText(product);

  return Array.isArray(product.colors) && product.colors.length
    ? product.colors.join(", ")
    : extractAttributeValues(productText, ["colores", "color"]) ||
        "consultame el color que buscas";
}

function getProductSizes(product) {
  const productText = getProductText(product);

  return Array.isArray(product.sizes) && product.sizes.length
    ? product.sizes.join(", ")
    : extractAttributeValues(productText, ["talles", "talle", "sizes", "size"]) ||
        "consultame el talle que necesitas";
}

function getStockText(product) {
  return Number(product.stock) > 0
    ? `${product.stock} unidades disponibles`
    : "sin stock por el momento";
}

function getShortSalesPitch(product) {
  const baseText = truncateText(product.description || product.info_adicional || "", 95);

  if (baseText) {
    return baseText;
  }

  if (Number(product.stock) > 0) {
    return "Tiene stock y esta listo para salir.";
  }

  return "Puedo ayudarte a buscar una alternativa similar.";
}

function buildSalesClosing(product) {
  if (Number(product.stock) > 0) {
    return `Si te gusto, seguimos con la compra. Decime si queres pagarlo con debito, credito o transferencia.`;
  }

  return "Si queres, te muestro otra opcion parecida para que no pierdas la venta.";
}

function formatProductChatResponse(product) {
  return [
    `Tengo ${product.name} para vos.`,
    `Precio: ${formatPrice(product.price)}.`,
    `Stock: ${getStockText(product)}.`,
    `Colores: ${getProductColors(product)}.`,
    `Talles: ${getProductSizes(product)}.`,
    buildSalesClosing(product),
  ].join(" ");
}

function createChatResponse(response, options = {}) {
  return {
    response,
    actions: options.actions || [],
    checkout: options.checkout || null,
  };
}

function buildSendMessageAction(label, value) {
  return {
    type: "send_message",
    label,
    value,
  };
}

function buildLinkAction(label, url) {
  return {
    type: "link",
    label,
    url,
  };
}

function buildCheckoutAction(checkout) {
  return {
    type: "checkout",
    label: "Abrir checkout",
    checkout,
  };
}

function buildSalesQuickActions(product) {
  if (!product) {
    return [];
  }

  return [
    buildSendMessageAction("Lo quiero", `Me llevo ${product.name}`),
    buildSendMessageAction("Debito", `Quiero pagar ${product.name} con debito`),
    buildSendMessageAction("Credito", `Quiero pagar ${product.name} con credito`),
  ];
}

function buildChoiceQuickActions(products = []) {
  return products.slice(0, 3).map((product) =>
    buildSendMessageAction(truncateText(product.name, 22), product.name)
  );
}

function formatProductOption(product, index) {
  return `${index}. ${product.name} - ${formatPrice(product.price)} - ${getStockText(product)}. Ver detalle: ${buildProductDetailPath(product)}. ${getShortSalesPitch(product)}`;
}

function hasKeywordIntent(message, keywords = []) {
  const normalized = normalizeMessage(message);
  return keywords.some((keyword) => normalized.includes(normalizeMessage(keyword)));
}

function scoreProducts(products, searchTerms = []) {
  return products
    .map((product) => {
      const normalizedName = normalizeMessage(product.name);
      const haystack = normalizeMessage(getProductText(product));
      const normalizedColors = (product.colors || []).map((color) =>
        normalizeMessage(color)
      );
      const normalizedSizes = (product.sizes || []).map((size) =>
        normalizeMessage(size)
      );
      const normalizedBrand = normalizeMessage(getProductBrandName(product));
      const normalizedType = normalizeMessage(getProductTypeName(product));

      const score = searchTerms.reduce((acc, termEntry) => {
        const token =
          typeof termEntry === "string" ? termEntry : termEntry?.value || "";
        const tokenWeight =
          typeof termEntry === "string" ? 1 : termEntry?.weight || 1;

        if (!token) {
          return acc;
        }

        if (normalizedName.includes(token)) {
          return acc + 4 * tokenWeight;
        }

        if (normalizedBrand.includes(token) || normalizedType.includes(token)) {
          return acc + 3 * tokenWeight;
        }

        if (normalizedColors.some((color) => color.includes(token))) {
          return acc + 2 * tokenWeight;
        }

        if (normalizedSizes.some((size) => size.includes(token))) {
          return acc + 2 * tokenWeight;
        }

        if (haystack.includes(token)) {
          return acc + 1 * tokenWeight;
        }

        return acc;
      }, 0);

      return { product, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
}

function getProductMatches(message, products) {
  const tokens = extractMeaningfulTokens(message);

  if (!tokens.length) {
    return [];
  }

  return scoreProducts(products, expandTokensWithSynonyms(tokens));
}

function extractProductsMentionedInHistory(history, products) {
  const mentionedProducts = [];
  const seen = new Set();

  history.forEach((entry) => {
    const normalizedText = normalizeMessage(entry.text);

    products.forEach((product) => {
      const productName = normalizeMessage(product.name);

      if (!productName || seen.has(product.id)) {
        return;
      }

      if (normalizedText.includes(productName)) {
        seen.add(product.id);
        mentionedProducts.push(product);
      }
    });
  });

  return mentionedProducts;
}

function buildChoiceResponse(matches = []) {
  const suggestedProducts = matches.slice(0, 2).map(({ product }) => product);

  if (!suggestedProducts.length) {
    return null;
  }

  return [
    "Hola! Si, mira, tengo estas opciones para vos:",
    ...suggestedProducts.map((product, index) =>
      formatProductOption(product, index + 1)
    ),
    "Si queres, te recomiendo una o avanzamos directo con la que mas te guste.",
  ].join("\n");
}

function buildComparisonResponse(products = []) {
  if (products.length < 2) {
    return null;
  }

  const [firstProduct, secondProduct] = products;
  const recommendedProduct =
    Number(firstProduct.stock) >= Number(secondProduct.stock)
      ? Number(firstProduct.price) <= Number(secondProduct.price)
        ? firstProduct
        : secondProduct
      : secondProduct;

  return [
    `Si estas entre ${firstProduct.name} y ${secondProduct.name}, te lo bajo simple:`,
    `1. ${firstProduct.name}: ${formatPrice(firstProduct.price)}, ${getStockText(firstProduct)}, colores ${getProductColors(firstProduct)}, talles ${getProductSizes(firstProduct)}.`,
    `2. ${secondProduct.name}: ${formatPrice(secondProduct.price)}, ${getStockText(secondProduct)}, colores ${getProductColors(secondProduct)}, talles ${getProductSizes(secondProduct)}.`,
    `Si queres una recomendacion rapida para cerrar hoy, yo iria por ${recommendedProduct.name}.`,
    "Si te convence, decime como queres pagar: debito, credito o transferencia.",
  ].join("\n");
}

function buildComparisonQuickActions(products = []) {
  if (products.length < 2) {
    return [];
  }

  return [
    buildSendMessageAction("Me quedo con 1", `Me llevo ${products[0].name}`),
    buildSendMessageAction("Me quedo con 2", `Me llevo ${products[1].name}`),
    buildSendMessageAction("Pago ahora", `Quiero pagar ${products[0].name}`),
  ];
}

function getRecentProductContext(message, history, products) {
  const currentMatches = getProductMatches(message, products).map(
    ({ product }) => product
  );
  const historyMatches = extractProductsMentionedInHistory(history, products);

  return [...new Map([...currentMatches, ...historyMatches].map((product) => [product.id, product])).values()];
}

function buildPaymentSalesResponse(message, businessConfig, recentProducts = []) {
  if (!hasKeywordIntent(message, PAYMENT_KEYWORDS)) {
    return null;
  }

  const normalized = normalizeMessage(message);
  const paymentSummary = sectionListToPlainText(
    businessConfig.paymentsPolicySections,
    2
  );
  const currentProduct = recentProducts[0];
  const intro = currentProduct
    ? `Perfecto, avancemos con ${currentProduct.name}.`
    : "Perfecto, vamos cerrando la compra.";

  if (normalized.includes("debito")) {
    return [
      intro,
      "Con debito resolves rapido y el pago impacta de forma inmediata.",
      "Apenas se acredita, preparamos el pedido y coordinamos entrega o retiro.",
      paymentSummary ? `Medios y condiciones: ${paymentSummary}.` : "",
      currentProduct
        ? `Si queres, seguimos con ${currentProduct.name}.`
        : "Si queres, ahora elegimos el producto y te acompano hasta el cierre.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (normalized.includes("credito") || normalized.includes("cuota")) {
    return [
      intro,
      "Con credito podes financiar la compra si la pasarela y la promo vigente lo permiten.",
      "Apenas se acredita, dejamos el pedido en preparacion.",
      paymentSummary ? `Medios y condiciones: ${paymentSummary}.` : "",
      currentProduct
        ? `Si queres, seguimos con ${currentProduct.name}.`
        : "Si queres, ahora elegimos el producto y te acompano hasta el cierre.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (normalized.includes("transfer")) {
    return [
      intro,
      "Tambien podes pagar por transferencia si esa opcion esta habilitada en la tienda.",
      "Cuando se confirma el pago, preparamos el pedido y avanzamos con el envio o retiro.",
      paymentSummary ? `Medios y condiciones: ${paymentSummary}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    intro,
    "Podes pagar con debito, credito o transferencia segun la pasarela activa del negocio.",
    "Si queres, decime con que medio queres avanzar y te guio con el siguiente paso.",
    paymentSummary ? `Medios y condiciones: ${paymentSummary}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function buildPurchaseContinuationResponse(message, history, products) {
  if (!hasKeywordIntent(message, PURCHASE_KEYWORDS)) {
    return null;
  }

  const recentProducts = getRecentProductContext(message, history, products);
  const selectedProduct = recentProducts[0];

  if (!selectedProduct) {
    return "Perfecto. Decime que producto queres llevar y te paso precio, stock y forma de pago para cerrarlo.";
  }

  return [
    `Perfecto, vamos con ${selectedProduct.name}.`,
    `Sale ${formatPrice(selectedProduct.price)} y hoy tiene ${getStockText(selectedProduct)}.`,
    "El siguiente paso es definir el pago para dejar el pedido listo.",
    "Decime si preferis debito, credito o transferencia y seguimos.",
  ].join(" ");
}

function buildPreferenceItemFromProduct(product) {
  return {
    product_description: product.description || product.name,
    product_name: product.name,
    product_image: product.image?.secure_url || product.image || null,
    product_amount: 1,
    product_unit_price: Number(product.price || 0),
    prodId: product.id,
  };
}

async function getAuthenticatedUserFromRequest(req) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return null;
    }

    return User.findByPk(userId);
  } catch (error) {
    return null;
  }
}

async function getOrCreateUserCartForCheckout(user) {
  let cart = await Cart.findOne({ where: { cartUserId: user.id } });

  if (!cart) {
    return Cart.create({
      cartUserId: user.id,
      cartProducts: [],
      order: Date.now(),
    });
  }

  return cart;
}

async function createCheckoutForChatSale(user, product) {
  const cart = await getOrCreateUserCartForCheckout(user);
  const preferencia = [buildPreferenceItemFromProduct(product)];
  const orderData = {
    quantity: 1,
    description: product.name,
    price: Number(product.price || 0),
    total_order_price: Number(product.price || 0),
  };

  const newOrder = await Order.create(
    buildCheckoutOrderPayload({
      user,
      cart,
      orderData,
      preferenceItems: preferencia,
    })
  );

  const preferenceResponse = await createMercadoPagoPreference({
    order: newOrder,
    user,
  });

  await newOrder.update({
    preference_id: preferenceResponse.id,
    payment_provider_reference: preferenceResponse.id,
    payment_provider_data: {
      ...(newOrder.payment_provider_data || {}),
      preferenceId: preferenceResponse.id,
      source: "chatbot",
      lastPreferenceCreatedAt: new Date().toISOString(),
    },
  });

  return {
    preferenceId: preferenceResponse.id,
    initPoint:
      preferenceResponse.init_point ||
      preferenceResponse.sandbox_init_point ||
      null,
    orderId: newOrder.id,
    productName: product.name,
    total: Number(product.price || 0),
  };
}

function findProductAnswer(message, products) {
  const scoredProducts = getProductMatches(message, products);

  if (!scoredProducts.length) {
    return null;
  }

  const [topProduct] = scoredProducts;
  const closeMatches = scoredProducts.filter(
    ({ score }, index) => index < 3 && score >= topProduct.score - 2
  );

  if (closeMatches.length > 1) {
    return buildChoiceResponse(closeMatches);
  }

  return formatProductChatResponse(topProduct.product);
}

function buildPromptProductContext(message, history, products) {
  const relevantProducts = getRecentProductContext(message, history, products)
    .slice(0, 4)
    .map(
      (product) =>
        `- ${product.name} | precio ${formatPrice(product.price)} | stock ${getStockText(product)} | colores ${getProductColors(product)} | talles ${getProductSizes(product)} | detalle ${truncateText(product.description || product.info_adicional || "sin detalle", 120)}`
    )
    .join("\n");

  return relevantProducts || "- Sin coincidencias claras en catalogo.";
}

function getChatProductReply(message, products) {
  const productMatches = getProductMatches(message, products);

  if (!productMatches.length) {
    return null;
  }

  const [topProduct] = productMatches;
  const closeMatches = productMatches.filter(
    ({ score }, index) => index < 3 && score >= topProduct.score - 2
  );

  if (closeMatches.length > 1) {
    const options = closeMatches.map(({ product }) => product);

    return createChatResponse(buildChoiceResponse(closeMatches), {
      actions: buildChoiceQuickActions(options),
    });
  }

  return createChatResponse(formatProductChatResponse(topProduct.product), {
    actions: buildSalesQuickActions(topProduct.product),
  });
}

function buildConversationText(history = [], message = "") {
  const lines = history.map(
    (entry) => `${entry.sender === "bot" ? "Asistente" : "Cliente"}: ${entry.text}`
  );

  lines.push(`Cliente: ${message}`);

  return lines.join("\n");
}

let model;
const geminiModelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (process.env.GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: geminiModelName });
} else {
  console.warn(
    "GEMINI_API_KEY no esta definida. El chatbot funcionara solo con la base de conocimiento local."
  );
}

chatRouter.post("/chatpost", async (req, res) => {
  try {
    const { message = "", history = [] } = req.body;
    const sanitizedHistory = sanitizeHistory(history);
    const businessConfigRecord = await getBusinessConfigRecord();
    const businessConfig = mapBusinessConfig(businessConfigRecord);
    const localKnowledge = buildLocalKnowledge(businessConfig);
    const products = await Product.findAll({
      include: [Type, Brand],
      where: { status: true },
      limit: 100,
    });
    const authenticatedUser = await getAuthenticatedUserFromRequest(req);

    const comparisonProducts = getRecentProductContext(
      message,
      sanitizedHistory,
      products
    );

    if (
      hasKeywordIntent(message, COMPARISON_KEYWORDS) &&
      comparisonProducts.length >= 2
    ) {
      const comparedProducts = comparisonProducts.slice(0, 2);

      return res.json(
        createChatResponse(buildComparisonResponse(comparedProducts), {
          actions: buildComparisonQuickActions(comparedProducts),
        })
      );
    }

    const shouldTriggerCheckout =
      comparisonProducts.length > 0 &&
      (hasKeywordIntent(message, PURCHASE_KEYWORDS) ||
        hasKeywordIntent(message, PAYMENT_KEYWORDS));

    if (shouldTriggerCheckout) {
      const selectedProduct = comparisonProducts[0];

      if (!authenticatedUser) {
        return res.json(
          createChatResponse(
            `Ya tengo listo ${selectedProduct.name}. Para disparar la venta y llevarte al cobro, primero inicia sesion y volvemos directo al checkout.`,
            {
              actions: [
                buildLinkAction("Iniciar sesion", "/Login"),
                buildSendMessageAction("Seguir viendo", selectedProduct.name),
              ],
            }
          )
        );
      }

      const checkout = await createCheckoutForChatSale(
        authenticatedUser,
        selectedProduct
      );
      const paymentResponse =
        buildPaymentSalesResponse(message, businessConfig, comparisonProducts) ||
        `Perfecto, avanzamos con ${selectedProduct.name}.`;

      return res.json(
        createChatResponse(
          `${paymentResponse} Ya te abri el checkout para completar el pago.`,
          {
            actions: [
              buildCheckoutAction(checkout),
              buildLinkAction("Ver carrito", "/Cart"),
            ],
            checkout,
          }
        )
      );
    }

    const paymentResponse = buildPaymentSalesResponse(
      message,
      businessConfig,
      comparisonProducts
    );

    if (paymentResponse) {
      return res.json(createChatResponse(paymentResponse));
    }

    const productResponse = getChatProductReply(message, products);

    if (productResponse) {
      return res.json(productResponse);
    }

    const purchaseResponse = buildPurchaseContinuationResponse(
      message,
      sanitizedHistory,
      products
    );

    if (purchaseResponse) {
      return res.json(createChatResponse(purchaseResponse));
    }

    const localResponse = findLocalAnswer(message, localKnowledge);

    if (localResponse) {
      return res.json(createChatResponse(localResponse));
    }

    if (!model) {
      return res.json(
        createChatResponse(
          `Gracias por tu consulta. En este momento no puedo darte una respuesta especifica. Te sugerimos escribir a ${businessConfig.supportEmail} o por WhatsApp al ${businessConfig.whatsapp} para recibir ayuda personalizada.`
        )
      );
    }

    const prompt = `
Eres el vendedor principal de ${businessConfig.businessName}.
Tu trabajo es vender, orientar, cobrar, explicar el siguiente paso del pedido y despedir al cliente para que vuelva.

Reglas importantes:
- Habla como vendedor humano, claro, amable y concreto.
- Si el cliente esta explorando, ofrece entre 1 y 3 opciones concretas.
- Si el cliente duda entre dos productos, comparalos y recomienda uno.
- Si hablas de un producto, incluye precio y stock cuando esten disponibles.
- Despues de recomendar, intenta cerrar con una pregunta concreta como forma de pago o confirmacion de compra.
- Si el cliente quiere avanzar, guialo a pagar con debito, credito o transferencia segun las opciones disponibles.
- Explica que, luego del pago, el pedido se prepara y se coordina envio o retiro.
- No inventes productos, precios, promociones, stock, datos personales ni procesos tecnicos.
- Si una consulta supera tu informacion, deriva a ${businessConfig.supportEmail} o WhatsApp ${businessConfig.whatsapp}.
- Responde en espanol rioplatense, corto y vendedor.

Contexto del negocio:
- Negocio: ${businessConfig.businessName}
- Leyenda: ${businessConfig.businessTagline}
- Envios: ${sectionListToPlainText(businessConfig.shippingPolicySections, 3)}
- Cambios: ${sectionListToPlainText(businessConfig.returnPolicySections, 3)}
- Pagos: ${sectionListToPlainText(businessConfig.paymentsPolicySections, 3)}
- FAQ: ${(businessConfig.faqItems || [])
  .slice(0, 4)
  .map((item) => `${item.question}: ${item.answer}`)
  .join(" | ")}

Productos relevantes del catalogo:
${buildPromptProductContext(message, sanitizedHistory, products)}

Historial reciente:
${buildConversationText(sanitizedHistory, message)}

Asistente:
`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      return res.json(createChatResponse(response));
    } catch (geminiError) {
      console.error(
        `Error en Gemini con el modelo ${geminiModelName}:`,
        geminiError
      );

      return res.json(
        createChatResponse(
          `No pude responder con IA en este momento, pero puedo seguir ayudandote con info del negocio. Si queres, consultame por envios, pagos, cambios o productos; y si necesitas atencion humana, escribi a ${businessConfig.supportEmail} o por WhatsApp al ${businessConfig.whatsapp}.`
        )
      );
    }
  } catch (error) {
    console.error("Error en chatbot:", error);
    return res.status(500).json({
      response:
        "No pudimos procesar tu mensaje automaticamente. Intenta nuevamente o contacta al negocio por sus canales habituales.",
      error: error.message,
    });
  }
});

module.exports = { chatRouter };
