const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Comment = require("../models/Comment");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/:movieId/comments", async (req, res) => {
  const movieId = Number(req.params.movieId);
  if (!Number.isFinite(movieId)) {
    return res.status(400).json({ message: "Invalid movie id" });
  }
  try {
    const list = await Comment.find({ movieId })
      .sort({ createdAt: 1 })
      .lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:movieId/comments", verifyToken, async (req, res) => {
  const movieId = Number(req.params.movieId);
  if (!Number.isFinite(movieId)) {
    return res.status(400).json({ message: "Invalid movie id" });
  }
  const text = String(req.body.text || "").trim();
  if (!text) {
    return res.status(400).json({ message: "Comment text required" });
  }
  if (text.length > 2000) {
    return res.status(400).json({ message: "Comment too long (max 2000 characters)" });
  }
  try {
    const username = req.username || "Member";
    const comment = new Comment({
      movieId,
      userId: String(req.userId),
      username,
      text,
    });
    await comment.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:movieId/comments/:commentId", verifyToken, async (req, res) => {
  const movieId = Number(req.params.movieId);
  const { commentId } = req.params;
  if (!Number.isFinite(movieId)) {
    return res.status(400).json({ message: "Invalid movie id" });
  }
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(400).json({ message: "Invalid comment id" });
  }
  const text = String(req.body.text || "").trim();
  if (!text) {
    return res.status(400).json({ message: "Comment text required" });
  }
  if (text.length > 2000) {
    return res
      .status(400)
      .json({ message: "Comment too long (max 2000 characters)" });
  }
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (Number(comment.movieId) !== movieId) {
      return res
        .status(400)
        .json({ message: "Comment does not belong to this movie" });
    }
    if (String(comment.userId) !== String(req.userId)) {
      return res.status(403).json({ message: "You can only edit your own comments" });
    }
    comment.text = text;
    comment.updatedAt = new Date();
    await comment.save();
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:movieId/comments/:commentId", verifyToken, async (req, res) => {
  const movieId = Number(req.params.movieId);
  const { commentId } = req.params;
  if (!Number.isFinite(movieId)) {
    return res.status(400).json({ message: "Invalid movie id" });
  }
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(400).json({ message: "Invalid comment id" });
  }
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (Number(comment.movieId) !== movieId) {
      return res
        .status(400)
        .json({ message: "Comment does not belong to this movie" });
    }
    if (String(comment.userId) !== String(req.userId)) {
      return res.status(403).json({ message: "You can only delete your own comments" });
    }
    await Comment.findByIdAndDelete(commentId);
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
