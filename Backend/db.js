// db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS|| 'Conexion12345',
  database: process.env.DB_NAME || 'sistema_pedido',
 
   waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificación de conexión al iniciar
pool.getConnection()
  .then(conn => {
    console.log('✅ Conectado a MySQL');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error de conexión:', err.message);
    process.exit(1);
  });

module.exports = pool;