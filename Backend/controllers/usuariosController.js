const bcrypt = require('bcryptjs');
const db = require('../db');

// ============================
// MOSTRAR TODOS LOS USUARIOS
// ============================
const mostrarUsuarios = async (req, res) => {
  try {
    const [results] = await db.query(
      'SELECT id_users AS id, nombre, correo, rol, estado FROM users'
    );
    res.json(results);
  } catch (err) {
    console.error('Error en mostrarUsuarios:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
};

// ============================
// MOSTRAR USUARIO POR ID
// ============================
const mostrarUsuarioPorId = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const [results] = await db.query(
      'SELECT id_users AS id, nombre, correo, rol, estado FROM users WHERE id_users = ?',
      [id]
    );

    if (!results.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(results[0]);
  } catch (err) {
    console.error('Error en mostrarUsuarioPorId:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
};

// ============================
// CREAR USUARIO
// ============================
const crearUsuario = async (req, res) => {
  const { nombre, correo, rol, estado, contraseña } = req.body;

  if (!nombre || !correo || !contraseña) {
    return res.status(400).json({ error: 'Campos obligatorios incompletos' });
  }

  try {
    // 🔎 Verificar duplicados
    const [existe] = await db.query(
      'SELECT id_users FROM users WHERE nombre = ? OR correo = ?',
      [nombre, correo]
    );

    if (existe.length > 0) {
      return res.status(400).json({
        error: 'El nombre o el correo ya están registrados'
      });
    }

    const contraseña_hash = await bcrypt.hash(contraseña, 10);

    await db.query(
      `INSERT INTO users (nombre, correo, rol, estado, contraseña_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, correo, rol || 'user', estado || 'activo', contraseña_hash]
    );

    res.status(201).json({ message: 'Usuario creado correctamente' });

  } catch (err) {
    console.error('Error en crearUsuario:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
};

// ============================
// EDITAR USUARIO
// ============================
const editarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, correo, rol, estado, contraseña } = req.body;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    // 🔎 Verificar duplicados (excluyendo el usuario actual)
    const [existe] = await db.query(
      `SELECT id_users FROM users 
       WHERE (nombre = ? OR correo = ?) 
       AND id_users != ?`,
      [nombre, correo, id]
    );

    if (existe.length > 0) {
      return res.status(400).json({
        error: 'El nombre o el correo ya están registrados'
      });
    }

    let query = 'UPDATE users SET nombre = ?, correo = ?, rol = ?, estado = ?';
    const params = [nombre, correo, rol, estado];

    if (contraseña && contraseña.trim() !== '') {
      const contraseña_hash = await bcrypt.hash(contraseña, 10);
      query += ', contraseña_hash = ?';
      params.push(contraseña_hash);
    }

    query += ' WHERE id_users = ?';
    params.push(id);

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario actualizado correctamente' });

  } catch (err) {
    console.error('Error en editarUsuario:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
};

// ============================
// ELIMINAR USUARIO
// ============================
const eliminarUsuario = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const [result] = await db.query(
      'DELETE FROM users WHERE id_users = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado correctamente' });

  } catch (err) {
    console.error('Error en eliminarUsuario:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
};

module.exports = {
  mostrarUsuarios,
  mostrarUsuarioPorId,
  crearUsuario,
  editarUsuario,
  eliminarUsuario
};
