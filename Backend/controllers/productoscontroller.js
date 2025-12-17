// Backend: Controlador Express para búsqueda, paginación y CRUD de productos

const db = require('../db');

// Obtener productos con búsqueda y paginación
const obtenerProductos = async (req, res) => {
  const search = req.query.search?.toLowerCase() || "";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const searchSql = `%${search}%`;

  try {
    const [productos] = await db.query(
      `SELECT * FROM productos
       WHERE LOWER(nombre_producto) LIKE ? OR LOWER(codigo_original) LIKE ?
       ORDER BY nombre_producto ASC
       LIMIT ? OFFSET ?`,
      [searchSql, searchSql, limit, offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM productos
       WHERE LOWER(nombre_producto) LIKE ? OR LOWER(codigo_original) LIKE ?`,
      [searchSql, searchSql]
    );

    res.json({
      productos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error en obtenerProductos:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Crear producto
const crearProducto = async (req, res) => {
  const { nombre_producto, id_proveedor, precio, codigo_original } = req.body;

  if (!nombre_producto || !codigo_original) {
    return res.status(400).json({ error: 'Nombre y código son obligatorios' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO productos (nombre_producto, id_proveedor, precio, codigo_original) VALUES (?, ?, ?, ?)',
      [nombre_producto, id_proveedor, precio, codigo_original]
    );
    res.json({ id: result.insertId, message: 'Producto creado' });
  } catch (error) {
    console.error('Error en crearProducto:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Actualizar producto
const actualizarProducto = async (req, res) => {
  const { id_producto } = req.params;
  const { nombre_producto, id_proveedor, precio, codigo_original } = req.body;

  try {
    await db.query(
      'UPDATE productos SET nombre_producto = ?, id_proveedor = ?, precio = ?, codigo_original = ? WHERE id_producto = ?',
      [nombre_producto, id_proveedor, precio, codigo_original, id_producto]
    );
    res.json({ message: 'Producto actualizado' });
  } catch (error) {
    console.error('Error en actualizarProducto:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Eliminar producto
const eliminarProducto = async (req, res) => {
  const { id_producto } = req.params;

  try {
    await db.query('DELETE FROM productos WHERE id_producto = ?', [id_producto]);
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error('Error en eliminarProducto:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

module.exports = {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto
};
