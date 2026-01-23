const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoscontroller');
const authMiddleware = require('../Middleware/Middleware'); 

// Rutas públicas
router.get('/', pedidoController.mostrarPedidos);

// Rutas protegidas específicas
router.get('/estadisticas', authMiddleware, pedidoController.obtenerEstadisticas);
router.get('/detalles-con-productos/:id', authMiddleware, pedidoController.obtenerDetallesConProductos);
router.get('/productos/proveedor/:id', authMiddleware, pedidoController.obtenerProductosPorProveedor);
router.get('/:id/detalles', authMiddleware, pedidoController.obtenerDetallesConProductos);

// CRUD protegido
router.post('/', authMiddleware, pedidoController.crearPedido);
router.put('/:id', authMiddleware, pedidoController.actualizarPedido);
router.delete('/:id', authMiddleware, pedidoController.eliminarPedido);
router.delete('/detalle/:id', authMiddleware, pedidoController.eliminarDetallePedido);

// 🔹 RUTA PDF (ANTES de la genérica)
router.get('/:id/pdf', authMiddleware, pedidoController.descargarPDF);

// ESTA SIEMPRE AL FINAL
router.get('/:id', pedidoController.obtenerPedidoConDetalles);



module.exports = router;
