import React, { useState, useEffect } from "react";
import "../style/foter.css";

const Footer = () => {
  const [config, setConfig] = useState({});
  
  useEffect(() => {
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
  }, []);

  return (
    <footer 
      className="footer-normal"
      style={{
        // FORZAR SIN MÁRGENES
        width: '100%',
        minWidth: '100%',
        margin: 0,
        padding: 0,
        position: 'relative',
        left: 0,
        right: 0,
        background: 'white',
       
       
        height: '70px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
      }}
    >
      <div 
        className="footer-container"
        style={{
          width: '100%',
          margin: 0,
          padding: 0,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
        }}
      >
        <div 
          className="footer-content"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '15px',
            width: '100%',
            height: '100%',
            padding: '0 0 0 20px', // Solo padding izquierdo
            margin: 0,
          }}
        >
          
          <span 
            className="footer-text"
            style={{
              fontSize: '15px',
              color: '#1a202c',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '8px'
            }}
          >
            <strong style={{ color: '#1976d2', fontWeight: 700, fontSize: '16px' }}>
              Sistema Pedidos {config.company_name || "SIGPRO"}
            </strong>
            <span>© 2025 - Todos los derechos reservados</span>
            <span 
              className="version-text"
              style={{
                background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '15px',
                fontSize: '12px',
                fontWeight: 600,
                marginLeft: '8px'
              }}
            >
              Versión 1.0.0
            </span>
          </span>
        </div>
      </div>
      
      
    </footer>
  );
};

export default Footer;