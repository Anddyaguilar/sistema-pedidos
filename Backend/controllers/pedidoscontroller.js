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
      SELECT 
        dp.id_detalle, 
        dp.id_producto, 
        dp.cantidad, 
        dp.precio_unitario, 
        IFNULL(p.nombre_producto, 'Producto no disponible') AS nombre_producto
      FROM detalles_pedido dp
      LEFT JOIN productos p ON dp.id_producto = p.id_producto
      WHERE dp.id_pedido = ?`;

    const [results] = await db.query(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'No se encontraron detalles para este pedido' });
    }

    console.log("Detalles obtenidos:", results); // Para debug
    res.json(results);
  } catch (error) {
    console.error('Error al obtener los detalles del pedido:', error);
    res.status(500).json({ 
      error: 'Error al obtener los detalles del pedido', 
      details: error.message 
    });
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
  console.log('📥 BODY RECIBIDO:', req.body);
  console.log('👤 USER JWT:', req.user);

  const { fecha_pedido, id_proveedor, detalles } = req.body;

  // Validación básica
  if (!fecha_pedido || !id_proveedor || !Array.isArray(detalles) || detalles.length === 0) {
    console.log('❌ Error: datos incompletos o sin detalles');
    return res.status(400).json({ error: 'Datos incompletos o sin detalles' });
  }

  try {
    await db.query('BEGIN');

    const id_usuario = req.user?.id;
    if (!id_usuario) {
      await db.query('ROLLBACK');
      console.log('❌ Usuario no identificado');
      return res.status(400).json({ error: 'Usuario no autenticado' });
    }

    console.log('🧾 Detalles recibidos CRUDOS:', detalles);

    // Filtrar y normalizar detalles válidos
    const detallesValues = detalles
      .map(d => ({
        id_producto: Number(d.id_producto),
        cantidad: Number(d.cantidad),
        precio_unitario: Number(d.precio_unitario)
      }))
      .filter(d =>
        Number.isInteger(d.id_producto) &&
        d.id_producto > 0 &&
        !isNaN(d.cantidad) &&
        d.cantidad > 0 &&
        !isNaN(d.precio_unitario) &&
        d.precio_unitario > 0
      );

    console.log('✅ Detalles válidos BACKEND:', detallesValues);

    if (detallesValues.length === 0) {
      await db.query('ROLLBACK');
      console.log('❌ No hay detalles válidos');
      return res.status(400).json({
        error: 'Los productos enviados no son válidos',
        detalles_recibidos: detalles
      });
    }

    // INSERT en pedido usando id_users
    const [pedidoResult] = await db.query(
      'INSERT INTO pedido (fecha_pedido, id_proveedor, total, id_user) VALUES (?, ?, 0, ?)',
      [fecha_pedido, id_proveedor, id_usuario]
    );

    const id_pedido = pedidoResult.insertId;
    console.log('🆕 Pedido creado con ID:', id_pedido);

    // Preparar detalles para insert múltiple
    const insertValues = detallesValues.map(d => [
      id_pedido,
      d.id_producto,
      d.cantidad,
      d.precio_unitario
    ]);

    await db.query(
      'INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES ?',
      [insertValues]
    );

    // Actualizar total del pedido
    await db.query(
      `UPDATE pedido 
       SET total = (
         SELECT COALESCE(SUM(cantidad * precio_unitario), 0)
         FROM detalles_pedido
         WHERE id_pedido = ?
       )
       WHERE id_pedido = ?`,
      [id_pedido, id_pedido]
    );

    await db.query('COMMIT');

    console.log('✅ Pedido creado correctamente');

    res.status(201).json({ message: 'Pedido creado', id_pedido });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('🔥 ERROR BACKEND:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
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
    if (!pedido || pedido.length === 0) {
      return res.status(404).json({ error: 'El pedido no existe' });
    }

    // 2. Obtener datos de la empresa desde system_config
    const [empresa] = await db.query('SELECT * FROM system_config LIMIT 1');
    const comp = (empresa && empresa[0]) ? empresa[0] : {};

    const companyName = comp.company_name || 'Nombre de la empresa';
    const ruc = comp.ruc || '';
    const address = comp.address || '';
    const email = comp.email || '';
    const phone = comp.phone || '';
    const currency = comp.currency || 'C$';
    const logoPath = comp.logo_path && fs.existsSync(comp.logo_path) ? comp.logo_path : null;

    // 3. Nombre del proveedor
    let nombreProveedor = "Proveedor no especificado";
    const [proveedor] = await db.query(
      'SELECT nombre_proveedor FROM proveedor WHERE id_proveedor = ?',
      [pedido[0].id_proveedor]
    );
    if (proveedor && proveedor.length > 0) nombreProveedor = proveedor[0].nombre_proveedor;

    // 4. Detalles del pedido
    const [detalles] = await db.query(`
      SELECT dp.cantidad, dp.precio_unitario, p.nombre_producto, p.codigo_original
      FROM detalles_pedido dp
      JOIN productos p ON dp.id_producto = p.id_producto
      WHERE dp.id_pedido = ?`, [id]);

    // 5. Configurar PDF
    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      layout: 'portrait',
      info: {
        Title: `Pedido ${id}`,
        Author: companyName
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="pedido_${id}.pdf"`);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const marginBottom = 40;
    const tableWidth = pageWidth - 80;
    const tableLeftX = 40;
    const rowHeight = 27;

    const colWidths = {
      num: 25,
      codigo: 80,
      producto: 200,
      cantidad: 45,
      precio: 70,
      subtotal: 80
    };

    let currentY = 120;

    // Función para agregar header de página
    function addHeader() {
      // Logo
      if (logoPath) {
        try {
          doc.image(logoPath, tableLeftX, 40, { width: 80, height: 50, fit: [80,50] });
        } catch (err) {
          console.warn('Error al cargar logo:', err.message);
        }
      }

      // Datos de la empresa
      doc.fontSize(12).font('Helvetica-Bold')
        .text(companyName, logoPath ? 130 : tableLeftX, 40, { align: 'left', width: pageWidth - 170 });

      doc.fontSize(9).font('Helvetica')
        .text(`RUC: ${ruc}`, logoPath ? 130 : tableLeftX, 60)
        .text(`Dirección: ${address}`, logoPath ? 130 : tableLeftX, 72, { width: pageWidth - 170 })
        .text(`Email: ${email}`, logoPath ? 130 : tableLeftX, 84)
        .text(`Tel: ${phone}`, logoPath ? 130 : tableLeftX, 96);

      // Datos del pedido
      doc.fontSize(10).font('Helvetica-Bold')
        .text(`PEDIDO N°: ${id}`, tableLeftX, 120)
        .font('Helvetica')
        .text(`Fecha: ${new Date(pedido[0].fecha_pedido).toLocaleDateString()}`, tableLeftX, 135)
        .text(`Proveedor: ${nombreProveedor}`, tableLeftX, 150);

      // Línea separadora
      doc.moveTo(tableLeftX, 165).lineTo(pageWidth - 40, 165).stroke('#333333');

      currentY = 170;
      drawTableHeader(currentY);
      currentY += rowHeight;
    }

    function drawTableHeader(y) {
      doc.rect(tableLeftX, y, tableWidth, rowHeight).fill('#1a4693');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);

      doc.text('#', tableLeftX + 5, y + 7, { width: colWidths.num, align: 'center' })
        .text('CÓDIGO', tableLeftX + colWidths.num, y + 7, { width: colWidths.codigo, align: 'center' })
        .text('DESCRIPCIÓN', tableLeftX + colWidths.num + colWidths.codigo, y + 7, { width: colWidths.producto, align: 'center' })
        .text('CANT.', tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto, y + 7, { width: colWidths.cantidad, align: 'center' })
        .text('PRECIO', tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto + colWidths.cantidad, y + 7, { width: colWidths.precio, align: 'right' })
        .text('SUBTOTAL', tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto + colWidths.cantidad + colWidths.precio, y + 7, { width: colWidths.subtotal, align: 'right' });
    }

    function checkPageHeight(y, heightNeeded = rowHeight) {
      if (y + heightNeeded > pageHeight - marginBottom) {
        doc.addPage();
        addHeader();
        return currentY;
      }
      return y;
    }

    // Inicializar header
    addHeader();

    // Filas de la tabla
    let totalGeneral = 0;
    detalles.forEach((detalle, i) => {
      const cantidad = Number(detalle.cantidad) || 0;
      const precio = Number(detalle.precio_unitario) || 0;
      const subtotal = cantidad * precio;
      totalGeneral += subtotal;

      currentY = checkPageHeight(currentY, rowHeight);

      // Alternar colores
      if (i % 2 === 0) doc.rect(tableLeftX, currentY, tableWidth, rowHeight).fill('#f8f9fa');

      // Texto de la fila
      doc.fillColor('#000000').font('Helvetica').fontSize(10)
        .text(i + 1, tableLeftX + 5, currentY + 7, { width: colWidths.num, align: 'center' })
        .text(detalle.codigo_original || 'N/A', tableLeftX + colWidths.num, currentY + 7, { width: colWidths.codigo })
        .text(detalle.nombre_producto || '', tableLeftX + colWidths.num + colWidths.codigo, currentY + 7, { width: colWidths.producto, ellipsis: true })
        .text(cantidad, tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto, currentY + 7, { width: colWidths.cantidad, align: 'center' })
        .text(`${currency}${precio.toFixed(2)}`, tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto + colWidths.cantidad, currentY + 7, { width: colWidths.precio, align: 'right' })
        .text(`${currency}${subtotal.toFixed(2)}`, tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto + colWidths.cantidad + colWidths.precio, currentY + 7, { width: colWidths.subtotal, align: 'right' });

      currentY += rowHeight;
    });

    // Total general
    doc.font('Helvetica-Bold').fontSize(12)
  .text(
    'TOTAL:',
    tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto + colWidths.cantidad,
    currentY,
    { width: colWidths.precio, align: 'right' }
  )
  .text(
    `${currency}${totalGeneral.toFixed(2)}`,
    tableLeftX
      + colWidths.num
      + colWidths.codigo
      + colWidths.producto
      + colWidths.cantidad
      + colWidths.precio,
    currentY,
    { width: colWidths.subtotal, align: 'right' }
  );

