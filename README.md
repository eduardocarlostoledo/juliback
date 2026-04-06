<p align="center">
  <img src="../FRONT/logo.svg" alt="HALLPA" width="180" />
</p>

<h1 align="center">HALLPA — Backend API</h1>

<p align="center">
  API RESTful para e-commerce white-label con autenticacion JWT, checkout Mercado Pago, chatbot IA y arquitectura preparada para multi-pasarela, envios y facturacion electronica.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20_LTS-339933?logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Sequelize-6.28-52B0E7?logo=sequelize&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/MercadoPago-SDK_2.0-009EE3?logo=mercadopago&logoColor=white" />
  <img src="https://img.shields.io/badge/license-proprietary-red" />
</p>

---

## Sobre el proyecto

HALLPA Backend es la API central que alimenta la plataforma de e-commerce white-label HALLPA. Gestiona todo el ciclo de vida de una tienda online: autenticacion, catalogo, carrito, ordenes, pagos, y una capa de configuracion de negocio que permite adaptar la tienda a cualquier marca sin modificar codigo.

Incluye un asistente de ventas basado en Google Gemini, integracion completa con Mercado Pago y una arquitectura de integraciones extensible para soportar multiples pasarelas de pago, carriers de envio y facturacion electronica AFIP.

---

## Stack tecnologico

| Capa | Tecnologia |
|------|------------|
| Runtime | Node.js 20 LTS (Alpine) |
| Framework | Express 4 |
| ORM | Sequelize 6 |
| Base de datos | PostgreSQL |
| Autenticacion | JWT + bcryptjs |
| OAuth | Google Identity Services / Passport |
| Pagos | Mercado Pago SDK 2.0 |
| IA | Google Gemini (Generative AI SDK) |
| Imagenes | Cloudinary |
| Email | Nodemailer |
| Seguridad | Helmet, CORS, XSS-Clean, Rate Limiting |
| Logging | Morgan (dev/combined) |
| Contenedores | Docker (Alpine) |

---

## Arquitectura

```
src/
├── controllers/
│   ├── usersController.js         # Auth, registro, Google login
│   ├── productController.js       # CRUD productos + Cloudinary
│   ├── cartController.js          # Carrito por usuario autenticado
│   ├── orderControllers.js        # Ordenes de compra
│   ├── chatController.js          # Chatbot IA (Gemini)
│   ├── businessConfigController.js # Configuracion white-label
│   ├── filterController.js        # Filtros de catalogo
│   ├── invoiceController.js       # Facturacion AFIP (scaffolding)
│   ├── shippingController.js      # Envios multi-carrier (scaffolding)
│   └── paymentProviderController.js # Multi-pasarela (scaffolding)
├── models/
│   ├── User.js                    # Usuarios con roles
│   ├── Product.js                 # Catalogo
│   ├── Brand.js / Type.js         # Taxonomia de productos
│   ├── Cart.js                    # Carrito persistente
│   ├── Order.js                   # Ordenes con snapshot de compra
│   ├── Roles.js                   # Sistema de roles
│   └── BusinessConfig.js          # Configuracion de negocio (JSONB)
├── routes/
│   ├── index.js                   # Router central
│   ├── userRouter.js              # /users/*
│   ├── productRouter.js           # /products/*
│   ├── cartRouter.js              # /cart/*
│   ├── orderRouter.js             # /orders/*
│   ├── payRouter.js               # /pay/* (Mercado Pago)
│   ├── chatRouter.js              # /chat/*
│   ├── businessConfigRouter.js    # /business-config/*
│   ├── invoiceRouter.js           # /billing/* (AFIP)
│   ├── shippingRouter.js          # /shipping/*
│   ├── paymentProviderRouter.js   # /payment-providers/*
│   ├── filterRouter.js            # /filters/*
│   ├── cspRouter.js               # CSP reporting
│   └── googleRouter.js            # OAuth Google
├── services/
│   ├── mercadoPagoService.js      # Logica de negocio MP
│   └── orderService.js            # Logica de negocio ordenes
├── helpers/
│   ├── verificaToken.js           # Middleware JWT
│   ├── verificaUsuario.js         # Verificacion de usuario activo
│   ├── verifyAdmin.js             # Middleware de rol admin
│   ├── bcrypt.js                  # Hashing de passwords
│   ├── baseKnowledge.js           # Contexto base para chatbot IA
│   └── integrationResponses.js    # Respuestas estandar para integraciones
├── constants/
│   ├── integrationProviders.js    # Providers de pago, envio y facturacion
│   └── businessConfigDefaults.js  # Valores default white-label
├── mail/
│   ├── nodemail.js                # Envio de emails transaccionales
│   └── changePass.js              # Template de cambio de password
├── utils/
│   └── cloudinary.js              # Configuracion de Cloudinary
├── app.js                         # Configuracion de Express y middlewares
└── db.js                          # Conexion Sequelize + PostgreSQL
```

