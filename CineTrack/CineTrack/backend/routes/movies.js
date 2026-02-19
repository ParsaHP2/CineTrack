const express = require("express");
const router = express.Router();

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

module.exports = router;
