
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const PRIVATE_UPLOAD_DIR = path.join(
  __dirname,
  "..",
  "private_uploads"
);

if (!fs.existsSync(PRIVATE_UPLOAD_DIR)) {
  fs.mkdirSync(PRIVATE_UPLOAD_DIR, { recursive: true });
}

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PRIVATE_UPLOAD_DIR);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeName = `${crypto.randomUUID()}${extension}`;

    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error("Only JPG, PNG, and PDF files are allowed.")
    );
  }

  const extension = path.extname(file.originalname).toLowerCase();

  const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];

  if (!allowedExtensions.includes(extension)) {
    return cb(
      new Error("Invalid document file extension.")
    );
  }

  cb(null, true);
};

const uploadOwnerDocuments = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 2,
  },
}).fields([
  { name: "validId", maxCount: 1 },
  { name: "ownershipProof", maxCount: 1 },
]);

module.exports = {
  uploadOwnerDocuments,
  PRIVATE_UPLOAD_DIR,
};
