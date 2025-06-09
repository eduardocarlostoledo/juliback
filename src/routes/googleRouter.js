const { Router } = require("express");
const googleRouter = Router();
const passport=require("passport");
const { verificaToken } = require("../helpers/verificaToken.js");
const { verifyAdmin } = require("../helpers/verifyAdmin.js");
const router = require("./index.js");

googleRouter.post(
    "/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );
  
  // Ruta de callback para Google
  googleRouter.get(
    "/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
      // Redirige al usuario a la página deseada tras un inicio de sesión exitoso
      res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?response_type=code&redirect_uri=http://localhost:3001/auth/google/callback&scope=profile%20email&client_id=${process.env.CLIENT_ID_LOGIN}`);
    });
    
    module.exports = { googleRouter };
