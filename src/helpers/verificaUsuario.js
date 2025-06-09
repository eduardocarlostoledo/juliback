const jwt = require('jsonwebtoken');
const { User } = require('../db.js');

const verificaUsuario = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        //console.log("Decoded token:", decoded); // 👈

        const user = await User.findByPk(decoded.userId); // ✅ correcto

        //console.log("User from DB:", user); // 👈

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};


module.exports = { verificaUsuario };