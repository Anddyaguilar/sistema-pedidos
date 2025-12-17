// controllers/ocrController.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import mysql from "mysql2/promise";

// Inicializamos Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configuración MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sistema",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Genera contenido usando Gemini con reintentos exponenciales
 */
async function generateWithRetry(model, input, retries = 5, initialDelay = 2000, maxDelay = 15000) {
  let delay = initialDelay;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`Intento ${attempt + 1} de ${retries}`);
      const result = await model.generateContent(input);
      return result;
    } catch (err) {
      if (err.status === 503 && attempt < retries - 1) {
        console.warn(`Modelo ocupado, reintentando en ${delay}ms... (${attempt + 1})`);
        await new Promise(r => setTimeout(r, delay));
        delay = Math.min(delay * 2, maxDelay);
      } else {
        console.error("Error final al generar contenido:", err);
        throw err;
      }
    }
  }
}

/**
 * Procesa la imagen y extrae productos usando Gemini
 */
export async function extractProductsFromImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No se subió ninguna imagen" });
    }

    const imageData = req.file.buffer.toString("base64");

    const prompt = `
Analiza la imagen adjunta.
Extrae todos los productos visibles y devuelve únicamente
un JSON válido con esta estructura:

{
  "productos": [
    {
      "nombre_producto": "",
      "codigo_original": "",
      "precio": 0
    }
  ]
}

Reglas:
- No incluyas texto fuera del JSON
- No inventes datos
- Si un campo no se detecta, usa null
- El precio debe ser un número entero
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 🔹 Reintentos automáticos con retraso exponencial
    const response = await generateWithRetry(model, [
      { inlineData: { data: imageData, mimeType: req.file.mimetype } },
      { text: prompt }
    ]);

    // 🔹 Limpiar Markdown (```json ... ```)
    let rawText = response.response.text();
    rawText = rawText.replace(/```json|```/g, "").trim();

    // 🔹 Parsear JSON
    const json = JSON.parse(rawText);

    res.json({
      success: true,
      productos: json.productos || []
    });

  } catch (err) {
    console.error("Error Gemini con reintentos:", err.response?.data || err);
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Guarda los productos detectados en la base de datos
 */
export async function saveProducts(req, res) {
  try {
    const { productos } = req.body;

    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ success: false, error: "Productos inválidos o vacíos" });
    }

    for (const p of productos) {
      const { nombre_producto, codigo_original, precio } = p;
      await pool.query(
        `INSERT INTO productos (nombre_producto, codigo_original, precio) VALUES (?, ?, ?)`,
        [nombre_producto, codigo_original, precio || 0]
      );
    }

    res.json({ success: true, message: "Productos guardados correctamente" });

  } catch (err) {
    console.error("Error MySQL:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
