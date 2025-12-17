const bcrypt = require('bcryptjs');
const db = require('../db');

// Mostrar todos los usuarios
const mostrarUsuarios = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM users');
    res.json(results);
  } catch (err) {
    console.error('Error en mostrarUsuarios:', err);
    res.status(500).send('Error en la base de datos');
  }
};

// Mostrar un usuario por ID
const mostrarUsuarioPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (results.length === 0) {
      return res.status(404).send('Usuario no encontrado');
    }
    res.json(results[0]);
  } catch (err) {
    console.error('Error en mostrarUsuarioPorId:', err);
    res.status(500).send('Error en la base de datos');
  }
};

// Crear un nuevo usuario
const crearUsuario = async (req, res) => {
  const { nombre, correo, rol, estado, contraseña } = req.body;
  try {
    const contraseña_hash = await bcrypt.hash(contraseña, 10);
    const query = `
      INSERT INTO users (nombre, correo, rol, estado, contraseña_hash)
      VALUES (?, ?, ?, ?, ?)`;
    await db.query(query, [nombre, correo, rol, estado, contraseña_hash]);
    res.status(201).send('Usuario creado');
  } catch (err) {
    console.error('Error en crearUsuario:', err);
    res.status(500).send('Error en la base de datos');
  }
};

// Editar un usuario
const editarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, correo, rol, estado, contraseña } = req.body;
  try {
    let query = 'UPDATE users SET nombre = ?, correo = ?, rol = ?, estado = ?';
    const params = [nombre, correo, rol, estado];

    if (contraseña) {
      const contraseña_hash = await bcrypt.hash(contraseña, 10);
      query += ', contraseña_hash = ?';
      params.push(contraseña_hash);
    }

    query += ' WHERE id = ?';
    params.push(id);

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).send('Usuario no encontrado');
    }

    res.send('Usuario actualizado');
  } catch (err) {
    console.error('Error en editarUsuario:', err);
    res.status(500).send('Error en la base de datos');
  }
};

// Eliminar un usuario
const eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Usuario no encontrado');
    }
    res.send('Usuario eliminado');
  } catch (err) {
    console.error('Error en eliminarUsuario:', err);
    res.status(500).send('Error en la base de datos');
  }
};

module.exports = {
  mostrarUsuarios,
  mostrarUsuarioPorId,
  crearUsuario,
  editarUsuario,
  eliminarUsuario,
};