---

## Features

### Core e-commerce
- CRUD completo de productos con imagenes en Cloudinary
- Carrito persistente por usuario autenticado (JWT)
- Ordenes de compra con snapshot completo del comprador y productos
- Filtros de catalogo por marca, tipo y atributos

### Autenticacion y autorizacion
- Registro y login tradicional con JWT
- Google Sign-In (Identity Services + Passport OAuth)
- Middleware de verificacion de token en rutas protegidas
- Sistema de roles (usuario / admin)
- Cambio de password con email de verificacion

### Pagos — Mercado Pago
- Creacion de preferencias de pago (Checkout Pro)
- Webhook de feedback (success / pending / failure)
- Actualizacion automatica del estado de la orden
- Arquitectura multi-provider preparada (Mobbex, Todo Pago, MODO, Stripe)

### Chatbot de ventas (IA)
- Asistente virtual potenciado por Google Gemini
- Base de conocimiento configurable del negocio
- Contexto de productos y politicas inyectado al modelo

### Sistema white-label
- Configuracion de negocio almacenada en PostgreSQL (JSONB)
- Logo, nombre comercial, tagline, emails de contacto
- Textos institucionales editables: FAQ, politica de envios, devoluciones, privacidad, terminos, historia
- Hero section y contenido de landing configurables
- API dedicada para lectura y actualizacion desde el panel admin

### Seguridad (OWASP Top 10)
- Helmet con Content Security Policy personalizada
- CORS con whitelist estricta de origenes
- XSS-Clean en todos los inputs
- HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff
- Rate limiting preparado (configurable)
- Validacion global de URLs
- Request ID unico por solicitud para trazabilidad

---

## Docker

El backend incluye un Dockerfile listo para produccion:

```dockerfile
FROM node:20.18-alpine3.20
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

### Build y ejecucion

```bash
# Build de la imagen
docker build -t hallpa-backend .

# Ejecucion
docker run -d \
  --name hallpa-api \
  -p 3000:3000 \
  --env-file .env \
  hallpa-backend
```

### Caracteristicas del contenedor
- **Base image**: `node:20.18-alpine3.20` — imagen minima (~50MB base)
- **Solo dependencias de produccion**: `--only=production` reduce el tamano final
- **Puerto expuesto**: 3000
- **Variables de entorno**: inyectadas via `--env-file` o orquestador (no se incluyen en la imagen)

---

## Inicio rapido

### Requisitos previos

- Node.js >= 18
- npm >= 9
- PostgreSQL >= 14
- Cuenta de Cloudinary
- Credenciales de Mercado Pago
- API Key de Google Gemini

### Instalacion

```bash
git clone <repo-url>
cd BACK
npm install
```

### Variables de entorno

Crear archivo `.env` en la raiz de `BACK/`:

```env
# Server
PORT=3000
BACK=http://localhost:3000
FRONT=http://localhost:6002
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hallpa
DB_USER=postgres
DB_PASSWORD=tu-password

# Auth
JWT_SECRET=tu-jwt-secret
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# Mercado Pago
ACCESS_TOKEN_MERCADOPAGO=tu-access-token

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret

# Gemini AI
GEMINI_API_KEY=tu-gemini-key
GEMINI_MODEL=gemini-2.5-flash

