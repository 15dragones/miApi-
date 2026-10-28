const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Producto = sequelize.define('Producto', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    categoriaId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'categoria_id'
    },
    proveedorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'proveedor_id'
    }
}, {
    timestamps: true
});

module.exports = Producto;