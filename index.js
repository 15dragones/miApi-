const express = require('express');
const cors = require('cors');
const { Op } = require('sequelize');
const sequelize = require('./config/db');
const Producto = require('./models/Producto');
const Categoria = require('./models/Categoria');
const Proveedor = require('./models/Proveedor');
const Usuario = require('./models/Usuario');
const Movimiento = require('./models/Movimiento');

Producto.belongsTo(Categoria, { as: 'categoria', foreignKey: 'categoriaId' });
Categoria.hasMany(Producto, { as: 'productos', foreignKey: 'categoriaId' });
Producto.belongsTo(Proveedor, { as: 'proveedor', foreignKey: 'proveedorId' });
Proveedor.hasMany(Producto, { as: 'productos', foreignKey: 'proveedorId' });
Movimiento.belongsTo(Producto, { as: 'producto', foreignKey: 'productoId' });
Producto.hasMany(Movimiento, { as: 'movimientos', foreignKey: 'productoId' });
Movimiento.belongsTo(Usuario, { as: 'usuario', foreignKey: 'usuarioId' });
Usuario.hasMany(Movimiento, { as: 'movimientos', foreignKey: 'usuarioId' });

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
    res.send('¡API Backend funcionando exitosamente!');
});

function validarId(value) {
    if (typeof value === 'boolean' || value === '') {
        return null;
    }
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function errorDeRestriccion(error) {
    return error.name === 'SequelizeForeignKeyConstraintError' ||
        error.name === 'SequelizeUniqueConstraintError';
}

function responderError(res, error, message) {
    console.error(message, error);
    if (errorDeRestriccion(error)) {
        return res.status(409).json({
            error: 'Ya existe un registro con esos datos o el registro está relacionado con otros datos.'
        });
    }
    return res.status(500).json({ error: message });
}

function validarProducto(body, { permitirStock = false } = {}) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Debes enviar los datos del producto.' };
    }

    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    const descripcion = typeof body.descripcion === 'string' ? body.descripcion.trim() : '';
    const precio = Number(body.precio);
    const tieneStock = Object.hasOwn(body, 'stock');
    const stock = tieneStock ? Number(body.stock) : 0;
    const categoriaId = validarId(body.categoriaId);
    const proveedorId = body.proveedorId === null || body.proveedorId === '' ||
        body.proveedorId === undefined ? null : validarId(body.proveedorId);

    if (!nombre || nombre.length > 255) {
        return { error: 'El nombre es obligatorio y no debe superar 255 caracteres.' };
    }
    if (body.descripcion !== undefined && body.descripcion !== null &&
        typeof body.descripcion !== 'string') {
        return { error: 'La descripción debe ser texto.' };
    }
    if (body.precio === '' || body.precio === null || body.precio === undefined ||
        typeof body.precio === 'boolean' ||
        !Number.isFinite(precio) || precio < 0 || precio > 99999999.99) {
        return { error: 'El precio debe ser un número válido mayor o igual a cero.' };
    }
    if (!permitirStock && tieneStock) {
        return { error: 'El stock se modifica desde el Kardex, no desde el formulario del producto.' };
    }
    if (permitirStock && tieneStock &&
        (body.stock === '' || body.stock === null || typeof body.stock === 'boolean' ||
            !Number.isSafeInteger(stock) || stock < 0 || stock > 2147483647)) {
        return { error: 'El stock debe ser un entero mayor o igual a cero.' };
    }
    if (categoriaId === null) {
        return { error: 'Selecciona una categoría existente para el producto.' };
    }
    if (proveedorId === null && body.proveedorId !== null &&
        body.proveedorId !== '' && body.proveedorId !== undefined) {
        return { error: 'Selecciona un proveedor válido.' };
    }

    return {
        values: {
            nombre,
            descripcion,
            precio,
            ...(permitirStock ? { stock } : {}),
            categoriaId,
            proveedorId
        }
    };
}

function validarCategoria(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Debes enviar los datos de la categoría.' };
    }
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    const descripcion = typeof body.descripcion === 'string' ? body.descripcion.trim() : '';
    if (!nombre || nombre.length > 120) {
        return { error: 'El nombre es obligatorio y no debe superar 120 caracteres.' };
    }
    if (body.descripcion !== undefined && body.descripcion !== null &&
        typeof body.descripcion !== 'string') {
        return { error: 'La descripción debe ser texto.' };
    }
    return { values: { nombre, descripcion } };
}

function validarProveedor(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Debes enviar los datos del proveedor.' };
    }
    for (const campo of ['contacto', 'telefono', 'email']) {
        if (body[campo] !== undefined && body[campo] !== null &&
            typeof body[campo] !== 'string') {
            return { error: `${campo} debe ser texto.` };
        }
    }
    const razonSocial = typeof body.razonSocial === 'string' ? body.razonSocial.trim() : '';
    const contacto = typeof body.contacto === 'string' ? body.contacto.trim() : '';
    const telefono = typeof body.telefono === 'string' ? body.telefono.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (!razonSocial || razonSocial.length > 180) {
        return { error: 'La razón social es obligatoria y no debe superar 180 caracteres.' };
    }
    if (contacto.length > 120 || telefono.length > 40 || email.length > 180) {
        return { error: 'Revisa la longitud de los datos del proveedor.' };
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { error: 'Ingresa un correo electrónico válido.' };
    }
    return { values: { razonSocial, contacto, telefono, email: email || null } };
}

