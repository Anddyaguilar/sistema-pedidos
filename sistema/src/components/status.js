import React, { useState, useEffect } from "react";
import "../style/style.css";
import { format } from "date-fns";
import es from "date-fns/locale/es";
import axios from "axios";

const Stats = () => {
  const [logoUrl, setLogoUrl] = useState('');

  const [stats, setStats] = useState({
    pedidosPendientes: 0,
    pedidosAprobados: 0,
    pedidosCancelados: 0,
    ultimaActualizacion: new Date(),
    loading: true,
    error: null
  });

  /* ===== LOGO DINÁMICO ===== */
  useEffect(() => {
    loadLogo();
  }, []);

  const loadLogo = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/config');
      if (res.data.config?.logo_path) {
        setLogoUrl('http://localhost:5001' + res.data.config.logo_path);
      }
    } catch (err) {
      console.error('Error cargando logo:', err);
    }
  };

  /* ===== ESTADÍSTICAS ===== */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get("http://localhost:5001/api/pedidos/estadisticas", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });

        setStats({
          pedidosPendientes: data.pedidosPendientes,
          pedidosAprobados: data.pedidosAprobados,
          pedidosCancelados: data.pedidosCancelados,
          ultimaActualizacion: new Date(data.ultimaActualizacion),
          loading: false,
          error: null
        });
      } catch (err) {
        console.error("Error al cargar estadísticas:", err);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: "Error al cargar estadísticas. Verifica la conexión con el servidor."
        }));
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 300000); // Actualiza cada 5 minutos
    return () => clearInterval(interval);
  }, []);

  const formatoFecha = fecha => format(fecha, "PPpp", { locale: es });

  

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Panel de Control</h1>
          <p>Resumen de pedidos por estado</p>
        </div>
        <div className="header-info">
          <div>
            <span>Última actualización  </span>
            <strong>{formatoFecha(stats.ultimaActualizacion)}</strong>
          </div>
          {logoUrl && <img src={logoUrl} alt="logo" className="logo" />}
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Pedidos Pendientes</h3>
          <div className="metric-value">{stats.pedidosPendientes}</div>
        </div>

        <div className="metric-card">
          <h3>Pedidos Aprobados</h3>
          <div className="metric-value">{stats.pedidosAprobados}</div>
        </div>

        <div className="metric-card">
          <h3>Pedidos Anulados</h3>
          <div className="metric-value">{stats.pedidosCancelados}</div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
