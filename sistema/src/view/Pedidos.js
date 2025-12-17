import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/style.css";
import NewPedidoForm from "./Newpedido";
import axios from "axios";

export default function PedidosView() {
  // Estados del componente principal
  const [pedidos, setPedidos] = useState([]);
  const [proveedoresMap, setProveedoresMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState([]);
  
  // Estados para la edición de pedidos
  const [editingPedido, setEditingPedido] = useState(null);
  const [detallesPedido, setDetallesPedido] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [fechaPedidoEdit, setFechaPedidoEdit] = useState("");
  const [proveedorEdit, setProveedorEdit] = useState("");
  const [productosEdit, setProductosEdit] = useState([]);
  const [proveedoresList, setProveedoresList] = useState([]);
  const [productosFiltradosEdit, setProductosFiltradosEdit] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchTermProduct, setSearchTermProduct] = useState("");
  const [detallesEliminados, setDetallesEliminados] = useState([]);

  const navigate = useNavigate();

  // FUNCIÓN: Obtener lista de pedidos desde la API
  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/pedidos");
        if (!response.ok) throw new Error("Error al obtener los pedidos");
        const data = await response.json();
        setPedidos(data);
      } catch (error) {
        console.error("Error al obtener pedidos:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPedidos();
  }, []);

  // FUNCIÓN: Obtener lista de proveedores y crear mapa
  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/proveedores");
        const data = await response.json();
        const proveedoresMap = data.reduce((acc, proveedor) => {
          acc[proveedor.id_proveedor] = proveedor.nombre_proveedor;
          return acc;
        }, {});
        setProveedoresMap(proveedoresMap);
        setProveedoresList(data);
      } catch (error) {
        console.error("Error obteniendo proveedores:", error);
      }
    };
    fetchProveedores();
  }, []);

  // FUNCIÓN: Obtener nombre del proveedor por ID
  const getProviderName = (providerId) => {
    return proveedoresMap[providerId] || "Desconocido";
  };

  // FUNCIÓN: Cargar productos del proveedor seleccionado
  const cargarProductosDelProveedor = async (proveedorId) => {
    if (!proveedorId) {
      alert("Por favor, seleccione un proveedor primero");
      return [];
    }

    try {
      const res = await fetch(`http://localhost:5001/api/pedidos/productos/proveedor/${proveedorId}`);
      if (!res.ok) {
        console.error("Error en la respuesta de la API:", res.status);
        alert("Error al cargar productos del proveedor");
        return [];
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
        return [];
      }

      return productosCargados;
    } catch (err) {
      console.error("Error cargando productos del proveedor:", err);
      alert("Error al cargar productos del proveedor");
      return [];
    }
  };

  // FUNCIÓN: Manejar edición de pedido
  const handleEdit = async (pedido) => {
    const { id_pedido } = pedido;

    try {
      // Cargar detalles del pedido
      const response = await fetch(`http://localhost:5001/api/pedidos/${id_pedido}/detalles`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al obtener los detalles del pedido: ${errorData.message || response.status}`);
      }
      const detalles = await response.json();
      
      // Cargar productos del proveedor
      const productosCargados = await cargarProductosDelProveedor(pedido.id_proveedor);
      
      setEditingPedido(pedido);
      setDetallesPedido(detalles.map(d => ({
        id_detalle: d.id_detalle,
        id_producto: d.id_producto,
        nombre_producto: d.nombre_producto,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
      })));
      setFechaPedidoEdit(pedido.fecha_pedido.split("T")[0]);
      setProveedorEdit(pedido.id_proveedor);
      setProductosEdit(productosCargados);
      setProductosFiltradosEdit(productosCargados);
      setDetallesEliminados([]);
      setShowEditModal(true);
    } catch (error) {
      console.error("Error al cargar detalles del pedido:", error);
      alert("Hubo un problema al cargar los detalles del pedido.");
    }
  };

  // FUNCIÓN: Cerrar modal de edición
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingPedido(null);
    setDetallesPedido([]);
    setShowProductModal(false);
  };

  // FUNCIÓN: Manejar eliminación de pedido
  const handleDelete = async (pedidoId) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este pedido?")) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5001/api/pedidos/${pedidoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el pedido");
      }

      setPedidos(pedidos.filter((pedido) => pedido.id_pedido !== pedidoId));
      alert("Pedido eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar el pedido:", error);
      alert("Hubo un problema al eliminar el pedido.");
    }
  };

  // FUNCIÓN: Mostrar formulario para nuevo pedido
  const handleAdd = () => {
    setShowNewForm(true);
  };

  // FUNCIÓN: Descargar PDF de un pedido individual
  const handleDescargarPDF = async (pedidoId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/pedidos/${pedidoId}/pdf`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `pedido_${pedidoId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al descargar el PDF:", error);
      alert("Error al descargar el PDF. Por favor, inténtalo de nuevo.");
    }
  };

  // FUNCIÓN: Descargar PDFs de múltiples pedidos seleccionados
  const handleDescargarPDFsSeleccionados = async () => {
    if (selectedPedido.length === 0) {
      alert("Por favor seleccione al menos un pedido para descargar.");
      return;
    }

    try {
      for (const pedidoId of selectedPedido) {
        await handleDescargarPDF(pedidoId);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error("Error al descargar múltiples PDFs:", error);
      alert("Hubo un problema al descargar los PDFs seleccionados.");
    }
  };

  // FUNCIÓN: Guardar nuevo pedido
  const handleSave = async (nuevoPedido) => {
    try {
      const response = await fetch("http://localhost:5001/api/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nuevoPedido),
      });

      if (!response.ok) {
        throw new Error("Error al agregar pedido");
      }

      const data = await response.json();
      setPedidos((prevPedidos) => [...prevPedidos, data]);
      setShowNewForm(false);
      alert("Pedido creado exitosamente");
    } catch (error) {
      console.error("Error al guardar pedido:", error);
      alert("Hubo un problema al guardar el pedido.");
    }
  };

  // FUNCIÓN: Cancelar creación de nuevo pedido
  const handleCancel = () => {
    setShowNewForm(false);
  };

  // FUNCIÓN: Actualizar pedido existente
  const handleUpdate = async (pedidoActualizado) => {
    try {
      const response = await fetch(`http://localhost:5001/api/pedidos/${editingPedido.id_pedido}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fecha_pedido: pedidoActualizado.fecha_pedido,
          id_proveedor: pedidoActualizado.id_proveedor,
          detalles: pedidoActualizado.detalles,
          eliminados: pedidoActualizado.eliminados
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el pedido");
      }

      const updatedPedidos = pedidos.map((pedido) =>
        pedido.id_pedido === editingPedido.id_pedido ? { 
          ...pedido, 
          fecha_pedido: pedidoActualizado.fecha_pedido,
          id_proveedor: pedidoActualizado.id_proveedor
        } : pedido
      );
      setPedidos(updatedPedidos);

      closeEditModal();
      alert("Pedido actualizado exitosamente");
    } catch (error) {
      console.error("Error al actualizar el pedido:", error);
      alert("Hubo un problema al actualizar el pedido.");
    }
  };

  // FUNCIÓN: Seleccionar/deseleccionar pedidos para descarga múltiple
  const togglePedidoSelection = (pedidoId) => {
    setSelectedPedido(prev => {
      if (prev.includes(pedidoId)) {
        return prev.filter(id => id !== pedidoId);
      } else {
        return [...prev, pedidoId];
      }
    });
  };

  // FUNCIÓN: Agregar nuevo detalle al pedido en edición
  const agregarDetalle = async () => {
    if (!proveedorEdit) {
      alert("Por favor, seleccione un proveedor primero");
      return;
    }
    
    if (productosEdit.length === 0) {
      const productosCargados = await cargarProductosDelProveedor(proveedorEdit);
      if (productosCargados.length === 0) {
        alert("Este proveedor no tiene productos disponibles");
        return;
      }
      setProductosEdit(productosCargados);
      setProductosFiltradosEdit(productosCargados);
    }
    
    setSearchTermProduct("");
    setShowProductModal(true);
  };

  // FUNCIÓN: Filtrar productos en el modal de búsqueda
  const handleSearchProduct = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTermProduct(term);
    const filtrados = productosEdit.filter(
      (prod) =>
        prod.nombre_producto.toLowerCase().includes(term) ||
        prod.codigo_original?.toLowerCase().includes(term)
    );
    setProductosFiltradosEdit(filtrados);
  };

  // FUNCIÓN: Seleccionar producto del modal
  const selectProduct = (producto) => {
    // Verificar si el producto ya está en los detalles
    const existe = detallesPedido.some(d => d.id_producto === producto.id_producto);
    if (existe) {
      alert("Este producto ya está en el pedido. Puede modificar la cantidad.");
      return;
    }

    setDetallesPedido((prev) => [
      ...prev,
      {
        id_producto: producto.id_producto,
        nombre_producto: producto.nombre_producto,
        cantidad: 1,
        precio_unitario: producto.precio,
      },
    ]);
    setShowProductModal(false);
  };

  // FUNCIÓN: Eliminar detalle del pedido en edición
  const eliminarDetalle = async (index) => {
    const detalle = detallesPedido[index];

    // Confirmar eliminación
    if (!window.confirm("¿Está seguro de que desea eliminar este producto del pedido?")) {
      return;
    }

    // Si el detalle tiene id_detalle, lo agregamos a la lista de eliminados
    if (detalle.id_detalle) {
      setDetallesEliminados(prev => [...prev, detalle.id_detalle]);
    }

    // Eliminar del estado (frontend)
    setDetallesPedido((prev) => prev.filter((_, i) => i !== index));
  };

  // FUNCIÓN: Manejar cambios en los campos de detalle
  const handleDetalleChange = (index, field, value) => {
    const nuevos = [...detallesPedido];
    
    // Validar cantidad mínima
    if (field === "cantidad" && value < 1) {
      alert("La cantidad mínima es 1");
      return;
    }
    
    nuevos[index][field] = field === "cantidad" ? parseInt(value) || 1 : value;
    
    // Si cambia el producto, actualizar nombre y precio automáticamente
    if (field === "id_producto") {
      const prod = productosEdit.find((p) => p.id_producto === parseInt(value));
      nuevos[index].nombre_producto = prod ? prod.nombre_producto : "";
      nuevos[index].precio_unitario = prod ? prod.precio : 0;
    }

    setDetallesPedido(nuevos);
  };

  // FUNCIÓN: Calcular total del pedido en edición
  const calcularTotal = () => {
    return detallesPedido.reduce((total, detalle) => {
      return total + (detalle.cantidad * detalle.precio_unitario);
    }, 0).toFixed(2);
  };

  // FUNCIÓN: Manejar cambio de proveedor en edición
  const handleProveedorChange = async (e) => {
    const nuevoProveedor = e.target.value;
    setProveedorEdit(nuevoProveedor);
    
    if (nuevoProveedor) {
      const productosCargados = await cargarProductosDelProveedor(nuevoProveedor);
      setProductosEdit(productosCargados);
      setProductosFiltradosEdit(productosCargados);
    } else {
      setProductosEdit([]);
      setProductosFiltradosEdit([]);
    }
  };

  // FUNCIÓN: Manejar envío del formulario de edición
  const handleSubmitEdit = (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!proveedorEdit) {
      alert("Por favor, seleccione un proveedor");
      return;
    }
    
    if (detallesPedido.length === 0) {
      alert("Debe agregar al menos un producto al pedido");
      return;
    }
    
    handleUpdate({
      fecha_pedido: fechaPedidoEdit,
      id_proveedor: proveedorEdit,
      detalles: detallesPedido,
      eliminados: detallesEliminados,
    });
  };

  // FUNCIÓN: Filtrar pedidos según término de búsqueda
  const filteredPedidos = pedidos.filter((pedido) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      pedido.id_pedido.toString().includes(searchLower) ||
      getProviderName(pedido.id_proveedor).toLowerCase().includes(searchLower) ||
      pedido.fecha_pedido.includes(searchLower) ||
      pedido.total.toString().includes(searchLower)
    );
  });

  // Estados de carga y error
  if (loading) return <p>Cargando pedidos...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="order-list">
      {/* Contenedor principal con título, búsqueda y botones */}
      <div className="container-t1">
        <h2>Lista de Pedidos</h2>

        {/* Barra de búsqueda y botones */}
        <div className="search-containerpd">
          <input
            type="text"
            placeholder="Buscar por proveedor, número de pedido, fecha o total"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-inputpd"
          />
          
          <div className="toolbar-buttons">
            
            
            <button
              onClick={handleDescargarPDFsSeleccionados}
              className="btn-create-order"
              disabled={selectedPedido.length === 0}
            >
              Descargar PDF Seleccionados ({selectedPedido.length})
            </button>
          </div>
          
          <span className="total-products">
            {filteredPedidos.length} pedidos encontrados
          </span>
        </div>
      </div>

      {/* Renderizado condicional: formulario nuevo o tabla de pedidos */}
      {showNewForm ? (
        <NewPedidoForm onSave={handleSave} onCancel={handleCancel} />
      ) : (
        // Tabla de pedidos
        <div className="table-responsive">
          {filteredPedidos.length === 0 ? (
            <p className="no-results">No hay pedidos disponibles.</p>
          ) : (
            <table className="product-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>Seleccionar</th>
                  <th>N° de pedido</th>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPedidos.map((pedido) => (
                  <tr key={pedido.id_pedido}>
                    <td>
                      <input
                        className="select-checkbox"
                        type="checkbox"
                        checked={selectedPedido.includes(pedido.id_pedido)}
                        onChange={() => togglePedidoSelection(pedido.id_pedido)}
                      />
                    </td>
                    <td>{pedido.id_pedido}</td>
                    <td>{new Date(pedido.fecha_pedido).toLocaleDateString('es-NI')}</td>
                    <td>{getProviderName(pedido.id_proveedor)}</td>
                    <td>${pedido.total}</td>
                    <td>
                      <button
                        onClick={() => handleEdit(pedido)}
                        className="btn-edit"
                        title="Editar pedido"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(pedido.id_pedido)}
                        className="btn-delete"
                        title="Eliminar pedido"
                      >
                        🗑️
                      </button>
                      <button
                        onClick={() => handleDescargarPDF(pedido.id_pedido)}
                        className="btn-create-order"
                        title="Descargar PDF"
                        style={{ marginLeft: '5px', padding: '0.4rem 0.75rem' }}
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal para editar pedido */}
      {showEditModal && editingPedido && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Editar Pedido #{editingPedido.id_pedido}</h3>
            
            <form onSubmit={handleSubmitEdit} className="edit-formp">
              <div className="form-group">
                <label>Número de Pedido</label>
                <input 
                  type="text" 
                  value={editingPedido?.id_pedido || ''} 
                  readOnly 
                  className="inpute" 
                />
              </div>

              <div className="form-group">
                <label>Fecha del Pedido</label>
                <input 
                  type="date" 
                  value={fechaPedidoEdit} 
                  readOnly 
                  className="inpute" 
                />
              </div>

              <div className="form-group">
                <label>Proveedor *</label>
                <select
                  value={proveedorEdit}
                  onChange={handleProveedorChange}
                  className="inpute"
                  required
                >
                  <option value="">Seleccione un proveedor</option>
                  {proveedoresList.map((p) => (
                    <option key={p.id_proveedor} value={p.id_proveedor}>
                      {p.nombre_proveedor}
                    </option>
                  ))}
                </select>
              </div>

              <div className="detalles">
                <h3>Productos del Pedido</h3>
                
                {detallesPedido.length === 0 ? (
                  <p className="no-results">No hay productos en este pedido</p>
                ) : (
                  <div className="table-responsive" style={{ marginTop: '1rem' }}>
                    <table className="product-table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Cantidad</th>
                          <th>Precio Unitario</th>
                          <th>Subtotal</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detallesPedido.map((d, index) => (
                          <tr key={index}>
                            <td>
                              <input
                                type="text"
                                value={d.nombre_producto}
                                readOnly
                                className="inpute"
                                style={{ width: '100%' }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                value={d.cantidad}
                                onChange={(e) =>
                                  handleDetalleChange(index, "cantidad", parseInt(e.target.value))
                                }
                                className="inpute"
                                style={{ width: '80px' }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={`$${d.precio_unitario}`}
                                readOnly
                                className="inpute"
                                style={{ width: '100px' }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={`$${(d.cantidad * d.precio_unitario).toFixed(2)}`}
                                readOnly
                                className="inpute"
                                style={{ width: '100px', fontWeight: 'bold' }}
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => eliminarDetalle(index)}
                                className="btn-delete"
                                style={{ padding: '0.25rem 0.5rem' }}
                              >
                                🗑️ 
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                            Total del Pedido:
                          </td>
                          <td colSpan="2" style={{ fontWeight: 'bold', color: '#28a745' }}>
                            ${calcularTotal()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                <button
                  type="button"
                  onClick={agregarDetalle}
                  className="btn-add"
                  style={{ marginTop: '1rem' }}
                >
                  + Agregar Producto
                </button>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-confirm">
                  💾 Guardar Cambios
                </button>
                <button type="button" onClick={closeEditModal} className="btn-cancel">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para seleccionar productos */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Seleccionar Producto</h3>
            
            <div className="form-group">
              <input
                type="text"
                value={searchTermProduct}
                onChange={handleSearchProduct}
                placeholder="Buscar producto por nombre o código"
                className="search-inputpd"
                autoFocus
              />
            </div>

            <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Código</th>
                    <th>Precio</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltradosEdit.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="no-results">
                        No se encontraron productos
                      </td>
                    </tr>
                  ) : (
                    productosFiltradosEdit.map((producto) => (
                      <tr key={producto.id_producto}>
                        <td>{producto.nombre_producto}</td>
                        <td>{producto.codigo_original || 'N/A'}</td>
                        <td>${Number(producto.precio).toFixed(2)}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => selectProduct(producto)}
                            className="btn-edit"
                            style={{ padding: '0.25rem 0.5rem' }}
                          >
                            Seleccionar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="btn-cancel"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}