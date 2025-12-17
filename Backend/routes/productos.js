const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productoscontroller'); // Importa el controlador de productos

// Rutas para productos
router.get('/productos', productosController.obtenerProductos); // Obtener todos los productos
router.post('/productos', productosController.crearProducto); // Crear un nuevo producto
router.put('/productos/:id_producto', productosController.actualizarProducto); // Actualizar un producto existente
router.delete('/productos/:id_producto', productosController.eliminarProducto); // Eliminar un producto

module.exports = router;
