const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Proveedor = sequelize.define('Proveedor', {
    razonSocial: {
        type: DataTypes.STRING(180),
        allowNull: false,
        field: 'razon_social'
    },
    contacto: {
        type: DataTypes.STRING(120),
        allowNull: true
    },
    telefono: {
        type: DataTypes.STRING(40),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(180),
        allowNull: true,
        validate: { isEmail: true }
    }
}, { tableName: 'Proveedores' });

module.exports = Proveedor;
