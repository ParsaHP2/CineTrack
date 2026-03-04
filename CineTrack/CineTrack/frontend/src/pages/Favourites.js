import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:5000";
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

function FavouriteCard({ favourite, onRemove }) {
  const posterUrl = favourite.posterPath
    ? `${POSTER_BASE}${favourite.posterPath}`
    : null;
  const year = favourite.releaseDate
    ? favourite.releaseDate.slice(0, 4)
    : "—";

  return (
    <div className="movie-card">
      <div className="movie-poster">
        {posterUrl ? (
          <img src={posterUrl} alt={favourite.title} />
        ) : (
          <div className="poster-placeholder">No poster</div>
        )}
        <button
          type="button"
          className="favourite-btn is-favourite"
          onClick={() => onRemove(favourite)}
          aria-label="Remove from favourites"
          title="Remove from favourites"
        >
          ♥
        </button>
      </div>
      <div className="movie-info">
        <h3>{favourite.title || "Unknown title"}</h3>
        <p className="movie-year">{year}</p>
      </div>
    </div>
  );
}

export default function Favourites() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // [Part 2: Personalized Greeting] jwt-decode extracts username from token (protected view)
  const username = token ? jwtDecode(token).username : null;

  // [Part 2: Authenticated Requests] Authorization header on GET favourites
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_BASE}/api/favourites`, {
      headers: { Authorization: token },
    })
      .then((res) => res.json())
      .then((list) => setFavourites(list || []))
      .catch((err) => {
        console.error("Error fetching favourites:", err);
        setFavourites([]);
      })
      .finally(() => setLoading(false));
  }, [token]);

  // [Part 2: Authenticated Requests] Authorization header on DELETE favourite
  const handleRemove = async (favourite) => {
    try {
      await fetch(`${API_BASE}/api/favourites/${favourite.movieId}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });
      setFavourites((prev) =>
        prev.filter((f) => f.movieId !== favourite.movieId)
      );
    } catch (err) {
      setError("Could not remove from favourites.");
    }
  };

  // [Part 2: Logout] Clears token from Context/localStorage, redirects to /login
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="page-container">
      <header className="main-header">
        <h1>CineTrack</h1>
        <nav className="nav-links">
          <Link to="/dashboard">Browse</Link>
          <Link to="/favourites" className="nav-active">
            My Favourites
          </Link>
        </nav>
        <div className="auth-area">
          <div className="user-info">
            <span>
              Logged in as <strong>{username}</strong>
            </span>
            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
            >
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
        <h2 className="welcome-greeting">My Favourites</h2>
        {loading ? (
          <p className="loading">Loading favourites…</p>
        ) : favourites.length === 0 ? (
          <p className="section-empty">
            No favourites yet.{" "}
            <Link to="/dashboard">Browse movies</Link> to add some!
          </p>
        ) : (
          <div className="movie-grid">
            {favourites.map((fav) => (
              <FavouriteCard
                key={fav.movieId}
                favourite={fav}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
