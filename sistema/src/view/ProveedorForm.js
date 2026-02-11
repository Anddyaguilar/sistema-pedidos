import React, { useState, useEffect } from 'react';
import "../style/style.css";

const ProveedorForm = ({ onSave, onCancel, proveedor }) => {
  // Estados del formulario de proveedor
  const [formData, setFormData] = useState({
    nombre_proveedor: '',
    telefono: ''
  });
  
  const [loading, setLoading] = useState(false);

  // FUNCIÓN: Efecto para cargar datos del proveedor si está en modo edición
  useEffect(() => {
    if (proveedor) {
      setFormData({
        nombre_proveedor: proveedor.nombre_proveedor || '',
        telefono: proveedor.telefono || ''
      });
    } else {
      // Reset form for new provider
      setFormData({
        nombre_proveedor: '',
        telefono: ''
      });
    }
  }, [proveedor]);

  // FUNCIÓN: Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // FUNCIÓN: Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar teléfono (opcional)
    if (formData.telefono && !/^[\d\s\-\+\(\)]{6,20}$/.test(formData.telefono)) {
      alert('Por favor ingrese un número de teléfono válido');
      return;
    }
    
    setLoading(true);
    
    // LLAMAR: Función que maneja la creación/actualización del proveedor
    await handleSaveProveedor(formData);
    
    setLoading(false);
  };

  // FUNCIÓN: Guardar proveedor en el servidor
  const handleSaveProveedor = async (proveedorData) => {
    const url = proveedor 
      ? `http://localhost:5001/api/proveedores/${proveedor.id_proveedor}`  // PUT para actualizar
      : 'http://localhost:5001/api/proveedores';  // POST para crear
    
    const method = proveedor ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proveedorData),
      });
      
      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }
      
      const data = await response.json();
      console.log(proveedor ? 'Proveedor actualizado:' : 'Proveedor creado:', data);
      alert(`Proveedor ${proveedor ? 'actualizado' : 'guardado'} correctamente`);
      onSave(data);  // Se llama a la función onSave para manejar el proveedor creado/actualizado
    } catch (error) {
      console.error('Error al guardar el proveedor:', error);
      alert('Hubo un error al guardar el proveedor');
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
          
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Campo: Nombre del proveedor */}
          <div className="form-group">
            <label htmlFor="nombre_proveedor">Nombre Proveedor </label>
            <input
              type="text"
              id="nombre_proveedor"
              name="nombre_proveedor"
              value={formData.nombre_proveedor}
              onChange={handleChange}
              required
              placeholder="Ej: Distribuidora Central"
              maxLength="100"
              className="modal-input"
              disabled={loading}
            />
           
          </div>

          {/* Campo: Teléfono del proveedor */}
          <div className="form-group">
            <label htmlFor="telefono">Teléfono</label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="Ej: 8888-8888 o +505 88888888"
              maxLength="20"
              className="modal-input"
              disabled={loading}
            />
          </div>

          {/* Botones de acción del formulario */}
          <div className="modal-actions">
            <button type="submit" className='btn btn-save' disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  {proveedor ? 'Actualizando...' : 'Guardando...'}
                </>
              ) : (
                proveedor ? 'Actualizar Proveedor' : 'Agregar Proveedor'
              )}
            </button>
            <button 
              type="button" 
              onClick={onCancel} 
              className='btn btn-cancel'
              disabled={loading}
            >
              Cancelar
            </button>
          </div>

         
        </form>
      </div>
    </div>
  );
};

export default ProveedorForm;