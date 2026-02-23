// Backend: Controlador Express para búsqueda, paginación y CRUD de productos

const db = require('../db');

/// Obtener productos con búsqueda avanzada y paginación
const obtenerProductos = async (req, res) => {
  const search = req.query.search?.toLowerCase().trim() || "";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  try {
    let whereClause = "";
    let params = [];

    if (search !== "") {
      const words = search.split(/\s+/);

      const conditions = words
        .map(() => `(LOWER(nombre_producto) LIKE ? OR LOWER(codigo_original) LIKE ?)`)
        .join(" AND ");

      whereClause = `WHERE ${conditions}`;

      words.forEach(word => {
        const like = `%${word}%`;
        params.push(like, like);
      });
    }

    // 🔹 Consulta principal
    const [productos] = await db.query(
      `SELECT * FROM productos
       ${whereClause}
       ORDER BY nombre_producto ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // 🔹 Conteo total
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM productos
       ${whereClause}`,
      params
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


// Crear producto - Evita duplicados por código y proveedor
const crearProducto = async (req, res) => {
  const { nombre_producto, id_proveedor, precio, codigo_original } = req.body;

  if (!nombre_producto || !codigo_original) {
    return res.status(400).json({ error: 'Nombre y código son obligatorios' });
  }

  try {
    // Primero, verificar si ya existe un producto con el mismo código Y el mismo proveedor
    const [productosExistentes] = await db.query(
      `SELECT id_producto FROM productos 
       WHERE codigo_original = ? AND id_proveedor = ?`,
      [codigo_original, id_proveedor]
    );

    if (productosExistentes.length > 0) {
      // Si ya existe con el mismo código y mismo proveedor: SOLO ACTUALIZAR PRECIO
      const productoId = productosExistentes[0].id_producto;

      await db.query(
        `UPDATE productos SET precio = ? WHERE id_producto = ?`,
        [precio, productoId]
      );

      return res.json({
        id: productoId,
        message: 'Producto actualizado (precio modificado)',
        accion: 'actualizado',
        detalle: 'Ya existía un producto con el mismo código y proveedor'
      });
    }

    // Si NO existe el mismo código con el mismo proveedor, crear NUEVO producto
    const [result] = await db.query(
      `INSERT INTO productos (nombre_producto, id_proveedor, precio, codigo_original) 
       VALUES (?, ?, ?, ?)`,
      [nombre_producto, id_proveedor, precio, codigo_original]
    );

    res.json({
      id: result.insertId,
      message: 'Producto creado exitosamente',
      accion: 'creado'
    });

  } catch (error) {
    console.error('Error en crearProducto:', error);

    // Manejar posibles errores de duplicados en la base de datos
    if (error.code === 'ER_DUP_ENTRY') {
      // Si hay un error de duplicado en la BD, intentar actualizar
      try {
        const [existentes] = await db.query(
          `SELECT id_producto FROM productos 
           WHERE codigo_original = ? AND id_proveedor = ?`,
          [codigo_original, id_proveedor]
        );

        if (existentes.length > 0) {
          await db.query(
            `UPDATE productos SET precio = ? WHERE id_producto = ?`,
            [precio, existentes[0].id_producto]
          );

          return res.json({
            id: existentes[0].id_producto,
            message: 'Producto actualizado (precio modificado)',
            accion: 'actualizado',
            detalle: 'Duplicado detectado por la base de datos'
          });
        }
      } catch (innerError) {
        console.error('Error al manejar duplicado:', innerError);
      }
    }

    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Actualizar producto (para uso manual, no desde la creación)
const actualizarProducto = async (req, res) => {
  const { id_producto } = req.params;
  const { nombre_producto, id_proveedor, precio, codigo_original, moneda } = req.body;

  try {
    // Verificar duplicados
    if (codigo_original && id_proveedor) {
      const [duplicados] = await db.query(
        `SELECT id_producto FROM productos 
         WHERE codigo_original = ? 
         AND id_proveedor = ? 
         AND id_producto != ?`,
        [codigo_original, id_proveedor, id_producto]
      );

      if (duplicados.length > 0) {
        return res.status(400).json({
          error: 'Ya existe otro producto con el mismo código y proveedor'
        });
      }
    }

    // Actualizar producto incluyendo tipo_moneda
    await db.query(
      `UPDATE productos SET 
        nombre_producto = ?, 
        id_proveedor = ?, 
        precio = ?, 
        codigo_original = ?, 
        tipo_moneda = ?
       WHERE id_producto = ?`,
      [nombre_producto, id_proveedor, precio, codigo_original, moneda, id_producto]
    );

    res.json({
      message: 'Producto actualizado',
      accion: 'actualizado'
    });
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
    res.json({
      message: 'Producto eliminado',
      accion: 'eliminado'
    });
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