const defaultShippingPolicySections = [
  {
    title: "Donde entregamos",
    content:
      "Realizamos envios a todo el pais. Tambien podes coordinar retiro o entrega especial segun la operacion del negocio.",
  },
  {
    title: "Tiempos de entrega",
    content:
      "Los plazos pueden variar segun destino, disponibilidad y operador logistico. Una vez confirmado el pedido te compartimos el seguimiento si corresponde.",
  },
  {
    title: "Costos de envio",
    content:
      "El costo de envio se informa antes de finalizar la compra y puede cambiar segun ubicacion, volumen y promociones vigentes.",
  },
  {
    title: "Seguimiento del pedido",
    content:
      "Cuando el pedido es despachado te enviamos la informacion necesaria para seguirlo y acompanarte hasta la entrega.",
  },
];

const defaultReturnPolicySections = [
  {
    title: "Solicitudes de cambio o devolucion",
    content:
      "Si necesitas gestionar un cambio o devolucion, escribinos por WhatsApp indicando numero de orden y motivo para que podamos ayudarte.",
  },
  {
    title: "Condicion del producto",
    content:
      "Para aprobar la gestion, el producto debe estar sin uso y en condiciones acordes a la politica del negocio.",
  },
  {
    title: "Costos asociados",
    content:
      "Cuando existe una falla o un error de preparacion, asumimos los costos correspondientes. En otros casos puede aplicarse un cargo logistico.",
  },
  {
    title: "Reembolsos",
    content:
      "Si corresponde un reintegro, lo procesamos por el mismo medio de pago o por el canal acordado con el cliente.",
  },
];

const defaultPaymentsPolicySections = [
  {
    title: "Medios de pago",
    content:
      "Aceptamos tarjetas de credito y debito, transferencias y otras alternativas que puedan habilitarse desde la pasarela de pago del negocio.",
  },
  {
    title: "Promociones",
    content:
      "Las promociones bancarias, cuotas y descuentos pueden variar segun la fecha, el medio de pago y las condiciones vigentes.",
  },
  {
    title: "Validacion de pagos",
    content:
      "Todas las operaciones quedan sujetas a validacion de la plataforma de pago y a controles antifraude cuando corresponda.",
  },
];

const defaultTermsSections = [
  {
    title: "1. Informacion general",
    content:
      "Al utilizar este sitio aceptas los terminos y condiciones vigentes del negocio.",
  },
  {
    title: "2. Cuenta y registro",
    content:
      "La persona usuaria debe brindar informacion real y mantener resguardadas sus credenciales.",
  },
  {
    title: "3. Productos, precios y disponibilidad",
    content:
      "Los precios, promociones y stock pueden modificarse sin previo aviso, salvo en ordenes ya confirmadas.",
  },
  {
    title: "4. Envios, cambios y devoluciones",
    content:
      "Las condiciones especificas se informan en las politicas publicadas en el sitio y forman parte de estos terminos.",
  },
  {
    title: "5. Jurisdiccion",
    content:
      "Estos terminos se interpretan conforme a la normativa aplicable en la Republica Argentina.",
  },
];

const defaultPrivacySections = [
  {
    title: "1. Datos que recopilamos",
    content:
      "Podemos solicitar informacion necesaria para procesar compras, brindar soporte y mejorar la experiencia del sitio.",
  },
  {
    title: "2. Uso de la informacion",
    content:
      "Los datos se utilizan para gestionar ordenes, comunicaciones, soporte y obligaciones administrativas o legales.",
  },
  {
    title: "3. Seguridad",
    content:
      "Aplicamos medidas razonables para resguardar la informacion personal y las operaciones realizadas en la plataforma.",
  },
  {
    title: "4. Derechos",
    content:
      "La persona usuaria puede solicitar actualizacion o revision de sus datos por los canales de contacto publicados.",
  },
];

const defaultFaqItems = [
  {
    question: "Como realizo una compra?",
    answer:
      "Explora los productos, agrega lo que necesites al carrito y completa los pasos de pago y entrega.",
  },
  {
    question: "Que medios de pago aceptan?",
    answer:
      "Aceptamos los medios disponibles en la pasarela de pago activa del negocio y las promociones vigentes.",
  },
  {
    question: "Realizan envios?",
    answer:
      "Si. Las condiciones de envio dependen de la ubicacion del cliente y de la logistica definida por el negocio.",
  },
  {
    question: "Puedo cambiar o devolver un producto?",
    answer:
      "Si la operacion lo permite, podes solicitarlo siguiendo la politica de cambios y devoluciones publicada en el sitio.",
  },
];

const defaultHistorySections = [
  {
    title: "Origen",
    content:
      "Esta marca nace con la idea de ofrecer una experiencia de compra clara, cercana y con identidad propia.",
  },
  {
    title: "Crecimiento",
    content:
      "Con el tiempo incorporamos nuevos productos, mejores procesos y una presencia digital mas solida para acompanar a cada cliente.",
  },
  {
    title: "Proposito",
    content:
      "Buscamos construir una marca confiable, flexible y lista para adaptarse a distintos negocios sin perder su personalidad.",
  },
];

const businessConfigDefaults = {
  logo: null,
  businessName: "HALLPA",
  businessTagline: "marroquineria con identidad",
  whatsapp: "5493855015327",
  supportEmail: "hola@hallpa.com",
  legalEmail: "legal@hallpa.com",
  contactAddress: "Argentina",
  footerText:
    "Atencion personalizada, compra protegida y una experiencia lista para crecer con tu marca.",
  homeHeroBadge: "Marca blanca lista para vender",
  homeHeroTitle:
    "HALLPA combina identidad, experiencia de compra clara y una presencia visual mas fuerte.",
  homeHeroDescription:
    "Configura logo, nombre comercial, textos clave y contenidos institucionales desde el panel administrador para adaptar la tienda a cada negocio.",
  homeStoryTitle: "Una marca con relato, no solo con productos",
  homeStoryDescription:
    "La tienda puede contar su propia historia, reforzar su propuesta de valor y mantener consistencia en cada punto de contacto.",
  homeStoryQuote:
    "Cada negocio necesita una identidad clara, una narrativa propia y una operacion lista para escalar.",
  homeStoryAuthor: "Equipo fundador",
  shippingPolicySections: defaultShippingPolicySections,
  returnPolicySections: defaultReturnPolicySections,
  paymentsPolicySections: defaultPaymentsPolicySections,
  termsSections: defaultTermsSections,
  privacySections: defaultPrivacySections,
  faqItems: defaultFaqItems,
  historySections: defaultHistorySections,
};

const cloneBusinessConfigDefaults = () =>
  JSON.parse(JSON.stringify(businessConfigDefaults));

module.exports = {
  businessConfigDefaults,
  cloneBusinessConfigDefaults,
};
