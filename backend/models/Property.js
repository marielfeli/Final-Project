
const mongoose = require("mongoose");
const propertySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  type: { type: String, required: true },
  image: { type: String, required: true },
  photos: { type: [String], default: [] },
  description: { type: String, required: true },
  amenities: { type: [String], default: [] },
  ownerName: { type: String, default: "Property Owner" },
  ownerEmail: { type: String, default: "", index: true },
  bedrooms: { type: Number, default: 0 },
  bathrooms: { type: Number, default: 0 },
  maxOccupants: { type: Number, default: 1 },
  availability: { type: String, enum: ["available", "unavailable", "occupied"], default: "available" },
  status: { type: String, enum: ["pending", "approved", "rejected", "revision"], default: "approved" },
  rejectionReason: { type: String, default: "" }
}, { timestamps: true });
module.exports = mongoose.model("Property", propertySchema);
