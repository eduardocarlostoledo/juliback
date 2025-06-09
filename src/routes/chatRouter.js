const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Router } = require("express");
const { postChat } = require("../controllers/chatController.js"); // Assuming this might be used for persistence, otherwise can be removed if not needed.
require("dotenv").config();
const chatRouter = Router();
const localKnowledge = require('../helpers/baseKnowledge.js');

// Helper function to normalize messages for better keyword matching
function normalizeMessage(message) {
  return message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, ''); // Removes accents and punctuation
}

// Updated findLocalAnswer function with keyword matching
function findLocalAnswer(message) {
  console.log("buscando en base de conocimiento local", message);
  const lowerMessage = normalizeMessage(message);

  for (const key in localKnowledge) {
    if (localKnowledge.hasOwnProperty(key)) {
      const entry = localKnowledge[key];
      // Check if any of the entry's keywords are included in the user's message
      const match = entry.keywords.some(keyword => lowerMessage.includes(keyword));
      if (match) {
        console.log(`Respuesta de base de conocimiento local para la clave: ${key}`);
        return entry.response; // Return the response
      }
    }
  }
  console.log("No se encontró respuesta en la base de conocimiento local.");
  return null; // If no match is found, return null
}

// Initialize Gemini only if API key is present
let genAI;
let model;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // Using gemini-1.5-pro-latest as it's typically the recommended version for production
  model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
} else {
  console.warn("GEMINI_API_KEY no está definida. El chatbot funcionará solo con la base de conocimiento local.");
}


chatRouter.post("/chatpost", async (req, res) => {
  const { message } = req.body;

  // 1. Try to find an answer in the local knowledge base first
  const respuestaLocal = findLocalAnswer(message);

  if (respuestaLocal) {
    return res.json({ response: respuestaLocal });
  }

  // 2. If no local answer, try to use Gemini (if initialized)
  if (model) { // Check if Gemini model was successfully initialized
    const prompt = `
Eres un asistente virtual amable y servicial para Moda Total Online, una tienda de ropa deportiva para mujer en Argentina.
Tu objetivo es ayudar a los clientes con información sobre sus productos y servicios.

Reglas importantes:
- Si la pregunta del cliente es muy específica o sale de tu conocimiento general, o si te piden información personal (como datos de tarjetas, números de seguimiento que no te proporcionaron, etc.), debes responder amablemente: "Lo siento, como asistente virtual no tengo esa información. Para una atención más personalizada, por favor, escribinos a soporte@modatotal.netlify.app o por WhatsApp al 3764331313."
- Mantén tus respuestas concisas y directas.
- No inventes información.
- El cliente no tiene conocimiento de tu base de datos interna o si usas una IA.

Cliente: "${message}"
Asistente:
`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      return res.json({ response });
    } catch (err) {
      console.error("Error con Gemini:", err);
      // Fallback if Gemini fails (e.g., quota exceeded, API error)
      return res.status(500).json({
        response: "Lo siento, en este momento no puedo procesar tu solicitud. Para una atención más personalizada, por favor, escribinos a soporte@modatotal.netlify.app o por WhatsApp al 3764331313. Disculpa las molestias.",
        error: "Error al generar respuesta con Gemini o cuota excedida."
      });
    }
  } else {
    // 3. If Gemini is not initialized (no API key) and no local answer was found
    console.warn("Gemini API no está configurada o falló al iniciar. Respondiendo con fallback genérico.");
    return res.json({
      response: "Gracias por tu consulta. En este momento no puedo darte una respuesta específica. Te sugiero que nos escribas a soporte@modatotal.netlify.app o por WhatsApp al 3764331313 para que podamos ayudarte de forma personalizada.",
      note: "Gemini API no configurada o falló."
    });
  }
});

module.exports = {chatRouter}; // Ensure you export the router
// 
// // const { GoogleGenerativeAI } = require("@google/generative-ai");
// const { Router } = require("express");
// const {
//   postChat,  
// } = require("../controllers/chatController.js");
// require("dotenv").config();
// const chatRouter = Router();
// const localKnowledge = require('../helpers/baseKnowledge.js');

// // chatRouter.js
// function findLocalAnswer(message) {
//   console.log("buscando en base de conocimiento local", message);
//   const lowerMessage = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Normaliza y quita tildes

//   for (const key in localKnowledge) {
//     if (localKnowledge.hasOwnProperty(key)) {
//       const entry = localKnowledge[key];
//       // Verifica si alguna de las palabras clave de la entrada está contenida en el mensaje del usuario
//       const match = entry.keywords.some(keyword => lowerMessage.includes(keyword));
//       if (match) {
//         console.log("respuesta de base de conocimiento local", key);
//         return entry.response; // Retorna la respuesta
//       }
//     }
//   }
//   console.log("respuesta de base de conocimiento local: undefined");
//   return null; // Si no encuentra nada, retorna null
// }

