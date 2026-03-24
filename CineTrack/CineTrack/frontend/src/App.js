import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PublicDashboard from "./pages/PublicDashboard"; // guest
import Favourites from "./pages/Favourites";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      {/* [Part 2: Router] react-router-dom with public and protected routes */}
      <BrowserRouter>
        <Routes>
          {/* [Part 2: Public Routes] /login and /register */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/public-dashboard" element={<Dashboard />} />
          {/* [Part 2: Protected Route] /favourites and /dashboard - redirects to /login if unauthenticated */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/favourites"
            element={
              <ProtectedRoute>
                <Favourites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
