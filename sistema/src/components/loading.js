import React, { useEffect, useState } from 'react';
import logo from "../images/logo.png";

const LoadingPage = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('Inicializando sistema...');

  useEffect(() => {
    const tasks = [
      { task: 'Cargando configuración...', duration: 800 },
      { task: 'Conectando con la base de datos...', duration: 1200 },
      { task: 'Verificando servicios...', duration: 1000 },
      { task: 'Preparando interfaz...', duration: 600 },
      { task: 'Iniciando sesión...', duration: 400 }
    ];

    let currentIndex = 0;
    let totalDuration = tasks.reduce((acc, task) => acc + task.duration, 0);
    let elapsed = 0;

    const interval = setInterval(() => {
      if (currentIndex < tasks.length) {
        setCurrentTask(tasks[currentIndex].task);
        elapsed += tasks[currentIndex].duration;
        setProgress(Math.min((elapsed / totalDuration) * 100, 100));
        currentIndex++;
      } else {
        clearInterval(interval);

        // Esperar un poco más para mostrar el 100%
        setTimeout(() => {
          // Validación segura
          if (typeof onLoadingComplete === "function") {
            onLoadingComplete();
          }
        }, 500);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [onLoadingComplete]);

  return (
    <div className="loading-container">
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      
      <div className="loading-content">
        <div className="loading-logo">
          <img src={logo} alt="Logo del sistema" />
          <div className="logo-glow"></div>
        </div>
        
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-dot"></div>
        </div>
        
        <h2 className="loading-title">Sistema de Gestión de Pedidos</h2>
        <p className="loading-task">{currentTask}</p>
        
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>
        
        <div className="loading-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
