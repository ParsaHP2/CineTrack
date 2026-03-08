import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:5000";
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

function MovieCard({ movie }) {
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
      </div>
      <div className="movie-info">
        <h3>{movie.title}</h3>
        <p className="movie-year">{year}</p>
      </div>
    </div>
  );
}

export default function PublicDashboard() {
  const [movies, setMovies] = useState({ classic: [], modern: [] });
  const [loading, setLoading] = useState(true);

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
      .catch(() => setMovies({ classic: [], modern: [] }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <header className="main-header">
        <h1>CineTrack</h1>
        <nav className="nav-links">
          <Link to="/public-dashboard" className="nav-active">Browse</Link>
          <Link to="/login">Login / Register</Link>
        </nav>
      </header>

      <main className="content">
        <h2>Browse Movies</h2>
        {loading ? (
          <p className="loading">Loading movies…</p>
        ) : (
          <>
            <section className="movie-section">
              <h2>Classic (1900 – 1960)</h2>
              <div className="movie-grid">
                {movies.classic.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </section>
            <section className="movie-section">
              <h2>Modern (1961 – 2025)</h2>
              <div className="movie-grid">
                {movies.modern.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}