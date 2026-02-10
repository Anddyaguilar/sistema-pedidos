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
      ////console.log(`Intento ${attempt + 1} de ${retries}`);
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
Analiza la imagen adjunta y extrae todos los productos visibles.
Devuelve únicamente un JSON válido, sin texto adicional, con esta estructura:

{
  "productos": [
    {
      "nombre_producto": "",  // Nombre del producto
      "codigo_original": "",   // Código original del producto
      "precio": 0              // Precio, puede ser decimal
    }
  ]
}

Reglas importantes:
1. Si detectas "código original" o "código alterno" en la imagen, usa esos valores para llenar "codigo_original" en el JSON (campo de la BD).
2. Si detectas "nombre del producto", "marca" o "descripción", combina estos y colócalos en "nombre_producto" en el JSON (campo de la BD).
3. "precio" debe ser decimal si aparece con decimales.
4. Si algún campo no se detecta, usa null.
5. No inventes datos que no estén en la imagen.
6. Devuelve solo el JSON, sin texto adicional ni explicaciones.
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
      // Mapear campos al esquema de la tabla
      const nombre_producto = [p.nombre_producto, p.marca, p.descripcion]
        .filter(Boolean)
        .join(" | "); // concatenamos en un solo campo
      const codigo_original = [p.codigo_original, p.codigo_alterno]
        .filter(Boolean)
        .join(" | "); // concatenamos códigos
      const precio = parseFloat(p.precio) || 0;

      await pool.query(
        `INSERT INTO productos (nombre_producto, codigo_original, precio) VALUES (?, ?, ?)`,
        [nombre_producto, codigo_original, precio]
      );
    }

    res.json({ success: true, message: "Productos guardados correctamente" });

  } catch (err) {
    console.error("Error MySQL:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

