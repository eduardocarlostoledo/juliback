const sectionListToText = (sections = []) =>
  sections
    .filter((item) => item?.title || item?.content)
    .map((item) => {
      if (item.title && item.content) {
        return `**${item.title}:** ${item.content}`;
      }

      return item.title || item.content;
    })
    .join(" ");

const buildLocalKnowledge = (businessConfig = {}) => {
  const businessName = businessConfig.businessName || "la tienda";
  const whatsapp = businessConfig.whatsapp || "";
  const supportEmail = businessConfig.supportEmail || "";
  const shippingText = sectionListToText(businessConfig.shippingPolicySections);
  const returnsText = sectionListToText(businessConfig.returnPolicySections);
  const paymentsText = sectionListToText(businessConfig.paymentsPolicySections);
  const historyText = sectionListToText(businessConfig.historySections);

  return {
    horario_atencion: {
      response:
        "Nuestro equipo esta disponible para ayudarte durante el horario informado por el negocio. Si necesitas asistencia personalizada tambien podes escribirnos por WhatsApp o email.",
      keywords: ["horario", "atienden", "abierto", "horas", "horarios", "atencion"],
    },
    direccion_tienda_fisica: {
      response:
        "La operacion puede ser online, presencial o mixta segun el negocio. Si necesitas confirmar retiro, entrega o direccion, escribinos por nuestros canales de contacto.",
      keywords: ["direccion", "local", "tienda fisica", "donde estan", "retiro", "ubicacion", "sucursal"],
    },
    metodos_pago: {
      response:
        paymentsText ||
        `Podes consultar los medios de pago vigentes de ${businessName} en la seccion de pagos del sitio.`,
      keywords: ["pago", "pagar", "formas de pago", "tarjeta", "efectivo", "mercadopago", "cuotas", "medio de pago", "pagos"],
    },
    formas_envio: {
      response:
        shippingText ||
        `Podes consultar la politica de envios vigente de ${businessName} en la seccion correspondiente del sitio.`,
      keywords: ["envio", "envios", "entrega", "despacho", "correo", "tiempo de entrega", "costo envio", "mandan", "domicilio"],
    },
    cambios_devoluciones: {
      response:
        returnsText ||
        `Podes consultar la politica de cambios y devoluciones vigente de ${businessName} en el sitio.`,
      keywords: ["cambio", "devolucion", "devolver", "reembolso", "garantia", "cambiar", "reintegro", "politica de cambio"],
    },
    contacto_general: {
      response: `Para cualquier consulta podes escribirnos a **${supportEmail || "nuestro email de soporte"}** o por **WhatsApp ${whatsapp || "del negocio"}**.`,
      keywords: ["contacto", "llamar", "telefono", "whatsapp", "email", "mail", "soporte", "comunicarse", "vias", "contactar", "consulta"],
    },
    como_trabajamos: {
      response:
        historyText ||
        `${businessName} trabaja con una propuesta pensada para ofrecer una experiencia clara, acompanamiento comercial y una compra mas simple.`,
      keywords: ["como trabajan", "modelo de negocio", "operacion", "somos", "como funciona"],
    },
    politica_privacidad: {
      response:
        "La politica de privacidad esta disponible en el sitio para que puedas revisar como se administran los datos personales.",
      keywords: ["privacidad", "datos personales", "politica de datos", "informacion personal"],
    },
    terminos_condiciones: {
      response:
        "Los terminos y condiciones estan publicados en el sitio para que puedas revisar las reglas de uso y las condiciones comerciales vigentes.",
      keywords: ["terminos", "condiciones", "reglas", "politicas", "uso de la web", "legales"],
    },
    saludo_generico: {
      response: `Hola, soy el asistente virtual de ${businessName}. Puedo ayudarte con envios, pagos, cambios, FAQ o informacion general del negocio.`,
      keywords: ["hola", "q onda", "que onda", "buenas", "saludos", "hi"],
    },
    despedida_generica: {
      response: `Gracias por contactarte con ${businessName}. Si necesitas algo mas, volve a escribirnos cuando quieras.`,
      keywords: ["chau", "adios", "gracias", "nos vemos", "bye", "hasta luego"],
    },
    comentario_inapropiado_irrelevante: {
      response: `Solo puedo ayudarte con consultas relacionadas con ${businessName}. Si necesitas atencion personalizada, escribinos a ${supportEmail || "nuestro email"} o por WhatsApp ${whatsapp || "del negocio"}.`,
      keywords: [
        "estupido", "idiota", "tonto", "maldito", "mierda", "puto", "gil", "imbecil", "pelotudo", "boludo", "tarado",
        "sexo", "puta", "culo", "tetas", "pene", "coger", "garcha", "porno", "xxx", "acosar",
        "matar", "golpear", "arma", "amenaza", "violencia", "muerte",
        "clima", "noticias", "futbol", "politica", "chiste", "adivinanza", "musica", "pelicula", "receta",
      ],
    },
  };
};

module.exports = { buildLocalKnowledge };
