const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Usuario = sequelize.define('Usuario', {
    nombre: {
        type: DataTypes.STRING(120),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(180),
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash'
    },
    rol: {
        type: DataTypes.ENUM('Administrador', 'Almacenero'),
        allowNull: false,
        defaultValue: 'Almacenero'
    }
}, { tableName: 'Usuarios' });

module.exports = Usuario;
