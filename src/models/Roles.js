const { DataTypes} = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('role', {
        id:{
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        role_name:{
            type: DataTypes.STRING,
        },
        id_user_name:{
            type: DataTypes.STRING,
        },
    },{timestamps:false})
}