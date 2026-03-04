const jwt = require("jsonwebtoken");

// [Part 1: verifyToken middleware] Rejects with 401 if no valid token in Authorization header
function verifyToken(req, res, next) {
  const token = req.header("Authorization");

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
    res.status(401).json({ error: "Invalid token" }); // 401 Unauthorized for invalid/expired token
  }
}

module.exports = verifyToken;
