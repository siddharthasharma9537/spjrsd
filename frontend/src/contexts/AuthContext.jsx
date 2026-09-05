import { createContext, useContext, useState, useEffect } from 'react';
import { getItem, setItem, removeItem } from '@/lib/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [savedToken, savedUser, savedType] = await Promise.all([
        getItem('token'),
        getItem('user'),
        getItem('userType'),
      ]);
      if (savedToken && savedUser) {
        // Mirror into localStorage so the axios interceptor (which reads
        // synchronously) sees the same token on native builds, where the
        // source of truth is Capacitor Preferences.
        localStorage.setItem('token', savedToken);
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setUserType(savedType);
      }
      setLoading(false);
    })();
  }, []);

  const login = (tokenVal, userData, type) => {
    setItem('token', tokenVal);
    setItem('user', JSON.stringify(userData));
    setItem('userType', type);
    localStorage.setItem('token', tokenVal);
    setToken(tokenVal);
    setUser(userData);
    setUserType(type);
  };

  const logout = () => {
    removeItem('token');
    removeItem('user');
    removeItem('userType');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    setToken(null);
    setUser(null);
    setUserType(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, userType, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
