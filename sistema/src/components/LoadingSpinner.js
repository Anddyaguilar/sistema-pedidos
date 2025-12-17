import React from 'react';
import '../style/LoadingSpinner.css'; // Opcional: estilos para el spinner

const LoadingSpinner = () => (
  <div className="loading-spinner-overlay">
    <div className="loading-spinner"></div>
  </div>
);

export default LoadingSpinner;