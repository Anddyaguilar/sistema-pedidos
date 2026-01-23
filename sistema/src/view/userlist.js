import React, { useEffect, useState } from 'react';
import "../style/style.css";

const UsuariosList = () => {

  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioEditandoId, setUsuarioEditandoId] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    rol: 'admin',
    estado: 'activo',
    contraseña: ''
  });

  const cargarUsuarios = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/usuarios');
      const data = await res.json();
      setUsuarios(data);
    } catch (err) {
      setError('Error al cargar usuarios');
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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

  const abrirEditarModal = usuario => {
    setFormData({
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      estado: usuario.estado,
      contraseña: ''
    });

    setUsuarioEditandoId(usuario.id);
    setModoEdicion(true);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setUsuarioEditandoId(null);
  };

  const crearUsuario = async () => {
    try {
      await fetch('http://localhost:5001/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      cargarUsuarios();
      cerrarModal();
    } catch {
      setError('Error al crear usuario');
    }
  };

  const actualizarUsuario = async () => {
    try {
      await fetch(`http://localhost:5001/api/usuarios/${usuarioEditandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      cargarUsuarios();
      cerrarModal();
    } catch {
      setError('Error al actualizar usuario');
    }
  };

  const eliminarUsuario = async id => {
    if (!window.confirm('¿Eliminar usuario?')) return;

    try {
      await fetch(`http://localhost:5001/api/usuarios/${id}`, {
        method: 'DELETE'
      });

      cargarUsuarios();
    } catch {
      setError('Error al eliminar usuario');
    }
  };

  return (
    <div className="order-list">

      <h2>Gestión de Usuarios</h2>

      <button className="btn btn-add" onClick={abrirCrearModal}>
        Crear Usuario
      </button>

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
          {usuarios.map(usuario => (
            <tr key={usuario.id}>
              <td>{usuario.id}</td>
              <td>{usuario.nombre}</td>
              <td>{usuario.correo}</td>
              <td>{usuario.rol}</td>
              <td>{usuario.estado}</td>
              <td>
                <button className="btn-action btn-edit"
                        onClick={() => abrirEditarModal(usuario)}>
                   ✏️
                </button>

                <button className="btn-action btn-delete"
                        onClick={() => eliminarUsuario(usuario.id)}>
                    🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalOpen && (
        <div className="modal">
          <div className="modal-content">

            <h3>{modoEdicion ? 'Editar Usuario' : 'Crear Usuario'}</h3>

            <input name="nombre" placeholder="Nombre"
                   value={formData.nombre} onChange={handleChange} />

            <input name="correo" placeholder="Correo"
                   value={formData.correo} onChange={handleChange} />

            <select name="rol" value={formData.rol} onChange={handleChange}>
              <option value="admin">Admin</option>
              <option value="usuario">Usuario</option>
            </select>

            <select name="estado" value={formData.estado} onChange={handleChange}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>

            <input type="password" name="contraseña" placeholder="Contraseña"
                   value={formData.contraseña} onChange={handleChange} />

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
