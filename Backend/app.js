const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.get('/', (req, res) => {
  res.send('API de pedidos funcionando 🚀');
});

module.exports = app; // Exportar la aplicación