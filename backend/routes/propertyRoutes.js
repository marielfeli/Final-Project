
const express = require("express");
const router = express.Router();
const Property = require("../models/Property");
const { protect, ownerOnly } = require("../middleware/authMiddleware");

// GET all properties (PUBLIC)
router.get("/", async (req, res) => {
  try {
    const properties = await Property.find();
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET one property (PUBLIC)
router.get("/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ADD a property (OWNER ONLY)
router.post("/", protect, ownerOnly, async (req, res) => {
  try {
    const property = new Property({
      ...req.body,
      image: req.body.image,
      photos: Array.isArray(req.body.photos)
        ? req.body.photos
        : [req.body.image],
      ownerName: req.user.name,
      ownerEmail: req.user.email,
    });

    const savedProperty = await property.save();
    res.status(201).json(savedProperty);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE a property (OWNER ONLY)
router.put("/:id", protect, ownerOnly, async (req, res) => {
  try {
    const updatedProperty = await Property.findOneAndUpdate(
      {
        _id: req.params.id,
        ownerEmail: req.user.email,
      },
      {
        ...req.body,
        image: req.body.image,
        photos: Array.isArray(req.body.photos)
          ? req.body.photos
          : [req.body.image],
        ownerName: req.user.name,
        ownerEmail: req.user.email,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedProperty) {
      return res.status(404).json({
        message: "Property not found or you do not own this property.",
      });
    }

    res.json({
      message: "Property updated successfully",
      property: updatedProperty,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a property (OWNER ONLY)
router.delete("/:id", protect, ownerOnly, async (req, res) => {
  try {
    const deletedProperty = await Property.findOneAndDelete({
      _id: req.params.id,
      ownerEmail: req.user.email,
    });

    if (!deletedProperty) {
      return res.status(404).json({
        message: "Property not found or you do not own this property.",
      });
    }

    res.json({ message: "Property deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
