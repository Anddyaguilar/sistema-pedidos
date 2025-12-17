import React, { useState, useEffect } from "react";
import "../style/style.css";

const EditProductForm = ({ pedido, detalles, onSave, onCancel }) => {
  // Estados del formulario de edición
  const [fechaPedido, setFechaPedido] = useState(""); // Fecha del pedido
  const [proveedor, setProveedor] = useState(""); // Proveedor seleccionado
  const [detallesPedido, setDetallesPedido] = useState([]); // Detalles del pedido
  const [productos, setProductos] = useState([]); // Lista completa de productos
  const [proveedores, setProveedores] = useState([]); // Lista de proveedores
  const [productosFiltrados, setProductosFiltrados] = useState([]); // Productos filtrados para búsqueda
  const [showModal, setShowModal] = useState(false); // Controla visibilidad del modal
  const [searchTerm, setSearchTerm] = useState(""); // Término de búsqueda en modal
  const [detallesEliminados, setDetallesEliminados] = useState([]); // Detalles eliminados

  // FUNCIÓN: Efecto para inicializar datos del formulario
  useEffect(() => {
    if (pedido) {
      setFechaPedido(pedido.fecha_pedido.split("T")[0]);
      setProveedor(pedido.id_proveedor);
    }
    if (detalles) {
      // Mapear detalles del pedido al estado local
      setDetallesPedido(
        detalles.map((d) => ({
          id_detalle: d.id_detalle,
          id_producto: d.id_producto,
          nombre_producto: d.nombre_producto,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
        }))
      );
    }

    // FUNCIÓN: Obtener lista de proveedores
    fetch("http://localhost:5001/api/proveedores")
      .then((res) => res.json())
      .then((data) => {
        setProveedores(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Error obteniendo proveedores:", err));
  }, [pedido, detalles]);

  // FUNCIÓN: Agregar nuevo detalle al pedido
  const agregarDetalle = async () => {
    console.log("Proveedor antes de cargar productos:", proveedor);
    await cargarProductosDelProveedor(); // Espera que se carguen los productos
    setSearchTerm("");
    setShowModal(true);
  };

  // FUNCIÓN: Cargar productos del proveedor seleccionado
  const cargarProductosDelProveedor = async () => {
    if (!proveedor) return;

    try {
      const res = await fetch(`http://localhost:5001/api/pedidos/productos/proveedor/${proveedor}`);
      if (!res.ok) {
        console.error("Error en la respuesta de la API:", res.status);
        return;
      }

      const data = await res.json();
      console.log("✅ Respuesta de la API:", data);

      let productosCargados = [];
      if (Array.isArray(data)) {
        productosCargados = data;
      } else if (Array.isArray(data.productos)) {
        productosCargados = data.productos;
      } else {
        console.error("La respuesta no tiene un formato válido:", data);
      }

      setProductos(productosCargados);
      setProductosFiltrados(productosCargados);
    } catch (err) {
      console.error("Error cargando productos del proveedor:", err);
    }
  };

  // FUNCIÓN: Filtrar productos en el modal de búsqueda
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtrados = productos.filter(
      (prod) =>
        prod.nombre_producto.toLowerCase().includes(term) ||
        prod.codigo_original?.toLowerCase().includes(term)
    );
    setProductosFiltrados(filtrados);
  };

  // FUNCIÓN: Seleccionar producto del modal y agregarlo a detalles
  const selectProduct = (producto) => {
    setDetallesPedido((prev) => [
      ...prev,
      {
        id_producto: producto.id_producto,
        nombre_producto: producto.nombre_producto,
        cantidad: 1,
        precio_unitario: producto.precio,
      },
    ]);
    setShowModal(false);
  };

  // FUNCIÓN: Eliminar detalle del pedido (tanto frontend como backend)
  const eliminarDetalle = async (index) => {
    const detalle = detallesPedido[index];

    // Si el detalle tiene id_detalle, lo eliminamos de la base de datos
    if (detalle.id_detalle) {
      try {
        const res = await fetch(`http://localhost:5001/api/pedidos/detalle/${detalle.id_detalle}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const data = await res.json();
          console.error("Error al eliminar en backend:", data.mensaje);
          return;
        }

        console.log("✅ Detalle eliminado del backend");
      } catch (err) {
        console.error("Error de red al eliminar detalle:", err);
        return;
      }
    }

    // Luego, eliminamos del estado (frontend)
    setDetallesPedido((prev) => prev.filter((_, i) => i !== index));
  };

  // FUNCIÓN: Manejar cambios en los campos de detalle
  const handleDetalleChange = (index, field, value) => {
    const nuevos = [...detallesPedido];
    nuevos[index][field] = value;

    // Si cambia el producto, actualizar nombre y precio automáticamente
    if (field === "id_producto") {
      const prod = productos.find((p) => p.id_producto === parseInt(value));
      nuevos[index].nombre_producto = prod ? prod.nombre_producto : "";
      nuevos[index].precio_unitario = prod ? prod.precio : 0;
    }

    setDetallesPedido(nuevos);
  };

  // FUNCIÓN: Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      fecha_pedido: fechaPedido,
      id_proveedor: proveedor,
      detalles: detallesPedido,
      eliminados: detallesEliminados,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="edit-formp">
      {/* Campo: Fecha del pedido */}
      <div className="form-group">
        <label>Fecha del Pedido</label>
        <input type="date" value={fechaPedido} readOnly className="input" />
      </div>

      {/* Campo: Selección de proveedor */}
      <div className="form-group">
        <label>Proveedor</label>
        <select
          value={proveedor}
          onChange={(e) => setProveedor(e.target.value)}
          className="input"
        >
          <option value="">Seleccione un proveedor</option>
          {proveedores.map((p) => (
            <option key={p.id_proveedor} value={p.id_proveedor}>
              {p.nombre_proveedor}
            </option>
          ))}
        </select>
      </div>

      {/* Sección: Detalles del pedido */}
      <div className="detalles">
        <h3>Detalles del Pedido</h3>
        {detallesPedido.map((d, index) => (
          <div key={index} className="detalle-row">
            {/* Campo: Nombre del producto (solo lectura) */}
            <input
              type="text"
              value={d.nombre_producto}
              readOnly
              className="input1"
            />

            {/* Campo: Cantidad del producto */}
            <input
              type="number"
              value={d.cantidad}
              onChange={(e) =>
                handleDetalleChange(index, "cantidad", parseInt(e.target.value))
              }
              className="input small"
            />

            {/* Campo: Precio unitario (solo lectura) */}
            <input
              type="text"
              value={d.precio_unitario ?? ""}
              readOnly
              className="input small"
              placeholder="Precio"
            />

            {/* Botón: Eliminar detalle */}
            <button
              type="button"
              onClick={() => eliminarDetalle(index)}
              className="btnc"
            >
              🗑️ 
            </button>
          </div>
        ))}

        {/* Botón: Agregar nuevo detalle */}
        <button
          type="button"
          onClick={agregarDetalle}
          className="btn btn-primary"
        >
          + Agregar Detalle
        </button>
      </div>

      {/* Modal: Selección de productos */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Seleccione un Producto</h2>

            {/* Campo: Búsqueda de productos */}
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Buscar producto por nombre o código"
              className="input"
            />

            {/* Tabla: Lista de productos filtrados */}
            <table className="tabla-productos">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Código</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((producto) => (
                  <tr
                    key={producto.id_producto}
                    onClick={() => selectProduct(producto)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{producto.nombre_producto}</td>
                    <td>{producto.codigo_original}</td>
                    <td>{Number(producto.precio).toFixed(2)} C$</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Botón: Cerrar modal */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn btn-secondary"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Botones: Guardar y Cancelar */}
      <div className="form-actions">
        <button type="submit" className=" btn-successp">
          💾 Guardar
        </button>
        <button type="button" onClick={onCancel} className="btnc">
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default EditProductForm;
