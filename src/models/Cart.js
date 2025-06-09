const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  sequelize.define(
    "cart",
    {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
          },

      cartUserId: {
        type: DataTypes.UUID, // Asegúrate de que sea UUID
        allowNull: false,
        primaryKey: true,
      },
      cartProducts:       
       {
        type: DataTypes.ARRAY(
          DataTypes.JSONB({
            name: DataTypes.STRING,
            image: DataTypes.STRING,
            price: DataTypes.INTEGER,
            amount: DataTypes.INTEGER,
          })
        ),
        defaultValue: [],
      },      
      
      
      order: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
    },
    { timestamps: false }
  );
};
