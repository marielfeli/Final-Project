
const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      default: "",
    },
    storageName: {
      type: String,
      default: "",
    },
    mimeType: {
      type: String,
      enum: ["image/jpeg", "image/png", "application/pdf", ""],
      default: "",
    },
    size: {
      type: Number,
      default: 0,
    },
    uploadedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["tenant", "owner", "admin"],
      default: "tenant",
    },

    phone: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
      },
    ],

    accountStatus: {
      type: String,
      enum: ["active", "deactivated", "suspended"],
      default: "active",
    },

    verificationStatus: {
      type: String,
      enum: [
        "not_required",
        "pending",
        "approved",
        "rejected",
        "revision",
      ],
      default: "not_required",
    },

    verificationNote: {
      type: String,
      default: "",
    },

    // Legacy document URL fields.
    // Retained for compatibility with existing records.
    validIdUrl: {
      type: String,
      default: "",
    },

    ownershipProofUrl: {
      type: String,
      default: "",
    },

    // New private document metadata.
    // Actual files are stored outside the public folder.
    validIdDocument: {
      type: documentSchema,
      default: () => ({}),
    },

    ownershipProofDocument: {
      type: documentSchema,
      default: () => ({}),
    },

    documentsSubmittedAt: {
      type: Date,
      default: null,
    },

    documentsReviewedAt: {
      type: Date,
      default: null,
    },

    documentsReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
