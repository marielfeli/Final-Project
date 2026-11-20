const express = require("express");
const router = express.Router();

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Property = require("../models/Property");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

// ==========================================
// START OR GET EXISTING CONVERSATION
// ==========================================
router.post("/start/:propertyId", protect, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const customerId = req.user._id;

    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        message: "Property not found.",
      });
    }

    // Find property owner using existing ownerEmail field
    const owner = await User.findOne({
      email: property.ownerEmail.toLowerCase(),
      role: "owner",
    });

    if (!owner) {
      return res.status(404).json({
        message: "Property owner account not found.",
      });
    }

    // Customer cannot message their own property
    if (owner._id.toString() === customerId.toString()) {
      return res.status(400).json({
        message: "You cannot message your own property.",
      });
    }

    // Only tenant/customer can initiate a new conversation
    if (req.user.role !== "tenant") {
      return res.status(403).json({
        message: "Only customers can start a property inquiry.",
      });
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      property: property._id,
      participants: { $all: [customerId, owner._id] },
    });

    // Create new conversation if none exists
    if (!conversation) {
      conversation = await Conversation.create({
        property: property._id,
        participants: [customerId, owner._id],
            lastMessage: "",
        lastMessageAt: new Date(),
      });
    }

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "name email role")
      .populate("property", "name location price image");

    res.status(200).json({
      message: "Conversation ready.",
      conversation: populatedConversation,
    });
  } catch (error) {
    console.error("START CHAT ERROR:", error);
    res.status(500).json({
      message: "Failed to start conversation.",
    });
  }
});

// ==========================================
// GET USER CONVERSATIONS / INBOX
// ==========================================
router.get("/", protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "name email role")
      .populate("property", "name location price image")
      .sort({ lastMessageAt: -1 });

    // Get unread message count per conversation
    const results = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          sender: { $ne: req.user._id },
          isRead: false,
        });

        return {
          ...conversation.toObject(),
          unreadCount,
        };
      })
    );

    res.json(results);
  } catch (error) {
    console.error("GET CONVERSATIONS ERROR:", error);
    res.status(500).json({
      message: "Failed to load conversations.",
    });
  }
});

// ==========================================
// GET MESSAGES IN A CONVERSATION
// ==========================================
router.get("/:conversationId/messages", protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(
      req.params.conversationId
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found.",
      });
    }

    // Check if current user is a participant
    const isParticipant = conversation.participants.some(
      (participant) =>
        participant.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not allowed to access this conversation.",
      });
    }

    const messages = await Message.find({
      conversation: conversation._id,
    })
      .populate("sender", "name email role")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("GET MESSAGES ERROR:", error);
    res.status(500).json({
      message: "Failed to load messages.",
    });
  }
});

// ==========================================
// SEND MESSAGE
// ==========================================
router.post("/:conversationId/messages", protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Message cannot be empty.",
      });
    }

    const conversation = await Conversation.findById(
      req.params.conversationId
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found.",
      });
    }

    // Check participant permission
    const isParticipant = conversation.participants.some(
      (participant) =>
        participant.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not allowed to send messages here.",
      });
    }

    // Save message
    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text: text.trim(),
    });

    // Update conversation's latest message
    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name email role");

    res.status(201).json({
      message: "Message sent successfully.",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);
    res.status(500).json({
      message: "Failed to send message.",
    });
  }
});

// ==========================================
// MARK MESSAGES AS READ
// ==========================================
router.patch("/:conversationId/read", protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(
      req.params.conversationId
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found.",
      });
    }

    const isParticipant = conversation.participants.some(
      (participant) =>
        participant.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not allowed to access this conversation.",
      });
    }

    await Message.updateMany(
      {
        conversation: conversation._id,
        sender: { $ne: req.user._id },
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    res.json({
      message: "Messages marked as read.",
    });
  } catch (error) {
    console.error("MARK READ ERROR:", error);
    res.status(500).json({
      message: "Failed to mark messages as read.",
    });
  }
});

module.exports = router;