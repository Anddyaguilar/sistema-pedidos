// routes/apiroute.js
const express = require("express");
const multer = require("multer");
const { extractProductsFromImage, saveProducts } = require("../controllers/ocrController");

const router = express.Router();
const upload = multer();

router.post("/extract", upload.single("image"), extractProductsFromImage);
router.post("/save", saveProducts);

module.exports = router;
