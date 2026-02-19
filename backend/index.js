import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user.js";
import Tweet from "./models/tweet.js";
import Otp from "./models/otp.js";
import { Server } from "socket.io";
import { createServer } from "http";
import nodemailer from "nodemailer";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { DateTime } from "luxon";

dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust this in production
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

app.use(cors());
app.use(express.json());

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "twiller_audio",
    resource_type: "auto",
    format: "mp3",
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// Mail Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter connection
transporter.verify(function (error, success) {
  if (error) {
    console.log("❌ Mail Server Error:", error);
  } else {
    console.log("📧 Mail Server is ready to send messages");
  }
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("📡 User connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("🔌 User disconnected");
  });
});

app.get("/", (req, res) => {
  res.send("Twiller backend is running successfully");
});

// Middleware: IST Time Validation (2:00 PM - 7:00 PM)
const validateTimeWindow = (req, res, next) => {
  const nowIST = DateTime.now().setZone("Asia/Kolkata");
  const hour = nowIST.hour;
  const minute = nowIST.minute;

  // TEMPORARY FOR TESTING: 2:00 PM (14:00) to 9:00 PM (21:00)
  if (hour < 14 || (hour >= 21 && minute > 0)) {
    return res.status(403).send({
      error: "Audio tweets are allowed only between 2:00 PM and 9:00 PM IST (Testing Window).",
    });
  }
  next();
};

// OTP Endpoints
app.post("/request-otp", async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`📩 OTP requested for: ${email}`);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email }); // Delete old OTPs
    const newOtp = new Otp({ email, code });
    await newOtp.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Twiller Audio Verification Code",
      text: `Your OTP for audio tweet verification is: ${code}. It expires in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post("/verify-otp", async (req, res) => {
  try {
    const { email, code } = req.body;
    const otp = await Otp.findOne({ email, code });

    if (!otp) {
      return res.status(400).send({ error: "Invalid or expired OTP" });
    }

    otp.verified = true;
    await otp.save();
    res.status(200).send({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post("/upload-audio", validateTimeWindow, upload.single("audio"), async (req, res) => {
  try {
    const { email, duration } = req.body;

    // Check if OTP was verified
    const otp = await Otp.findOne({ email, verified: true });
    if (!otp) {
      return res.status(403).send({ error: "Please verify OTP before uploading." });
    }

    // Duration validation (300 seconds = 5 minutes)
    if (parseFloat(duration) > 300) {
      return res.status(400).send({ error: "Audio duration exceeds 5 minutes limit." });
    }

    // Single use OTP - consume it
    await Otp.deleteMany({ email });

    res.status(200).send({ audioUrl: req.file.path });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

const port = process.env.PORT || 5000;
const url = process.env.MONGODB_URL || process.env.MONOGDB_URL;

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${port}`);
});

mongoose
  .connect(url)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

//Register
app.post("/register", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).send({ error: "Email is required" });
    }
    const existinguser = await User.findOne({ email });
    if (existinguser) {
      return res.status(200).send(existinguser);
    }
    const newUser = new User(req.body);
    await newUser.save();
    return res.status(201).send(newUser);
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(400).send({ error: error.message });
  }
});
// loggedinuser
app.get("/loggedinuser", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).send({ error: "Email required" });
    }
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    return res.status(200).send(user);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});
// update Profile
app.patch("/userupdate/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const updated = await User.findOneAndUpdate(
      { email },
      { $set: req.body },
      { new: true, upsert: false }
    );
    return res.status(200).send(updated);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});
// Tweet API

// POST
app.post("/post", async (req, res) => {
  try {
    const tweet = new Tweet(req.body);
    await tweet.save();
    const populatedTweet = await Tweet.findById(tweet._id).populate("author");
    io.emit("new-tweet", populatedTweet);
    return res.status(201).send(populatedTweet);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});
// get all tweet
app.get("/post", async (req, res) => {
  try {
    const tweet = await Tweet.find().sort({ timestamp: -1 }).populate("author");
    return res.status(200).send(tweet);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});
//  LIKE TWEET
app.post("/like/:tweetid", async (req, res) => {
  try {
    const { userId } = req.body;
    const tweet = await Tweet.findById(req.params.tweetid);
    if (!tweet.likedBy.includes(userId)) {
      tweet.likes += 1;
      tweet.likedBy.push(userId);
      await tweet.save();
    }
    const populated = await Tweet.findById(req.params.tweetid).populate("author");
    res.send(populated);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});
// retweet 
app.post("/retweet/:tweetid", async (req, res) => {
  try {
    const { userId } = req.body;
    const tweet = await Tweet.findById(req.params.tweetid);
    if (!tweet.retweetedBy.includes(userId)) {
      tweet.retweets += 1;
      tweet.retweetedBy.push(userId);
      await tweet.save();
    }
    const populated = await Tweet.findById(req.params.tweetid).populate("author");
    res.send(populated);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});