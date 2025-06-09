const { DataTypes} = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('user', {
        id:{
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name:{
            type: DataTypes.STRING,
        },
        lastname: {
            type: DataTypes.STRING,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        image: {
            type: DataTypes.JSON,
            public_id: DataTypes.STRING,
            secure_url: DataTypes.STRING,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phonenumber: {
            type: DataTypes.STRING,
            unique: true
        },
        country: {
            type: DataTypes.STRING,
            defaultValue: "Argentina"
        },
        city: {
            type: DataTypes.STRING
        },
        address: {
            type: DataTypes.STRING
        },
        admin: {
               type: DataTypes.BOOLEAN,
               defaultValue: false
     } ,
       status:{
           type: DataTypes.BOOLEAN,
               defaultValue: true
       }
    },{timestamps:false})
}
