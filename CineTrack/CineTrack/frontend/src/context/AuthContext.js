import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // Check localStorage on app load to persist login
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) return;
    try {
      const decoded = jwtDecode(storedToken);
      // Basic expiry check (jwt-decode doesn't validate, just decodes)
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return;
      }
      setToken(storedToken);
      setUser({
        id: decoded.id,
        username: decoded.username,
      });
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }, []);

  const login = (newToken, userData) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
