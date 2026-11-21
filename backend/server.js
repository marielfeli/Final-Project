
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// SECURITY HEADERS
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

// PROPERTY ROUTES
const propertyRoutes = require("./routes/propertyRoutes");
app.use("/api/properties", propertyRoutes);

// AUTHENTICATION ROUTES
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// INQUIRY ROUTES
const inquiryRoutes = require("./routes/inquiryRoutes");
app.use("/api/inquiries", inquiryRoutes);

// FAVORITE ROUTES
const favoriteRoutes = require("./routes/favoriteRoutes");
app.use("/api/favorites", favoriteRoutes);

// BOOKING ROUTES
const bookingRoutes = require("./routes/bookingRoutes");
app.use("/api/bookings", bookingRoutes);

// CHAT ROUTES
const chatRoutes = require("./routes/chatRoutes");
app.use("/api/chat", chatRoutes);

// ADMIN ROUTES
const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

// NOTIFICATION ROUTES
const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

// HOME ROUTE
app.get("/", (req, res) => {
  res.json({
    message: "StayFinder Backend is Running!",
    status: "OK",
  });
});

// NOT FOUND ROUTE
app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found.",
  });
});

// GENERAL ERROR HANDLER
app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(error.status || 500).json({
    message: "An unexpected server error occurred.",
  });
});

// SERVER AND DATABASE CONNECTION
const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is missing from backend/.env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully!");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  });

