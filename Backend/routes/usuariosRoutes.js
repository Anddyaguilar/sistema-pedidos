// routes/usuarios.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuariosController');

// OJO: quitamos el prefijo /usuarios porque ya lo incluye app.js
router.get('/', usuarioController.mostrarUsuarios);
router.get('/:id', usuarioController.mostrarUsuarioPorId);
router.post('/', usuarioController.crearUsuario);
router.put('/:id', usuarioController.editarUsuario);
router.delete('/:id', usuarioController.eliminarUsuario);

module.exports = router;
