
const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");
const { protect } = require("../middleware/authMiddleware");

// GET ALL NOTIFICATIONS + UNREAD COUNT
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({
      recipient: userId,
    })
      .populate("sender", "name")
      .sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error.message);

    res.status(500).json({
      message: "Failed to load notifications.",
    });
  }
});

// MARK ONE NOTIFICATION AS READ
router.patch("/:id/read", protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.user._id,
      },
      {
        isRead: true,
      },
      {
        new: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    res.json({
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error.message);

    res.status(500).json({
      message: "Failed to update notification.",
    });
  }
});

// MARK ALL NOTIFICATIONS AS READ
router.patch("/read-all", protect, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    res.json({
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error.message);

    res.status(500).json({
      message: "Failed to update notifications.",
    });
  }
});

// DELETE NOTIFICATION
router.delete("/:id", protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    res.json({
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    console.error("Delete notification error:", error.message);

    res.status(500).json({
      message: "Failed to delete notification.",
    });
  }
});

module.exports = router;
