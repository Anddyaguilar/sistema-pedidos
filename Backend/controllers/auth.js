const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
require('dotenv').config();

const login = async (req, res) => {
  const { nombre, contraseña } = req.body;

  ////console.log('Body recibido:', req.body); // Verificar lo que llega

  // Verificar que las credenciales no falten
  if (!nombre || !contraseña) {
    return res.status(400).json({ message: 'Faltan credenciales.' });
  }



  try {
    // Consultar la base de datos
   const [rows] = await pool.query('SELECT * FROM users WHERE nombre = ?', [nombre]);


    // Si no se encuentra el usuario
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Correo o contraseña incorrectos.' });
    }

    const usuario = rows[0];

    // Verificar que la cuenta esté activa
    if (usuario.estado !== 'activo') {
      return res.status(403).json({ message: 'Cuenta desactivada.' });
    }

    // Comparar las contraseñas
    const isMatch = await bcrypt.compare(contraseña, usuario.contraseña_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Correo o contraseña incorrectos.' });
    }

    // Crear el payload y firmar el token
    const payload = {
      id: usuario.id_users,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol
    };
     ////console.log('🧪 PAYLOAD JWT:', payload);

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Responder con el token
    return res.json({ message: 'Login exitoso', token });
  } catch (error) {
    console.error(error.message);  // Mejorar el log para que se vea el mensaje del error
    return res.status(500).json({ message: 'Error en el servidor.' });
  }
};

module.exports = { login };
