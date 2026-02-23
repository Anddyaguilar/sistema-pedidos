require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const productosRoutes = require('./routes/productos');
const proveedorRoute = require('./routes/proveedores');
const pedidoRoute = require('./routes/pedidoroutes');
const airoute = require('./routes/apiroute');
const authRoutes = require('./routes/authRoutes');
const Usuario = require('./routes/usuariosRoutes');
const confg = require('./routes/rutesisc');



const path = require('path');

const app = express();
const PORT = parseInt(process.env.PORT) || 5001;
 
// Configuración básica
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));

// Conexión a MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error('❌ Error de conexión a MySQL:', err);
    process.exit(1);
  }
  //console.log('✅ Conectado a MySQL');
});

// Rutas
app.use('/api', productosRoutes);
app.use('/api', proveedorRoute);
app.use('/api/pedidos', pedidoRoute);
app.use("/api/ocr", airoute); 
app.use('/api', authRoutes);
app.use('/api/usuarios', Usuario);
app.use('/api/config', confg);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/*app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
);
*/
// Función para iniciar el servidor con reintentos
const startServer = async (port, attempts = 5) => {
  if (attempts <= 0) {
    console.error('❌ No se pudo encontrar un puerto disponible');
    process.exit(1);
  }

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      //console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
      resolve(server);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        //console.log(`⚠️  Puerto ${port} ocupado. Probando con ${port + 1}...`);
        startServer(port + 1, attempts - 1).then(resolve);
      } else {
        console.error('❌ Error inesperado:', err);
        process.exit(1);
      }
    });
  });
};

// Iniciar aplicación
(async () => {
  try {
    const server = await startServer(PORT);
    
    // Manejo de cierre limpio
    process.on('SIGINT', () => {
      //console.log('\n🔴 Apagando servidor...');
      server.close(() => {
        db.end();
        process.exit();
      });
    });
  } catch (err) {
    console.error('❌ Error al iniciar:', err);
    process.exit(1);
  }
})();