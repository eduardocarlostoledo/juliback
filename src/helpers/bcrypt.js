const bcrypt = require('bcryptjs');

// Función para encriptar texto en formato plano con manejo de errores
const encrypt = async (textPlain) => {
  try {
    const hash = await bcrypt.hash(textPlain, 10);
    return hash;
  } catch (error) {
    console.error('Error al encriptar:', error);
    throw new Error('Error en la encriptación');
  }
};

// Función para comparar una contraseña en texto plano con su hash con manejo de errores
const compare = async (passwordPlain, hashPassword) => {
  try {
    return await bcrypt.compare(passwordPlain, hashPassword);
  } catch (error) {
    console.error('Error al comparar contraseñas:', error);
    throw new Error('Error al comparar las contraseñas');
  }
};

module.exports = {
  encrypt,
  compare,
};
