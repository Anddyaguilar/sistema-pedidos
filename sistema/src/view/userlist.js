import React, { useEffect, useState } from 'react';
import "../style/style.css";

const UsuariosList = () => {
  // Estados del componente de gestión de usuarios
  const [usuarios, setUsuarios] = useState([]); // Lista de usuarios
  const [error, setError] = useState(null); // Estado de errores
  const [modalOpen, setModalOpen] = useState(false); // Controla visibilidad del modal
  const [modoEdicion, setModoEdicion] = useState(false); // Define si está en modo edición o creación
  const [formData, setFormData] = useState({
    nombre: '', // Nombre del usuario
    correo: '', // Correo electrónico
    rol: 'admin', // Rol (admin/usuario)
    estado: 'activo', // Estado (activo/inactivo)
    contraseña: '' // Contraseña (solo para creación)
  });
  const [usuarioEditandoId, setUsuarioEditandoId] = useState(null); // ID del usuario en edición

  // FUNCIÓN: Cargar lista de usuarios desde la API
  const cargarUsuarios = () => {
    fetch('http://localhost:5001/api/usuarios/')
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar los usuarios');
        return res.json();
      })
      .then(data => setUsuarios(data))
      .catch(err => {
        console.error(err);
        setError(err.message);
      });
  };

  // EFECTO: Cargar usuarios al montar el componente
  useEffect(() => {
    cargarUsuarios();
  }, []);

  // FUNCIÓN: Manejar cambios en los campos del formulario
  const handleChange = e => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // FUNCIÓN: Abrir modal para crear nuevo usuario
  const abrirCrearModal = () => {
    setFormData({
      nombre: '',
      correo: '',
      rol: 'admin',
      estado: 'activo',
      contraseña: ''
    });
    setModoEdicion(false);
    setModalOpen(true);
  };

  // FUNCIÓN: Abrir modal para editar usuario existente
  const abrirEditarModal = (usuario) => {
    setFormData({
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      estado: usuario.estado,
      contraseña: '' // Contraseña vacía por seguridad en edición
    });
    setModoEdicion(true);
    setUsuarioEditandoId(usuario.id);
    setModalOpen(true);
  };

  // FUNCIÓN: Cerrar modal y limpiar datos del formulario
  const cerrarModal = () => {
    setModalOpen(false);
    setFormData({});
  };

  // FUNCIÓN: Crear nuevo usuario
  const crearUsuario = () => {
    fetch('http://localhost:5001/api/usuarios/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al crear usuario');
        return res.text();
      })
      .then(() => {
        cargarUsuarios(); // Recargar lista
        cerrarModal(); // Cerrar modal
      })
      .catch(err => setError(err.message));
  };

  // FUNCIÓN: Actualizar usuario existente
  const actualizarUsuario = () => {
    fetch(`http://localhost:5001/api/usuarios/${usuarioEditandoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al actualizar usuario');
        return res.text();
      })
      .then(() => {
        cargarUsuarios(); // Recargar lista
        cerrarModal(); // Cerrar modal
      })
      .catch(err => setError(err.message));
  };

  // FUNCIÓN: Eliminar usuario con confirmación
  const eliminarUsuario = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      fetch(`http://localhost:5001/api/usuarios/${id}`, {
        method: 'DELETE'
      })
        .then(res => {
          if (!res.ok) throw new Error('Error al eliminar usuario');
          return res.text();
        })
        .then(() => cargarUsuarios()) // Recargar lista después de eliminar
        .catch(err => setError(err.message));
    }
  };

  return (
    <div className="order-list">
      {/* Encabezado y controles */}
      <h2>Lista de Usuarios</h2>
      {error && <p className="error">{error}</p>}
      
      {/* Botón para crear nuevo usuario */}
      <button className="btn btn-add" onClick={abrirCrearModal}>
        Crear Usuario
      </button>

      {/* Tabla de usuarios */}
      <table className="usuarios-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id}>
              <td>{usuario.id}</td>
              <td>{usuario.nombre}</td>
              <td>{usuario.correo}</td>
              <td>{usuario.rol}</td>
              <td>{usuario.estado}</td>
              <td className="actions-cell">
                {/* Botón para editar usuario */}
                <button 
                  className="btn-action btn-edit" 
                  onClick={() => abrirEditarModal(usuario)}
                >
                  Editar
                </button>
                
                {/* Botón para eliminar usuario */}
                <button 
                  className="btn-action btn-delete" 
                  onClick={() => eliminarUsuario(usuario.id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal para crear/editar usuarios */}
      {modalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>{modoEdicion ? 'Editar Usuario' : 'Crear Usuario'}</h3>
            
            {/* Campo: Nombre */}
            <label>Nombre</label>
            <input 
              type="text" 
              name="nombre" 
              value={formData.nombre} 
              onChange={handleChange} 
            />
            
            {/* Campo: Correo */}
            <label>Correo</label>
            <input 
              type="email" 
              name="correo" 
              value={formData.correo} 
              onChange={handleChange} 
            />
            
            {/* Campo: Rol */}
            <label>Rol</label>
            <select name="rol" value={formData.rol} onChange={handleChange}>
              <option value="admin">Admin</option>
              <option value="usuario">Usuario</option>
            </select>
            
            {/* Campo: Estado */}
            <label>Estado</label>
            <select name="estado" value={formData.estado} onChange={handleChange}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
            
            {/* Campo: Contraseña */}
            <label>Contraseña</label>
            <input 
              type="password" 
              name="contraseña" 
              value={formData.contraseña} 
              onChange={handleChange} 
            />

            {/* Botones de acción del modal */}
            <div className="modal-actions">
              <button onClick={modoEdicion ? actualizarUsuario : crearUsuario}>
                {modoEdicion ? 'Actualizar' : 'Crear'}
              </button>
              <button onClick={cerrarModal}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosList;