import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:5000";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || data.error || "Registration failed");
        return;
      }
      // After registration, log in to get token
      const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const loginData = await loginResponse.json();
      if (loginResponse.ok) {
        login(loginData.token, loginData.user);
        navigate("/dashboard", { replace: true });
      } else {
        setError("Registered but login failed. Please try logging in.");
      }
    } catch (err) {
      setError("Network error. Is the backend running?");
      console.error(err);
    }
  };

  return (
    <div className="auth-page">
      <h1>CineTrack</h1>
      <h2>Register</h2>
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
        <button type="submit">Register</button>
        <p className="auth-switch">
          Have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
