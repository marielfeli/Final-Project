
const mongoose = require("mongoose");
const bookingSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
  propertyName: { type: String, required: true },
  ownerEmail: { type: String, required: true, index: true },
  ownerName: { type: String, default: "" },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  moveInDate: { type: Date, required: true },
  durationMonths: { type: Number, min: 1, required: true },
  occupants: { type: Number, min: 1, required: true },
  message: { type: String, default: "" },
  status: { type: String, enum: ["pending", "approved", "rejected", "completed", "cancelled"], default: "pending" },
  rejectionReason: { type: String, default: "" }
}, { timestamps: true });
module.exports = mongoose.model("Booking", bookingSchema);