currentY += 25; // 👈 reserva espacio posterior

    // Finalizar PDF
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


// Obtener cantidad de pedidos por estado
const obtenerEstadisticas = async (req, res) => {
  try {
    const [pendientes] = await db.query(
      `SELECT COUNT(*) as total FROM pedido WHERE estado = 'pendiente'`
    );
    const [aprobados] = await db.query(
      `SELECT COUNT(*) as total FROM pedido WHERE estado = 'aprobado'`
    );
    const [cancelados] = await db.query(
      `SELECT COUNT(*) as total FROM pedido WHERE estado = 'anulado'`
    );

    res.json({
      pedidosPendientes: pendientes[0].total,
      pedidosAprobados: aprobados[0].total,
      pedidosCancelados: cancelados[0].total,
      ultimaActualizacion: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al obtener estadísticas por estado:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas', details: error.message });
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
  const { estado, detalles, eliminados } = req.body;

  if (!estado || !Array.isArray(detalles)) {
    return res.status(400).json({ error: 'Datos incompletos o inválidos' });
  }

  try {
    await db.query('BEGIN');

    // 1️⃣ Eliminar detalles marcados
    if (Array.isArray(eliminados) && eliminados.length > 0) {
      await db.query('DELETE FROM detalles_pedido WHERE id_detalle IN (?) AND id_pedido = ?', [eliminados, id]);
    }

    // 2️⃣ Actualizar solo el estado
    await db.query(
      'UPDATE pedido SET estado = ? WHERE id_pedido = ?',
      [estado, id]
    );

    // 3️⃣ Insertar o actualizar detalles
    for (const item of detalles) {
      const { id_detalle, id_producto, cantidad } = item;

      const [productoRows] = await db.query('SELECT precio FROM productos WHERE id_producto = ?', [id_producto]);
      if (!productoRows || productoRows.length === 0) continue;

      const precio_unitario = productoRows[0].precio;

      if (id_detalle) {
        await db.query(
          'UPDATE detalles_pedido SET id_producto = ?, cantidad = ?, precio_unitario = ? WHERE id_detalle = ? AND id_pedido = ?',
          [id_producto, cantidad, precio_unitario, id_detalle, id]
        );
      } else {
        await db.query(
          'INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
          [id, id_producto, cantidad, precio_unitario]
        );
      }
    }

    // 4️⃣ Actualizar total
    await db.query(
      `UPDATE pedido 
       SET total = (SELECT COALESCE(SUM(cantidad * precio_unitario),0) FROM detalles_pedido WHERE id_pedido = ?)
       WHERE id_pedido = ?`,
      [id, id]
    );

    await db.query('COMMIT');
    res.status(200).json({ message: 'Pedido actualizado correctamente' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error al actualizar el pedido:', error.message);
    res.status(500).json({ error: 'Error al actualizar el pedido', details: error.message });
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
