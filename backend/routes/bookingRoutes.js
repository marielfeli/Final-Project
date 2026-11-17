
const express = require("express");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const { protect, ownerOnly } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "tenant") return res.status(403).json({ message: "Only customers can request bookings." });
    const { propertyId, moveInDate, durationMonths, occupants, message } = req.body;
    if (!mongoose.isValidObjectId(propertyId) || !moveInDate || !durationMonths || !occupants) {
      return res.status(400).json({ message: "Property, move-in date, duration and occupants are required." });
    }
    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: "Apartment not found." });
    if (property.status && property.status !== "approved") return res.status(400).json({ message: "This apartment is not approved for booking." });
    const booking = await Booking.create({
      propertyId: property._id, propertyName: property.name, ownerEmail: property.ownerEmail,
      ownerName: property.ownerName, customerId: req.user._id, customerName: req.user.name,
      customerEmail: req.user.email, moveInDate: new Date(moveInDate),
      durationMonths: Number(durationMonths), occupants: Number(occupants), message: message || ""
    });
    res.status(201).json({ message: "Booking request submitted.", booking });
  } catch (error) { res.status(400).json({ message: error.message }); }
});
router.get("/mine", protect, async (req, res) => {
  if (req.user.role !== "tenant") return res.status(403).json({ message: "Customer access required." });
  const rows = await Booking.find({ customerId: req.user._id }).sort({ createdAt: -1 });
  res.json(rows);
});
router.get("/owner", protect, ownerOnly, async (req, res) => {
  const rows = await Booking.find({ ownerEmail: req.user.email }).sort({ createdAt: -1 });
  res.json(rows);
});
router.patch("/:id/decision", protect, ownerOnly, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ message: "Invalid decision." });
    const booking = await Booking.findOne({ _id: req.params.id, ownerEmail: req.user.email });
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.status !== "pending") return res.status(409).json({ message: "Only pending bookings can be decided." });
    if (status === "rejected" && !String(rejectionReason || "").trim()) return res.status(400).json({ message: "A rejection reason is required." });
    booking.status = status; booking.rejectionReason = status === "rejected" ? rejectionReason : "";
    await booking.save();
    res.json({ message: `Booking ${status}.`, booking });
  } catch (error) { res.status(400).json({ message: error.message }); }
});
module.exports = router;
