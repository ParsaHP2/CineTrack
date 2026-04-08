const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Visitor endpoint: creates a new Member account.
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      role: "user",
      isBanned: false,
    });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Visitor endpoint: returns JWT used for Member/Admin access.
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isBanned) {
      return res
        .status(403)
        .json({ message: "Your account has been banned. Contact an admin." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const secret = process.env.JWT_SECRET;
    if (!secret)
      return res.status(500).json({ message: "Server misconfiguration" });
    // JWT payload includes user's database ID and username (assignment requirement)
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role || "user",
        isBanned: Boolean(user.isBanned),
      },
      secret,
      { expiresIn: "1h" },
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role || "user",
        isBanned: Boolean(user.isBanned),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
