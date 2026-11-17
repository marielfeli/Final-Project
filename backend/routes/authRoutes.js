
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, validIdUrl, ownershipProofUrl } = req.body;
    const role = req.body.role || "tenant";

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill in all fields.",
      });
    }

    if (!["tenant", "owner"].includes(role)) {
      return res.status(400).json({
        message: "Invalid account role.",
      });
    }

    if (role === "owner" && (!String(validIdUrl || "").trim() || !String(ownershipProofUrl || "").trim())) {
      return res.status(400).json({ message: "Apartment Owners must submit both a valid ID link and proof-of-ownership link." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      verificationStatus: role === "owner" ? "pending" : "not_required",
      verificationNote: "",
      validIdUrl: role === "owner" ? String(validIdUrl).trim() : "",
      ownershipProofUrl: role === "owner" ? String(ownershipProofUrl).trim() : "",
      accountStatus: "active",
    });

    await newUser.save();

    res.status(201).json({
      message: "Registration successful!",
    });
  } catch (error) {
    res.status(500).json({
      message: "Registration failed.",
      error: error.message,
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter your email and password.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

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
      return res.status(403).json({ message: `Your account is ${user.accountStatus}. Please contact the administrator.` });
    }

    // GENERATE JWT TOKEN
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "tenant",
        accountStatus: user.accountStatus || "active",
        verificationStatus: user.verificationStatus || "not_required",
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed.",
      error: error.message,
    });
  }
});

module.exports = router;
