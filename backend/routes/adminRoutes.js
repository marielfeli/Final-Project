
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const User = require("../models/User");
const Property = require("../models/Property");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const { PRIVATE_UPLOAD_DIR } = require("../middleware/documentUpload");

const ALLOWED_DOCUMENT_TYPES = {
  validId: "validIdDocument",
  ownershipProof: "ownershipProofDocument",
};

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

const hasDocument = (owner, documentType) => {
  const document = owner[documentType];

  return Boolean(
    document &&
    document.storageName &&
    document.mimeType &&
    ALLOWED_MIME_TYPES.includes(document.mimeType)
  );
};

// ADMIN DASHBOARD STATISTICS
router.get("/dashboard", protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTenants = await User.countDocuments({ role: "tenant" });
    const totalOwners = await User.countDocuments({ role: "owner" });
    const totalProperties = await Property.countDocuments();

    const pendingProperties = await Property.countDocuments({
      status: "pending",
    });

    const pendingOwnerApplications = await User.countDocuments({
      role: "owner",
      verificationStatus: "pending",
    });

    const approvedProperties = await Property.countDocuments({
      status: "approved",
    });

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
    console.error("Dashboard error:", error);

    res.status(500).json({
      message: "Failed to load dashboard statistics.",
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
    console.error("Get users error:", error);

    res.status(500).json({
      message: "Failed to load users.",
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
    console.error("Get properties error:", error);

    res.status(500).json({
      message: "Failed to load properties.",
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
    console.error("Delete property error:", error);

    res.status(500).json({
      message: "Failed to delete property.",
    });
  }
});

// ADMIN APPROVES / REJECTS A PROPERTY LISTING
router.patch(
  "/properties/:id/decision",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const { status, reason } = req.body;

      if (!["approved", "rejected", "revision"].includes(status)) {
        return res.status(400).json({
          message: "Invalid listing decision.",
        });
      }

      if (status !== "approved" && !String(reason || "").trim()) {
        return res.status(400).json({
          message: "Please provide a reason.",
        });
      }

      const property = await Property.findByIdAndUpdate(
        req.params.id,
        {
          status,
          rejectionReason: status === "approved" ? "" : reason,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!property) {
        return res.status(404).json({
          message: "Apartment not found.",
        });
      }

      res.json({
        message: `Listing ${status}.`,
        property,
      });
    } catch (error) {
      console.error("Property decision error:", error);

      res.status(400).json({
        message: error.message,
      });
    }
  }
);

// ADMIN ACTIVATES / DEACTIVATES AN ACCOUNT
router.patch("/users/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { accountStatus } = req.body;

    if (!["active", "deactivated", "suspended"].includes(accountStatus)) {
      return res.status(400).json({
        message: "Invalid account status.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { accountStatus },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.json({
      message: `Account ${accountStatus}.`,
      user,
    });
  } catch (error) {
    console.error("Account status error:", error);

    res.status(400).json({
      message: error.message,
    });
  }
});

// LIST OWNER APPLICATIONS
router.get("/owner-applications", protect, adminOnly, async (req, res) => {
  try {
    const applications = await User.find({
      role: "owner",
      verificationStatus: {
        $in: ["pending", "revision", "rejected"],
      },
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error("Owner applications error:", error);

    res.status(500).json({
      message: "Failed to load owner applications.",
    });
  }
});

// VIEW PRIVATE OWNER DOCUMENT
// Only authenticated administrators can access this endpoint.
router.get(
  "/users/:id/documents/:documentType",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const { id, documentType } = req.params;

      const documentField = ALLOWED_DOCUMENT_TYPES[documentType];

      if (!documentField) {
        return res.status(400).json({
          message: "Invalid document type.",
        });
      }

      const owner = await User.findOne({
        _id: id,
        role: "owner",
      }).select(documentField);

      if (!owner) {
        return res.status(404).json({
          message: "Owner application not found.",
        });
      }

      const document = owner[documentField];

      if (!document || !document.storageName) {
        return res.status(404).json({
          message: "Document has not been uploaded.",
        });
      }

      if (!ALLOWED_MIME_TYPES.includes(document.mimeType)) {
        return res.status(400).json({
          message: "Unsupported document type.",
        });
      }

      const safeStorageName = path.basename(document.storageName);

      if (safeStorageName !== document.storageName) {
        return res.status(400).json({
          message: "Invalid document reference.",
        });
      }

      const uploadRoot = path.resolve(PRIVATE_UPLOAD_DIR);
      const filePath = path.resolve(uploadRoot, safeStorageName);

      if (!filePath.startsWith(uploadRoot + path.sep)) {
        return res.status(400).json({
          message: "Invalid document path.",
        });
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          message: "Document file not found.",
        });
      }

      const extension = path.extname(safeStorageName).toLowerCase();

      const allowedExtensions = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".pdf": "application/pdf",
      };

      if (allowedExtensions[extension] !== document.mimeType) {
        return res.status(400).json({
          message: "Document file validation failed.",
        });
      }

      const originalName = path
        .basename(document.originalName || "owner-document")
        .replace(/[^a-zA-Z0-9._-]/g, "_");

      res.setHeader("Content-Type", document.mimeType);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${originalName}"`
      );
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "private, no-store, no-cache");

      return res.sendFile(filePath);
    } catch (error) {
      console.error("Private document viewing error:", error);

      res.status(500).json({
        message: "Failed to open owner document.",
      });
    }
  }
);

// ADMIN OWNER VERIFICATION DECISION
router.patch(
  "/users/:id/verification",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const { verificationStatus, verificationNote } = req.body;

      if (!["approved", "rejected", "revision"].includes(verificationStatus)) {
        return res.status(400).json({
          message: "Invalid verification decision.",
        });
      }

      if (
        verificationStatus !== "approved" &&
        !String(verificationNote || "").trim()
      ) {
        return res.status(400).json({
          message: "A reason or revision note is required.",
        });
      }

      const owner = await User.findOne({
        _id: req.params.id,
        role: "owner",
      });

      if (!owner) {
        return res.status(404).json({
          message: "Owner application not found.",
        });
      }

      // Accept new uploaded documents or legacy links.
      const hasValidId =
        hasDocument(owner, "validIdDocument") ||
        Boolean(String(owner.validIdUrl || "").trim());

      const hasOwnershipProof =
        hasDocument(owner, "ownershipProofDocument") ||
        Boolean(String(owner.ownershipProofUrl || "").trim());

      if (
        verificationStatus === "approved" &&
        (!hasValidId || !hasOwnershipProof)
      ) {
        return res.status(400).json({
          message: "Valid ID and Proof of Ownership must be submitted before approval.",
        });
      }

      owner.verificationStatus = verificationStatus;
      owner.verificationNote =
        verificationNote ? String(verificationNote).trim() : "";

      owner.documentsReviewedAt = new Date();
      owner.documentsReviewedBy = req.user._id;

      await owner.save();

      const safeUser = await User.findById(owner._id).select("-password");

      res.json({
        message: `Owner application ${verificationStatus}.`,
        user: safeUser,
      });
    } catch (error) {
      console.error("Owner verification error:", error);

      res.status(400).json({
        message: error.message,
      });
    }
  }
);

module.exports = router;
