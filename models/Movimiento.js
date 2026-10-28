const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Movimiento = sequelize.define('Movimiento', {
    productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'producto_id'
    },
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'usuario_id'
    },
    tipoMovimiento: {
        type: DataTypes.ENUM('Entrada', 'Salida', 'Ajuste'),
        allowNull: false,
        field: 'tipo_movimiento'
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fechaHora: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'fecha_hora'
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, { tableName: 'Movimientos' });

module.exports = Movimiento;
