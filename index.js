const server = require('./src/app.js');
const { conn } = require('./src/db.js');
const { PORT } = process.env

console.log("🌍 Variables de entorno visibles:");
console.log("BACK:", process.env.BACK);
console.log("FRONT:", process.env.FRONT);
console.log("ACCESS_TOKEN_MERCADOPAGO:", process.env.ACCESS_TOKEN_MERCADOPAGO ? "✅ presente" : "❌ faltante");


// Syncing all the models at once.
console.log`░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
█░██░██░██░██░██░██░██░██░██░░░░░░░░░░█
█░██░██░██░██░██░██░██░██░██░░░░░░░░░░█
█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░█░░░░█▀▀▀█░█▀▀█░█▀▀▄░▀█▀░█▄░░█░█▀▀█░░
░░█░░░░█░░░█░█▄▄█░█░░█░░█░░█░█░█░█░▄▄░░
░░█▄▄█░█▄▄▄█░█░░█░█▄▄▀░▄█▄░█░░▀█░█▄▄█░░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░`

conn.sync({ alter: false }).then(() => { //CAMBIAR A {alter: true} CUANDO TERMINE DE CREAR TODO EL BACKEND
  server.listen(PORT, () => {
    console.log(`Servidor activo en el puerto ${PORT}`); // eslint-disable-line no-console
  });
}); 