import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Usuario logueado (id, nombre, correo, rol)
  const [loading, setLoading] = useState(true); // Para indicar si se está verificando sesión
  const [error, setError] = useState(null);     // Mensajes de error

  // 🔹 Verificar token al iniciar la app
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          const res = await fetch('http://localhost:5001/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (res.ok) {
            const userData = await res.json();
            setUser(userData);                        // Guardamos usuario completo
            localStorage.setItem('rol', userData.rol); // 🔹 Guardamos rol en localStorage
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('rol');           // 🔹 Limpiar rol si token inválido
            setUser(null);
          }
        } catch (err) {
          console.error("ERROR TOKEN /me:", err);
          localStorage.removeItem('token');
          localStorage.removeItem('rol');             // 🔹 Limpiar rol si error
          setUser(null);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // 🔹 Función de login
  const login = async (nombre, contraseña) => {
    setError(null);
    setUser(null);

    try {
      const res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ nombre, contraseña })
      });

      const data = await res.json();

      if (!res.ok || data.message?.includes('incorrecto') || data.message?.includes('desactivada')) {
        throw new Error(data.message || 'Credenciales incorrectas');
      }

      if (!data.token) {
        throw new Error('No se recibió token del servidor');
      }

      // Guardar token en localStorage
      localStorage.setItem('token', data.token);

      // Obtener datos del usuario
      const userRes = await fetch('http://localhost:5001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${data.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);                         // Guardamos usuario completo
        localStorage.setItem('rol', userData.rol); // 🔹 Guardamos rol en localStorage
        return true;
      } else {
        throw new Error('Error al obtener datos del usuario');
      }
    } catch (err) {
      console.error("ERROR EN LOGIN:", err.message);
      localStorage.removeItem('token');
      localStorage.removeItem('rol');
      setUser(null);
      setError(err.message || 'Credenciales incorrectas');
      throw new Error(err.message || 'Credenciales incorrectas');
    }
  };

  // 🔹 Función de logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,       // Contiene id, nombre, correo y rol
      login,      // Función de login
      logout,     // Función de logout
      loading,    // True mientras verifica sesión
      error       // Mensaje de error
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// 🔹 Hook para usar el contexto
const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth };
