const express = require('express');
const router = express.Router();
const { login } = require('../controllers/auth');
const authMiddleware = require('../Middleware/Middleware');

// Ruta pública
router.post('/auth/login', login);

// Ruta protegida que devuelve los datos del usuario autenticado
router.get('/auth/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

module.exports = router;
