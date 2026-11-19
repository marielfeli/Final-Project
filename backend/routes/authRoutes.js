
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const User = require("../models/User");
const {
  uploadOwnerDocuments,
  PRIVATE_UPLOAD_DIR,
} = require("../middleware/documentUpload");

const router = express.Router();

const removeUploadedFiles = (files) => {
  if (!files) return;

  Object.values(files).flat().forEach((file) => {
    if (file && file.path) {
      fs.unlink(file.path, (error) => {
        if (error && error.code !== "ENOENT") {
          console.error("Failed to remove uploaded file:", error.message);
        }
      });
    }
  });
};

const getDocumentMetadata = (file) => ({
  originalName: path.basename(file.originalname),
  storageName: file.filename,
  mimeType: file.mimetype,
  size: file.size,
  uploadedAt: new Date(),
});

// REGISTER
router.post(
  "/register",
  (req, res, next) => {
    uploadOwnerDocuments(req, res, (error) => {
      if (error) {
        removeUploadedFiles(req.files);

        return res.status(400).json({
          message: error.code === "LIMIT_FILE_SIZE"
            ? "Each document must not exceed 5 MB."
            : error.message || "Document upload failed.",
        });
      }

      next();
    });
  },
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        phone,
        address,
      } = req.body;

      const role = req.body.role || "tenant";

      const validIdFile = req.files?.validId?.[0];
      const ownershipFile = req.files?.ownershipProof?.[0];

      if (!name || !email || !password) {
        removeUploadedFiles(req.files);

        return res.status(400).json({
          message: "Please fill in all required fields.",
        });
      }

      if (!["tenant", "owner"].includes(role)) {
        removeUploadedFiles(req.files);

        return res.status(400).json({
          message: "Invalid account role.",
        });
      }

      if (role === "owner" && (!validIdFile || !ownershipFile)) {
        removeUploadedFiles(req.files);

        return res.status(400).json({
          message: "Apartment Owners must upload both a Valid ID and Proof of Ownership.",
        });
      }

      if (role === "tenant" && (validIdFile || ownershipFile)) {
        removeUploadedFiles(req.files);

        return res.status(400).json({
          message: "Document uploads are only available for Apartment Owners.",
        });
      }

      const normalizedEmail = String(email).toLowerCase().trim();

      const existingUser = await User.findOne({
        email: normalizedEmail,
      });

      if (existingUser) {
        removeUploadedFiles(req.files);

        return res.status(400).json({
          message: "Email is already registered.",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role,
        phone: phone ? String(phone).trim() : "",
        address: address ? String(address).trim() : "",

        verificationStatus:
          role === "owner" ? "pending" : "not_required",

        verificationNote: "",

        // Retain legacy fields for existing system compatibility.
        validIdUrl: "",
        ownershipProofUrl: "",

        // Save metadata for private uploaded documents.
        validIdDocument: validIdFile
          ? getDocumentMetadata(validIdFile)
          : {},

        ownershipProofDocument: ownershipFile
          ? getDocumentMetadata(ownershipFile)
          : {},

        documentsSubmittedAt:
          role === "owner" ? new Date() : null,

        accountStatus: "active",
      });

      await newUser.save();

      return res.status(201).json({
        message: role === "owner"
          ? "Registration successful! Your documents are pending Admin verification."
          : "Registration successful!",
      });
    } catch (error) {
      removeUploadedFiles(req.files);

      console.error("Registration error:", error);

      if (error.code === 11000) {
        return res.status(400).json({
          message: "Email is already registered.",
        });
      }

      return res.status(500).json({
        message: "Registration failed. Please try again.",
      });
    }
  }
);

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter your email and password.",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password.",
      });
    }

    if (user.accountStatus && user.accountStatus !== "active") {
      return res.status(403).json({
        message: `Your account is ${user.accountStatus}. Please contact the administrator.`,
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Authentication configuration is missing.",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "tenant",
        accountStatus: user.accountStatus || "active",
        verificationStatus:
          user.verificationStatus || "not_required",
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed. Please try again.",
    });
  }
});

module.exports = router;
