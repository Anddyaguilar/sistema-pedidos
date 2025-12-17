const sharp = require('sharp');

async function preprocessImage(buffer) {
    return sharp(buffer, {
        failOnError: false,
        density: 300 // simula DPI alto (muy importante)
    })

        // 1️⃣ Corrige orientación real
        .rotate()

        // 2️⃣ Resolución extrema (OCR ama esto)
        .resize({
            width: 2400,
            fit: 'inside',
            withoutEnlargement: true
        })

        // 3️⃣ Conversión óptima a grises
        .grayscale()

        // 4️⃣ Contraste fino (sin quemar letras)
        .linear(1.45, -30)

        // 5️⃣ Eliminación de ruido de fondo
        .median(3)

        // 6️⃣ Nitidez de bordes (nivel quirúrgico)
        .sharpen({
            sigma: 1.4,
            m1: 1,
            m2: 2,
            x1: 2,
            y2: 14,
            y3: 25
        })

        // 7️⃣ Binarización OCR-friendly
        .threshold(145)

        // 8️⃣ Asegura fondo limpio
        .removeAlpha()

        .toBuffer();
}

module.exports = preprocessImage;
