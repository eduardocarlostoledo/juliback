const jwt = require('jsonwebtoken');
const { User } = require('../db')
const {getUserById} = require("../controllers/usersController.js")


// Middleware para verificar si el usuario es administrador
const verifyAdmin = async (req, res, next) => {
  //console.log("verificando admin en midleware", req.headers)
    try {

      const token = req.headers['authorization']?.split(' ')[1]; // "Bearer <token>"
      
        if (!token) {
          return res.status(403).json({ msg: 'No token provided', success: false });
        }
      
        try {
          // Verificar y decodificar el token
          const decoded = await jwt.verify(token, process.env.JWT_SECRET); 
          req.user = decoded; // Almacenar la información del usuario decodificada
          //console.log("token confirmado req.user", req.user)


      const userId = decoded.userId; // Suponiendo que el ID del usuario está en el cuerpo de la petición
      const userEmail = decoded.email;
  
      //console.log("VERIFY", decoded,  userId, userEmail) 
  
      if (!decoded.admin) {
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden realizar esta acción.' });
      }
  
      next();
    } catch (error) {
      res.status(500).json({ error: 'Error al verificar permisos de administrador' });
    }
  }
  catch (error) {
    res.status(500).json({ error: 'Error al verificar permisos de administrador' });
  }
  
};

  module.exports= {verifyAdmin}