// src/components/Header.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaShoppingCart,
  FaBox,
  FaTruck,
  FaUsers,
  FaSignOutAlt,
  FaChartPie,
  FaCog,
  FaBell
} from "react-icons/fa";
import { useAuth } from "../view/authcontext";
import "../style/style.css";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isScrolled, setIsScrolled] = useState(false);

  // Configuración del sistema
  const [config, setConfig] = useState({});

  useEffect(() => {
    // Reloj
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Scroll
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);

    // Carga config
    const loadConfig = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/config");
        const data = await res.json();
        setConfig(data.config || {});
      } catch (err) {
        console.error("Error cargando configuración:", err);
      }
    };
    loadConfig();

    return () => {
      clearInterval(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const formatTime = (date) =>
    date.toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" });

  const formatDate = (date) =>
    date.toLocaleDateString("es-NI", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
    navigate("/login");
  };

  const getInitials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase() : "U";

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: "/status", icon: FaHome, label: "Dashboard", badge: null },
    { path: "/pedidos", icon: FaShoppingCart, label: "Pedidos", badge: 3 },
    { path: "/productos", icon: FaBox, label: "Productos", badge: null },
    { path: "/proveedores", icon: FaTruck, label: "Proveedores", badge: null },
    { path: "/usuarios", icon: FaUsers, label: "Usuarios", badge: null },
  ];

  return (
    <>
      <header className={`header-professional ${isScrolled ? "scrolled" : ""}`}>
        <div className="header-container">
          {/* Brand */}
          <div className="brand-section">
            <button
              className="mobile-menu-trigger"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <div className={`hamburger ${isMobileMenuOpen ? "active" : ""}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>

            <div className="brand-logo">
              <div className="logo-icon">
                <FaChartPie />
              </div>
              <div className="logo-text">
                <h1 className="brand-name">
                  Sistema Pedidos {config.company_name || "Holfer"}
                </h1>
                <span className="brand-subtitle">Enterprise Dashboard</span>
                
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="navigation-center">
            <div className="nav-items">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive(item.path) ? "active" : ""}`}
                >
                  <item.icon className="nav-icon" />
                  <span>{item.label}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </Link>
              ))}
            </div>
          </nav>

          {/* User Section */}
          <div className="user-section">
            {/* System Status */}
            <div className="system-status">
              <div className="status-indicator online">
                <i className="fas fa-circle"></i>
                <span>Sistema Online</span>
              </div>
            </div>

            {/* Time */}
            <div className="time-display">
              <div className="time-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="time-info">
                <div className="current-time">{formatTime(currentTime)}</div>
                <div className="current-date">{formatDate(currentTime)}</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <button className="action-btn notification-btn">
                <FaBell />
                <span className="notification-badge">2</span>
              </button>
              <Link
                to="/configuracion"
                className="action-btn settings-btn"
                title="Configuración del Sistema"
              >
                <FaCog />
              </Link>
            </div>

            {/* User Profile */}
            <div
              className="user-profile"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="avatar-container">
                <div className="user-avatar">
                  {user?.nombre ? getInitials(user.nombre) : "U"}
                </div>
                <div className="status-dot"></div>
              </div>
              <div className="user-info">
                <div className="user-name">{user?.nombre || "Usuario"}</div>
                <div className="user-role">{user?.rol || "Administrador"}</div>
              </div>
              <div className="dropdown-chevron">
                <i className={`fas fa-chevron-${isMenuOpen ? "up" : "down"}`}></i>
              </div>
            </div>
          </div>
        </div>

        {/* User Menu Dropdown */}
        {isMenuOpen && (
          <div className="user-menu-dropdown">
            <div className="menu-header">
              <div className="menu-avatar">
                {user?.nombre ? getInitials(user.nombre) : "U"}
              </div>
              <div className="menu-user-info">
                <div className="menu-user-name">{user?.nombre || "Usuario"}</div>
                <div className="menu-user-email">
                  {user?.email || "usuario@holfer.com"}
                </div>
                <div className="menu-user-role">{user?.rol || "Administrador"}</div>
              </div>
            </div>

            <div className="menu-divider"></div>

            <div className="menu-sections">
              <div className="menu-section">
                <h4>Navegación Principal</h4>
                <div className="menu-items">
                  {menuItems.slice(0, 3).map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="menu-item"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                      {item.badge && <span className="menu-badge">{item.badge}</span>}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="menu-section">
                <h4>Administración</h4>
                <div className="menu-items">
                  {menuItems.slice(3).map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="menu-item"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="menu-section">
                <h4>Configuración</h4>
                <div className="menu-items">
                  <Link
                    to="/configuracion"
                    className="menu-item"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaCog />
                    <span>Mi Perfil</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="menu-footer">
              <button className="logout-btn" onClick={handleLogout}>
                <FaSignOutAlt />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Sidebar */}
      <div className={`mobile-sidebar ${isMobileMenuOpen ? "open" : ""}`}>
        <div className="mobile-sidebar-header">
          <div className="mobile-brand">
            <div className="logo-icon">
              <FaChartPie />
            </div>
            <span className="brand-text">{config.company_name || "Holfer System"}</span>
          </div>
          <button
            className="close-mobile-menu"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <nav className="mobile-nav">
          <div className="mobile-nav-items">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-item ${isActive(item.path) ? "active" : ""}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="nav-icon" />
                <span>{item.label}</span>
                {item.badge && <span className="mobile-nav-badge">{item.badge}</span>}
              </Link>
            ))}
          </div>
        </nav>

        <div className="mobile-sidebar-footer">
          <div className="mobile-user-info">
            <div className="mobile-user-avatar">
              {user?.nombre ? getInitials(user.nombre) : "U"}
            </div>
            <div className="mobile-user-details">
              <div className="mobile-user-name">{user?.nombre || "Usuario"}</div>
              <div className="mobile-user-role">{user?.rol || "Administrador"}</div>
            </div>
          </div>
          <button className="mobile-logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Overlay */}
      {(isMenuOpen || isMobileMenuOpen) && (
        <div
          className="menu-overlay"
          onClick={() => {
            setIsMenuOpen(false);
            setIsMobileMenuOpen(false);
          }}
        ></div>
      )}
    </>
  );
};

export default Header;
