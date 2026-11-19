const express = require("express");
const router = express.Router();
const Property = require("../models/Property");
const { protect, ownerOnly } = require("../middleware/authMiddleware");

// PUBLIC CATALOG
// Only approved listings are visible.
// Legacy records without a status remain visible.
router.get("/", async (req, res) => {
  try {
    const properties = await Property.find({
      $or: [
        { status: "approved" },
        { status: { $exists: false } }
      ]
    }).sort({ createdAt: -1 });

    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// MY PROPERTIES
router.get("/mine", protect, ownerOnly, async (req, res) => {
  try {
    const properties = await Property.find({
      ownerEmail: req.user.email
    }).sort({ createdAt: -1 });

    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// SINGLE PROPERTY
router.get("/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (
      !property ||
      (property.status && property.status !== "approved")
    ) {
      return res.status(404).json({
        message: "Apartment not found or not approved."
      });
    }

    res.json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADD PROPERTY
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
      status: "pending"
    });

    const saved = await property.save();

    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE PROPERTY
// ADMIN: Can update any property
// OWNER: Can update only their own property
router.put("/:id", protect, ownerOnly, async (req, res) => {
  try {
    let updated;

    if (req.user.role === "admin") {
      // Admin can update any apartment without owner restriction
      updated = await Property.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        {
          new: true,
          runValidators: true
        }
      );
    } else {
      // Owner can update only their own apartment
      updated = await Property.findOneAndUpdate(
        {
          _id: req.params.id,
          ownerEmail: req.user.email
        },
        {
          $set: {
            ...req.body,
            ownerName: req.user.name,
            ownerEmail: req.user.email,
            status: "pending"
          }
        },
        {
          new: true,
          runValidators: true
        }
      );
    }

    if (!updated) {
      return res.status(404).json({
        message: "Apartment not found or not owned by you."
      });
    }

    res.json({
      message: req.user.role === "admin"
        ? "Apartment updated successfully."
        : "Changes submitted for Admin review.",
      property: updated
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE PROPERTY
// ADMIN: Can delete any property
// OWNER: Can delete only their own property
router.delete("/:id", protect, ownerOnly, async (req, res) => {
  try {
    let deleted;

    // ADMIN CAN DELETE ANY APARTMENT
    if (req.user.role === "admin") {
      deleted = await Property.findByIdAndDelete(req.params.id);
    } 
    // OWNER CAN DELETE ONLY THEIR OWN APARTMENT
    else {
      deleted = await Property.findOneAndDelete({
        _id: req.params.id,
        ownerEmail: req.user.email
      });
    }

    if (!deleted) {
      return res.status(404).json({
        message: "Apartment not found or not allowed to delete."
      });
    }

    res.json({
      message: "Apartment deleted successfully."
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

module.exports = router;