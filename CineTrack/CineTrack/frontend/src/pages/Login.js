import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:5000";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || data.error || "Login failed");
        return;
      }
      login(data.token, data.user);
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      setError("Network error. Is the backend running?");
      console.error(err);
    }
  };

  return (
    <div className="auth-page">
      <h1>CineTrack</h1>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="auth-form auth-form-standalone">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}
        <button type="submit">Login</button>
        <p className="auth-switch">
          Need an account? <Link to="/register">Register</Link>
        </p>
        <button
          type="button"
          className="guest-btn"
          // Clicking "continue as guest" will navigate to the public dashboard without setting a token
          onClick={() => navigate("/public-dashboard", { replace: true })}
        >
          Continue as guest
        </button>
      </form>
    </div>
  );
}
