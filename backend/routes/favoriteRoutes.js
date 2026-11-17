
const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Property = require("../models/Property");
const { protect } = require("../middleware/authMiddleware");

// CHECK TENANT ROLE
const tenantOnly = (req, res, next) => {
  if (req.user.role !== "tenant") {
    return res.status(403).json({
      message: "Only tenant accounts can manage favorites.",
    });
  }

  next();
};

// GET TENANT FAVORITES
router.get("/", protect, tenantOnly, async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.user.email,
    }).populate("favorites");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.status(200).json(user.favorites);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch favorites.",
      error: error.message,
    });
  }
});

// ADD FAVORITE
router.post("/:propertyId", protect, tenantOnly, async (req, res) => {
  try {
    const property = await Property.findById(req.params.propertyId);

    if (!property) {
      return res.status(404).json({
        message: "Property not found.",
      });
    }

    const user = await User.findOneAndUpdate(
      { email: req.user.email },
      { $addToSet: { favorites: property._id } },
      { new: true }
    ).populate("favorites");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.status(200).json({
      message: "Property added to favorites.",
      favorites: user.favorites,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add favorite.",
      error: error.message,
    });
  }
});

// REMOVE FAVORITE
router.delete("/:propertyId", protect, tenantOnly, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { email: req.user.email },
      { $pull: { favorites: req.params.propertyId } },
      { new: true }
    ).populate("favorites");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.status(200).json({
      message: "Property removed from favorites.",
      favorites: user.favorites,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to remove favorite.",
      error: error.message,
    });
  }
});

module.exports = router;
