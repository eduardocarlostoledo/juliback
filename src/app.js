require("dotenv").config();
const express = require("express");
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cors = require("cors");
const fileUpload = require("express-fileupload");
const morgan = require("morgan");
const helmet = require("helmet");
const mercadopago = require("mercadopago");
const routes = require("./routes/index.js");
// const crypto = require('crypto');
require("./db.js");

const server = express();
server.name = "API";

// Configuración de MercadoPago
const ACCESS_TOKEN_MERCADOPAGO = process.env.ACCESS_TOKEN_MERCADOPAGO;
if (ACCESS_TOKEN_MERCADOPAGO) {
  mercadopagoClient = new mercadopago.MercadoPagoConfig({
    accessToken: ACCESS_TOKEN_MERCADOPAGO,
  });
} else {
  console.error(
    "Error: ACCESS_TOKEN_MERCADOPAGO no está definido en el archivo .env"
  );
}

// Variables para URLs comunes
const whitelist = [
  "https://modatotal.netlify.app",
  "modatotal.netlify.app",
  "localhost:3000",
  "localhost:3001",  
  "localhost:5173",
  "localhost:3001",
  "http://localhost:3001",
  "http://localhost:5173",
  "https://elgatonegropremium.netlify.app",
  "https://elgatonegropremium-back-production.up.railway.app",
  "https://api.mercadopago.com",
  "https://sdk.mercadopago.com",
  "https://apis.google.com",
  "https://accounts.google.com",
  "https://csp.withgoogle.com/csp/identity-sign-in-google-http",
  "https://sweetalert.js.org",
  "https://fonts.googleapis.com",
  "https://cdn.jsdelivr.net",
  "https://res.cloudinary.com",
  "https://fonts.gstatic.com",
  "https://www.mercadopago.com",
];

// server.use((req, res, next) => {
//   // Generar un nonce único para cada solicitud
//   res.locals.nonce = crypto.randomBytes(16).toString('base64');
//   next();
// });

// Middleware de seguridad
server.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", ...whitelist],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Úsalo solo si es estrictamente necesario          
          // `'nonce-${res.locals.nonce}'`, // Nonce dinámico
          ...whitelist,
        ],
        styleSrc: ["'self'", "'unsafe-inline'", ...whitelist],
        imgSrc: ["'self'", "data:", ...whitelist],
        connectSrc: ["'self'", ...whitelist],
        fontSrc: ["'self'", "https:", "data:", ...whitelist],
        frameSrc: ["'self'", "https://www.mercadopago.com", ...whitelist],
        formAction: ["'self'", "https://elgatonegropremium-back-production.up.railway.app"],
        objectSrc: ["'none'"], // Más seguro: bloquea objetos embebidos
        upgradeInsecureRequests: [], // Vacío porque es booleano implícito
        baseUri: ["'self'"], // Directiva separada
        reportUri: ["https://csp.withgoogle.com/csp/identity-sign-in-google-http"], // Reporte de CSP
      },
    },
    // contentSecurityPolicy: false, // Opcional, si necesitas más flexibilidad.
  })
);

//esto es para que no exista colision entre helmet y el inicio de sesion de google que requiere permisos "especiales"
server.use ( (req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://api.mercadopago.com https://sdk.mercadopago.com https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount https://elgatonegropremium-back-production.up.railway.app/users/auth/google http://localhost:3001/users/auth/google https://events.mercadopago.com https://api.mercadolibre.com/tracks https://events.mercadopago.com/v2/traffic-light"
  );
next();
})

server.use(helmet.noSniff());
server.use(helmet.frameguard({ action: "deny" }));
server.use(
  helmet.hsts({
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
  })
);
server.use(helmet.hidePoweredBy());

// Configuración de CORS
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) {
      console.log(`CORS permitido para ${origin}`);
      callback(null, true);
    } else {
      console.error(`CORS rechazado para ${origin}`);
      callback(new Error("No permitido por CORS"));
    }
  },
  credentials: true,
};
server.use(cors(corsOptions));

// Otros middlewares
server.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
server.use(express.json());
server.use(express.urlencoded({ extended: false }));
server.use(fileUpload({ useTempFiles: true, tempFileDir: "./uploads" }));

// Middleware para agregar un ID único a las solicitudes
server.use((req, res, next) => {
  req.id = Math.random().toString(36).substring(7);
  next();
});

// Validación global de URLs
server.use((req, res, next) => {
  if (req.body.url && !/^(ftp|http|https):\/\/[^ "]+$/.test(req.body.url)) {
    return res.status(400).json({ error: "Invalid URL" });
  }
  next();
});

// Sesiones y autenticación con Passport
server.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { sameSite: "Lax", secure: process.env.NODE_ENV === "production" }
    // cookie: { sameSite: "None", secure: true }, //solo para https
  })
);
server.use(passport.initialize());
server.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID_LOGIN,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "/auth/callback",
    },
    (accessToken, refreshToken, profile, done) => done(null, profile)
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Rutas
server.use("/", routes);

// Manejo de errores
server.use((err, req, res, next) => {
  const status = err.status || 500;
  console.error(err);
  res.status(status).send(err.message || "Error interno del servidor");
});

module.exports = server;
