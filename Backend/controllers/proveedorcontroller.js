const db = require('../db');

// Obtener todos los proveedores
const obtenerProveedores = async (req, res) => {
  try {
    const [proveedores] = await db.query('SELECT * FROM proveedor');
    res.json(proveedores);
  } catch (error) {
    console.error('Error en obtenerProveedores:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Crear proveedor
const crearProveedor = async (req, res) => {
  const { nombre_proveedor } = req.body;
  
  if (!nombre_proveedor) {
    return res.status(400).json({ error: 'Nombre es obligatorio' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO proveedor (nombre_proveedor) VALUES (?)',
      [nombre_proveedor]
    );
    res.json({ id: result.insertId, message: 'Proveedor creado' });
  } catch (error) {
    console.error('Error en crearProveedor:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Actualizar proveedor
const actualizarProveedor = async (req, res) => {
  const { id_proveedor } = req.params;
  const { nombre_proveedor } = req.body;

  try {
    await db.query(
      'UPDATE proveedor SET nombre_proveedor = ? WHERE id_proveedor = ?',
      [nombre_proveedor, id_proveedor]
    );
    res.json({ message: 'Proveedor actualizado' });
  } catch (error) {
    console.error('Error en actualizarProveedor:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Eliminar proveedor
const eliminarProveedor = async (req, res) => {
  const { id_proveedor } = req.params;

  try {
    await db.query('DELETE FROM proveedor WHERE id_proveedor = ?', [id_proveedor]);
    res.json({ message: 'Proveedor eliminado' });
  } catch (error) {
    console.error('Error en eliminarProveedor:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

module.exports = {
  obtenerProveedores,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor
};