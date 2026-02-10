import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar token al iniciar la app
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      ////console.log("TOKEN AL INICIAR APP:", token);

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
            ////console.log("USUARIO DESDE /me:", userData);
            setUser(userData);
          } else {
            // Token inválido
            ////console.log("Token inválido o expirado");
            localStorage.removeItem('token');
            setUser(null);
          }
        } catch (err) {
          console.error("ERROR TOKEN /me:", err);
          localStorage.removeItem('token');
          setUser(null);
        }
      } else {
       // //console.log("No hay token en localStorage");
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Función de login - IMPORTANTE: NO establece usuario si hay error
  const login = async (nombre, contraseña) => {
    setError(null);
    setUser(null); // Asegurar que user esté en null al intentar login
    
    try {
      ////console.log("Intentando login con:", { nombre, contraseña });

      const res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ nombre, contraseña })
      });

      const data = await res.json();
      //console.log("RESPUESTA LOGIN:", data);

      // VERIFICAR SI HAY ERROR EN LA RESPUESTA
      if (!res.ok || data.message?.includes('incorrecto') || data.message?.includes('desactivada')) {
        // Credenciales incorrectas o cuenta desactivada
        throw new Error(data.message || 'Credenciales incorrectas');
      }

      if (!data.token) {
        throw new Error('No se recibió token del servidor');
      }

      // SOLO SI TODO ESTÁ BIEN: Guardar token
      localStorage.setItem('token', data.token);
      //console.log("TOKEN GUARDADO EN LOCALSTORAGE:", data.token);

      // Obtener datos del usuario
      const userRes = await fetch('http://localhost:5001/api/auth/me', {
        headers: { 
          'Authorization': `Bearer ${data.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        //console.log("USUARIO OBTENIDO POST LOGIN:", userData);
        setUser(userData);
        return true; // Login exitoso
      } else {
        throw new Error('Error al obtener datos del usuario');
      }

    } catch (err) {
      console.error("ERROR EN LOGIN:", err.message);
      
      // IMPORTANTE: Limpiar todo si el login falló
      localStorage.removeItem('token');
      setUser(null);
      
      // Establecer el error
      const errorMessage = err.message || 'Credenciales incorrectas';
      setError(errorMessage);
      throw new Error(errorMessage); // Lanza el error
    }
  };

  const logout = () => {
    //console.log("Cerrando sesión");
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      error 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth };