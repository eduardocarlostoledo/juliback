const { Router } = require("express");

const googleRouter = Router();

googleRouter.all("*", (req, res) => {
  return res.status(410).json({
    success: false,
    message:
      "Flujo Passport Google legado fuera de uso. Utiliza /users/google-auth.",
  });
});

module.exports = { googleRouter };
