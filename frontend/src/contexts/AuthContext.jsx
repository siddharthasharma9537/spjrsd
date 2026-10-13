import { createContext, useContext, useState, useEffect } from 'react';
import { clearCached } from '@/lib/cachedGet';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedType = localStorage.getItem('userType');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setUserType(savedType);
    }
    setLoading(false);
  }, []);

  const login = (tokenVal, userData, type) => {
    clearCached();
    localStorage.setItem('token', tokenVal);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userType', type);
    setToken(tokenVal);
    setUser(userData);
    setUserType(type);
  };

  const logout = () => {
    clearCached();
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
