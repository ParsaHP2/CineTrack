const express = require("express");
const router = express.Router();
const Favourite = require("../models/Favourite");
const { verifyToken } = require("../middleware/authMiddleware");

// [Part 1: Protected Domain Routes] verifyToken applied to GET, POST, DELETE - 401 if no valid token
router.get("/", verifyToken, async (req, res) => {
  try {
    const list = await Favourite.find({ userId: req.userId }).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
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

    const ratingNum =
      rating !== undefined && rating !== null && rating !== ""
        ? Number(rating)
        : null;

    const fav = new Favourite({
      userId: req.userId,
      movieId: Number(movieId),
      title: title || null,
      posterPath: posterPath || null,
      releaseDate: releaseDate || null,
      rating: ratingNum,
    });

    await fav.save();
    res.status(201).json(fav);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:movieId", verifyToken, async (req, res) => {
  try {
    const movieId = Number(req.params.movieId);
    await Favourite.findOneAndDelete({ userId: req.userId, movieId });
    res.json({ message: "Removed from favourites" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
