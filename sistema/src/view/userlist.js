import React, { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../style/style.css";

const UsuariosList = () => {

  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioEditandoId, setUsuarioEditandoId] = useState(null);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    rol: 'admin',
    estado: 'activo',
    contraseña: ''
  });

  // ======================
  // CARGAR USUARIOS
  // ======================
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

  // ======================
  // ABRIR MODALES
  // ======================
  const abrirCrearModal = () => {
    setFormData({
      nombre: '',
      correo: '',
      rol: 'admin',
      estado: 'activo',
      contraseña: ''
    });
    setModoEdicion(false);
    setMostrarPassword(false);
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
    setMostrarPassword(false);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setUsuarioEditandoId(null);
    setMostrarPassword(false);
  };

  // ======================
  // CREAR USUARIO
  // ======================
  const crearUsuario = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Error al crear usuario');
        return;
      }

      alert(data.message || 'Usuario creado correctamente');
      cargarUsuarios();
      cerrarModal();

    } catch (error) {
      console.error(error);
      alert('Error de conexión con el servidor');
    }
  };

  // ======================
  // ACTUALIZAR USUARIO
  // ======================
  const actualizarUsuario = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/usuarios/${usuarioEditandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Error al actualizar usuario');
        return;
      }

      alert(data.message || 'Usuario actualizado correctamente');
      cargarUsuarios();
      cerrarModal();

    } catch (error) {
      console.error(error);
      alert('Error de conexión con el servidor');
    }
  };

  // ======================
  // ELIMINAR USUARIO
  // ======================
  const eliminarUsuario = async id => {
    if (!window.confirm('¿Eliminar usuario?')) return;

    try {
      const res = await fetch(`http://localhost:5001/api/usuarios/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Error al eliminar usuario');
        return;
      }

      alert(data.message || 'Usuario eliminado correctamente');
      cargarUsuarios();

    } catch (error) {
      console.error(error);
      alert('Error de conexión con el servidor');
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

            <input
              name="nombre"
              placeholder="Nombre"
              value={formData.nombre}
              onChange={handleChange}
            />

            <input
              name="correo"
              placeholder="Correo"
              value={formData.correo}
              onChange={handleChange}
            />

            <select name="rol" value={formData.rol} onChange={handleChange}>
              <option value="admin">Admin</option>
              <option value="usuario">Usuario</option>
            </select>

            <select name="estado" value={formData.estado} onChange={handleChange}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>

            {/* PASSWORD CON REACT ICONS */}
            <div className="password-wrapper">
              <input
                type={mostrarPassword ? "text" : "password"}
                name="contraseña"
                placeholder="Contraseña"
                value={formData.contraseña}
                onChange={handleChange}
                className="password-input"
              />

              <span
                className="password-icon"
                onClick={() => setMostrarPassword(!mostrarPassword)}
              >
                {mostrarPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </span>
            </div>


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
