import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './authcontext';

const LoginForm = () => {
  const [nombre, setNombre] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const { login, error: loginError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadLogo();
  }, []);

  const loadLogo = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/config');
      const data = await res.json();
      if (data.config?.logo_path) {
        setLogoUrl('http://localhost:5001' + data.config.logo_path);
      }
    } catch (err) {
      console.error('Error cargando logo:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(nombre, contraseña);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(loginError || 'Hubo un problema al iniciar sesión');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Iniciar sesión</h2>

        {logoUrl && <img src={logoUrl} alt="logo" className="logo" />}

        <form onSubmit={handleSubmit}>
          <div className="form-groupL">
            <label>Nombre de usuario</label>
            <input
              type="text"
              placeholder='Nombre de Usuario'
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="form-groupL">
            <label>Contraseña</label>
            <input
             placeholder='Contraseña'
              type="password"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit">Iniciar sesión</button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
