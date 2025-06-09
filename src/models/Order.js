const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  sequelize.define(
    "Order",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      cartId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      buyer_email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      buyer_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      buyer_lastname: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      buyer_phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      buyer_address: {
        type: DataTypes.JSON, // Almacena la dirección como un objeto JSON
        allowNull: true,
      },
      products: {
        type: DataTypes.JSON, // Almacena los productos como un array de objetos JSON
        allowNull: false,
      },
      total_order_price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      payment_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      merchant_order_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      preference_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      payment_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      processing_mode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      site_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      estadoEnvio:{
        type: DataTypes.ENUM('enviada', 'pendiente', 'cancelada'),
        allowNull: true,
        defaultValue: 'pendiente'
      },
      trackSeguimiento: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      trackUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      trackCarrierName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW, // Fecha y hora actuales
        allowNull: true,
      },
    },
    { timestamps: false }
  );
};
