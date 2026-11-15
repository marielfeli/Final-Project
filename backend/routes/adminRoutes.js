const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Property = require("../models/Property");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

// ADMIN DASHBOARD STATISTICS
router.get("/dashboard", protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTenants = await User.countDocuments({ role: "tenant" });
    const totalOwners = await User.countDocuments({ role: "owner" });
    const totalProperties = await Property.countDocuments();

    res.json({
      totalUsers,
      totalTenants,
      totalOwners,
      totalProperties,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load dashboard statistics.",
      error: error.message,
    });
  }
});

// GET ALL USERS
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load users.",
      error: error.message,
    });
  }
});

// GET ALL PROPERTIES
router.get("/properties", protect, adminOnly, async (req, res) => {
  try {
    const properties = await Property.find()
      .sort({ createdAt: -1 });

    res.json(properties);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load properties.",
      error: error.message,
    });
  }
});

// DELETE PROPERTY (ADMIN ONLY)
router.delete("/properties/:id", protect, adminOnly, async (req, res) => {
  try {
    const deletedProperty = await Property.findByIdAndDelete(
      req.params.id
    );

    if (!deletedProperty) {
      return res.status(404).json({
        message: "Property not found.",
      });
    }

    res.json({
      message: "Property deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete property.",
      error: error.message,
    });
  }
});

module.exports = router;