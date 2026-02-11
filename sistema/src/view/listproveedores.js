import React, { useEffect, useState } from "react";
import axios from "axios";
import "../style/style.css";
import ProveedorForm from "./ProveedorForm";
// ELIMINA esta línea: import EditProveedorForm from "./Editproveedor";

const ProveedoresList = () => {
  // Estados del componente
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentProveedor, setCurrentProveedor] = useState(null); // Proveedor a editar
  const [searchTerm, setSearchTerm] = useState("");

  // FUNCIÓN: Obtener lista de proveedores al cargar el componente
  useEffect(() => {
    axios
      .get("http://localhost:5001/api/proveedores")
      .then((response) => {
        setProveedores(response.data || []);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // FUNCIÓN: Manejar eliminación de proveedor
  const handleDelete = (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este proveedor?")) {
      return;
    }

    axios
      .delete(`http://localhost:5001/api/proveedores/${id}`)
      .then(() => {
        setProveedores((prevProveedores) =>
          prevProveedores.filter((proveedor) => proveedor?.id_proveedor !== id)
        );
        alert("Proveedor eliminado correctamente");
      })
      .catch((error) => {
        console.error("Error al eliminar proveedor", error);
        alert("Error al eliminar proveedor");
      });
  };

  // FUNCIÓN: Mostrar formulario para agregar nuevo proveedor
  const handleAdd = () => {
    setCurrentProveedor(null); // Sin proveedor = modo creación
    setShowForm(true);
  };

  // FUNCIÓN: Manejar edición de proveedor
  const handleEdit = (proveedor) => {
    setCurrentProveedor(proveedor); // Con proveedor = modo edición
    setShowForm(true);
  };

  // FUNCIÓN: Cancelar operación
  const handleCancel = () => {
    setShowForm(false);
    setCurrentProveedor(null);
  };

  // FUNCIÓN: Guardar proveedor
  const handleSave = async (savedProveedor) => {
    try {
      if (savedProveedor.id_proveedor) {
        // Actualizar en la lista local
        setProveedores((prevProveedores) =>
          prevProveedores.map((proveedor) =>
            proveedor?.id_proveedor === savedProveedor.id_proveedor
              ? savedProveedor
              : proveedor
          )
        );
      } else {
        // Agregar nuevo (el servidor debe asignar el id)
        setProveedores((prevProveedores) => [...prevProveedores, savedProveedor]);
      }

      // Cerrar formulario
      setShowForm(false);
      setCurrentProveedor(null);

      // Opcional: Recargar datos del servidor para asegurar consistencia
      const response = await axios.get("http://localhost:5001/api/proveedores");
      setProveedores(response.data || []);

    } catch (error) {
      console.error("Error al guardar proveedor:", error);
    }
  };

  // FUNCIÓN: Filtrar proveedores según término de búsqueda
  const filteredProveedores = Array.isArray(proveedores)
    ? proveedores.filter((proveedor) => {
      if (!proveedor) return false;
      const searchLower = searchTerm.toLowerCase();
      return (
        proveedor.id_proveedor?.toString().includes(searchLower) ||
        proveedor.nombre_proveedor?.toLowerCase().includes(searchLower) ||
        proveedor.telefono?.toString().includes(searchLower)
      );
    })
    : [];

  // Estados de carga y error
  if (loading) return <p>Cargando proveedores...</p>;
  if (error) return <p>Error: {error}</p>;
  const rolUsuario = localStorage.getItem("rol"); // "admin" o "user"

  return (
    <div className="order-list">
      {/* Encabezado con título y controles */}
      <div className='container-t1'>
        <h2>Lista de Proveedores</h2> {/* Cambiado de "Productos" a "Proveedores" */}

        {/* Barra de búsqueda y botón de nuevo proveedor */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por ID, nombre o teléfono"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button onClick={handleAdd} className="btn btn-add">
            Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Renderizado condicional: formulario o tabla de proveedores */}
      {showForm ? (
        // Usa ProveedorForm para ambos (crear y editar)
        <ProveedorForm
          onSave={handleSave}
          onCancel={handleCancel}
          proveedor={currentProveedor} // Pasa el proveedor si está en modo edición
        />
      ) : (
        // Tabla de proveedores
        <table>
          <thead>
            <tr>
              <th>N° Proveedor</th>
              <th>Nombre Proveedor</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProveedores.length > 0 ? (
              filteredProveedores.map((proveedor) => (
                <tr key={proveedor?.id_proveedor}>
                  <td>{proveedor?.id_proveedor}</td>
                  <td>{proveedor?.nombre_proveedor}</td>
                  <td>{proveedor?.telefono || 'N/A'}</td>
                  <td>

                    <button
                      onClick={() => handleEdit(proveedor)}
                      className="btn btn-edit"
                    >
                      ✏️
                    </button>
                    {rolUsuario === "admin" && (
                      <button
                        onClick={() => handleDelete(proveedor?.id_proveedor)}
                        className="btn btn-delete"
                      >
                        🗑️
                      </button>
                    )}

                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">
                  {searchTerm ?
                    "No se encontraron proveedores con ese criterio" :
                    "No hay proveedores disponibles"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProveedoresList;