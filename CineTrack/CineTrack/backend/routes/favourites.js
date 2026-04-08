const express = require("express");
const router = express.Router();
const Favourite = require("../models/Favourite");
const { verifyToken } = require("../middleware/authMiddleware");

// GET /api/favourites
router.get("/", verifyToken, async (req, res) => {
  try {
    const list = await Favourite.find({ userId: req.userId }).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/favourites
router.post("/", verifyToken, async (req, res) => {
  try {
    const { movieId, title, posterPath, releaseDate, rating } = req.body;
    if (!movieId) return res.status(400).json({ message: "movieId required" });

    const username = req.user.username; // use the username from verifyToken

    const ratingNum =
      rating !== undefined && rating !== null && rating !== ""
        ? Number(rating)
        : null;

    // Check if favourite already exists for this user
    let existing = await Favourite.findOne({
      userId: req.userId,       // keep as string
      movieId: Number(movieId),
    });

    if (existing) {
      // Update rating and username if it exists
      existing.rating = ratingNum;
      existing.username = username;
      await existing.save();
      return res.json(existing);
    }

    // Create new favourite
    const fav = new Favourite({
      userId: req.userId,
      movieId: Number(movieId),
      title: title || null,
      posterPath: posterPath || null,
      releaseDate: releaseDate || null,
      rating: ratingNum,
      username: username,
    });

    await fav.save();
    res.status(201).json(fav);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/favourites/:movieId
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