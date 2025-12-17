import React, { useState, useEffect } from 'react';

export default function UsuarioForm({ 
  formData, 
  onChange, 
  onSubmit, 
  onCancel, 
  modoEdicion = false 
}) {
  
  // Si no se pasan props, usar estado interno (para uso independiente)
  const [internalForm, setInternalForm] = useState(formData || { 
    nombre: '',
    correo: '',
    contraseña: '',
    rol: 'user',
    estado: 'activo'
  });

  // Actualizar el estado interno cuando cambien las props
  useEffect(() => {
    if (formData) {
      setInternalForm(formData);
    }
  }, [formData]);

  const handleChange = e => {
    const newForm = {
      ...internalForm,
      [e.target.name]: e.target.value
    };
    
    // Si se pasa la función onChange desde el padre, usarla
    if (onChange) {
      onChange(e); // Para compatibilidad con UsuariosList
    } else {
      setInternalForm(newForm);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    if (onSubmit) {
      // Si se pasa onSubmit desde el padre, usarlo
      onSubmit();
    } else {
      // Comportamiento original para uso independiente
      const res = await fetch('http://localhost:5001/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(internalForm)
      });
      
      if (res.ok) {
        alert('Usuario creado');
        setInternalForm({
          nombre: '',
          correo: '',
          contraseña: '',
          rol: 'user',
          estado: 'activo'
        });
      } else {
        alert('Error al crear usuario');
      }
    }
  };

  return (
    <div className="container">
      <h2>{modoEdicion ? "Editar Usuario" : "Crear Usuario"}</h2>
      
      <form onSubmit={handleSubmit}>
        <input 
          name="nombre" 
          placeholder="Nombre" 
          value={internalForm.nombre || ''}
          onChange={handleChange} 
          required
        />
        
        <input 
          name="correo" 
          placeholder="Correo" 
          type="email" 
          value={internalForm.correo || ''}
          onChange={handleChange} 
          required
        />
        
        <input 
          name="contraseña" 
          placeholder="Contraseña" 
          type="password" 
          value={internalForm.contraseña || ''}
          onChange={handleChange} 
          required={!modoEdicion} // Solo requerido al crear
        />
        
        <select name="rol" value={internalForm.rol || 'user'} onChange={handleChange}>
          <option value="user">Usuario</option>
          <option value="admin">Administrador</option>
        </select>

        {/* Campo estado solo para edición */}
        {modoEdicion && (
          <>
            <label>Estado</label>
            <select name="estado" value={internalForm.estado || 'activo'} onChange={handleChange}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </>
        )}
        
        <div className="form-actions">
          <button type="submit">
            {modoEdicion ? "Actualizar" : "Crear"}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}