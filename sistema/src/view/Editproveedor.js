import React, { useState, useEffect } from "react";
import  "../style/style.css";

const EditProveedorForm = ({ proveedorToEdit, onSave, onCancel }) => {
  // Estado para manejar los datos del proveedor en edición
  const [proveedor, setProveedor] = useState({
    nombre_proveedor: "" // Nombre del proveedor
  });

  // FUNCIÓN: Efecto para cargar datos del proveedor a editar
  useEffect(() => {
    if (proveedorToEdit) {
      setProveedor({
        nombre_proveedor: proveedorToEdit.nombre_proveedor,
      });
    }
  }, [proveedorToEdit]);

  // FUNCIÓN: Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    setProveedor({ ...proveedor, [e.target.name]: e.target.value });
  };

  // FUNCIÓN: Manejar envío del formulario de edición
  const handleSubmit = async (e) => {
    e.preventDefault();

    // VALIDACIÓN: Verificar que el campo no esté vacío
    if (!proveedor.nombre_proveedor || !proveedor) {
      alert("Ambos campos son obligatorios");
      return; // No enviamos el formulario si los campos están vacíos
    }

    try {
      // REALIZAR: Petición PUT para actualizar el proveedor
      const response = await fetch(
        `http://localhost:5001/api/proveedores/${proveedorToEdit.id_proveedor}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(proveedor),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // ÉXITO: Mostrar alerta y guardar cambios
        alert("Proveedor actualizado correctamente");
        onSave(data); // Llama a onSave para actualizar la lista
      } else {
        // ERROR: Mostrar mensaje de error del servidor
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      // ERROR DE CONEXIÓN: Mostrar alerta genérica
      alert("Error al conectar con el servidor");
    }
  };

  return (
    <div className="form-container">
      <h2>Editar Proveedor</h2>
      
      {/* Formulario de edición de proveedor */}
      <form onSubmit={handleSubmit}>
        
        {/* Campo: Nombre del proveedor */}
        <label>
          Nombre Proveedor:
          <input
            type="text"
            name="nombre_proveedor"
            value={proveedor.nombre_proveedor}
            onChange={handleChange}
            required
          />
        </label>

        {/* Botones de acción del formulario */}
        <div className="form-buttons">
          
          {/* Botón: Guardar cambios */}
          <button type="submit" className="btn btn-save">
            Guardar
          </button>
          
          {/* Botón: Cancelar edición */}
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-cancel"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProveedorForm;