// if (!process.env.GEMINI_API_KEY) {
//   throw new Error("GENERATIVE_API_KEY is not defined");
// }
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });


// chatRouter.post("/chatpost", async (req, res) => {
//   const { message } = req.body;
//   const respuestaLocal = findLocalAnswer(message);
//   console.log("respuesta de base de conocimiento", respuestaLocal);

//   if (respuestaLocal) {
//     return res.json({ response: respuestaLocal });
//   }

//   // Prompt reducido solo si no hay respuesta local
//   const prompt = `
// Eres un asistente de Moda Total Online, tienda de ropa deportiva para mujer en Argentina. Responde simple y amable.
// Si no sabés algo, decí que no tenés esa info y sugiere escribir a soporte@modatotal.netlify.app o WhatsApp 3764331313.

// Cliente: "${message}"
// Asistente:
// `;

//   try {
//     const result = await model.generateContent(prompt);
//     const response = result.response.text();
//     return res.json({ response });
//   } catch (err) {
//     console.error("Error con Gemini", err);
//     res.status(500).json({ error: "Error al generar respuesta con Gemini" });
//   }
// });


// //esto lo silenciamos para no usar el modelo de gemini en lo posible
// // const businessContext = `
// // Eres un asistente amable de "Moda Total Online", tienda argentina de ropa deportiva femenina.

// // 🔹 Prendas:
// // - Calzas (Supplex, Lycra, microfibra)
// // - Tops, remeras, musculosas transpirables
// // - Corpiños deportivos (bajo, medio, alto impacto)
// // - Buzos, camperas (algodón frizado, neopreno liviano)
// // - Accesorios: medias, gorras, viseras, muñequeras

// // 🔹 Ventajas:
// // - Telas técnicas: elasticidad, soporte, secado rápido
// // - Diseño moderno, tendencia
// // - Guía de talles online por producto
// // - Envíos en Argentina: Correo Argentino, Andreani, OCA, cadetería o Uber
// // - Pago por Mercado Pago (tarjeta, débito, efectivo)
// // - Cambios: 3 días, prenda sin uso y con etiquetas

// // 🔹 Tu rol:
// // - Ayudar a elegir prendas, explicar talles, telas, uso y stock
// // - Asistir en pagos, envíos y cambios
// // - Si algo no está en el contexto, sugerir contactar a soporte@modatotal.netlify.app o WhatsApp 3764331313
// // `;


// // const faqs = `
// // 🔸 Talles: cada prenda tiene tabla. Medir busto, cintura y cadera. Consultar ante dudas.

// // 🔸 Stock: si podés seleccionar talle, hay stock. Si está grisado, no disponible.

// // 🔸 Compra: agregás al carrito > iniciar compra > datos > método envío > pago por Mercado Pago > confirmar.

// // 🔸 Pagos: 
// // - Tarjetas (crédito, débito), efectivo (Pago Fácil, Rapipago), dinero MP.
// // - Seguro: todo pasa por Mercado Pago.

// // 🔸 Envío:
// // - Costo según destino y método.
// // - Demora: 3 a 7 días hábiles aprox.
// // - Seguimiento por código enviado al mail.

// // 🔸 Cambios/Devolución:
// // - 3 días desde entrega. Prenda sin uso y con etiquetas.
// // - Cambio por talle: envío nuevo sin costo. Cliente puede pagar la devolución.
// // - Fallas: enviar fotos a devoluciones@modatotal.netlify.app (dentro de 48hs).

// // 🔸 Contacto: soporte@modatotal.netlify.app o WhatsApp 3764331313.
// // `;


// // chatRouter.post("/chatpost", async (req, res) => {
// //   console.log("req body", req.body);
// //   try {
// //     const { message } = req.body; // Mensaje original del cliente

// //     // --- INICIO: Construcción del Prompt Mejorado ---
// // const detailedPrompt = `
// // ${businessContext}
// // ${faqs}
// // Cliente: "${message}"
// // Asistente: (responde claro, amable, breve, basado en la info. Si no tenés respuesta, deriva a soporte o WhatsApp)
// // `;

// //     // --- FIN: Construcción del Prompt Mejorado ---

// //     // console.log("Prompt enviado a Gemini:", detailedPrompt); // Para depuración

// //     // Usa el prompt detallado en lugar del mensaje simple
// //     const result = await model.generateContent(detailedPrompt);
// //     const response = result.response.text();
// //     res.json({ response });
// //   } catch (error) {
// //     console.error("Error:", error);
// //     res.status(500).json({ error: "Error generando la respuesta" });
// //   }
// // });

// module.exports = { chatRouter };
