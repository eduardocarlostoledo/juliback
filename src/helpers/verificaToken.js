const jwt = require('jsonwebtoken');

const verificaToken = async (req, res, next) => {
//console.log("Verificando token en middleware", req.headers);
  
  // Extraer el token del header "Authorization"
  const token = req.headers['authorization']?.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(403).json({ msg: 'No token provided', success: false });
  }

  try {
    // Verificar y decodificar el token
    const decoded = await jwt.verify(token, process.env.JWT_SECRET); 
    req.user = decoded; // Almacenar la información del usuario decodificada
    //console.log("token confirmado req.user", req.user)
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ msg: 'Token expirado', success: false });
    }
    
    // Enviar una respuesta para cualquier otro tipo de error
    return res.status(500).json({ msg: 'Token no válido', success: false, error: err.message });
  }
};

module.exports = { verificaToken };
