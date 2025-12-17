const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoscontroller');

// Definir rutas
router.get('/', pedidoController.mostrarPedidos);
router.get('/:id', pedidoController.obtenerPedidoConDetalles);
router.get('/:id/detalles', pedidoController.mostrarDetallesPedido);
router.get('/:id/pdf', pedidoController.descargarPDF);
router.post('/', pedidoController.crearPedido);
router.delete('/:id', pedidoController.eliminarPedido); // Nueva ruta para eliminar pedido
router.get('/estadisticas', pedidoController.obtenerEstadisticas);
router.get("/detalles-con-productos/:id",pedidoController.obtenerDetallesConProductos  );
router.put('/:id', pedidoController.actualizarPedido);
router.get("/productos/proveedor/:id", pedidoController.obtenerProductosPorProveedor);
router.delete('/detalle/:id', pedidoController.eliminarDetallePedido);


module.exports = router;

