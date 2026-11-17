
const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["tenant", "owner", "admin"], default: "tenant" },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Property" }],
  accountStatus: { type: String, enum: ["active", "deactivated", "suspended"], default: "active" },
  verificationStatus: { type: String, enum: ["not_required", "pending", "approved", "rejected", "revision"], default: "not_required" },
  verificationNote: { type: String, default: "" },
  validIdUrl: { type: String, default: "" },
  ownershipProofUrl: { type: String, default: "" }
}, { timestamps: true });
module.exports = mongoose.model("User", userSchema);
