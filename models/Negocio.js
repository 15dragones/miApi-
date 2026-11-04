const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Negocio = sequelize.define('Negocio', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        defaultValue: 1
    },
    nombreComercial: {
        type: DataTypes.STRING(120),
        allowNull: false,
        defaultValue: 'Mi negocio',
        field: 'nombre_comercial'
    },
    ruc: {
        type: DataTypes.STRING(11),
        allowNull: true
    },
    direccion: {
        type: DataTypes.STRING(255),
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
}, { tableName: 'Negocio' });

module.exports = Negocio;
