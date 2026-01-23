const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// OBTENER CONFIGURACIÓN
async function getConfig(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM system_config LIMIT 1');
    res.json({ ok: true, config: rows[0] || {} });
  } catch (err) {
    console.error('Error getConfig:', err);
    res.status(500).json({ ok: false, error: 'Error al obtener configuración' });
  }
}

// ACTUALIZAR CONFIGURACIÓN
async function updateConfig(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM system_config LIMIT 1');
    if (!rows.length) {
      return res.status(404).json({ ok: false, error: 'No existe configuración' });
    }

    const current = rows[0];

    // Manejo de logo
    let logoPath = req.file ? `/uploads/${req.file.filename}` : current.logo_path;
    if (req.file && current.logo_path) {
      const oldLogoPath = path.join(__dirname, '..', current.logo_path);
      if (fs.existsSync(oldLogoPath)) fs.unlinkSync(oldLogoPath);
    }

    // Actualización simple, ignorando campos vacíos
    const sql = `
      UPDATE system_config SET
        company_name = ?,
        ruc = ?,
        address = ?,
        phone = ?,
        email = ?,
        currency = ?,
        logo_path = ?
      WHERE id = ?
    `;

    const values = [
      req.body.company_name?.trim() || current.company_name,
      req.body.ruc?.trim() || current.ruc,
      req.body.address?.trim() || current.address,
      req.body.phone?.trim() || current.phone,
      req.body.email?.trim() || current.email,
      req.body.currency?.trim() || current.currency,
      logoPath,
      current.id
    ];

    await pool.query(sql, values);

    res.json({ ok: true, message: 'Configuración actualizada correctamente' });
  } catch (err) {
    console.error('Error updateConfig:', err);
    res.status(500).json({ ok: false, error: 'Error al actualizar configuración' });
  }
}

module.exports = { getConfig, updateConfig };
