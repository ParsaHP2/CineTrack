import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:5000";

export default function AdminDashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyUserId, setBusyUserId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE}/api/admin/users`, { headers: { Authorization: token } })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || "Failed to fetch users");
        if (isMounted) setUsers(data || []);
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [token]);

  const toggleBan = async (account) => {
    setBusyUserId(account._id);
    setError(null);
    try {
      const action = account.isBanned ? "unban" : "ban";
      const response = await fetch(`${API_BASE}/api/admin/users/${account._id}/${action}`, {
        method: "PATCH",
        headers: { Authorization: token },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Action failed");
      }
      setUsers((prev) => prev.map((u) => (u._id === account._id ? data : u)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyUserId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="page-container">
      <header className="main-header">
        <h1>CineTrack Admin</h1>
        <nav className="nav-links">
          <Link to="/dashboard">Browse</Link>
          <Link to="/favourites">My Favourites</Link>
          <Link to="/admin" className="nav-active">
            Admin
          </Link>
        </nav>
        <div className="auth-area">
          <div className="user-info">
            <span>
              Logged in as <strong>{user?.username}</strong>
            </span>
            <button type="button" className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button
            type="button"
            className="dismiss-error"
            onClick={() => setError(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <main className="content">
        <h2 className="welcome-greeting">User Management</h2>
        {loading ? (
          <p className="loading">Loading users…</p>
        ) : (
          <div className="admin-users-table-wrap">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((account) => (
                  <tr key={account._id}>
                    <td>{account.username}</td>
                    <td>{account.role || "user"}</td>
                    <td>{account.isBanned ? "Banned" : "Active"}</td>
                    <td>
                      <button
                        type="button"
                        className={account.isBanned ? "unban-btn" : "ban-btn"}
                        disabled={busyUserId === account._id || account._id === user?.id}
                        onClick={() => toggleBan(account)}
                      >
                        {busyUserId === account._id
                          ? "Saving..."
                          : account.isBanned
                            ? "Unban"
                            : "Ban"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
