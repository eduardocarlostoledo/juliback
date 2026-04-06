const { Router } = require('express');
const {productRouter} = require('./productRouter')
const {userRouter} = require("./userRouter.js")
const {cartRouter} = require("./cartRouter.js")
const {filterRouter} = require("./filterRouter")
const {payRouter} = require("./payRouter.js")
const {orderRouter} = require("./orderRouter.js")
const {googleRouter} = require("./googleRouter.js")
const {cspRouter} = require("./cspRouter.js")
const {chatRouter} = require("./chatRouter.js")
const {invoiceRouter} = require("./invoiceRouter.js")
const {shippingRouter} = require("./shippingRouter.js")
const {paymentProviderRouter} = require("./paymentProviderRouter.js")
const {businessConfigRouter} = require("./businessConfigRouter.js")
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');


const router = Router();



// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);
router.use('/products', productRouter)
router.use('/users', userRouter)
router.use('/cart', cartRouter)
router.use('/filter',filterRouter)
router.use('/pay', payRouter)
router.use("/orders", orderRouter)
router.use('/auth', googleRouter)
router.use("csp", cspRouter)
router.use("/chat", chatRouter);
router.use("/billing", invoiceRouter);
router.use("/shipping", shippingRouter);
router.use("/payment-providers", paymentProviderRouter);
router.use("/business-config", businessConfigRouter);

module.exports = router;
