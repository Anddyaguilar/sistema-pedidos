import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/pedidos.css";
import NewPedidoForm from "./Newpedido";
import axios from "axios";

export default function PedidosView() {
  // Estados del componente principal
  const [pedidos, setPedidos] = useState([]);
  const [proveedoresMap, setProveedoresMap] = useState({});
  const [usuariosMap, setUsuariosMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState([]);
  
  // Nuevo estado para la tasa de cambio
  const [tasaCambio, setTasaCambio] = useState(36.6); // Valor por defecto

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

  // FUNCIÓN: Obtener tasa de cambio desde la configuración
  useEffect(() => {
    const fetchTasaCambio = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/config");
        if (response.ok) {
          const data = await response.json();
          if (data?.config?.exchange_rate) {
            setTasaCambio(Number(data.config.exchange_rate));
          }
        }
      } catch (error) {
        console.warn("No se pudo cargar la tasa de cambio, usando valor por defecto:", error);
        // Mantener el valor por defecto
      }
    };
    fetchTasaCambio();
  }, []);

  // FUNCIÓN: Convertir precios entre monedas (SEGURA)
  const convertirPrecios = (precio, moneda = "C$") => {
    // Asegurarse de que precio sea un número
    const p = Number(precio) || 0;
    const tasa = Number(tasaCambio) || 36.6;
    
    if (moneda === "C$") {
      return {
        cordoba: p,
        dolar: Number((p / tasa).toFixed(2))
      };
    } else {
      return {
        cordoba: Number((p * tasa).toFixed(2)),
        dolar: p
      };
    }
  };

  // FUNCIÓN: Formatear moneda (SEGURA)
  const formatCurrency = (amount, currency = "C$") => {
    const numAmount = Number(amount) || 0;
    return `${currency}${numAmount.toLocaleString("es-NI", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // FUNCIÓN: Asegurar que un valor sea número
  const asegurarNumero = (valor) => {
    if (valor === null || valor === undefined) return 0;
    const num = Number(valor);
    return isNaN(num) ? 0 : num;
  };

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

  // FUNCIÓN: Obtener lista de usuarios y crear mapa
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/usuarios/");
        const data = await response.json();

        // crear el mapa usando la propiedad correcta "id"
        const map = data.reduce((acc, usuario) => {
          acc[String(usuario.id)] = usuario.nombre;
          return acc;
        }, {});

        setUsuariosMap(map);
      } catch (error) {
        console.error("Error obteniendo usuarios:", error);
      }
    };

    fetchUsuarios();
  }, []);

  // FUNCIÓN: Obtener nombre del proveedor por ID
  const getProviderName = (providerId) => {
    return proveedoresMap[providerId] || "Desconocido";
  };

  // FUNCIÓN: Obtener nombre de usuario por ID
  const getUserName = (id) => {
    return usuariosMap[String(id)] || "Desconocido";
  };

  // FUNCIÓN: Cargar productos del proveedor seleccionado
  const cargarProductosDelProveedor = async (proveedorId) => {
    if (!proveedorId) {
      alert("Por favor, seleccione un proveedor primero");
      return [];
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("No hay token disponible. Debes iniciar sesión.");

      const res = await fetch(
        `http://localhost:5001/api/pedidos/productos/proveedor/${proveedorId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        }
      );

      if (!res.ok) {
        console.error("Error en la respuesta de la API:", res.status);
        alert("Error al cargar productos del proveedor");
        return [];
      }

      const data = await res.json();

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
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No hay token disponible. Debes iniciar sesión.');

      // 1️⃣ Cargar detalles del pedido
      const detallesRes = await axios.get(
        `http://localhost:5001/api/pedidos/${id_pedido}/detalles`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Obtener arrays según la respuesta de la API
      const detallesArray = detallesRes.data.detalles || [];
      const productosArray = detallesRes.data.productos || [];

      // 2️⃣ Mapear detalles agregando el nombre desde productos
      const detallesFormateados = detallesArray.map(d => {
        const producto = productosArray.find(p => p.id_producto === d.id_producto);
        return {
          id_detalle: d.id_detalle || null,
          id_producto: d.id_producto,
          nombre_producto: producto ? producto.nombre_producto : 'Producto no disponible',
          cantidad: asegurarNumero(d.cantidad),
          precio_unitario: asegurarNumero(d.precio_unitario),
          moneda: producto?.tipo_moneda || "C$"
        };
      });

      // 3️⃣ Cargar productos del proveedor
      const productosRes = await axios.get(
        `http://localhost:5001/api/pedidos/productos/proveedor/${pedido.id_proveedor}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const productosCargados = Array.isArray(productosRes.data)
        ? productosRes.data
        : productosRes.data.productos || [];

      // 4️⃣ Actualizar estados
      setEditingPedido(pedido);
      setDetallesPedido(detallesFormateados);
      setFechaPedidoEdit(pedido.fecha_pedido.split("T")[0]);
      setProveedorEdit(pedido.id_proveedor);
      setProductosEdit(productosCargados);
      setProductosFiltradosEdit(productosCargados);
      setDetallesEliminados([]);
      setShowEditModal(true);

    } catch (error) {
      console.error("❌ Error al cargar detalles del pedido:", error);
      alert("Hubo un problema al cargar los detalles del pedido. Revisa la consola.");
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
      const token = localStorage.getItem('token');
      if (!token) {
        alert("No hay sesión iniciada. Debes iniciar sesión primero.");
        return;
      }

      const response = await fetch(`http://localhost:5001/api/pedidos/${pedidoId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const msg = errorData?.message || "Error al eliminar el pedido";
        throw new Error(msg);
      }

      setPedidos(pedidos.filter((pedido) => pedido.id_pedido !== pedidoId));
      alert("Pedido eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar el pedido:", error);
      alert(`Hubo un problema al eliminar el pedido: ${error.message}`);
    }
  };

  // FUNCIÓN: Mostrar formulario para nuevo pedido
  const handleAdd = () => {
    setShowNewForm(true);
  };

  // FUNCIÓN: Descargar PDF de un pedido individual
  const handleDescargarPDF = async (idPedido) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No tienes sesión iniciada');
        return;
      }

      const response = await axios.get(`http://localhost:5001/api/pedidos/${idPedido}/pdf`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pedido_${idPedido}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (error) {
      console.error('Error al descargar el PDF:', error);
      alert('Error al descargar PDF');
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
  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Su sesión ha expirado. Por favor inicie sesión de nuevo.");
        navigate("/login");
        return;
      }

      // Verificar que cada detalle tenga id_producto y cantidad válidos
      const detallesValidos = detallesPedido.map(d => ({
        id_detalle: d.id_detalle || null,
        id_producto: d.id_producto,
        cantidad: asegurarNumero(d.cantidad),
        precio_unitario: asegurarNumero(d.precio_unitario)
      }));

      const response = await fetch(`http://localhost:5001/api/pedidos/${editingPedido.id_pedido}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          estado: editingPedido.estado,
          detalles: detallesValidos,
          eliminados: detallesEliminados
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.error || "Error al actualizar el pedido";
        throw new Error(errorMsg);
      }

      const updatedPedidos = pedidos.map(p =>
        p.id_pedido === editingPedido.id_pedido
          ? { ...p, estado: editingPedido.estado }
          : p
      );
      setPedidos(updatedPedidos);

      closeEditModal();
      alert("Pedido actualizado correctamente");

    } catch (error) {
      console.error("Error al actualizar el pedido:", error);
      alert(`Hubo un problema al actualizar el pedido: ${error.message}`);
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
        precio_unitario: asegurarNumero(producto.precio),
        moneda: producto.tipo_moneda || "C$"
      },
    ]);
    setShowProductModal(false);
  };

  // FUNCIÓN: Eliminar detalle del pedido en edición
  const eliminarDetalle = async (index) => {
    const detalle = detallesPedido[index];

    if (!window.confirm("¿Está seguro de que desea eliminar este producto del pedido?")) {
      return;
    }

    if (detalle.id_detalle) {
      setDetallesEliminados(prev => [...prev, detalle.id_detalle]);
    }

    setDetallesPedido((prev) => prev.filter((_, i) => i !== index));
  };

  // FUNCIÓN: Manejar cambios en los campos de detalle
  const handleDetalleChange = (index, field, value) => {
    const nuevos = [...detallesPedido];

    if (field === "cantidad" && value < 1) {
      alert("La cantidad mínima es 1");
      return;
    }

    nuevos[index][field] = field === "cantidad" ? parseInt(value) || 1 : value;

    if (field === "id_producto") {
      const prod = productosEdit.find((p) => p.id_producto === parseInt(value));
      nuevos[index].nombre_producto = prod ? prod.nombre_producto : "";
      nuevos[index].precio_unitario = prod ? asegurarNumero(prod.precio) : 0;
      nuevos[index].moneda = prod ? prod.tipo_moneda || "C$" : "C$";
    }

    setDetallesPedido(nuevos);
  };

  // FUNCIÓN: Calcular total del pedido en edición (CORREGIDA)
  const calcularTotal = () => {
    const total = detallesPedido.reduce((total, detalle) => {
      const precioUnitario = asegurarNumero(detalle.precio_unitario);
      const cantidad = asegurarNumero(detalle.cantidad);
      const tasa = asegurarNumero(tasaCambio);
      
      let precioCordobas = precioUnitario;
      if (detalle.moneda === "$") {
        precioCordobas = precioUnitario * tasa;
      }
      
      return total + (cantidad * precioCordobas);
    }, 0);
    
    return total.toFixed(2);
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

    if (detallesPedido.length === 0) {
      alert("Debe agregar al menos un producto al pedido");
      return;
    }

    handleUpdate({
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
        </div>
        
        {/* Info de tasa de cambio */}
        <div className="tasa-info" style={{
          fontSize: '15px',
          color: '#666',
          marginTop: '5px',
          fontStyle: 'italic'
        }}>
          Tasa de cambio: 1$ = C${tasaCambio.toFixed(2)}
        </div>
      </div>

      {/* Renderizado condicional: formulario nuevo o tabla de pedidos */}
      {showNewForm ? (
        <NewPedidoForm onSave={handleSave} onCancel={handleCancel} tasaCambio={tasaCambio} />
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
                  <th>Creado por</th>
                  <th style={{ width: '120px' }}>Estado</th>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Total C$</th>
                  <th>Total $</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPedidos.map((pedido) => {
                  // Calcular total en dólares (con manejo de errores)
                  const totalPedido = asegurarNumero(pedido.total);
                  const tasa = asegurarNumero(tasaCambio);
                  const totalDolares = tasa > 0 ? (totalPedido / tasa).toFixed(2) : "0.00";
                  
                  return (
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
                      <td>{getUserName(pedido.id_user)}</td>
                      <td>
                        <div className="td-estado">
                          <div 
                            className={`estado-bola estado-con-tooltip ${pedido.estado?.toLowerCase() || 'default'}`}
                            data-tooltip={`Estado: ${pedido.estado}`}
                          >
                            {pedido.estado}
                          </div>
                        </div>
                      </td>
                      <td>{new Date(pedido.fecha_pedido).toLocaleDateString('es-NI')}</td>
                      <td>{getProviderName(pedido.id_proveedor)}</td>
                      <td style={{ fontWeight: 'bold' }}>{formatCurrency(pedido.total, "C$")}</td>
                      <td style={{ color: '#28a745', fontWeight: 'bold' }}>{formatCurrency(totalDolares, "$")}</td>
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
                  );
                })}
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
            
            {/* Info de tasa de cambio en el modal */}
            <div className="tasa-info-modal" style={{
              fontSize: '15px',
              color: '#666',
              marginBottom: '15px',
              fontStyle: 'italic',
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              padding: '5px',
              borderRadius: '4px'
            }}>
              Tasa de cambio actual: 1$ = C${tasaCambio.toFixed(2)}
            </div>

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
                <label>Creado por</label>
                <input
                  type="text"
                  value={getUserName(editingPedido.id_user)}
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

              {/* Estado editable */}
              <div className="form-group">
                <label>Estado del Pedido *</label>
                <div className="estado-radio-group">
                  {['Pendiente', 'Aprobado', 'Anulado'].map((estado) => (
                    <div key={estado} className="estado-radio-option">
                      <input
                        type="radio"
                        id={`estado-${estado}`}
                        name="estado"
                        value={estado}
                        checked={editingPedido.estado === estado}
                        onChange={() =>
                          setEditingPedido(prev => ({ ...prev, estado }))
                        }
                      />
                      <label 
                        htmlFor={`estado-${estado}`} 
                        className={`estado-radio-label estado-${estado.toLowerCase()}`}
                      >
                        {estado}
                      </label>
                    </div>
                  ))}
                </div>
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
                          <th>Moneda</th>
                          <th>Precio C$</th>
                          <th>Subtotal C$</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detallesPedido.map((d, index) => {
                          // Calcular precio en córdobas (con manejo seguro)
                          const precioUnitario = asegurarNumero(d.precio_unitario);
                          const cantidad = asegurarNumero(d.cantidad);
                          const tasa = asegurarNumero(tasaCambio);
                          const moneda = d.moneda || "C$";
                          
                          let precioCordobas = precioUnitario;
                          if (moneda === "$") {
                            precioCordobas = precioUnitario * tasa;
                          }
                          
                          const precioCordobasNum = Number(precioCordobas) || 0;
                          const subtotalCordobas = cantidad * precioCordobasNum;
                          
                          return (
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
                                  value={`${moneda}${precioUnitario.toFixed(2)}`}
                                  readOnly
                                  className="inpute"
                                  style={{ width: '100px' }}
                                />
                              </td>
                              <td>
                                <span style={{
                                  fontWeight: 'bold',
                                  color: moneda === 'C$' ? '#28a745' : '#007bff'
                                }}>
                                  {moneda}
                                </span>
                              </td>
                              <td>
                                <input
                                  type="text"
                                  value={`C$${precioCordobasNum.toFixed(2)}`}
                                  readOnly
                                  className="inpute"
                                  style={{ width: '100px', fontWeight: 'bold' }}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  value={`C$${subtotalCordobas.toFixed(2)}`}
                                  readOnly
                                  className="inpute"
                                  style={{ width: '100px', fontWeight: 'bold', color: '#28a745' }}
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
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                            Total del Pedido (C$):
                          </td>
                          <td colSpan="2" style={{ fontWeight: 'bold', color: '#28a745', fontSize: '1.1em' }}>
                            C${calcularTotal()}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                            Total del Pedido ($):
                          </td>
                          <td colSpan="2" style={{ fontWeight: 'bold', color: '#007bff', fontSize: '1.1em' }}>
                            ${(asegurarNumero(calcularTotal()) / asegurarNumero(tasaCambio)).toFixed(2)}
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
                    <th>Moneda</th>
                    <th>Precio C$</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltradosEdit.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-results">
                        No se encontraron productos
                      </td>
                    </tr>
                  ) : (
                    productosFiltradosEdit.map((producto) => {
                      const precio = asegurarNumero(producto.precio);
                      const moneda = producto.tipo_moneda || "C$";
                      const tasa = asegurarNumero(tasaCambio);
                      
                      let precioCordobas = precio;
                      if (moneda === "$") {
                        precioCordobas = precio * tasa;
                      }
                      
                      return (
                        <tr key={producto.id_producto}>
                          <td>{producto.nombre_producto}</td>
                          <td>{producto.codigo_original || 'N/A'}</td>
                          <td>
                            {moneda}{precio.toFixed(2)}
                          </td>
                          <td>
                            <span style={{
                              fontWeight: 'bold',
                              color: moneda === 'C$' ? '#28a745' : '#007bff'
                            }}>
                              {moneda}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 'bold', color: '#28a745' }}>
                              C${precioCordobas.toFixed(2)}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => selectProduct(producto)}
                              className="btn-edit"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '1.8rem' }}
                            >
                              +
                            </button>
                          </td>
                        </tr>
                      );
                    })
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