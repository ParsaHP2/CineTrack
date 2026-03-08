import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:5000";
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

function FavouriteCard({ favourite, onRemove }) {
  const posterUrl = favourite.posterPath
    ? favourite.posterPath.startsWith("http")
      ? favourite.posterPath
      : `https://image.tmdb.org/t/p/w500${favourite.posterPath}`
    : null;

  const year = favourite.releaseDate ? favourite.releaseDate.slice(0, 4) : "—";

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
        {favourite.rating !== null && favourite.rating !== undefined && (
          <p className="movie-rating">⭐ {favourite.rating}/10</p>
        )}
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
  const [showPopup, setShowPopup] = useState(false);

  const username = token ? jwtDecode(token).username : null;

  const [newMovie, setNewMovie] = useState({
    title: "",
    releaseDate: "",
    posterPath: "",
    rating: "",
  });

  const handleInputChange = (e) => {
    setNewMovie({ ...newMovie, [e.target.name]: e.target.value });
  };

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

  const handleAddMovie = async () => {
    try {
      // convert rating to number if valid
      const ratingNum = parseInt(newMovie.rating, 10);
      const body = {
        movieId: Date.now(), // unique for custom movies
        title: newMovie.title,
        posterPath: newMovie.posterPath,
        releaseDate: newMovie.releaseDate,
      };
      if (!isNaN(ratingNum)) body.rating = ratingNum;

      const response = await fetch(`${API_BASE}/api/favourites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Failed to add movie");

      const savedMovie = await response.json();

      setFavourites([...favourites, savedMovie]);

      // Reset form
      setNewMovie({ title: "", releaseDate: "", posterPath: "", rating: "" });
      setShowPopup(false);
    } catch (err) {
      console.error(err);
      setError("Could not add movie.");
    }
  };

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
        <h2 className="welcome-greeting">My Favourites</h2>

        <button className="add-movie-btn" onClick={() => setShowPopup(true)}>
          + Add Your Own Movie
        </button>

        {loading ? (
          <p className="loading">Loading favourites…</p>
        ) : favourites.length === 0 ? (
          <p className="section-empty">
            No favourites yet. <Link to="/dashboard">Browse movies</Link> to add some!
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

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Add Your Own Movie</h2>

            <input
              type="text"
              name="title"
              placeholder="Movie Name"
              value={newMovie.title}
              onChange={handleInputChange}
            />

            <input
              type="date"
              name="releaseDate"
              value={newMovie.releaseDate}
              onChange={handleInputChange}
            />

            <input
              type="text"
              name="posterPath"
              placeholder="Poster Image URL"
              value={newMovie.posterPath}
              onChange={handleInputChange}
            />

            <input
              type="number"
              min="1"
              max="10"
              name="rating"
              placeholder="Personal Rating (1-10)"
              value={newMovie.rating}
              onChange={handleInputChange}
            />

            <div className="popup-buttons">
              <button onClick={handleAddMovie}>Add Movie</button>
              <button onClick={() => setShowPopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}