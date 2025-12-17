const mysql = require('mysql2/promise');
require('dotenv').config();
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// Obtener configuración
async function getConfig(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM system_config LIMIT 1');
    res.json({ ok: true, config: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: 'Error al obtener la configuración' });
  }
}

// Actualizar configuración
async function updateConfig(req, res) {
  try {
    const { company_name, ruc, address, email, phone, currency, tax_percent, additional } = req.body;
    const logoPath = req.file ? '/uploads/' + req.file.filename : null;

    // Tomar el primer registro
    const [rows] = await pool.query('SELECT id FROM system_config LIMIT 1');
    const id = rows[0].id;

    const sql = logoPath
      ? `UPDATE system_config 
         SET company_name=?, ruc=?, address=?, email=?, phone=?, currency=?, tax_percent=?, additional=?, logo_path=?
         WHERE id=?`
      : `UPDATE system_config 
         SET company_name=?, ruc=?, address=?, email=?, phone=?, currency=?, tax_percent=?, additional=?
         WHERE id=?`;

    const params = logoPath
      ? [company_name, ruc, address, email, phone, currency, tax_percent, additional, logoPath, id]
      : [company_name, ruc, address, email, phone, currency, tax_percent, additional, id];

    await pool.query(sql, params);

    const [updated] = await pool.query('SELECT * FROM system_config LIMIT 1');
    res.json({ ok: true, config: updated[0], message: 'Configuración actualizada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: 'Error al actualizar la configuración' });
  }
}

module.exports = { getConfig, updateConfig };
