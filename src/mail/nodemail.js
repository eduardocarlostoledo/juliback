const nodemailer = require('nodemailer');

const enviarMail = async (producto, precio, usuario, statusId) => {
  try {
    // Validaciones de entrada
    if (!producto || !precio || !usuario || !statusId) {
      throw new Error('Faltan datos necesarios para enviar el correo.');
    }

    if (typeof precio !== 'number' || precio <= 0) {
      throw new Error('El precio debe ser un número positivo.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuario)) {
      throw new Error('El email del usuario es inválido.');
    }

    // Verificación de credenciales de correo
    if (!process.env.EMAIL || !process.env.PASSWORD) {
      throw new Error('Las credenciales de correo no están configuradas.');
    }

    let cantidades = producto.split(',');

    const config = {
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
      }
    };

    const mensaje = {
      from: process.env.EMAIL,
      to: usuario,
      subject: 'Tu Compra en El Gato Negro',
      text: `Muchas gracias por comprar en El Gato Negro Premium! Adjuntamos los detalles de su compra:
      Producto/s: ${producto}
      Cantidad de productos: ${cantidades.length}
      Compra total: $${precio}
      Estado de pago: ${statusId}`
    };

    const transport = nodemailer.createTransport(config);

    // Enviar el correo y capturar la información de envío
    const info = await transport.sendMail(mensaje);

    console.log('Correo enviado: ', info);

  } catch (error) {
    console.error('Error al enviar el correo:', error);
    throw new Error('No se pudo enviar el correo. Por favor, verifica los datos y la configuración.');
  }
};

module.exports = enviarMail;
