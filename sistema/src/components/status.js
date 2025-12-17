// src/components/Stats.js
import React, { useState, useEffect } from "react";
import "../style/style.css";
import Logo from "../images/logo.png";
import { format, isToday, subDays } from "date-fns";
import es from "date-fns/locale/es";
import axios from "axios";

const Stats = () => {
  const [stats, setStats] = useState({
    pedidosHoy: 0,
    ingresosHoy: 0,
    pedidosPendientes: 0,
    tendenciaPedidos: 0,
    tendenciaIngresos: 0,
    ultimaActualizacion: new Date(),
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/pedidos');
        const pedidos = response.data;
        
        const hoy = new Date();
        const fechaHoy = hoy.toISOString().split('T')[0];
        const fechaAyer = subDays(hoy, 1).toISOString().split('T')[0];
        
        // Pedidos de hoy
        const pedidosHoy = pedidos.filter(p => 
          new Date(p.fecha_pedido).toISOString().split('T')[0] === fechaHoy && 
          p.estado === 'completado'
        );
        
        // Pedidos de ayer
        const pedidosAyer = pedidos.filter(p => 
          new Date(p.fecha_pedido).toISOString().split('T')[0] === fechaAyer && 
          p.estado === 'completado'
        );
        
        // Cálculo de tendencias
        const tendenciaPedidos = pedidosAyer.length > 0 
          ? ((pedidosHoy.length - pedidosAyer.length) / pedidosAyer.length * 100).toFixed(1)
          : 0;
          
        const ingresosAyer = pedidosAyer.reduce((sum, p) => sum + (p.total || 0), 0);
        const ingresosHoy = pedidosHoy.reduce((sum, p) => sum + (p.total || 0), 0);
        
        const tendenciaIngresos = ingresosAyer > 0 
          ? ((ingresosHoy - ingresosAyer) / ingresosAyer * 100).toFixed(1)
          : 0;

        setStats({
          pedidosHoy: pedidosHoy.length,
          ingresosHoy: ingresosHoy,
          pedidosPendientes: pedidos.filter(p => p.estado === 'pendiente').length,
          tendenciaPedidos: parseFloat(tendenciaPedidos),
          tendenciaIngresos: parseFloat(tendenciaIngresos),
          ultimaActualizacion: hoy,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error al obtener pedidos:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Error al cargar estadísticas. Verifica la conexión con el servidor.'
        }));
      }
    };

    fetchStats();
    
    const interval = setInterval(fetchStats, 300000);
    return () => clearInterval(interval);
  }, []);

  const formatoFecha = (fecha) => {
    return format(fecha, "PPpp", { locale: es });
  };

  const TrendIndicator = ({ value }) => {
    if (value > 0) {
      return <span className="trend positive">↗ +{value}%</span>;
    } else if (value < 0) {
      return <span className="trend negative">↘ {value}%</span>;
    }
    return <span className="trend neutral">→ {value}%</span>;
  };

  if (stats.loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Panel de Control</h1>
            <p>Resumen de métricas del negocio</p>
          </div>
            </div>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Panel de Control</h1>
            <p>Resumen de métricas del negocio</p>
          </div>
          
        </div>
        <div className="error-container">
          <div className="error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <h3>Error de conexión</h3>
          <p>{stats.error}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>
            Reintentar conexión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Panel de Control</h1>
          <p>Resumen de métricas del negocio</p>
        </div>
        <div className="header-info">
          <div className="last-update">
            <span className="update-label">Última actualización</span>
            <span className="update-time">{formatoFecha(stats.ultimaActualizacion)}</span>
          </div>
          <div className="logo-container">
            <img className="logo" src={Logo} alt="logo holfer" />
          </div>
        </div>
      </div>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <h3>Pedidos Hoy</h3>
          </div>
          <div className="metric-value">{stats.pedidosHoy}</div>
          <div className="metric-trend">
            <TrendIndicator value={stats.tendenciaPedidos} />
          </div>
          <div className="metric-footer">Completados hoy</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
              </svg>
            </div>
            <h3>Ingresos Hoy</h3>
          </div>
          <div className="metric-value">${stats.ingresosHoy.toLocaleString('es-NI')}</div>
          <div className="metric-trend">
            <TrendIndicator value={stats.tendenciaIngresos} />
          </div>
          <div className="metric-footer">Total acumulado</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <h3>Pedidos Pendientes</h3>
          </div>
          <div className="metric-value">{stats.pedidosPendientes}</div>
          <div className="metric-trend">
            <span className="status-badge pending">Por procesar</span>
          </div>
          <div className="metric-footer">En espera de entrega</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <h3>Eficiencia</h3>
          </div>
          <div className="metric-value">
            {stats.pedidosHoy > 0 ? Math.round((stats.pedidosHoy / (stats.pedidosHoy + stats.pedidosPendientes)) * 100) : 0}%
          </div>
          <div className="metric-trend">
            <span className="status-badge efficiency">Tasa de completado</span>
          </div>
          <div className="metric-footer">Ratio de eficiencia</div>
        </div>
      </div>

      <div className="dashboard-footer">
        <div className="footer-info">
          <span className="auto-refresh">Actualización automática cada 5 minutos</span>
          <span className="system-status">Sistema operativo</span>
        </div>
      </div>
    </div>
  );
};

export default Stats;