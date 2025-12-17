const express = require('express');
const router = express.Router();
const proveedoresController = require('../controllers/proveedorcontroller');

// Rutas para proveedores
router.get('/proveedores', proveedoresController.obtenerProveedores);
router.post('/proveedores', proveedoresController.crearProveedor);
router.put('/proveedores/:id_proveedor', proveedoresController.actualizarProveedor);
router.delete('/proveedores/:id_proveedor', proveedoresController.eliminarProveedor);

module.exports = router;
