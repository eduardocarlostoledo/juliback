const {DataTypes} = require("sequelize")

module.exports = (sequelize)=>{
    sequelize.define('brand',{
        id:{
            type:DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    },{timestamps:false})}