async function validarRelacionesProducto(values) {
    if (!await Categoria.findByPk(values.categoriaId)) {
        return 'La categoría seleccionada no existe.';
    }
    if (values.proveedorId !== null && !await Proveedor.findByPk(values.proveedorId)) {
        return 'El proveedor seleccionado no existe.';
    }
    return null;
}

function registrarRutasCatalogo(path, Model, validar, campoOrden) {
    app.get(path, async (_req, res) => {
        try {
            res.json(await Model.findAll({ order: [[campoOrden, 'ASC']] }));
        } catch (error) {
            responderError(res, error, `No se pudieron obtener ${path}.`);
        }
    });

    app.post(path, async (req, res) => {
        const resultado = validar(req.body);
        if (resultado.error) {
            return res.status(400).json({ error: resultado.error });
        }
        try {
            res.status(201).json(await Model.create(resultado.values));
        } catch (error) {
            responderError(res, error, `No se pudo crear el registro de ${path}.`);
        }
    });

    app.put(`${path}/:id`, async (req, res) => {
        const id = validarId(req.params.id);
        if (!id) {
            return res.status(400).json({ error: 'El ID debe ser un entero positivo.' });
        }
        const resultado = validar(req.body);
        if (resultado.error) {
            return res.status(400).json({ error: resultado.error });
        }
        try {
            const registro = await Model.findByPk(id);
            if (!registro) {
                return res.status(404).json({ error: 'No se encontró el registro.' });
            }
            await registro.update(resultado.values);
            return res.json(registro);
        } catch (error) {
            responderError(res, error, `No se pudo actualizar el registro de ${path}.`);
        }
    });

    app.delete(`${path}/:id`, async (req, res) => {
        const id = validarId(req.params.id);
        if (!id) {
            return res.status(400).json({ error: 'El ID debe ser un entero positivo.' });
        }
        try {
            const registro = await Model.findByPk(id);
            if (!registro) {
                return res.status(404).json({ error: 'No se encontró el registro.' });
            }
            await registro.destroy();
            return res.json({ message: 'Registro eliminado.' });
        } catch (error) {
            responderError(res, error, `No se pudo eliminar el registro de ${path}.`);
        }
    });
}

registrarRutasCatalogo('/categorias', Categoria, validarCategoria, 'nombre');
registrarRutasCatalogo('/proveedores', Proveedor, validarProveedor, 'razonSocial');

