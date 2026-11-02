const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

function obtenerSecretoJwt() {
    const secret = process.env.JWT_SECRET;
    if (!secret || Buffer.byteLength(secret) < 32) {
        throw new Error('JWT_SECRET debe contener al menos 32 bytes.');
    }
    return secret;
}

async function autenticar(req, res, next) {
    const authorization = req.get('authorization') || '';
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Debes iniciar sesión para continuar.' });
    }

    try {
        const payload = jwt.verify(token, obtenerSecretoJwt(), {
            algorithms: ['HS256']
        });
        if (typeof payload.sub !== 'string' || !/^\d+$/.test(payload.sub)) {
            return res.status(401).json({ error: 'La sesión no es válida.' });
        }

        const usuario = await Usuario.findByPk(Number(payload.sub), {
            attributes: ['id', 'nombre', 'email', 'rol', 'activo']
        });
        if (!usuario || !usuario.activo) {
            return res.status(401).json({ error: 'La sesión no es válida o está desactivada.' });
        }

        req.usuario = usuario;
        return next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'La sesión expiró o no es válida.' });
        }
        return next(error);
    }
}

function autorizar(...rolesPermitidos) {
    return (req, res, next) => {
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ error: 'No tienes permisos para realizar esta acción.' });
        }
        return next();
    };
}

module.exports = { autenticar, autorizar, obtenerSecretoJwt };
