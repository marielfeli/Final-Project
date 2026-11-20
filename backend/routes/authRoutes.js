
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();

// ==========================================
// REGISTER
// POST /api/auth/register
// ==========================================
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      role,
    } = req.body;

    const selectedRole = role || "tenant";

    // ------------------------------
    // Validate required fields
    // ------------------------------
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill in all required fields.",
      });
    }

    // ------------------------------
    // Validate role
    // ------------------------------
    if (!["tenant", "owner"].includes(selectedRole)) {
      return res.status(400).json({
        message: "Invalid account role.",
      });
    }

    // ------------------------------
    // Normalize email
    // ------------------------------
    const normalizedEmail = String(email).toLowerCase().trim();

    // ------------------------------
    // Check existing email
    // ------------------------------
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email is already registered.",
      });
    }

    // ------------------------------
    // Hash password
    // ------------------------------
    const hashedPassword = await bcrypt.hash(
      String(password),
      10
    );

    // ------------------------------
    // Create user
    // No documents required
    // ------------------------------
    const newUser = new User({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: selectedRole,

      phone: phone ? String(phone).trim() : "",
      address: address ? String(address).trim() : "",

      accountStatus: "active",

      // Owners are subject to Admin verification.
      verificationStatus:
        selectedRole === "owner"
          ? "pending"
          : "not_required",

      verificationNote: "",

      // Legacy document fields.
      // No documents are required during registration.
      validIdUrl: "",
      ownershipProofUrl: "",

      documentsSubmittedAt: null,
      documentsReviewedAt: null,
      documentsReviewedBy: null,
    });

    // ------------------------------
    // Save to MongoDB
    // ------------------------------
    await newUser.save();

    // ------------------------------
    // Success response
    // ------------------------------
    return res.status(201).json({
      success: true,
      message:
        selectedRole === "owner"
          ? "Registration successful! Your account is pending Admin verification."
          : "Registration successful!",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        accountStatus: newUser.accountStatus,
        verificationStatus: newUser.verificationStatus,
      },
    });
  } catch (error) {
    // ==============================
    // DEBUG ERROR
    // ==============================
    console.error("\n====================================");
    console.error("STAYFINDER REGISTRATION ERROR");
    console.error("====================================");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    console.error("Error Code:", error.code);
    console.error("Full Error:", error);
    console.error("====================================\n");

    // ------------------------------
    // Duplicate email
    // ------------------------------
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Email is already registered.",
      });
    }

    // ------------------------------
    // Mongoose validation error
    // ------------------------------
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Registration validation failed.",
        details: error.message,
      });
    }

    // ------------------------------
    // Other errors
    // ------------------------------
    return res.status(500).json({
      message: "Registration failed. Please try again.",
      debug: error.message,
    });
  }
});

// ==========================================
// LOGIN
// POST /api/auth/login
// ==========================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ------------------------------
    // Validate input
    // ------------------------------
    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter your email and password.",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // ------------------------------
    // Find user
    // ------------------------------
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password.",
      });
    }

    // ------------------------------
    // Compare password
    // ------------------------------
    const isMatch = await bcrypt.compare(
      String(password),
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password.",
      });
    }

    // ------------------------------
    // Check account status
    // ------------------------------
    if (
      user.accountStatus &&
      user.accountStatus !== "active"
    ) {
      return res.status(403).json({
        message: `Your account is ${user.accountStatus}. Please contact the administrator.`,
      });
    }

    // ------------------------------
    // Validate JWT configuration
    // ------------------------------
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from backend .env");

      return res.status(500).json({
        message: "Authentication configuration is missing.",
      });
    }

    // ------------------------------
    // Generate JWT
    // ------------------------------
    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // ------------------------------
    // Login success
    // ------------------------------
    return res.status(200).json({
      success: true,
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
    console.error("\n====================================");
    console.error("STAYFINDER LOGIN ERROR");
    console.error("====================================");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    console.error("Full Error:", error);
    console.error("====================================\n");

    return res.status(500).json({
      message: "Login failed. Please try again.",
    });
  }
});

module.exports = router;
