const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { rateLimit } = require('express-rate-limit');
const { Transaction } = require('sequelize');
const sequelize = require('../config/db');
const Usuario = require('../models/Usuario');
const { autenticar, obtenerSecretoJwt } = require('../middleware/autenticacion');
const { verificarPassword } = require('../services/passwords');

const router = express.Router();
const limitarLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.' }
});
const limitarRegistro = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Se alcanzó el límite de registros. Inténtalo más tarde.' }
});

function validarCredenciales(body, { registro = false } = {}) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Debes enviar los datos de acceso.' };
    }
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = body.password;

    if (!email || email.length > 180 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { error: 'Ingresa un correo electrónico válido.' };
    }
    if (typeof password !== 'string' || password.length < 8 ||
        (registro && Buffer.byteLength(password, 'utf8') > 72) ||
        (!registro && password.length > 128)) {
        return {
            error: registro
                ? 'La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.'
                : 'La contraseña debe tener entre 8 y 128 caracteres.'
        };
    }
    if (!registro) {
        return { values: { email, password } };
    }

    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    if (!nombre || nombre.length > 120) {
        return { error: 'El nombre es obligatorio y no debe superar 120 caracteres.' };
    }
    return { values: { nombre, email, password } };
}

function crearToken(usuario) {
    return jwt.sign(
        { rol: usuario.rol },
        obtenerSecretoJwt(),
        {
            algorithm: 'HS256',
            subject: String(usuario.id),
            expiresIn: process.env.JWT_EXPIRES_IN || '2h'
        }
    );
}

function usuarioSeguro(usuario) {
    return {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
    };
}

router.post('/register', limitarRegistro, async (req, res, next) => {
    const resultado = validarCredenciales(req.body, { registro: true });
    if (resultado.error) {
        return res.status(400).json({ error: resultado.error });
    }

    try {
        const { password, ...userValues } = resultado.values;
        const usuario = await sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
        }, async (transaction) => {
            const usuariosExistentes = await Usuario.count({ transaction });
            return Usuario.create({
                ...userValues,
                passwordHash: await bcrypt.hash(password, 12),
                rol: usuariosExistentes === 0 ? 'Administrador' : 'Almacenero',
                activo: true
            }, { transaction });
        });

        return res.status(201).json({
            message: 'Registro completado. Ya puedes iniciar sesión.',
            user: usuarioSeguro(usuario)
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
        }
        return next(error);
    }
});

router.post('/login', limitarLogin, async (req, res, next) => {
    const resultado = validarCredenciales(req.body);
    if (resultado.error) {
        return res.status(400).json({ error: resultado.error });
    }

    try {
        const usuario = await Usuario.findOne({
            where: { email: resultado.values.email }
        });
        const passwordDentroDelLimite = usuario?.passwordHash.startsWith('$2')
            ? Buffer.byteLength(resultado.values.password, 'utf8') <= 72
            : true;
        const passwordValida = usuario
            ? passwordDentroDelLimite &&
                await verificarPassword(resultado.values.password, usuario.passwordHash)
            : false;
        if (!usuario || !usuario.activo || !passwordValida) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
        }
        if (!usuario.passwordHash.startsWith('$2') &&
            Buffer.byteLength(resultado.values.password, 'utf8') <= 72) {
            usuario.passwordHash = await bcrypt.hash(resultado.values.password, 12);
            await usuario.save();
        }

        return res.json({
            token: crearToken(usuario),
            user: usuarioSeguro(usuario)
        });
    } catch (error) {
        return next(error);
    }
});

router.get('/me', autenticar, (req, res) => {
    return res.json({ user: usuarioSeguro(req.usuario) });
});

module.exports = router;
