import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/AuthContext";
import MovieDetailModal from "../components/MovieDetailModal";

const API_BASE = "http://localhost:5000";
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

//MovieCard
function MovieCard({ movie, favouriteIds, onToggleFavourite, isLoggedIn, onOpenDetails }) {
  const isFav = favouriteIds.has(movie.id || movie.movieId); // works for TMDB and added movies
  const posterUrl = movie.poster_path
    ? `${POSTER_BASE}${movie.poster_path}`
    : movie.posterPath || null;
  const year = movie.release_date
    ? movie.release_date.slice(0, 4)
    : movie.releaseDate
    ? movie.releaseDate.slice(0, 4)
    : "—";

  return (
    <div
      className="movie-card movie-card--clickable"
      tabIndex={0}
      onClick={() => onOpenDetails?.(movie)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetails?.(movie);
        }
      }}
      aria-label={`View details: ${movie.title || "movie"}`}
    >
      <div className="movie-poster">
        {posterUrl ? (
          <img src={posterUrl} alt={movie.title || "Untitled"} />
        ) : (
          <div className="poster-placeholder">No poster</div>
        )}
        {isLoggedIn && (
          <button
            type="button"
            className={`favourite-btn ${isFav ? "is-favourite" : ""}`} // red if favourite
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavourite(movie);
            }}
            aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
            title={isFav ? "Remove from favourites" : "Add to favourites"}
          >
            ♥
          </button>
        )}
      </div>
      <div className="movie-info">
        <h3>{movie.title || "Untitled"}</h3>
        <p className="movie-year">{year}</p>
        {movie.username && <p className="movie-username">Added by: {movie.username}</p>}
      </div>
    </div>
  );
}

//Dashboard
export default function Dashboard() {
  const { token, user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [movies, setMovies] = useState({ classic: [], modern: [] });
  const [loading, setLoading] = useState(true);
  const [favouriteIds, setFavouriteIds] = useState(new Set());
  const [error, setError] = useState(null);
  const [detailMovie, setDetailMovie] = useState(null);

  const isLoggedIn = Boolean(token);
  const username = isLoggedIn ? jwtDecode(token).username : user?.username ?? null;

  //Fetch trending and favourites
  useEffect(() => {
    setLoading(true);

    const trendingPromise = fetch(`${API_BASE}/api/movies/trending`).then((res) => res.json());

    const favouritesPromise = token
      ? fetch(`${API_BASE}/api/favourites`, { headers: { Authorization: token } }).then((res) =>
          res.json()
        )
      : Promise.resolve([]);

    Promise.all([trendingPromise, favouritesPromise])
      .then(([trendingData, favouriteData]) => {
        // Split favourites into classic/modern by year
        const classicFavourites = [];
        const modernFavourites = [];
        (favouriteData || []).forEach((movie) => {
          const year = Number(movie.releaseDate?.slice(0, 4));
          if (year && year <= 1960) classicFavourites.push(movie);
          else modernFavourites.push(movie);
        });

        setMovies({
          classic: [...(trendingData.classic || []), ...classicFavourites],
          modern: [...(trendingData.modern || []), ...modernFavourites],
        });

        // set favourite IDs
        const favIds = new Set((favouriteData || []).map((f) => f.movieId));
        setFavouriteIds(favIds);
      })
      .catch((err) => {
        console.error(err);
        setMovies({ classic: [], modern: [] });
        setFavouriteIds(new Set());
      })
      .finally(() => setLoading(false));
  }, [token]);

  //Toggle favourite
  const toggleFavourite = async (movie) => {
    const id = movie.id || movie.movieId;
    const isFav = favouriteIds.has(id);
    const headers = { "Content-Type": "application/json", Authorization: token };

    try {
      if (isFav) {
        await fetch(`${API_BASE}/api/favourites/${id}`, { method: "DELETE", headers });
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
            posterPath: movie.poster_path || movie.posterPath || null,
            releaseDate: movie.release_date || movie.releaseDate || null,
          }),
        });
        setFavouriteIds((prev) => new Set([...prev, id]));
      }
    } catch (err) {
      setError("Could not update favourite.");
    }
  };

  //Logout
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
            <Link to="/dashboard" className="nav-active">
              Browse
            </Link>
            <Link to="/favourites">My Favourites</Link>
            {isAdmin && <Link to="/admin">Admin</Link>}
          </nav>
        )}
        <div className="auth-area">
          {isLoggedIn ? (
            <div className="user-info">
              <span>
                Logged in as <strong>{username}</strong>
              </span>
              <button type="button" className="logout-btn" onClick={handleLogout}>
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
                      key={movie.id || movie.movieId}
                      movie={movie}
                      favouriteIds={favouriteIds}
                      onToggleFavourite={toggleFavourite}
                      isLoggedIn={isLoggedIn}
                      onOpenDetails={setDetailMovie}
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
                      key={movie.id || movie.movieId}
                      movie={movie}
                      favouriteIds={favouriteIds}
                      onToggleFavourite={toggleFavourite}
                      isLoggedIn={isLoggedIn}
                      onOpenDetails={setDetailMovie}
                    />
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <MovieDetailModal
        movie={detailMovie}
        isOpen={detailMovie != null}
        onClose={() => setDetailMovie(null)}
        token={token}
        isLoggedIn={isLoggedIn}
        user={user}
      />
    </div>
  );
}