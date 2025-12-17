import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  FaHome, 
  FaShoppingCart, 
  FaBox, 
  FaTruck, 
  FaUsers, 
  FaSignOutAlt
} from "react-icons/fa";
import { useAuth } from "../view/authcontext";
import "../style/style.css";

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const cerrarSesion = () => {
    logout();
    navigate("/login");
  };

  // Función para verificar si la ruta está activa
  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <div className="sidebar">
      <ul className="menu">
        <li>
          <Link to="/status" className={`menu-link ${isActive("/status")}`}>
            <FaHome className="menu-icon" />
            <span> Inicio</span>
          </Link>
        </li>
        <li>
          <Link to="/pedidos" className={`menu-link ${isActive("/pedidos")}`}>
            <FaShoppingCart className="menu-icon" />
            <span> Pedidos</span>
          </Link>
        </li>
        <li>
          <Link to="/productos" className={`menu-link ${isActive("/productos")}`}>
            <FaBox className="menu-icon" />
            <span> Productos</span>
          </Link>
        </li>
        <li>
          <Link to="/proveedores" className={`menu-link ${isActive("/proveedores")}`}>
            <FaTruck className="menu-icon" />
            <span>Proveedores</span>
          </Link>
        </li>
        <li>
          <Link to="/usuarios" className={`menu-link ${isActive("/usuarios")}`}>
            <FaUsers className="menu-icon" />
            <span> Usuarios</span>
          </Link>
        </li>
        <li className="logout-item">
          <button className="logout-btn" onClick={cerrarSesion}>
            <FaSignOutAlt className="logout-icon" />
            <span> Cerrar sesión</span>
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;