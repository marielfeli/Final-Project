
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const updateAdmin = async () => {
  try {
    const {
      MONGO_URI,
      ADMIN_NAME,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
    } = process.env;

    if (!MONGO_URI || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error("Missing required environment variables.");
    }

    await mongoose.connect(MONGO_URI);

    const admin = await User.findOne({ role: "admin" });

    if (!admin) {
      throw new Error("No existing Admin account found.");
    }

    const newEmail = ADMIN_EMAIL.toLowerCase().trim();

    const emailExists = await User.findOne({
      email: newEmail,
      _id: { $ne: admin._id },
    });

    if (emailExists) {
      throw new Error("This email is already used by another account.");
    }

    admin.name = ADMIN_NAME;
    admin.email = newEmail;
    admin.password = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await admin.save();

    console.log("Admin account updated successfully!");
    console.log("New Admin Email:", newEmail);

  } catch (error) {
    console.error("Update Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

updateAdmin();
