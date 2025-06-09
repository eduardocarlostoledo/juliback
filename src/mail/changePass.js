const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
});

const crearTransporter = async () => {
    try {
        const accessToken = await oauth2Client.getAccessToken();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.EMAIL,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        });
        return transporter;
    } catch (error) {
        console.error('Error al obtener el token de acceso:', error.message);
        throw new Error('No se pudo obtener el token de acceso.');
    }
};

const enviarPass = async (usuario, clave) => {
    try {
        const transporter = await crearTransporter();

        const mensaje = {
            from: process.env.EMAIL,
            to: usuario,
            subject: 'Código para cambio de contraseña',
            text: `El código solicitado para cambio de contraseña en https://elgatonegropremium.netlify.app/ es el siguiente: ${clave}`,
        };

        const info = await transporter.sendMail(mensaje);

        console.log('Correo enviado correo de recuperacion a: ', usuario);

    } catch (error) {
        console.error('Error al enviar el correo:', error.message);
        throw new Error('No se pudo enviar el correo. Verifica las credenciales y la configuración.');
    }
};

module.exports = enviarPass;
