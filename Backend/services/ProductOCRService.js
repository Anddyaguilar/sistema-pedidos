const fs = require('fs');
const path = require('path');
const preprocessImage = require('../utils/ImagePreprocessor');
const cleanOCRText = require('../utils/ocrTextCleaner');

class ProductOCRService {
  async processImage(imageBuffer) {
    try {
      const processedImage = await preprocessImage(imageBuffer);

      if (!processedImage || processedImage.length === 0) {
        throw new Error('Imagen procesada vacía');
      }

      const tempPath = path.join(
        __dirname,
        '../upload',
        `ocr_${Date.now()}.png`
      );

      fs.writeFileSync(tempPath, processedImage);

      const scribeModule = await import('scribe.js-ocr');
      const scribe = scribeModule.default || scribeModule;

      if (!scribe.extractText) {
        throw new Error('extractText no existe');
      }

      // 🔹 OCR crudo
      const ocrResult = await scribe.extractText([tempPath]);

      fs.unlinkSync(tempPath);

      // 🔹 Convertir a texto plano
      const rawText = typeof ocrResult === 'string'
        ? ocrResult
        : Array.isArray(ocrResult)
          ? ocrResult.join('\n')
          : ocrResult?.text || '';

      // 🔹 AQUÍ usas el cleaner
      const cleanedText = cleanOCRText(rawText);

      return {
        raw: rawText,
        cleaned: cleanedText
      };

    } catch (err) {
      console.error('OCR Service Error:', err);
      throw err;
    }
  }
}

module.exports = ProductOCRService;
