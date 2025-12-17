const db = require('../db');
const PDFDocument = require('pdfkit');

// Obtener todos los pedidos
const mostrarPedidos = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM pedido');
    res.json(results);
  } catch (error) {
    console.error('Error al obtener los pedidos:', error);
    res.status(500).json({ error: 'Error al obtener los pedidos', details: error.message });
  }
};

// Obtener detalles de un pedido
const mostrarDetallesPedido = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT dp.id_detalle, dp.id_producto, dp.cantidad, dp.precio_unitario, p.nombre_producto
      FROM detalles_pedido dp
      JOIN productos p ON dp.id_producto = p.id_producto
      WHERE dp.id_pedido = ?`;

    const [results] = await db.query(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'No se encontraron detalles para este pedido' });
    }
    res.json(results);
  } catch (error) {
    console.error('Error al obtener los detalles del pedido:', error);
    res.status(500).json({ error: 'Error al obtener los detalles del pedido', details: error.message });
  }
};

// Obtener un pedido con sus detalles
const obtenerPedidoConDetalles = async (req, res) => {
  const { id } = req.params;

  try {
    const [pedido] = await db.query('SELECT * FROM pedido WHERE id_pedido = ?', [id]);

    if (pedido.length === 0) {
      return res.status(404).json({ error: 'El pedido no existe' });
    }

    const [detalles] = await db.query(
      `SELECT dp.id_detalle, dp.id_producto, dp.cantidad, dp.precio_unitario, p.nombre_producto
       FROM detalles_pedido dp
       JOIN productos p ON dp.id_producto = p.id_producto
       WHERE dp.id_pedido = ?`, [id]
    );

    res.json({
      ...pedido[0],
      detalles,
    });
  } catch (error) {
    console.error('Error al obtener el pedido con detalles:', error);
    res.status(500).json({ error: 'Error al obtener el pedido con detalles', details: error.message });
  }
};

// Crear un nuevo pedido
const crearPedido = async (req, res) => {
  const { fecha_pedido, id_proveedor, detalles } = req.body;

  if (!fecha_pedido || !id_proveedor || !detalles || detalles.length === 0) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  try {
    await db.query('BEGIN');

    const queryPedido = 'INSERT INTO pedido (fecha_pedido, id_proveedor, total) VALUES (?, ?, 0)';
    const [result] = await db.query(queryPedido, [fecha_pedido, id_proveedor]);
    const id_pedido = result.insertId;

    const detallesValues = detalles.map(detalle => [id_pedido, detalle.id_producto, detalle.cantidad, detalle.precio_unitario]);
    const queryDetalles = 'INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES ?';
    await db.query(queryDetalles, [detallesValues]);

    await db.query(`
      UPDATE pedido 
      SET total = (SELECT COALESCE(SUM(cantidad * precio_unitario), 0) FROM detalles_pedido WHERE id_pedido = ?)
      WHERE id_pedido = ?`, [id_pedido, id_pedido]);

    await db.query('COMMIT');
    res.json({ message: 'Pedido creado con éxito', id_pedido });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error al crear el pedido:', error);
    res.status(500).json({ error: 'Error al crear el pedido', details: error.message });
  }
};

// Descargar PDF de un pedido

const path = require('path');
const fs = require('fs');
// descargar pdf
const descargarPDF = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Obtener datos del pedido
    const [pedido] = await db.query('SELECT * FROM pedido WHERE id_pedido = ?', [id]);
    if (!pedido || pedido.length === 0) return res.status(404).json({ error: 'El pedido no existe' });

    // 2. Nombre del proveedor
    let nombreProveedor = "Proveedor no especificado";
    try {
      const [proveedor] = await db.query(
        'SELECT nombre_proveedor FROM proveedor WHERE id_proveedor = ?',
        [pedido[0].id_proveedor]
      );
      if (proveedor && proveedor.length > 0) nombreProveedor = proveedor[0].nombre_proveedor;
    } catch (err) { console.warn('No se pudo obtener el nombre del proveedor:', err.message); }

    // 3. Detalles del pedido
    const [detalles] = await db.query(`
      SELECT dp.cantidad, dp.precio_unitario, p.nombre_producto, p.codigo_original
      FROM detalles_pedido dp
      JOIN productos p ON dp.id_producto = p.id_producto
      WHERE dp.id_pedido = ?`, [id]);

    // 4. Configurar PDF
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      layout: 'portrait',
      info: {
        Title: `Pedido ${id}`,
        Author: 'Sistema de Pedidos Repuestos Holfer'
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="pedido_${id}.pdf"`);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const marginBottom = 40;
    const tableWidth = pageWidth - 80;
    const tableLeftX = 40;

    // Aumentar altura de las filas
    const colWidths = {
      num: 25,
      codigo: 80,           // Reducido de 90 a 80
      producto: 200,        // Reducido de 220 a 200
      cantidad: 45,
      precio: 70,
      subtotal: 80          // Aumentado de 70 a 80
    };

    const rowHeight = 27;
    let currentY = 120;

    // Función para agregar header en cada página
    function addHeader() {
      // Logo y información de la empresa
      doc.fontSize(16).font('Helvetica-Bold')
        .text('REPUESTOS HOLFER JINOTEPE', 40, 40, { align: 'center' });

      doc.fontSize(12).font('Helvetica')
        .text(`PEDIDO N°: ${id}`, 40, 65, { align: 'center' });

      // Información del pedido en dos columnas
      doc.fontSize(10)
        .text(`FECHA: ${new Date(pedido[0].fecha_pedido).toLocaleDateString()}`, 40, 85)
        .text(`PROVEEDOR: ${nombreProveedor}`, pageWidth / 2, 85);

      // Línea separadora
      doc.moveTo(40, 105).lineTo(pageWidth - 40, 105).stroke('#333333');
    }

    // Función para revisar si se necesita nueva página
    function checkPageHeight(y, heightNeeded = rowHeight) {
      if (y + heightNeeded > pageHeight - marginBottom) {
        doc.addPage();
        currentY = 40;
        addHeader();

        // Redibujar encabezado de tabla
        currentY = drawTableHeader(currentY);
        return currentY;
      }
      return y;
    }

    // Función para dibujar el encabezado de la tabla
    function drawTableHeader(y) {
      // Fondo del encabezado
      doc.rect(tableLeftX, y, tableWidth, rowHeight).fill('#1a4693');

      // Texto del encabezado
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);

      doc.text('#', tableLeftX + 5, y + 7, { width: colWidths.num, align: 'center' })
        .text('CÓDIGO', tableLeftX + colWidths.num, y + 7, { width: colWidths.codigo, align: 'center' })
        .text('DESCRIPCIÓN DEL PRODUCTO', tableLeftX + colWidths.num + colWidths.codigo, y + 7, { width: colWidths.producto, align: 'center' })
        .text('CANT.', tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto, y + 7, { width: colWidths.cantidad, align: 'center' })
        .text('PRECIO', tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto + colWidths.cantidad, y + 7, { width: colWidths.precio, align: 'right' })
        .text('SUBTOTAL', tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto + colWidths.cantidad + colWidths.precio, y + 7, { width: colWidths.subtotal, align: 'right' });

      return y + rowHeight;
    }

    // 5. Encabezado inicial
    addHeader();

    // 6. Tabla encabezado
    currentY = drawTableHeader(currentY);

    // 7. Filas de la tabla
    let totalGeneral = 0;
    for (let i = 0; i < detalles.length; i++) {
      const detalle = detalles[i];
      const cantidad = Number(detalle.cantidad) || 0;
      const precio = Number(detalle.precio_unitario) || 0;
      const subtotal = cantidad * precio;
      totalGeneral += subtotal;

      currentY = checkPageHeight(currentY, rowHeight);

      // Alternar colores de fondo para mejor legibilidad
      if (i % 2 === 0) {
        doc.rect(tableLeftX, currentY, tableWidth, rowHeight).fill('#f8f9fa');
      }

      // Contenido de la fila - Ajustado para mayor altura
      doc.fillColor('#000000').font('Helvetica').fontSize(10);
      doc.text((i + 1).toString(), tableLeftX + 5, currentY + 7, { width: colWidths.num, align: 'center' })
        .text(detalle.codigo_original || 'N/A', tableLeftX + colWidths.num, currentY + 7, { width: colWidths.codigo })
        .text(detalle.nombre_producto || '', tableLeftX + colWidths.num + colWidths.codigo, currentY + 7, { width: colWidths.producto })
        .text(cantidad.toString(), tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto, currentY + 7, { width: colWidths.cantidad, align: 'center' })
        .text(`C$${precio.toFixed(2)}`, tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto + colWidths.cantidad, currentY + 7, { width: colWidths.precio, align: 'right' })
        .text(`C$${subtotal.toFixed(2)}`, tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto + colWidths.cantidad + colWidths.precio, currentY + 7, { width: colWidths.subtotal, align: 'right' });

      currentY += rowHeight;
    }

    // 8. Fila de total
    currentY = checkPageHeight(currentY, rowHeight + 5);

    // Línea separadora doble
    doc.moveTo(tableLeftX, currentY).lineTo(tableLeftX + tableWidth, currentY).stroke('#333333');
    doc.moveTo(tableLeftX, currentY + 1).lineTo(tableLeftX + tableWidth, currentY + 1).stroke('#333333');
    currentY += 10;

    // Fila de total
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#000000')
      .text('TOTAL GENERAL:', tableLeftX + colWidths.num + colWidths.codigo, currentY, {
        width: colWidths.producto + colWidths.cantidad + colWidths.precio - 10,
        align: 'right'
      })
      .text(`C$${totalGeneral.toFixed(2)}`, tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto + colWidths.cantidad + colWidths.precio, currentY, {
        width: colWidths.subtotal,
        align: 'right'
      });

    // 9. Finalizar PDF (SIN PIE DE PÁGINA)
    doc.pipe(res);
    doc.end();

  } catch (error) {
    console.error('Error al generar el PDF:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Error al generar el PDF', message: error.message });
  }
};

