const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de subida de logo
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, 'logo' + path.extname(file.originalname))
});
const upload = multer({ storage });

// Archivo JSON simulado como base de datos
const configFile = path.join(__dirname, '../config.json');

// GET: obtener configuración
router.get('/', (req, res) => {
  if (!fs.existsSync(configFile)) {
    return res.json({ config: {} });
  }
  const data = JSON.parse(fs.readFileSync(configFile));
  res.json({ config: data });
});

// PUT: actualizar configuración
router.put('/', upload.single('logo'), (req, res) => {
  const data = req.body;

  if (req.file) {
    data.logo_path = '/uploads/' + req.file.filename;
  }

  fs.writeFileSync(configFile, JSON.stringify(data, null, 2));
  res.json({ message: 'Configuración guardada', config: data });
});

module.exports = router;
