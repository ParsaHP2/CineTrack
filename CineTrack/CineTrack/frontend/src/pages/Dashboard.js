import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/AuthContext";
import MovieDetailModal from "../components/MovieDetailModal";

const API_BASE = "http://localhost:5000";
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

//MovieCard
function MovieCard({ movie, favouriteIds, isLoggedIn, onOpenDetails, onOpenRating, onToggleFavourite }) {
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

              if (isFav) {
                onToggleFavourite(movie); // remove
              } else {
                onOpenRating(movie); // open popup
              }
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
        {movie.rating && (
          <p className="movie-rating">⭐ {movie.rating}/10</p>
        )}
        {movie.username && (
          <p className="movie-username">
            Added by: <span>{movie.username}</span>
          </p>
        )}
      </div>
    </div>
  );
}

//Dashboard
export default function Dashboard() {
  const { token, user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [movies, setMovies] = useState({ classic: [], modern: [] });
  const [loading, setLoading] = useState(true);
  const [favouriteIds, setFavouriteIds] = useState(new Set());
  const [error, setError] = useState(null);
  const [detailMovie, setDetailMovie] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingMovie, setRatingMovie] = useState(null);
  const [ratingValue, setRatingValue] = useState("");

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

        const favMap = new Map();
        (favouriteData || []).forEach((fav) => {
          favMap.set(fav.movieId, fav);
        });

        const mergeMovies = (movies = []) =>
          movies.map((movie) => {
            const id = movie.id || movie.movieId;

            if (favMap.has(id)) {
              const fav = favMap.get(id);

              return {
                ...movie,
                ...fav,
                username: movie.username || fav.username, 
              };
            }

            return movie;
          });

        setMovies({
          classic: mergeMovies(trendingData.classic),
          modern: mergeMovies(trendingData.modern),
        });

        const favIds = new Set((favouriteData || []).map((f) => f.movieId));
        setFavouriteIds(favIds);
      })
      .catch((err) => {
        console.error(err);
        setMovies({ classic: [], modern: [] });
        setFavouriteIds(new Set());
      })
      .finally(() => setLoading(false));
      }, [token, location.pathname]);

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

  const filteredClassic = movies.classic.filter((movie) =>
      (movie.title || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredModern = movies.modern.filter((movie) =>
      (movie.title || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

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

        <input
          type="text"
          placeholder="Search movies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />

        {loading ? (
          <p className="loading">Loading movies…</p>
        ) : (
          <>
            <section className="movie-section">
              <h2>Classic (1900 – 1960)</h2>
              <div className="movie-grid">
                {filteredClassic.length === 0 ? (
                  <p className="section-empty">No movies in this range.</p>
                ) : (
                  filteredClassic.map((movie) => (
                    <MovieCard
                      key={movie.id || movie.movieId}
                      movie={movie}
                      favouriteIds={favouriteIds}
                      onToggleFavourite={toggleFavourite}
                      isLoggedIn={isLoggedIn}
                      onOpenDetails={setDetailMovie}
                      onOpenRating={(movie) => {
                        setRatingMovie(movie);
                        setRatingValue(movie.rating || "");
                      }}
                    />
                  ))
                )}
              </div>
            </section>

            <section className="movie-section">
              <h2>Modern (1961 – 2025)</h2>
              <div className="movie-grid">
                {filteredModern.length === 0 ? (
                  <p className="section-empty">No movies in this range.</p>
                ) : (
                  filteredModern.map((movie) => (
                    <MovieCard
                      key={movie.id || movie.movieId}
                      movie={movie}
                      favouriteIds={favouriteIds}
                      onToggleFavourite={toggleFavourite}
                      isLoggedIn={isLoggedIn}
                      onOpenDetails={setDetailMovie}
                      onOpenRating={(movie) => {
                        setRatingMovie(movie);
                        setRatingValue(movie.rating || "");
                      }}
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
      {ratingMovie && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Rate "{ratingMovie.title}"</h2>

            <input
              type="number"
              min="1"
              max="10"
              step="1"
              value={ratingValue}
              onChange={(e) => {
                let val = e.target.value;

                if (val === "") {
                  setRatingValue("");
                  return;
                }

                val = Number(val);

                // clamp between 1–10
                if (val < 1) val = 1;
                if (val > 10) val = 10;

                setRatingValue(val);
              }}
              placeholder="Enter rating (1–10)"
            />

            <div className="popup-buttons">
              <button
                onClick={async () => {
                  const id = ratingMovie.id || ratingMovie.movieId;

                  const numericRating = Number(ratingValue);

                  if (!numericRating || numericRating < 1 || numericRating > 10) {
                    alert("Rating must be between 1 and 10");
                    return;
                  }

                  try {
                    await fetch(`${API_BASE}/api/favourites`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: token,
                      },
                      body: JSON.stringify({
                        movieId: id,
                        title: ratingMovie.title,
                        posterPath:
                          ratingMovie.poster_path || ratingMovie.posterPath,
                        releaseDate:
                          ratingMovie.release_date || ratingMovie.releaseDate,
                        rating: ratingValue,
                      }),
                    });

                    // update favourites locally
                    setFavouriteIds((prev) => new Set([...prev, id]));

                    // optionally update movies with rating
                    setMovies((prev) => ({
                      classic: prev.classic.map((m) =>
                        (m.id || m.movieId) === id
                          ? { ...m, rating: ratingValue }
                          : m
                      ),
                      modern: prev.modern.map((m) =>
                        (m.id || m.movieId) === id
                          ? { ...m, rating: ratingValue }
                          : m
                      ),
                    }));

                    setRatingMovie(null);
                    setRatingValue("");
                  } catch (err) {
                    console.error(err);
                  }
                }}
              >
                Save
              </button>

              <button
                onClick={() => {
                  setRatingMovie(null);
                  setRatingValue("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}