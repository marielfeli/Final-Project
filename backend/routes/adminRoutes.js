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
    const pendingProperties = await Property.countDocuments({ status: "pending" });
    const pendingOwnerApplications = await User.countDocuments({ role: "owner", verificationStatus: "pending" });
    const approvedProperties = await Property.countDocuments({ status: "approved" });

    res.json({
      totalUsers,
      totalTenants,
      totalOwners,
      totalProperties,
      pendingProperties,
      pendingOwnerApplications,
      approvedProperties,
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


// ADMIN APPROVES / REJECTS A PROPERTY LISTING
router.patch("/properties/:id/decision", protect, adminOnly, async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!["approved", "rejected", "revision"].includes(status)) return res.status(400).json({ message: "Invalid listing decision." });
    if (status !== "approved" && !String(reason || "").trim()) return res.status(400).json({ message: "Please provide a reason." });
    const property = await Property.findByIdAndUpdate(req.params.id, { status, rejectionReason: status === "approved" ? "" : reason }, { new: true, runValidators: true });
    if (!property) return res.status(404).json({ message: "Apartment not found." });
    res.json({ message: `Listing ${status}.`, property });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

// ADMIN ACTIVATES / DEACTIVATES AN ACCOUNT
router.patch("/users/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const User = require("../models/User");
    const { accountStatus } = req.body;
    if (!["active", "deactivated", "suspended"].includes(accountStatus)) return res.status(400).json({ message: "Invalid account status." });
    const user = await User.findByIdAndUpdate(req.params.id, { accountStatus }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ message: `Account ${accountStatus}.`, user });
  } catch (error) { res.status(400).json({ message: error.message }); }
});


// LIST OWNER APPLICATIONS
router.get("/owner-applications", protect, adminOnly, async (req, res) => {
  try {
    const User = require("../models/User");
    const applications = await User.find({ role: "owner", verificationStatus: { $in: ["pending", "revision", "rejected"] } }).select("-password").sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// ADMIN OWNER VERIFICATION DECISION
router.patch("/users/:id/verification", protect, adminOnly, async (req, res) => {
  try {
    const User = require("../models/User");
    const { verificationStatus, verificationNote } = req.body;
    if (!["approved", "rejected", "revision"].includes(verificationStatus)) return res.status(400).json({ message: "Invalid verification decision." });
    if (verificationStatus !== "approved" && !String(verificationNote || "").trim()) return res.status(400).json({ message: "A reason or revision note is required." });
    const existing = await User.findOne({ _id: req.params.id, role: "owner" });
    if (!existing) return res.status(404).json({ message: "Owner application not found." });
    if (verificationStatus === "approved" && (!existing.validIdUrl || !existing.ownershipProofUrl)) {
      return res.status(400).json({ message: "Valid ID and proof-of-ownership documents must be submitted before approval." });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { verificationStatus, verificationNote: verificationNote || "" }, { new: true }).select("-password");
    res.json({ message: `Owner application ${verificationStatus}.`, user });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

module.exports = router;