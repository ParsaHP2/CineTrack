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

function isReleaseYearInRange(movie, from, to) {
  const date = String(movie?.release_date || "");
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) && year >= from && year <= to;
}

async function fetchModernVariety() {
  const currentYear = new Date().getFullYear();
  const ranges = [
    { from: 1961, to: 1979, take: 5 },
    { from: 1980, to: 1999, take: 5 },
    { from: 2000, to: 2014, take: 5 },
    { from: 2015, to: currentYear, take: 5 },
  ];

  const bucketResults = await Promise.all(
    ranges.map(async ({ from, to, take }) => {
      const data = await fetchDiscover(from, to);
      const valid = (data.results || []).filter((movie) =>
        isReleaseYearInRange(movie, from, to),
      );
      return valid.slice(0, take);
    }),
  );

  return bucketResults.flat();
}

// GET /api/movies/trending -> { classic: [...], modern: [...] }
router.get("/trending", async (req, res) => {
  if (!API_KEY) {
    return res.status(503).json({
      message: "Movie API not configured (TMDB_API_KEY missing)",
    });
  }
  try {
    const currentYear = new Date().getFullYear();
    const [classicRes, modernMovies] = await Promise.all([
      fetchDiscover(1900, 1960),
      fetchModernVariety(),
    ]);

    res.json({
      classic: (classicRes.results || []).filter((movie) =>
        isReleaseYearInRange(movie, 1900, 1960),
      ),
      modern: modernMovies.filter((movie) =>
        isReleaseYearInRange(movie, 1961, currentYear),
      ),
    });
  } catch (err) {
    console.error(err);
    res.status(502).json({ message: "Failed to fetch movies from TMDB" });
  }
});

// GET /api/movies/:movieId/details — synopsis & metadata from TMDB (for modal)
router.get("/:movieId/details", async (req, res) => {
  const movieId = Number(req.params.movieId);
  if (!Number.isFinite(movieId) || movieId < 1) {
    return res.status(400).json({ message: "Invalid movie id" });
  }
  if (!API_KEY) {
    return res.status(503).json({
      message: "Movie API not configured (TMDB_API_KEY missing)",
    });
  }
  try {
    const url = `${TMDB_BASE}/movie/${movieId}?api_key=${API_KEY}`;
    const tmdbRes = await fetch(url);
    if (tmdbRes.status === 404) {
      return res.json({
        notFound: true,
        title: null,
        overview: null,
        poster_path: null,
        release_date: null,
      });
    }
    if (!tmdbRes.ok) {
      throw new Error("TMDB request failed");
    }
    const data = await tmdbRes.json();
    res.json({
      notFound: false,
      title: data.title,
      overview: data.overview,
      poster_path: data.poster_path,
      release_date: data.release_date,
      vote_average: data.vote_average,
      runtime: data.runtime,
    });
  } catch (err) {
    console.error(err);
    res.status(502).json({ message: "Failed to fetch movie details" });
  }
});

module.exports = router;
