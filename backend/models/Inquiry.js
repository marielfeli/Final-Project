
const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    propertyName: {
      type: String,
      required: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
    ownerEmail: {
      type: String,
      required: true,
    },
    tenantName: {
      type: String,
      required: true,
    },
    tenantEmail: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["New", "Read"],
      default: "New",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inquiry", inquirySchema);
