import React, { useState, useEffect } from "react";
import "../style/style.css";

const EditPedidoForm = ({ pedidoToEdit, onSave, onCancel, user }) => {
  // Estado principal del pedido
  const [pedido, setPedido] = useState({
    id_pedido: null,
    id_proveedor: "",
    fecha_pedido: "",
    estado: "En proceso", // por defecto al crear
    usuario_creador: "", // nombre del usuario que lo creó
    detalles: [], // array de productos
  });

  // EFECTO: Cargar los datos del pedido al editar
  useEffect(() => {
    if (pedidoToEdit) {
      setPedido({
        id_pedido: pedidoToEdit.id_pedido,
        id_proveedor: pedidoToEdit.id_proveedor,
        fecha_pedido: pedidoToEdit.fecha_pedido?.split("T")[0] || "",
        estado: pedidoToEdit.estado || "En proceso",
        usuario_creador: pedidoToEdit.usuario_creador || "",
        detalles: pedidoToEdit.detalles || [],
      });
    }
  }, [pedidoToEdit]);

  // MANEJAR CAMBIOS EN EL ESTADO
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Solo el administrador puede cambiar el estado a "Aprobado"
    if (name === "estado") {
      if (value === "Aprobado" && user.rol !== "admin") {
        alert("Solo un administrador puede aprobar el pedido");
        return;
      }
    }

    setPedido({ ...pedido, [name]: value });
  };

  // MANEJAR CAMBIOS EN CANTIDAD DE DETALLES
  const handleDetalleChange = (index, field, value) => {
    const nuevosDetalles = [...pedido.detalles];
    nuevosDetalles[index][field] = field === "cantidad" || field === "precio_unitario" 
      ? Number(value) 
      : value;
    setPedido({ ...pedido, detalles: nuevosDetalles });
  };

  // GUARDAR PEDIDO
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No hay token disponible");

      const response = await fetch(
        `http://localhost:5001/api/pedidos/${pedido.id_pedido}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(pedido),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Pedido actualizado correctamente");
        onSave(data); // refrescar lista de pedidos
      } else {
        alert(`Error: ${data.error || "No se pudo actualizar el pedido"}`);
      }
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor");
    }
  };

  return (
    <div className="form-container">
      <h2>Editar Pedido</h2>
      <p>Usuario creador: <strong>{pedido.usuario_creador}</strong></p>

      <form onSubmit={handleSubmit}>
        {/* Fecha del pedido */}
        <label>
          Fecha Pedido:
          <input
            type="date"
            name="fecha_pedido"
            value={pedido.fecha_pedido}
            onChange={handleChange}
            required
          />
        </label>

        {/* Estado del pedido */}
        <label>
          Estado:
          <select name="estado" value={pedido.estado} onChange={handleChange}>
            <option value="Pendiente">Pendiente</option>
            <option value="En proceso">En proceso</option>
            <option value="Aprobado">Aprobado</option>
          </select>
        </label>

        {/* Detalles del pedido */}
        <h3>Detalles del pedido</h3>
        {pedido.detalles.map((d, index) => (
          <div key={index} className="detalle-item">
            <span>{d.nombre_producto}</span>
            <input
              type="number"
              min="1"
              name="cantidad"
              value={d.cantidad}
              onChange={(e) => handleDetalleChange(index, "cantidad", e.target.value)}
            />
            <input
              type="number"
              min="0"
              name="precio_unitario"
              value={d.precio_unitario}
              onChange={(e) => handleDetalleChange(index, "precio_unitario", e.target.value)}
            />
          </div>
        ))}

        <div className="form-buttons">
          <button type="submit" className="btn btn-save">Guardar</button>
          <button type="button" onClick={onCancel} className="btn btn-cancel">Cancelar</button>
        </div>
      </form>
    </div>
  );
};

export default EditPedidoForm;
