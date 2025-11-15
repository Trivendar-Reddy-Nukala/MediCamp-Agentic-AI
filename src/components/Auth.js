import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Add auto-logout on tab/window close
  useEffect(() => {
    const handleTabClose = () => {
      localStorage.removeItem('user');
    };

    window.addEventListener('beforeunload', handleTabClose);
    
    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
    };
  }, []);

  // Add session timeout
  useEffect(() => {
    let logoutTimer;

    if (user?.token) {
      // Auto logout after 24 hours
      logoutTimer = setTimeout(() => {
        logout();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }

    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
    };
  }, [user]);

  const login = (userData) => {
    const userToStore = {
      ...userData,
      token: userData.token || (userData.doctor && userData.doctor.token)
    };
    setUser(userToStore);
    localStorage.setItem('user', JSON.stringify(userToStore));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Token validation
  useEffect(() => {
    const validateToken = async () => {
      if (user?.token) {
        try {
          const response = await fetch('http://localhost:4000/api/validate-token', {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          });
          if (!response.ok) {
            logout();
          }
        } catch (error) {
          console.error('Token validation error:', error);
          logout();
        }
      }
    };

    validateToken();
    // Run validation every 5 minutes
    const interval = setInterval(validateToken, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 