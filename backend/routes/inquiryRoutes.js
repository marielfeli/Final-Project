
const express = require("express");
const router = express.Router();

const Inquiry = require("../models/Inquiry");
const Property = require("../models/Property");
const { protect, ownerOnly } = require("../middleware/authMiddleware");

// TENANT SEND INQUIRY
router.post("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "tenant") {
      return res.status(403).json({
        message: "Only tenant accounts can send inquiries.",
      });
    }

    const { propertyId, message } = req.body;

    if (!propertyId || !message || !message.trim()) {
      return res.status(400).json({
        message: "Property and message are required.",
      });
    }

    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        message: "Property not found.",
      });
    }

    const inquiry = new Inquiry({
      propertyId: property._id,
      propertyName: property.name,
      ownerName: property.ownerName,
      ownerEmail: property.ownerEmail,
      tenantName: req.user.name,
      tenantEmail: req.user.email,
      message: message.trim(),
    });

    const savedInquiry = await inquiry.save();

    res.status(201).json({
      message: "Inquiry sent successfully!",
      inquiry: savedInquiry,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// OWNER VIEW INQUIRIES
router.get("/my-inquiries", protect, ownerOnly, async (req, res) => {
  try {
    const inquiries = await Inquiry.find({
      ownerEmail: req.user.email,
    }).sort({ createdAt: -1 });

    res.json(inquiries);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// TENANT VIEW OWN INQUIRIES
router.get("/tenant-inquiries", protect, async (req, res) => {
  try {
    if (req.user.role !== "tenant") {
      return res.status(403).json({
        message: "Only tenant accounts can view their inquiries.",
      });
    }

    const inquiries = await Inquiry.find({
      tenantEmail: req.user.email,
    }).sort({ createdAt: -1 });

    res.json(inquiries);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// MARK INQUIRY AS READ
router.patch("/:id/read", protect, ownerOnly, async (req, res) => {
  try {
    const inquiry = await Inquiry.findOne({
      _id: req.params.id,
      ownerEmail: req.user.email,
    });

    if (!inquiry) {
      return res.status(404).json({
        message: "Inquiry not found.",
      });
    }

    inquiry.status = "Read";
    await inquiry.save();

    res.json({
      message: "Inquiry marked as read!",
      inquiry,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;
