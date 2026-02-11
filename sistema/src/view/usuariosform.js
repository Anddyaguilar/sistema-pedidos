import React, { useState, useEffect } from 'react';

export default function UsuarioForm({ 
  formData, 
  onChange, 
  onSubmit, 
  onCancel, 
  modoEdicion = false 
}) {

  const [internalForm, setInternalForm] = useState(formData || { 
    nombre: '',
    correo: '',
    contraseña: '',
    rol: 'user',
    estado: 'activo'
  });

  const [mostrarPassword, setMostrarPassword] = useState(false);

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
    
    if (onChange) {
      onChange(e);
    } else {
      setInternalForm(newForm);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    if (onSubmit) {
      onSubmit();
    } else {
      try {
        const res = await fetch('http://localhost:5001/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(internalForm)
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.error || 'Error al crear usuario');
          return;
        }

        alert(data.message || 'Usuario creado correctamente');

        setInternalForm({
          nombre: '',
          correo: '',
          contraseña: '',
          rol: 'user',
          estado: 'activo'
        });

      } catch (error) {
        alert('Error de conexión con el servidor');
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
        
        {/* PASSWORD CON OJO */}
        <div style={{ position: 'relative' }}>
          <input 
            name="contraseña" 
            placeholder="Contraseña" 
            type={mostrarPassword ? "text" : "password"}
            value={internalForm.contraseña || ''}
            onChange={handleChange} 
            required={!modoEdicion}
            style={{ paddingRight: '40px' }}
          />

          <span
            onClick={() => setMostrarPassword(!mostrarPassword)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            {mostrarPassword ? '🙈' : '👁️'}
          </span>
        </div>
        
        <select name="rol" value={internalForm.rol || 'user'} onChange={handleChange}>
          <option value="user">Usuario</option>
          <option value="admin">Administrador</option>
        </select>

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
