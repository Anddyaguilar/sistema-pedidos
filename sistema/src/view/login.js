import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './authcontext';
import logo from "../images/logo.png"

const LoginForm = () => {
  // Estados del formulario de login
  const [nombre, setNombre] = useState(''); // Nombre de usuario (antes era 'correo')
  const [contraseña, setContraseña] = useState(''); // Contraseña del usuario
  const [error, setError] = useState(''); // Estado para errores locales del formulario
  
  // FUNCIÓN: Obtener funciones y estados del contexto de autenticación
  const { login, error: loginError } = useAuth();
  const navigate = useNavigate();

  // FUNCIÓN: Manejar envío del formulario de login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpiar errores anteriores

    try {
      // REALIZAR: Intentar inicio de sesión
      await login(nombre, contraseña); // Pasa 'nombre' en lugar de 'correo'
      console.log('Login OK');
      
      // REDIRIGIR: Navegar a la página de estado después de login exitoso
    navigate('/dashboard', { replace: true });

    } catch (err) {
      console.error(err);
      // MOSTRAR ERROR: Usar error del contexto o mensaje genérico
      setError(loginError || 'Hubo un problema al iniciar sesión');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Iniciar sesión</h2>
        <img src={logo} alt='logo' className='logo'/>
        {/* Formulario de inicio de sesión */}
        <form onSubmit={handleSubmit}>
          
          {/* Campo: Nombre de usuario */}
          <div className="form-groupL">
            <label htmlFor="nombre">Nombre de usuario</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Ingresa tu nombre de usuario"
            />
          </div>

          {/* Campo: Contraseña */}
          <div className="form-groupL">
            <label htmlFor="contraseña">Contraseña</label>
            <input
              type="password"
              id="contraseña"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              required
              placeholder="Ingresa tu contraseña"
            />
          </div>

          {/* Mostrar mensaje de error si existe */}
          {error && <div className="error-message">{error}</div>}

          {/* Botón: Enviar formulario */}
          <button type="submit">Iniciar sesión</button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
