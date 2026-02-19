const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  // 1. Get token from header
  const token = req.header("Authorization");

  // 2. Check if token exists
  if (!token) return res.status(401).json({ error: "Access denied" });

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Server misconfiguration" });
  }
  try {
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.id; // Add user ID to request
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = verifyToken;
