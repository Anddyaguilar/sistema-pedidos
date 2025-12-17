// src/components/Footer.jsx
import React from "react";


export default function Footer({ company = "Mi Sistema", version = "1.0.0" }) {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-left">
        <strong>{company}</strong> © {year} - Todos los derechos reservados.
      </div>

      <div className="footer-right">
        <span>Versión {version}</span>
      </div>
    </footer>
  );
}
