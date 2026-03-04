import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

// [Part 2: AuthContext] Manages user's token and decoded user object (assignment requirement)
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // [Part 2: AuthContext] Checks localStorage on app load so user stays logged in after refresh
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

  // [Part 2: Logout] Clears token from Context and localStorage
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
