const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  sequelize.define(
    "product",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      image: {
        type: DataTypes.JSON,
        public_id: DataTypes.STRING,
        secure_url: DataTypes.STRING,
      },
      price: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 1000,
        },
      },
      info_adicional: {
        type: DataTypes.STRING,
      },
      calification: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
      },
      reviews: {
        type: DataTypes.ARRAY(
          DataTypes.JSONB({
            nameUser: DataTypes.STRING,
            lastnameUser: DataTypes.STRING,
            calification: DataTypes.INTEGER,
            comment: DataTypes.STRING,
          })
        ),
        defaultValue: [],
      },      
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    { timestamps: false }
  );
};
