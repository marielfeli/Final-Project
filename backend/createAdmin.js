
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const createAdmin = async () => {
  try {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } =
      process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || !MONGO_URI) {
      throw new Error("Please check your admin and MongoDB environment variables.");
    }

    await mongoose.connect(MONGO_URI);

    const email = ADMIN_EMAIL.toLowerCase().trim();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error("This email is already registered. Use another email.");
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const admin = new User({
      name: ADMIN_NAME,
      email,
      password: hashedPassword,
      role: "admin",
    });

    await admin.save();

    console.log("Admin account created successfully!");
    console.log("Admin Email:", email);

  } catch (error) {
    console.error("Admin Setup Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
