const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const Producto = require('./models/Producto');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
    res.send('¡API Backend funcionando exitosamente!');
});

function validarProducto(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Debes enviar los datos del producto.' };
    }

    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    const descripcion = typeof body.descripcion === 'string' ? body.descripcion.trim() : '';
    const precioVacio = body.precio === null || body.precio === undefined ||
        (typeof body.precio === 'string' && body.precio.trim() === '');
    const stockVacio = body.stock === null || body.stock === undefined ||
        (typeof body.stock === 'string' && body.stock.trim() === '');
    const precio = Number(body.precio);
    const stock = Number(body.stock);

    if (!nombre) {
        return { error: 'El nombre del producto es obligatorio.' };
    }
    if (nombre.length > 255) {
        return { error: 'El nombre del producto no debe superar 255 caracteres.' };
    }
    if (body.descripcion !== undefined && body.descripcion !== null &&
        typeof body.descripcion !== 'string') {
        return { error: 'La descripción debe ser texto.' };
    }
    if (precioVacio || typeof body.precio === 'boolean' ||
        !Number.isFinite(precio) || precio < 0) {
        return { error: 'El precio debe ser un número mayor o igual a cero.' };
    }
    if (stockVacio || typeof body.stock === 'boolean' ||
        !Number.isInteger(stock) || stock < 0) {
        return { error: 'El stock debe ser un entero mayor o igual a cero.' };
    }

    return { values: { nombre, descripcion, precio, stock } };
}

function obtenerIdProducto(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'El ID debe ser un entero positivo.' });
        return null;
    }
    return id;
}

app.get('/productos', async (_req, res) => {
    try {
        const productos = await Producto.findAll();
        res.json(productos);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'No se pudieron obtener los productos.' });
    }
});

app.post('/productos', async (req, res) => {
    const resultado = validarProducto(req.body);
    if (resultado.error) {
        return res.status(400).json({ error: resultado.error });
    }

    try {
        const nuevoProducto = await Producto.create(resultado.values);
        res.status(201).json(nuevoProducto);
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ error: 'No se pudo guardar el producto.' });
    }
});

app.put('/productos/:id', async (req, res) => {
    const id = obtenerIdProducto(req, res);
    if (id === null) {
        return;
    }

    const resultado = validarProducto(req.body);
    if (resultado.error) {
        return res.status(400).json({ error: resultado.error });
    }

    try {
        const producto = await Producto.findByPk(id);
        if (!producto) {
            return res.status(404).json({ error: 'No se encontró el producto.' });
        }
        await producto.update(resultado.values);
        res.json(producto);
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ error: 'No se pudo actualizar el producto.' });
    }
});

app.delete('/productos/:id', async (req, res) => {
    const id = obtenerIdProducto(req, res);
    if (id === null) {
        return;
    }

    try {
        const producto = await Producto.findByPk(id);
        if (!producto) {
            return res.status(404).json({ error: 'No se encontró el producto.' });
        }
        await producto.destroy();
        res.json({ message: 'Producto eliminado.' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ error: 'No se pudo eliminar el producto.' });
    }
});

const PORT = process.env.PORT || 3006;

async function startServer() {
    try {
        await sequelize.sync({ force: false });
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
