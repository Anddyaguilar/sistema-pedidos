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

    //console.log("Detalles obtenidos:", results); // Para debug
    res.json(results);
  } catch (error) {
    //console.error('Error al obtener los detalles del pedido:', error);
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
  //console.log('📥 BODY RECIBIDO:', req.body);
  //console.log('👤 USER JWT:', req.user);

  const { fecha_pedido, id_proveedor, detalles } = req.body;

  // Validación básica
  if (!fecha_pedido || !id_proveedor || !Array.isArray(detalles) || detalles.length === 0) {
    //console.log('❌ Error: datos incompletos o sin detalles');
    return res.status(400).json({ error: 'Datos incompletos o sin detalles' });
  }

  try {
    await db.query('BEGIN');

    const id_usuario = req.user?.id;
    if (!id_usuario) {
      await db.query('ROLLBACK');
      //console.log('❌ Usuario no identificado');
      return res.status(400).json({ error: 'Usuario no autenticado' });
    }

    //console.log('🧾 Detalles recibidos CRUDOS:', detalles);

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

    //console.log('✅ Detalles válidos BACKEND:', detallesValues);

    if (detallesValues.length === 0) {
      await db.query('ROLLBACK');
      //console.log('❌ No hay detalles válidos');
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
    //console.log('🆕 Pedido creado con ID:', id_pedido);

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

    // console.log('✅ Pedido creado correctamente');

    res.status(201).json({ message: 'Pedido creado', id_pedido });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('🔥 ERROR BACKEND:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

const fs = require('fs');

const descargarPDF = async (req, res) => {
  const { id } = req.params;

  try {

    // =====================================
    // 1. PEDIDO + USUARIOS DESDE BD
    // =====================================
    const [pedido] = await db.query(`
      SELECT 
        p.*,

        creador.nombre AS nombre_creador,
        aprobador.nombre AS nombre_aprobador,

        CASE 
          WHEN p.estado = 'Aprobado' THEN aprobador.nombre
          WHEN p.estado = 'Pendiente' THEN creador.nombre
          WHEN p.estado = 'Anulado' THEN creador.nombre
          ELSE creador.nombre
        END AS responsable

      FROM pedido p

      LEFT JOIN users creador 
        ON creador.id_users = p.id_user

      LEFT JOIN users aprobador 
        ON creador.id_users = p.id_user
        AND aprobador.id_users = p.aprobado_por

      WHERE p.id_pedido = ?
    `, [id]);

    if (!pedido || pedido.length === 0) {
      return res.status(404).json({ error: 'El pedido no existe' });
    }

    const pedidoData = pedido[0];

    const estadoActual = pedidoData.estado;
    const responsable = pedidoData.responsable || "Administrador";

    // =====================================
    // 2. CONFIGURACIÓN
    // =====================================
    const [config] = await db.query('SELECT * FROM system_config LIMIT 1');
    const comp = config?.[0] || {};

    const companyName = comp.company_name || 'Nombre de la empresa';
    const exchangeRate = parseFloat(comp.exchange_rate) || 36.6;
    const logoPath =
      comp.logo_path && fs.existsSync(comp.logo_path)
        ? comp.logo_path
        : null;

    // =====================================
    // 3. PROVEEDOR
    // =====================================
    let nombreProveedor = "Proveedor no especificado";

    const [proveedor] = await db.query(
      'SELECT nombre_proveedor FROM proveedor WHERE id_proveedor = ?',
      [pedidoData.id_proveedor]
    );

    if (proveedor.length > 0) {
      nombreProveedor = proveedor[0].nombre_proveedor;
    }

    // =====================================
    // 4. DETALLES
    // =====================================
    const [detalles] = await db.query(`
      SELECT 
        dp.cantidad, 
        dp.precio_unitario, 
        p.nombre_producto, 
        p.codigo_original,
        p.tipo_moneda
      FROM detalles_pedido dp
      JOIN productos p ON dp.id_producto = p.id_producto
      WHERE dp.id_pedido = ?`, 
      [id]
    );

    // =====================================
    // 5. CONFIGURAR PDF (TU DISEÑO ORIGINAL)
    // =====================================

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

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const marginBottom = 40;
    const tableWidth = pageWidth - 80;
    const tableLeftX = 40;
    const rowHeight = 27;

    const colWidths = {
      num: 30,
      codigo: 85,
      producto: 180,
      cantidad: 45,
      precio: 80,
      subtotal: 80
    };

    let currentY = 40;

    const convertirACordobas = (precio, moneda) => {
      const precioNum = parseFloat(precio) || 0;
      if (moneda === '$') return precioNum * exchangeRate;
      return precioNum;
    };

    // =====================================
    // HEADER (SIN CAMBIOS)
    // =====================================
    function addHeader() {

      const empresaLeftX = logoPath ? 130 : tableLeftX;

      if (logoPath) {
        try {
          doc.image(logoPath, tableLeftX, currentY, {
            width: 80,
            height: 50,
            fit: [80, 50]
          });
        } catch (err) {}
      }

      doc.font('Helvetica-Bold').fontSize(16)
        .text(companyName, empresaLeftX, currentY, {
          align: 'center',
          width: pageWidth - empresaLeftX - 40
        });

      currentY += 25;

      doc.font('Helvetica-Bold').fontSize(10).fillColor('#000')
        .text(`Pedido N°: ${id}`, tableLeftX, currentY)
        .text(`Fecha: ${new Date(pedidoData.fecha_pedido).toLocaleDateString()}`, tableLeftX, currentY + 12)
        .text(`Proveedor: ${nombreProveedor}`, tableLeftX, currentY + 24)
        .text(`Estado: ${estadoActual}`, tableLeftX, currentY + 36)
        .text(`Responsable: ${responsable}`, tableLeftX, currentY + 48);

      currentY += 70;

      doc.moveTo(tableLeftX, currentY)
        .lineTo(pageWidth - 40, currentY)
        .stroke('#333');

      currentY += 5;

      drawTableHeader(currentY);
      currentY += rowHeight;
    }

    function drawTableHeader(y) {
      doc.fillColor('#1a4693').font('Helvetica-Bold').fontSize(10);

      doc.text('#', tableLeftX + 5, y + 9, { width: colWidths.num - 10, align: 'center' })
        .text('CÓDIGO', tableLeftX + colWidths.num, y + 9, { width: colWidths.codigo, align: 'center' })
        .text('DESCRIPCIÓN', tableLeftX + colWidths.num + colWidths.codigo, y + 9, { width: colWidths.producto, align: 'center' })
        .text('CANT.', tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto, y + 9, { width: colWidths.cantidad, align: 'center' })
        .text('PRECIO', tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto + colWidths.cantidad, y + 9, { width: colWidths.precio, align: 'right' })
        .text('SUBTOTAL', tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto + colWidths.cantidad + colWidths.precio, y + 9, { width: colWidths.subtotal, align: 'right' });
    }

    function checkPageHeight(y, heightNeeded = rowHeight) {
      if (y + heightNeeded > pageHeight - marginBottom) {
        doc.addPage();
        currentY = 40;
        addHeader();
        return currentY;
      }
      return y;
    }

    addHeader();

    // =====================================
    // FILAS (SIN CAMBIOS)
    // =====================================
    let totalCordobas = 0;

    detalles.forEach((detalle, i) => {

      const cantidad = parseFloat(detalle.cantidad) || 0;
      const precioOriginal = parseFloat(detalle.precio_unitario) || 0;
      const moneda = detalle.tipo_moneda || 'C$';

      const precioCordobas = convertirACordobas(precioOriginal, moneda);
      const subtotalCordobas = cantidad * precioCordobas;
      totalCordobas += subtotalCordobas;

      currentY = checkPageHeight(currentY);

      if (i % 2 === 0)
        doc.rect(tableLeftX, currentY, tableWidth, rowHeight).fill('#f8f9fa');

      const colPos = {
        num: tableLeftX + 5,
        codigo: tableLeftX + colWidths.num,
        producto: tableLeftX + colWidths.num + colWidths.codigo,
        cantidad: tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto,
        precio: tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto + colWidths.cantidad,
        subtotal: tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto + colWidths.cantidad + colWidths.precio
      };

      doc.fillColor('#000').font('Helvetica').fontSize(9)
        .text(i + 1, colPos.num, currentY + 9, { width: colWidths.num - 10, align: 'center' })
        .text(detalle.codigo_original || 'N/A', colPos.codigo, currentY + 9, { width: colWidths.codigo })
        .text(detalle.nombre_producto || '', colPos.producto, currentY + 9, { width: colWidths.producto, ellipsis: true })
        .text(cantidad.toString(), colPos.cantidad, currentY + 9, { width: colWidths.cantidad, align: 'center' })
        .text(`C$${precioCordobas.toFixed(2)}`, colPos.precio, currentY + 9, { width: colWidths.precio, align: 'right' })
        .text(`C$${subtotalCordobas.toFixed(2)}`, colPos.subtotal, currentY + 9, { width: colWidths.subtotal, align: 'right' });

      currentY += rowHeight;
    });

    // =====================================
    // TOTALES (SIN CAMBIOS)
    // =====================================
    const totalDolares = totalCordobas / exchangeRate;

    currentY = checkPageHeight(currentY, 50);

    doc.moveTo(tableLeftX, currentY)
      .lineTo(tableLeftX + tableWidth, currentY)
      .stroke('#333');

    currentY += 10;

    doc.font('Helvetica-Bold').fontSize(12)
      .text('TOTAL C$:', tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto + colWidths.cantidad,
        currentY, { width: colWidths.precio, align: 'right' })
      .text(`C$${totalCordobas.toFixed(2)}`,
        tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto + colWidths.cantidad + colWidths.precio,
        currentY, { width: colWidths.subtotal, align: 'right' });

    currentY += 15;

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#28a745')
      .text('TOTAL $:',
        tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto + colWidths.cantidad,
        currentY, { width: colWidths.precio, align: 'right' })
      .text(`$${totalDolares.toFixed(2)}`,
        tableLeftX + colWidths.num + colWidths.codigo + colWidths.producto + colWidths.cantidad + colWidths.precio,
        currentY, { width: colWidths.subtotal, align: 'right' });

    doc.end();

  } catch (error) {
    console.error('Error al generar el PDF:', error);
    if (!res.headersSent)
      res.status(500).json({
        error: 'Error al generar el PDF',
        message: error.message
      });
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
  const { estado } = req.body;
  const idUsuario = req.user.id; // 👈 USUARIO LOGUEADO

  try {
    // Obtener estado actual
    const [rows] = await db.query(
      'SELECT estado FROM pedido WHERE id_pedido = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const estadoAnterior = rows[0].estado;

    // Actualizar estado
    await db.query(
      'UPDATE pedido SET estado = ? WHERE id_pedido = ?',
      [estado, id]
    );

    // SOLO si pasa a APROBADO
    if (
      estado.trim().toUpperCase() === 'APROBADO' &&
      estadoAnterior.trim().toUpperCase() !== 'APROBADO'
    ) {
      await db.query(
        `UPDATE pedido
         SET aprobado_por = ?, fecha_aprobacion = NOW()
         WHERE id_pedido = ?`,
        [idUsuario, id]
      );
    }

    res.json({ message: 'Estado actualizado correctamente' });

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error interno' });
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
    //console.log("Proveedor ID recibido:", proveedorId);
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
