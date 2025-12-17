const express = require('express');
const multer = require('multer');
const OCRController = require('../controllers/ai');

const router = express.Router();
const upload = multer(); // almacenamiento en memoria

router.post('/extract', upload.single('image'), (req, res) => OCRController.extractText(req, res));
router.post('/save-text', (req, res) => OCRController.saveText(req, res));

module.exports = router; // exportar router como CommonJS
