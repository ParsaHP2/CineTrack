import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:5000";
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

function App() {
  const [movies, setMovies] = useState({ classic: [], modern: [] });
  const [loading, setLoading] = useState(true);
  const [favouriteIds, setFavouriteIds] = useState(new Set());

  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      if (!token || !savedUser || savedUser === "undefined") return null;
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });
  const [authForm, setAuthForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(true);

  // Fetch trending movies (two categories)
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

  // Fetch user's favourites when logged in
  useEffect(() => {
    if (!user) {
      setFavouriteIds(new Set());
      return;
    }
    const token = localStorage.getItem("token");
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
  }, [user]);

  const toggleFavourite = async (movie) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Log in to favourite movies.");
      return;
    }
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

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const endpoint = isLoggingIn ? "/login" : "/register";
    try {
      const response = await fetch(`${API_BASE}/api/auth${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || data.error || "Authentication failed");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setAuthForm({ username: "", password: "" });
    } catch (err) {
      setError("Network error. Is the backend running?");
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setError(null);
  };

  function MovieCard({ movie }) {
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
          {user && (
            <button
              type="button"
              className={`favourite-btn ${isFav ? "is-favourite" : ""}`}
              onClick={() => toggleFavourite(movie)}
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

  return (
    <div className="page-container">
      <header className="main-header">
        <h1>CineTrack</h1>
        <div className="auth-area">
          {user ? (
            <div className="user-info">
              <span>
                Logged in as <strong>{user.username}</strong>
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
            <form onSubmit={handleAuthSubmit} className="auth-form">
              <input
                type="text"
                placeholder="Username"
                value={authForm.username}
                onChange={(e) =>
                  setAuthForm({ ...authForm, username: e.target.value })
                }
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(e) =>
                  setAuthForm({ ...authForm, password: e.target.value })
                }
                required
              />
              <button type="submit">
                {isLoggingIn ? "Login" : "Register"}
              </button>
              <button
                type="button"
                className="toggle-auth-btn"
                onClick={() => {
                  setIsLoggingIn(!isLoggingIn);
                  setError(null);
                }}
              >
                {isLoggingIn
                  ? "Need an account? Register"
                  : "Have an account? Login"}
              </button>
            </form>
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
                    <MovieCard key={movie.id} movie={movie} />
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
                    <MovieCard key={movie.id} movie={movie} />
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

export default App;
