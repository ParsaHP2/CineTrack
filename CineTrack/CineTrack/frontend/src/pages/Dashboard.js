import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:5000";
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

function MovieCard({ movie, favouriteIds, onToggleFavourite, isLoggedIn }) {
  const isFav = favouriteIds.has(movie.id);
  const posterUrl = movie.poster_path
    ? `${POSTER_BASE}${movie.poster_path}`
    : null;
  const year = movie.release_date ? movie.release_date.slice(0, 4) : "—";

  return (
    <div className="movie-card">
      <div className="movie-poster">
        {posterUrl ? (
          <img src={posterUrl} alt={movie.title} />
        ) : (
          <div className="poster-placeholder">No poster</div>
        )}
        {isLoggedIn && (
          <button
            type="button"
            className={`favourite-btn ${isFav ? "is-favourite" : ""}`}
            onClick={() => onToggleFavourite(movie)}
            aria-label={
              isFav ? "Remove from favourites" : "Add to favourites"
            }
            title={isFav ? "Remove from favourites" : "Add to favourites"}
          >
            ♥
          </button>
        )}
      </div>
      <div className="movie-info">
        <h3>{movie.title}</h3>
        <p className="movie-year">{year}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [movies, setMovies] = useState({ classic: [], modern: [] });
  const [loading, setLoading] = useState(true);
  const [favouriteIds, setFavouriteIds] = useState(new Set());
  const [error, setError] = useState(null);

  // [Part 2: Personalized Greeting] jwt-decode extracts username from token
  const isLoggedIn = Boolean(token);
  const username = isLoggedIn
    ? jwtDecode(token).username
    : user?.username ?? null;

  // Fetch trending movies
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/movies/trending`)
      .then((res) => res.json())
      .then((data) => {
        setMovies({
          classic: data.classic || [],
          modern: data.modern || [],
        });
      })
      .catch((err) => {
        console.error("Error fetching movies:", err);
        setMovies({ classic: [], modern: [] });
      })
      .finally(() => setLoading(false));
  }, []);

  // [Part 2: Authenticated Requests] Authorization header on GET favourites
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/favourites`, {
      headers: { Authorization: token },
    })
      .then((res) => res.json())
      .then((list) => {
        const ids = new Set((list || []).map((f) => f.movieId));
        setFavouriteIds(ids);
      })
      .catch(() => setFavouriteIds(new Set()));
  }, [token]);

  // [Part 2: Authenticated Requests] Authorization header on create (POST) and delete (DELETE)
  const toggleFavourite = async (movie) => {
    const id = movie.id;
    const isFav = favouriteIds.has(id);
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };

    try {
      if (isFav) {
        await fetch(`${API_BASE}/api/favourites/${id}`, {
          method: "DELETE",
          headers: { Authorization: token },
        });
        setFavouriteIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        await fetch(`${API_BASE}/api/favourites`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            movieId: id,
            title: movie.title,
            posterPath: movie.poster_path,
            releaseDate: movie.release_date,
          }),
        });
        setFavouriteIds((prev) => new Set([...prev, id]));
      }
    } catch (err) {
      setError("Could not update favourite.");
    }
  };

  // [Part 2: Logout] Clears token from Context/localStorage, redirects to public view (login)
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="page-container">
      <header className="main-header">
        <h1>CineTrack</h1>
        {isLoggedIn && (
          <nav className="nav-links">
            <Link to="/dashboard" className="nav-active">Browse</Link>
            <Link to="/favourites">My Favourites</Link>
          </nav>
        )}
        <div className="auth-area">
          {isLoggedIn ? (
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
          ) : (
            <Link to="/login" className="login-link">
              Login
            </Link>
          )}
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
        <h2 className="welcome-greeting">
          {isLoggedIn ? `Welcome, ${username}!` : "Browse movies"}
        </h2>
        {loading ? (
          <p className="loading">Loading movies…</p>
        ) : (
          <>
            <section className="movie-section">
              <h2>Classic (1900 – 1960)</h2>
              <div className="movie-grid">
                {movies.classic.length === 0 ? (
                  <p className="section-empty">No movies in this range.</p>
                ) : (
                  movies.classic.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      favouriteIds={favouriteIds}
                      onToggleFavourite={toggleFavourite}
                      isLoggedIn={isLoggedIn}
                    />
                  ))
                )}
              </div>
            </section>
            <section className="movie-section">
              <h2>Modern (1961 – 2025)</h2>
              <div className="movie-grid">
                {movies.modern.length === 0 ? (
                  <p className="section-empty">No movies in this range.</p>
                ) : (
                  movies.modern.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      favouriteIds={favouriteIds}
                      onToggleFavourite={toggleFavourite}
                      isLoggedIn={isLoggedIn}
                    />
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
