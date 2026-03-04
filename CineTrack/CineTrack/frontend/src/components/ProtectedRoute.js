import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// [Part 2: Protected Route wrapper] Redirects unauthenticated users to /login
export default function ProtectedRoute({ children }) {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
