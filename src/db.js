require("dotenv").config();
const { Sequelize } = require("sequelize");
const fs = require("fs");
const path = require("path");

const { DB_USER, DB_PASSWORD, DB_HOST, DB_NAME, DB_PORT } = process.env;

const sequelize = new Sequelize(
  `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
  {
    logging: false, // set to console.log to see the raw SQL queries
    native: false, // lets Sequelize know we can use pg-native for ~30% more speed
  }
);

const basename = path.basename(__filename);

const modelDefiners = [];

// Leemos todos los archivos de la carpeta Models, los requerimos y agregamos al arreglo modelDefiners
fs.readdirSync(path.join(__dirname, "/models"))
  .filter(
    (file) =>
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
  )
  .forEach((file) => {
    modelDefiners.push(require(path.join(__dirname, "/models", file)));
  });

// Injectamos la conexion (sequelize) a todos los modelos
modelDefiners.forEach((model) => model(sequelize));
// Capitalizamos los nombres de los modelos ie: product => Product
let entries = Object.entries(sequelize.models);
let capsEntries = entries.map((entry) => [
  entry[0][0].toUpperCase() + entry[0].slice(1),
  entry[1],
]);
sequelize.models = Object.fromEntries(capsEntries);

// En sequelize.models están todos los modelos importados como propiedades
// Para relacionarlos hacemos un destructuring
const { Product, User, Type, Brand, Cart, Order } = sequelize.models;

// Relación Usuario - Producto (Favoritos o historial de compras)
User.belongsToMany(Product, { through: "user_product" });
Product.belongsToMany(User, { through: "user_product" });

// Relación Producto - Marca (Uno a muchos)
Brand.hasMany(Product, { foreignKey: "brandId" });
Product.belongsTo(Brand);

// Relación Producto - Tipo (Uno a muchos)
Type.hasMany(Product, { foreignKey: "typeId" });
Product.belongsTo(Type);

// Relación Usuario - Carrito (Uno a Uno)
User.hasOne(Cart, { foreignKey: "cartUserId" });
Cart.belongsTo(User, { foreignKey: "cartUserId" });

// Relación Carrito - Orden (Uno a Uno)
Cart.hasOne(Order, { foreignKey: "cartId" });
Order.belongsTo(Cart, { foreignKey: "cartId" });

// Relación Usuario - Orden (Uno a Muchos)
User.hasMany(Order, { foreignKey: "userId" });
Order.belongsTo(User);


sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Base de datos sincronizada");
  })
  .catch((error) => {
    console.error("Error al sincronizar la base de datos:", error);
  });

module.exports = {
  ...sequelize.models, // para poder importar los modelos así: const { Product, User } = require('./db.js');
  conn: sequelize, // para importart la conexión { conn } = require('./db.js');
};
