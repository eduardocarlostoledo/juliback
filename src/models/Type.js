const {DataTypes} = require("sequelize")
module.exports= (sequelize)=>{
    sequelize.define('type',{
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