app.get('/productos', async (_req, res) => {
    try {
        const productos = await Producto.findAll({
            include: [
                { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
                { model: Proveedor, as: 'proveedor', attributes: ['id', 'razonSocial'] }
            ],
            order: [['nombre', 'ASC']]
        });
        res.json(productos);
    } catch (error) {
        responderError(res, error, 'No se pudieron obtener los productos.');
    }
});

app.post('/productos', async (req, res) => {
    const resultado = validarProducto(req.body, { permitirStock: true });
    if (resultado.error) {
        return res.status(400).json({ error: resultado.error });
    }
    try {
        const errorRelacion = await validarRelacionesProducto(resultado.values);
        if (errorRelacion) {
            return res.status(400).json({ error: errorRelacion });
        }
        const nuevoProducto = await sequelize.transaction(async (transaction) => {
            const { stock: stockInicial, ...datosProducto } = resultado.values;
            const producto = await Producto.create({
                ...datosProducto,
                stock: 0
            }, { transaction });
            if (stockInicial > 0) {
                await producto.update({ stock: stockInicial }, { transaction });
                await Movimiento.create({
                    productoId: producto.id,
                    tipoMovimiento: 'Entrada',
                    cantidad: stockInicial,
                    observaciones: 'Saldo inicial'
                }, { transaction });
            }
            return producto;
        });
        res.status(201).json(nuevoProducto);
    } catch (error) {
        responderError(res, error, 'No se pudo guardar el producto.');
    }
});

app.put('/productos/:id', async (req, res) => {
    const id = validarId(req.params.id);
    if (!id) {
        return res.status(400).json({ error: 'El ID debe ser un entero positivo.' });
    }
    const resultado = validarProducto(req.body);
    if (resultado.error) {
        return res.status(400).json({ error: resultado.error });
    }
    try {
        const errorRelacion = await validarRelacionesProducto(resultado.values);
        if (errorRelacion) {
            return res.status(400).json({ error: errorRelacion });
        }
        const producto = await Producto.findByPk(id);
        if (!producto) {
            return res.status(404).json({ error: 'No se encontró el producto.' });
        }
        await producto.update(resultado.values);
        return res.json(producto);
    } catch (error) {
        responderError(res, error, 'No se pudo actualizar el producto.');
    }
});

app.delete('/productos/:id', async (req, res) => {
    const id = validarId(req.params.id);
    if (!id) {
        return res.status(400).json({ error: 'El ID debe ser un entero positivo.' });
    }
    try {
        const producto = await Producto.findByPk(id);
        if (!producto) {
            return res.status(404).json({ error: 'No se encontró el producto.' });
        }
        await producto.destroy();
        return res.json({ message: 'Producto eliminado.' });
    } catch (error) {
        responderError(res, error, 'No se pudo eliminar el producto.');
    }
});

app.get('/movimientos', async (_req, res) => {
    try {
        const movimientos = await Movimiento.findAll({
            include: [
                { model: Producto, as: 'producto', attributes: ['id', 'nombre'] },
                { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }
            ],
            order: [['fechaHora', 'DESC'], ['id', 'DESC']]
        });
        res.json(movimientos);
    } catch (error) {
        responderError(res, error, 'No se pudieron obtener los movimientos.');
    }
});

app.post('/movimientos', async (req, res) => {
    const productoId = validarId(req.body?.productoId);
    const tipoMovimiento = req.body?.tipoMovimiento;
    const cantidad = Number(req.body?.cantidad);
    const usuarioId = req.body?.usuarioId === null || req.body?.usuarioId === undefined ||
        req.body?.usuarioId === '' ? null : validarId(req.body.usuarioId);
    const observaciones = typeof req.body?.observaciones === 'string'
        ? req.body.observaciones.trim()
        : '';

    if (!productoId) {
        return res.status(400).json({ error: 'Selecciona un producto válido.' });
    }
    if (!['Entrada', 'Salida', 'Ajuste'].includes(tipoMovimiento)) {
        return res.status(400).json({ error: 'El tipo debe ser Entrada, Salida o Ajuste.' });
    }
    if (typeof req.body?.cantidad === 'boolean' || !Number.isSafeInteger(cantidad) || cantidad === 0 ||
        (tipoMovimiento !== 'Ajuste' && cantidad < 0)) {
        return res.status(400).json({
            error: 'La cantidad debe ser un entero distinto de cero; los ajustes aceptan signo.'
        });
    }
    if (usuarioId === null && req.body?.usuarioId !== null &&
        req.body?.usuarioId !== undefined && req.body?.usuarioId !== '') {
        return res.status(400).json({ error: 'Selecciona un usuario válido.' });
    }
    if (!observaciones || observaciones.length > 1000) {
        return res.status(400).json({
            error: 'Indica el motivo del movimiento en observaciones (máximo 1000 caracteres).'
        });
    }

    const variacion = tipoMovimiento === 'Entrada' ? cantidad
        : tipoMovimiento === 'Salida' ? -cantidad
            : cantidad;

    try {
        const movimiento = await sequelize.transaction(async (transaction) => {
            const producto = await Producto.findByPk(productoId, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!producto) {
                const error = new Error('No se encontró el producto.');
                error.status = 404;
                throw error;
            }
            if (usuarioId !== null && !await Usuario.findByPk(usuarioId, { transaction })) {
                const error = new Error('No se encontró el usuario.');
                error.status = 400;
                throw error;
            }
            const nuevoStock = Number(producto.stock) + variacion;
            if (!Number.isSafeInteger(nuevoStock) || nuevoStock < 0) {
                const error = new Error('El movimiento no puede dejar el stock por debajo de cero.');
                error.status = 400;
                throw error;
            }
            if (nuevoStock > 2147483647) {
                const error = new Error('El stock supera el límite permitido.');
                error.status = 400;
                throw error;
            }
            await producto.update({ stock: nuevoStock }, { transaction });
            return Movimiento.create({
                productoId,
                usuarioId,
                tipoMovimiento,
                cantidad: variacion,
                observaciones
            }, { transaction });
        });
        return res.status(201).json(movimiento);
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ error: error.message });
        }
        return responderError(res, error, 'No se pudo registrar el movimiento.');
    }
});

app.get('/dashboard/resumen', async (_req, res) => {
    try {
        const [totalProductos, productosBajoStock, totalCategorias, totalProveedores,
            productosBajoStockLista, movimientosRecientes] = await Promise.all([
            Producto.count(),
            Producto.count({ where: { stock: { [Op.lte]: 5 } } }),
            Categoria.count(),
            Proveedor.count(),
            Producto.findAll({
                where: { stock: { [Op.lte]: 5 } },
                include: [{ model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] }],
                order: [['stock', 'ASC']],
                limit: 5
            }),
            Movimiento.findAll({
                include: [
                    { model: Producto, as: 'producto', attributes: ['id', 'nombre'] },
                    { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }
                ],
                order: [['fechaHora', 'DESC'], ['id', 'DESC']],
                limit: 5
            })
        ]);
        return res.json({
            totalProductos,
            productosBajoStock,
            totalCategorias,
            totalProveedores,
            productosBajoStockLista,
            movimientosRecientes
        });
    } catch (error) {
        return responderError(res, error, 'No se pudo cargar el resumen del inventario.');
    }
});

const PORT = process.env.PORT || 3006;

async function startServer() {
    try {
        await sequelize.sync({ alter: true });
        console.log('Base de datos conectada y sincronizada.');
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error);
        process.exitCode = 1;
    }
}

startServer();
