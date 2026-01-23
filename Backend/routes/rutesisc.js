const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { getConfig, updateConfig } = require('../controllers/configController');

// Rutas sin '/config' aquí
router.get('/', getConfig);                // GET /api/config/
router.put('/', upload.single('logo'), updateConfig); // PUT /api/config/

module.exports = router;
