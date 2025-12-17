import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './view/authcontext';

import Productos from './view/listproductos';
import Status from './components/status';
import Proveedor from './view/listproveedores';
import Pedidos from './view/Pedidos';
import Login from './view/login';
import Usuarios from './view/userlist';
import ConfigView from './components/conf';  // <-- Nueva vista
import LoadingPage from './components/loading'; 
import Header from './components/header';
import Footer from './components/footer';

import './style/productos.css';
import './style/header.css';
import './style/dashboard.css';
import './style/login.css';
import './style/pedidos.css';
import './style/proveedor.css';
import './style/loading.css';
import './style/editpedido.css';
import './style/foter.css';
import './style/usuario.css';
import './style/conf.css';

const App = () => {
  const { user, loading } = useAuth();
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setAppLoading(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (appLoading) return <LoadingPage />;
  if (loading) return <div>Verificando autenticación...</div>;

  // Componente wrapper para layout del dashboard
  const DashboardLayout = ({ children }) => (
    <div className="dashboard">
      <div className="main-content">
        <Header />
        <div className="content-container">{children}</div>
        <Footer company="Mi Sistema" version="1.0.0" />
      </div>
    </div>
  );

  return (
    <Router>
      <Routes>
        {/* LOGIN */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/configuracion" />} />

        {/* RUTAS DASHBOARD */}
        <Route path="/" element={user ? <Navigate to="/configuracion" /> : <Navigate to="/login" />} />

        <Route path="/configuracion" element={user ? <DashboardLayout><ConfigView /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/productos" element={user ? <DashboardLayout><Productos /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/status" element={user ? <DashboardLayout><Status /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/pedidos" element={user ? <DashboardLayout><Pedidos /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/usuarios" element={user ? <DashboardLayout><Usuarios /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/proveedores" element={user ? <DashboardLayout><Proveedor /></DashboardLayout> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
