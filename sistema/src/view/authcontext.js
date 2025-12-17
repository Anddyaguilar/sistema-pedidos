import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// FUNCIÓN: Crear contexto de autenticación
const AuthContext = createContext();

// COMPONENTE: Proveedor de autenticación que envuelve la aplicación
const AuthProvider = ({ children }) => {
  // Estados del contexto de autenticación
  const [user, setUser] = useState(null); // Usuario autenticado
  const [loading, setLoading] = useState(true); // Estado de carga inicial
  const [error, setError] = useState(null); // Estado para manejar errores de autenticación

  // EFECTO: Verificar autenticación al cargar el componente
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // FUNCIÓN: Validar token existente y obtener datos del usuario
      axios.get('http://localhost:5001/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setUser(response.data);
      })
      .catch((error) => {
        console.error('Error al obtener usuario', error);
        // FUNCIÓN: Limpiar token inválido
        localStorage.removeItem('token');
        setUser(null); // Asegurarse de limpiar el estado de usuario si el token es inválido
      })
      .finally(() => setLoading(false)); // Marcar como no cargando
    } else {
      setLoading(false); // No hay token, terminar de cargar
    }
  }, []);

  // FUNCIÓN: Manejar inicio de sesión
  const login = async (nombre, contraseña) => {
    setError(null); // Limpiar errores antes de intentar el login
    try {
      // REALIZAR: Solicitud de login al servidor
      const response = await axios.post('http://localhost:5001/api/auth/login', { nombre , contraseña });
      const { token } = response.data;

      // ALMACENAR: Token en localStorage
      localStorage.setItem('token', token);

      // OBTENER: Datos del usuario autenticado con el token
      const userResponse = await axios.get('http://localhost:5001/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(userResponse.data);
    } catch (error) {
      console.error('Error en login:', error);
      setError('Nombre o contraseña incorrectos'); // Mensaje de error amigable
      throw error; // Re-lanzar el error para que lo maneje el componente que llama a login
    }
  };

  // FUNCIÓN: Manejar cierre de sesión
  const logout = () => {
    // ELIMINAR: Token del almacenamiento local
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    // PROVEER: Contexto con valores de autenticación
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

// HOOK: Hook personalizado para usar el contexto de autenticación
const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth };