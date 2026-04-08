const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Member gate: validates JWT and loads fresh user role/status from DB.
async function verifyToken(req, res, next) {
  const token = req.header("Authorization");

  if (!token) return res.status(401).json({ error: "Access denied" });

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Server misconfiguration" });
  }
  try {
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id).lean();
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    if (user.isBanned) {
      return res
        .status(403)
        .json({ error: "Your account has been banned. Access denied." });
    }
    req.userId = String(user._id);
    req.user = {
      id: String(user._id),
      username: user.username,
      role: user.role || "user",
      isBanned: Boolean(user.isBanned),
    };
    req.username = user.username;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" }); // 401 Unauthorized for invalid/expired token
  }
}

function requireAdmin(req, res, next) {
  // Admin gate: only users with role=admin can continue.
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

module.exports = { verifyToken, requireAdmin };