# Email
EMAIL_USER=tu-email
EMAIL_PASS=tu-app-password
```

### Desarrollo

```bash
npm run start:dev
# Servidor con hot-reload via Nodemon en http://localhost:3000
```

### Produccion

```bash
npm start
# o via Docker
docker build -t hallpa-backend . && docker run -p 3000:3000 --env-file .env hallpa-backend
```

---

## Scripts disponibles

| Comando | Descripcion |
|---------|-------------|
| `npm start` | Inicia el servidor en produccion |
| `npm run start:dev` | Inicia con Nodemon (hot-reload) |

---

## Endpoints principales

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| `POST` | `/users/login` | Login tradicional | No |
| `POST` | `/users/google` | Login/registro con Google | No |
| `GET` | `/users/verificalogin` | Verificar sesion activa | JWT |
| `GET` | `/products` | Listar productos | No |
| `POST` | `/products` | Crear producto | Admin |
| `GET` | `/cart/getcartclient/:userId` | Obtener carrito | JWT |
| `POST` | `/cart/addcart` | Agregar al carrito | JWT |
| `POST` | `/pay/create_preference` | Crear preferencia MP | JWT |
| `GET` | `/pay/feedback/:status` | Webhook de pago | No |
| `GET` | `/orders/user/:userId` | Ordenes del usuario | JWT |
| `POST` | `/chat` | Mensaje al chatbot IA | No |
| `GET` | `/business-config` | Configuracion de negocio | No |
| `PUT` | `/business-config` | Actualizar configuracion | Admin |
| `GET` | `/billing/providers` | Providers de facturacion | JWT |
| `GET` | `/shipping/providers` | Providers de envio | JWT |
| `GET` | `/payment-providers/providers` | Pasarelas de pago | JWT |

---

## Integraciones externas

| Servicio | Uso | Estado |
|----------|-----|--------|
| **Mercado Pago** | Checkout Pro, webhooks, ordenes | Activo |
| **Google OAuth** | Autenticacion social | Activo |
| **Google Gemini** | Chatbot de ventas con IA generativa | Activo |
| **Cloudinary** | Upload y CDN de imagenes | Activo |
| **Nodemailer** | Emails transaccionales | Activo |
| **Mobbex** | Pasarela de pagos alternativa | Planificado |
| **Todo Pago** | Pasarela de pagos | Planificado |
| **MODO / DEBIN** | Pagos instantaneos | Planificado |
| **Stripe** | Pagos internacionales | Planificado |
| **Andreani** | Envios nacionales | Planificado |
| **Correo Argentino** | Envios nacionales | Planificado |
| **Mercado Envios** | Envios via ML | Planificado |
| **AFIP (WSAA/WSFEv1)** | Facturacion electronica | Planificado |

---

## Roadmap

- [ ] Unificar autenticacion Google en un solo endpoint
- [ ] Multi-pasarela de pagos con capa orquestadora
- [ ] Integracion real con AFIP sandbox (WSAA + WSFEv1)
- [ ] Primer carrier de envios (Andreani o Correo Argentino)
- [ ] Rate limiting en produccion
- [ ] Tests unitarios e integracion
- [ ] CI/CD pipeline
- [ ] docker-compose con PostgreSQL + API

---

## Seguridad

| Medida | Implementacion |
|--------|----------------|
| HTTPS forzado | HSTS con 1 ano de cache |
| Content Security Policy | Whitelist de origenes por directiva |
| XSS Prevention | `xss-clean` middleware global |
| CORS | Whitelist estricta con validacion de origen |
| Clickjacking | `X-Frame-Options: DENY` |
| MIME Sniffing | `X-Content-Type-Options: nosniff` |
| Fingerprinting | `X-Powered-By` removido |
| Password Hashing | bcryptjs con salt rounds |
| Token Auth | JWT con expiracion |
| Rate Limiting | express-rate-limit (preparado) |
| Request Tracing | ID unico por request |

---

<p align="center">
  Desarrollado por <strong>Toledo Consultora IT</strong>
</p>
