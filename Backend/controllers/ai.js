const ProductOCRService = require('../services/ProductOCRService');
const db = require('../db'); // tu conexión MySQL
const ocrService = new ProductOCRService();

class OCRController {
  // 1️⃣ Extrae texto de la imagen para edición
  async extractText(req, res) {
    try {
      if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

      console.log('📌 Imagen recibida, procesando OCR...');
      const result = await ocrService.processImage(req.file.buffer);

      let text = '';
      if (typeof result === 'string') text = result;
      else if (Array.isArray(result)) text = result.join('\n');
      else if (result.text) text = result.text;

      // Devuelve el texto al frontend para que el usuario pueda editarlo
      res.json({ success: true, data: { text } });
    } catch (err) {
      console.error('❌ OCRController.extractText Error:', err);
      res.status(500).json({ error: 'OCR processing failed', details: err.message });
    }
  }

  // 2️⃣ Guarda o actualiza el producto según existencia
  async saveText(req, res) {
    try {
      const { codigo_producto, id_proveedor, precio, descripcion } = req.body;

      if (!codigo_producto || !id_proveedor || !precio) 
        return res.status(400).json({ error: 'Faltan datos requeridos' });

      // Verificar si el producto ya existe
      const [rows] = await db.query(
        'SELECT * FROM products WHERE codigo_producto = ? AND id_proveedor = ?',
        [codigo_producto, id_proveedor]
      );

      if (rows.length > 0) {
        // Actualiza solo el precio
        await db.query(
          'UPDATE products SET precio = ? WHERE codigo_producto = ? AND id_proveedor = ?',
          [precio, codigo_producto, id_proveedor]
        );
        return res.json({ success: true, message: 'Precio actualizado' });
      }

      // Insertar nuevo producto si no existe
      await db.query(
        'INSERT INTO products (codigo_producto, id_proveedor, precio, descripcion) VALUES (?, ?, ?, ?)',
        [codigo_producto, id_proveedor, precio, descripcion || '']
      );

      res.json({ success: true, message: 'Producto agregado' });
    } catch (err) {
      console.error('❌ OCRController.saveText Error:', err);
      res.status(500).json({ error: 'Failed to save/update product', details: err.message });
    }
  }
}

module.exports = new OCRController();
