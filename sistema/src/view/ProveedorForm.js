import React, { useState, useEffect } from 'react';
import "../style/style.css";

const ProveedorForm = ({ onSave, onCancel, proveedor }) => {
  // Estados del formulario de proveedor
  const [nombreProveedor, setNombreProveedor] = useState(''); // Nombre del proveedor
  // NOTA: Se eliminó un estado duplicado que no tenía nombre ni función

  // FUNCIÓN: Efecto para cargar datos del proveedor si está en modo edición
  useEffect(() => {
    if (proveedor) {
      setNombreProveedor(proveedor.nombre_proveedor);
    }
  }, [proveedor]);

  // FUNCIÓN: Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // PREPARAR: Datos del proveedor para enviar
    const newProveedor = { 
      nombre_proveedor: nombreProveedor  
    };
    
    // LLAMAR: Función que maneja la creación/actualización del proveedor
    handleSaveProveedor(newProveedor);
  };

  // FUNCIÓN: Guardar proveedor en el servidor
  const handleSaveProveedor = (proveedor) => {
    // REALIZAR: Petición POST para crear nuevo proveedor
    fetch('http://localhost:5001/api/proveedores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(proveedor), // Enviar los datos del proveedor
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Proveedor creado:', data); // Log para ver si el proveedor fue creado correctamente
        alert('Proveedor guardado correctamente');  // Alerta de éxito
        onSave(data);  // Se llama a la función onSave para manejar el proveedor creado
      })
      .catch((error) => {
        console.error('Error al crear el proveedor:', error);
        alert('Hubo un error al guardar el proveedor');  // Alerta de error
      });
  };

  return (
    <div className='form-container'>
      {/* Formulario de proveedor */}
      <form onSubmit={handleSubmit}>
        
        {/* Título condicional según modo (editar/crear) */}
        <h3>{proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>

        {/* Campo: Nombre del proveedor */}
        <div>
          <label>Nombre Proveedor</label>
          <input
            type="text"
            value={nombreProveedor}
            onChange={(e) => setNombreProveedor(e.target.value)}
            required
          />
        </div>

        {/* Botones de acción del formulario */}
        <button type="submit" className='btn btn-save'>
          {proveedor ? 'Actualizar' : 'Agregar'}
        </button>
        <button type="button" onClick={onCancel} className='btn btn-cancel'>
          Cancelar
        </button>
      </form>
    </div>
  );
};

export default ProveedorForm;
