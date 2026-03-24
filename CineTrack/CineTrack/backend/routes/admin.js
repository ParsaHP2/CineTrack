const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

router.get("/users", verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ username: 1 }).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/users/:id/ban", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (String(id) === String(req.userId)) {
      return res.status(400).json({ message: "You cannot ban your own account" });
    }
    const user = await User.findByIdAndUpdate(id, { isBanned: true }, { new: true }).select(
      "-password",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/users/:id/unban", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { isBanned: false }, { new: true }).select(
      "-password",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
