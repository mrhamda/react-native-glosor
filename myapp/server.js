require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require("fs");
const app = express();

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const randomName = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${randomName}${ext}`);
  }
});
const upload = multer({ storage });

app.use(express.json());

app.get('/', (req, res) => res.send('Server is running'));

// Upload route
app.post("/photos/upload", upload.array("photos", 12), (req, res) => {
  try {
    const oldPath = req.body.oldPath; 
    if (oldPath) {
      const fullOldPath = path.join(__dirname, oldPath.replace(/^\/+/, ""));
      if (fs.existsSync(fullOldPath)) {
        fs.unlink(fullOldPath, (err) => {
          if (err) console.error("Failed to delete old file:", err);
          else console.log("Old file deleted:", oldPath);
        });
      }
    }

    const filesResponse = req.files.map(file => ({
      originalname: file.originalname,
      size: file.size,
      path: `/uploads/${file.filename}` 
    }));

    res.status(200).json({
      message: "Files uploaded successfully!",
      files: filesResponse,
    });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server started on http://0.0.0.0:${PORT}`));

