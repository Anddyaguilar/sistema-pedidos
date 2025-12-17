import React, { useEffect, useState } from "react";
import axios from "axios";
import "../style/style.css";
import ProveedorForm from "./ProveedorForm";
import EditProveedorForm from "./Editproveedor";

const ProveedoresList = () => {
  // Estados del componente
  const [proveedores, setProveedores] = useState([]); // Lista de proveedores
  const [loading, setLoading] = useState(true); // Estado de carga
  const [error, setError] = useState(null); // Estado de error
  const [showForm, setShowForm] = useState(false); // Controla formulario de nuevo proveedor
  const [currentProveedor, setCurrentProveedor] = useState(null); // Proveedor actual
  const [showEditForm, setShowEditForm] = useState(false); // Controla formulario de edición
  const [proveedorToEdit, setProveedorToEdit] = useState(null); // Proveedor a editar
  const [searchTerm, setSearchTerm] = useState(""); // Término de búsqueda

  // FUNCIÓN: Obtener lista de proveedores al cargar el componente
  useEffect(() => {
    axios
      .get("http://localhost:5001/api/proveedores")
      .then((response) => {
        setProveedores(response.data || []); // Asegurar que es un array
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // FUNCIÓN: Manejar eliminación de proveedor
  const handleDelete = (id) => {
    axios
      .delete(`http://localhost:5001/api/proveedores/${id}`)
      .then(() => {
        // Filtrar y remover el proveedor eliminado de la lista
        setProveedores((prevProveedores) =>
          prevProveedores.filter((proveedor) => proveedor?.id_proveedor !== id)
        );
      })
      .catch((error) => {
        console.error("Error al eliminar proveedor", error);
      });
  };

  // FUNCIÓN: Mostrar formulario para agregar nuevo proveedor
  const handleAdd = () => {
    setShowForm(true);
    setCurrentProveedor(null);
  };

  // FUNCIÓN: Manejar edición de proveedor
  const handleEdit = (proveedor) => {
    setShowForm(false);
    setShowEditForm(true);
    setProveedorToEdit(proveedor);
  };

  // FUNCIÓN: Cancelar operación (agregar o editar)
  const handleCancel = () => {
    setShowForm(false);
    setShowEditForm(false);
    setCurrentProveedor(null);
    setProveedorToEdit(null);
  };

  // FUNCIÓN: Guardar proveedor (tanto nuevo como editado)
  const handleSave = async (updatedProveedor) => {
    if (updatedProveedor.id_proveedor) {
      // Actualizar proveedor existente
      setProveedores((prevProveedores) =>
        prevProveedores.map((proveedor) =>
          proveedor?.id_proveedor === updatedProveedor.id_proveedor ? updatedProveedor : proveedor
        )
      );
    } else {
      // Agregar nuevo proveedor
      setProveedores((prevProveedores) => [...prevProveedores, updatedProveedor]);
    }

    // Cerrar formularios y resetear estados
    setShowEditForm(false);
    setShowForm(false);
    setCurrentProveedor(null);
    setProveedorToEdit(null);
  };

  // FUNCIÓN: Filtrar proveedores según término de búsqueda
  const filteredProveedores = Array.isArray(proveedores)
    ? proveedores.filter((proveedor) => {
      if (!proveedor) return false; // Evita errores si proveedor es undefined
      const searchLower = searchTerm.toLowerCase();
      return (
        proveedor.id_proveedor?.toString().includes(searchLower) ||
        proveedor.nombre_proveedor?.toLowerCase().includes(searchLower)
      );
    })
    : [];

  // Estados de carga y error
  if (loading) return <p>Cargando proveedores...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="order-list">
      {/* Encabezado con título y controles */}
      <div className='container-t1'>
        <h2>Lista de Productos</h2>

        {/* Barra de búsqueda y botón de nuevo proveedor */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por ID, nombre o "
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button onClick={handleAdd} className="btn btn-add">
            Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Renderizado condicional: formularios o tabla de proveedores */}
      {showForm ? (
        // Formulario para nuevo proveedor
        <ProveedorForm onSave={handleSave} onCancel={handleCancel} />
      ) : showEditForm ? (
        // Formulario para editar proveedor existente
        <EditProveedorForm
          proveedorToEdit={proveedorToEdit}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        // Tabla de proveedores
        <>
          <table>
            <thead>
              <tr>
                <th>N° Proveedor</th>
                <th>Nombre Proveedor</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProveedores.length > 0 ? (
                // Lista de proveedores filtrados
                filteredProveedores.map((proveedor) => (
                  <tr key={proveedor?.id_proveedor}>
                    <td>{proveedor?.id_proveedor}</td>
                    <td>{proveedor?.nombre_proveedor}</td>
                    <td>
                      {/* Botón: Editar proveedor */}
                      <button
                        onClick={() => handleEdit(proveedor)}
                        className="btn btn-edit"
                      >
                         ✏️ 
                      </button>
                      {/* Botón: Eliminar proveedor */}
                      <button
                        onClick={() => handleDelete(proveedor?.id_proveedor)}
                        className="btn btn-delete"
                      >
                        🗑️ 
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                // Mensaje cuando no hay proveedores
                <tr>
                  <td colSpan="4">No hay proveedores disponibles</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default ProveedoresList;