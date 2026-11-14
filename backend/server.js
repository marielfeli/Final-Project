
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Property Routes
const propertyRoutes = require("./routes/propertyRoutes");
app.use("/api/properties", propertyRoutes);

// Authentication Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// Inquiry Routes
const inquiryRoutes = require("./routes/inquiryRoutes");
app.use("/api/inquiries", inquiryRoutes);

// Favorite Routes
const favoriteRoutes = require("./routes/favoriteRoutes");
app.use("/api/favorites", favoriteRoutes);

// Home Route
app.get("/", (req, res) => {
  res.send("StayFinder Backend is Running!");
});

// Server and MongoDB Connection
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error.message);
  });
