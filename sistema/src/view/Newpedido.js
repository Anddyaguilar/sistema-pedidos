import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "../style/style.css";

const NewPedido = ({ onSave, onCancel }) => {
  // Estados del formulario de nuevo pedido
  const { id } = useParams(); // ID del pedido (para edición)
  const [fechaPedido, setFechaPedido] = useState(new Date().toISOString().split("T")[0]); // Fecha actual por defecto
  const [idProveedor, setIdProveedor] = useState(""); // Proveedor seleccionado
  const [detalles, setDetalles] = useState([]); // Detalles del pedido
  const [productos, setProductos] = useState([]); // Lista de productos disponibles
  const [proveedores, setProveedores] = useState([]); // Lista de proveedores
  const [loading, setLoading] = useState(true); // Estado de carga
  const [error, setError] = useState(null); // Estado de error
  const navigate = useNavigate(); // Hook para navegación

  // FUNCIÓN: Cargar datos iniciales (productos y proveedores)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // REALIZAR: Peticiones paralelas para productos y proveedores
        const [productosResponse, proveedoresResponse] = await Promise.all([
          axios.get("http://localhost:5001/api/productos"),
          axios.get("http://localhost:5001/api/proveedores"),
        ]);
        setProductos(productosResponse.data);
        setProveedores(proveedoresResponse.data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // FUNCIÓN: Obtener precio de compra de un producto por ID
  const getPrecioProducto = (idProducto) => {
    const producto = productos.find((p) => p.id_producto === idProducto);
    return producto ? producto.precio_compra : 0;
  };

  // FUNCIÓN: Manejar cambios en los campos de detalle
  const handleDetalleChange = (index, field, value) => {
    const newDetalles = [...detalles];

    if (field === "id_producto") {
      // ACTUALIZAR: Producto y su precio automáticamente
      newDetalles[index].id_producto = value;
      newDetalles[index].precio_unitario = getPrecioProducto(value);
    } else {
      // ACTUALIZAR: Otros campos directamente
      newDetalles[index][field] = value;
    }

    // CALCULAR: Subtotal (cantidad × precio unitario)
    newDetalles[index].subtotal = newDetalles[index].cantidad * newDetalles[index].precio_unitario;
    setDetalles(newDetalles);
  };

  // FUNCIÓN: Agregar nuevo detalle al pedido
  const agregarDetalle = () => {
    setDetalles([...detalles, { id_producto: "", cantidad: 1, precio_unitario: 0, subtotal: 0 }]);
  };

  // FUNCIÓN: Eliminar detalle del pedido
  const eliminarDetalle = (index) => {
    const newDetalles = detalles.filter((_, i) => i !== index);
    setDetalles(newDetalles);
  };

  // FUNCIÓN: Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // VALIDAR: Campos obligatorios
    if (!fechaPedido || !idProveedor || detalles.length === 0) {
      alert("Todos los campos son obligatorios, y el pedido debe tener al menos un detalle.");
      return;
    }

    // PREPARAR: Datos para enviar al servidor
    const pedidoData = { 
      fecha_pedido: fechaPedido, 
      id_proveedor: idProveedor, 
      detalles: detalles.map(d => ({
        id_producto: d.id_producto,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario
      }))
    };

    try {
      // ENVIAR: Crear nuevo pedido en el servidor
      await axios.post("http://localhost:5001/api/pedidos", pedidoData);
      alert("Pedido creado con éxito!");
      
      // EJECUTAR: Callback de guardado y navegar
      onSave && onSave();
      navigate("/pedidos");
    } catch (error) {
      console.error("Error al crear el pedido:", error);
      alert("Error al crear el pedido. Por favor, inténtalo de nuevo.");
    }
  };

  // Estados de carga y error
  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="pedido-form">
      <h2>{id ? "Editar Pedido" : "Crear Nuevo Pedido"}</h2>

      <form onSubmit={handleSubmit}>
        
        {/* Campo: Fecha del pedido */}
        <div className="form-group">
          <label>Fecha del Pedido:</label>
          <input 
            type="date" 
            value={fechaPedido} 
            onChange={(e) => setFechaPedido(e.target.value)} 
            required 
          />
        </div>

        {/* Campo: Selección de proveedor */}
        <div className="form-group">
          <label>Proveedor:</label>
          <select 
            value={idProveedor} 
            onChange={(e) => setIdProveedor(e.target.value)} 
            required
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
        <h3>Detalles del Pedido</h3>
        {detalles.map((detalle, index) => (
          <div key={index} className="detalle-pedido">
            
            {/* Campo: Selección de producto */}
            <select
              value={detalle.id_producto}
              onChange={(e) => handleDetalleChange(index, "id_producto", e.target.value)}
              required
            >
              <option value="">Seleccione un producto</option>
              {productos.map((p) => (
                <option key={p.id_producto} value={p.id_producto}>
                  {p.nombre_producto}
                </option>
              ))}
            </select>

            {/* Campo: Cantidad del producto */}
            <input
              type="number"
              value={detalle.cantidad}
              onChange={(e) => handleDetalleChange(index, "cantidad", parseInt(e.target.value))}
              min="1"
              required
            />

            {/* Campo: Precio unitario (solo lectura) */}
            <input 
              type="number" 
              value={detalle.precio_unitario} 
              readOnly 
            />

            {/* Campo: Subtotal (solo lectura) */}
            <input 
              type="text" 
              value={`$${detalle.subtotal.toFixed(2)}`} 
              readOnly 
            />

            {/* Botón: Eliminar detalle */}
            <button 
              type="button" 
              onClick={() => eliminarDetalle(index)} 
              className="btn btn-delete"
            >
              Eliminar
            </button>
          </div>
        ))}

        {/* Botón: Agregar nuevo detalle */}
        <button 
          type="button" 
          onClick={agregarDetalle} 
          className="btn btn-add"
        >
          Agregar Detalle
        </button>

        {/* Botones de acción del formulario */}
        <button 
          type="submit" 
          className="btn btn-submit"
        >
          {id ? "Actualizar Pedido" : "Crear Pedido"}
        </button>
        <button 
          type="button" 
          onClick={onCancel} 
          className="btn btn-cancel"
        >
          Cancelar
        </button>
      </form>
    </div>
  );
};

export default NewPedido;