// Eliminar un pedido y sus detalles
const eliminarPedido = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('BEGIN');

    // Eliminar detalles primero
    await db.query('DELETE FROM detalles_pedido WHERE id_pedido = ?', [id]);

    // Eliminar el pedido
    const [result] = await db.query('DELETE FROM pedido WHERE id_pedido = ?', [id]);

    if (result.affectedRows === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'El pedido no existe' });
    }

    await db.query('COMMIT');
    res.json({ message: 'Pedido eliminado con éxito' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error al eliminar el pedido:', error);
    res.status(500).json({ error: 'Error al eliminar el pedido', details: error.message });
  }
};
const obtenerEstadisticas = async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];

    // Consulta para pedidos hoy
    const [pedidosHoy] = await db.query(
      `SELECT COUNT(*) as total FROM pedido 
       WHERE DATE(fecha_pedido) = ? AND estado = 'completado'`,
      [hoy]
    );

    // Consulta para ingresos hoy
    const [ingresosHoy] = await db.query(
      `SELECT COALESCE(SUM(total), 0) as total FROM pedido 
       WHERE DATE(fecha_pedido) = ? AND estado = 'completado'`,
      [hoy]
    );

    // Consulta para pedidos pendientes
    const [pendientes] = await db.query(
      `SELECT COUNT(*) as total FROM pedido WHERE estado = 'pendiente'`
    );

    res.json({
      pedidosHoy: pedidosHoy[0].total,
      ingresosHoy: ingresosHoy[0].total,
      pedidosPendientes: pendientes[0].total,
      ultimaActualizacion: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
};
// Función para obtener detalles y productos asociados a un pedido
const obtenerDetallesConProductos = async (req, res) => {
  const idPedido = req.params.id;
  try {
    // 1. Leer los detalles del pedido
    const [detalles] = await db.query(
      "SELECT * FROM detalles_pedido WHERE id_pedido = ?",
      [idPedido]
    );

    // 2. Extraer IDs únicos de productos usados
    const idsProductos = [...new Set(detalles.map(d => d.id_producto))];
    if (idsProductos.length === 0) {
      return res.json({ detalles, productos: [] });
    }

    // 3. Obtener los productos (incluso inactivos)
    const [productos] = await db.query(
      "SELECT id_producto, nombre_producto, precio, codigo_original FROM productos WHERE id_producto IN (?)",
      [idsProductos]
    );

    // 4. Responder con detalles y productos
    res.json({ detalles, productos });
  } catch (error) {
    console.error("Error al cargar pedido con productos:", error);
    res.status(500).json({ error: 'Error al obtener detalles con productos' });
  }
};
///actualizar pedido
const actualizarPedido = async (req, res) => {
  const { id } = req.params;
  const { fecha_pedido, id_proveedor, detalles } = req.body;

  if (!fecha_pedido || !id_proveedor || !Array.isArray(detalles)) {
    return res.status(400).json({ error: 'Datos incompletos o inválidos' });
  }

  try {
    // Actualizar cabecera
    await db.query(
      'UPDATE pedido SET fecha_pedido = ?, id_proveedor = ? WHERE id_pedido = ?',
      [fecha_pedido, id_proveedor, id]
    );

    for (const item of detalles) {
      const { id_detalle, id_producto, cantidad } = item;

      // Obtener precio desde productos
      const [productoRows] = await db.query(
        'SELECT precio FROM productos WHERE id_producto = ?',
        [id_producto]
      );

      if (!productoRows || productoRows.length === 0) continue;

      const precio_unitario = productoRows[0].precio;


























      if (id_detalle) {
        // Si ya existe, hacer UPDATE
        await db.query(
          'UPDATE detalles_pedido SET id_producto = ?, cantidad = ?, precio_unitario = ? WHERE id_detalle = ? AND id_pedido = ?',
          [id_producto, cantidad, precio_unitario, id_detalle, id]
        );
      } else {
        // Si no tiene id_detalle, es nuevo → INSERT
        await db.query(
          'INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
          [id, id_producto, cantidad, precio_unitario]
        );
      }
    }

    res.status(200).json({ message: '✅ Pedido actualizado correctamente' });
  } catch (error) {
    console.error('🔥 Error al actualizar el pedido:', error.message);
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el pedido' });
  }
};
// optener producto por proveedor 
const obtenerProductosPorProveedor = async (req, res) => {
  const proveedorId = parseInt(req.params.id);
  const search = req.query.search?.toLowerCase() || "";
  const searchSql = `%${search}%`;

  if (isNaN(proveedorId)) {
    return res.status(400).json({ error: "ID de proveedor inválido" });
  }

  try {
    console.log("Proveedor ID recibido:", proveedorId);
    const [productos] = await db.query(
      `SELECT * FROM productos
       WHERE id_proveedor = ?
       AND (LOWER(nombre_producto) LIKE ? OR LOWER(codigo_original) LIKE ?)
       ORDER BY nombre_producto ASC`,
      [proveedorId, searchSql, searchSql]
    );

    res.json({ productos });
  } catch (error) {
    console.error("Error al obtener productos por proveedor:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

const eliminarDetallePedido = async (req, res) => {
  const { id } = req.params;

  try {
    const [resultado] = await db.query('DELETE FROM detalles_pedido WHERE id_detalle = ?', [id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Detalle no encontrado o ya eliminado' });
    }

    res.status(200).json({ mensaje: 'Detalle eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar detalle:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el detalle' });
  }
};




// Exportar funciones del controlador
module.exports = {
  mostrarPedidos,
  mostrarDetallesPedido,
  obtenerPedidoConDetalles,
  obtenerDetallesConProductos,
  crearPedido,
  descargarPDF,
  eliminarPedido,
  actualizarPedido,
  obtenerProductosPorProveedor,
  obtenerEstadisticas,
  eliminarDetallePedido
};
