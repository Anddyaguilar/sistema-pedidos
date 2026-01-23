import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar token al iniciar la app
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log("TOKEN AL INICIAR APP:", token);

    if (token) {
      fetch('http://localhost:5001/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          console.log("USUARIO DESDE /me:", data);
          setUser(data);
        })
        .catch(err => {
          console.error("ERROR TOKEN /me:", err);
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      console.log("No hay token en localStorage");
      setLoading(false);
    }
  }, []);

  // Función de login
  const login = async (nombre, contraseña) => {
    setError(null);
    try {
      console.log("Intentando login con:", { nombre, contraseña });

      const res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, contraseña })
      });

      const data = await res.json();
      console.log("RESPUESTA LOGIN:", data);

      if (!data.token) {
        setError(data.message || 'Nombre o contraseña incorrectos');
        return;
      }

      localStorage.setItem('token', data.token);
      console.log("TOKEN GUARDADO EN LOCALSTORAGE:", data.token);

      const userRes = await fetch('http://localhost:5001/api/auth/me', {
        headers: { Authorization: `Bearer ${data.token}` }
      });

      const userData = await userRes.json();
      console.log("USUARIO OBTENIDO POST LOGIN:", userData);
      setUser(userData);

    } catch (err) {
      console.error("ERROR EN LOGIN:", err);
      setError('Hubo un problema al iniciar sesión');
    }
  };

  const logout = () => {
    console.log("Cerrando sesión");
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth };
