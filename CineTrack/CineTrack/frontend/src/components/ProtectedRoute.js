import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// [Part 2: Protected Route wrapper] Redirects unauthenticated users to /login
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { token, user, isHydrating } = useAuth();
  const location = useLocation();

  if (isHydrating) {
    return null;
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
