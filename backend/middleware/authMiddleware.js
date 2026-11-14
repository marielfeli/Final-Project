
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// VERIFY TOKEN
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found.",
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error("JWT ERROR:", error.message);
    
    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};

// CHECK OWNER ROLE
const ownerOnly = (req, res, next) => {
  if (req.user && req.user.role === "owner") {
    return next();
  }

  return res.status(403).json({
    message: "Access denied. Owner account required.",
  });
};

module.exports = { protect, ownerOnly };
