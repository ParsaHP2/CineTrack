const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");

const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;
if (!API_KEY) {
  console.warn(
    "TMDB_API_KEY is not set. Set it in .env for /api/movies/trending to work.",
  );
}

async function fetchDiscover(from, to, page = 1) {
  const url = `${TMDB_BASE}/discover/movie?api_key=${API_KEY}&primary_release_date.gte=${from}-01-01&primary_release_date.lte=${to}-12-31&sort_by=popularity.desc&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("TMDB request failed");
  return res.json();
}

// GET /api/movies/trending -> { classic: [...], modern: [...] }
router.get("/trending", async (req, res) => {
  if (!API_KEY) {
    return res.status(503).json({
      message: "Movie API not configured (TMDB_API_KEY missing)",
    });
  }
  try {
    const [classicRes, modernRes] = await Promise.all([
      fetchDiscover(1900, 1960),
      fetchDiscover(1961, 2025),
    ]);

    res.json({
      classic: classicRes.results || [],
      modern: modernRes.results || [],
    });
  } catch (err) {
    console.error(err);
    res.status(502).json({ message: "Failed to fetch movies from TMDB" });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const { movieId, title, posterPath, releaseDate, rating } = req.body;
    if (!movieId) return res.status(400).json({ message: "movieId required" });

    const existing = await Favourite.findOne({
      userId: req.userId,
      movieId: Number(movieId),
    });

    if (existing) return res.status(201).json(existing);

    const fav = new Favourite({
      userId: req.userId,
      movieId: Number(movieId),
      title: title || null,
      posterPath: posterPath || null,
      releaseDate: releaseDate || null,
      rating: rating !== undefined ? Number(rating) : null,
    });

    await fav.save();
    res.status(201).json(fav);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
