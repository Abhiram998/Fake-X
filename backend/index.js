import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user.js";
import Tweet from "./models/tweet.js";
import Otp from "./models/otp.js";
import { Server } from "socket.io";
import { createServer } from "http";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { DateTime } from "luxon";
import sendOTP from "./utils/sendOTP.js";
import bcrypt from "bcryptjs";
import { generateSecureAlphabetPassword } from "./utils/passwordGenerator.js";
import webpush from "web-push";

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

// Web Push Config
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:example@yourdomain.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn("⚠️ Web Push keys are missing. Push notifications will not work.");
}

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

// Email configuration moved to utils/sendOTP.js

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

  // Final Production Window: 2:00 PM (14:00) to 7:00 PM (19:00)
  if (hour < 14 || (hour >= 19 && minute > 0)) {
    return res.status(403).send({
      error: "Audio tweets are allowed only between 2:00 PM and 7:00 PM IST.",
    });
  }
  next();
};

// OTP Endpoints
app.post("/request-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`📩 Generating OTP for: ${cleanEmail}`);

    // Save to DB (Single-use logic: Delete existing before creating new)
    await Otp.deleteMany({ email: cleanEmail });
    const newOtp = new Otp({ email: cleanEmail, code });
    await newOtp.save();

    // Send via Brevo API (Production-safe)
    const result = await sendOTP(cleanEmail, code);

    if (!result.success) {
      // Return 200 to avoid blocking UI, but log the failure
      console.log(`🔥 [FALLBACK] CODE FOR ${cleanEmail}: ${code}`);
      return res.status(200).send({
        message: "OTP generated. Please check server logs if email is not received."
      });
    }

    res.status(200).send({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("❌ Request OTP Error:", error);
    res.status(200).send({ error: "Something went wrong. Please check logs." });
  }
});

app.post("/verify-otp", async (req, res) => {
  try {
    const { email, code } = req.body;
    const cleanEmail = email.trim().toLowerCase();
    console.log(`🔍 Verifying OTP for: ${cleanEmail} with code: ${code}`);

    const otp = await Otp.findOne({ email: cleanEmail, code: code.trim() });

    if (!otp) {
      console.log("❌ No matching OTP found in database");
      return res.status(400).send({ error: "Invalid or expired OTP" });
    }

    console.log("✅ OTP match found!");
    otp.verified = true;
    await otp.save();
    res.status(200).send({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Forgot Password Endpoint
app.post("/forgot-password", async (req, res) => {
  try {
    const { identity } = req.body; // identity can be email or phone
    if (!identity) {
      return res.status(400).send({ error: "Email or Phone is required" });
    }

    const cleanIdentity = identity.trim().toLowerCase();

    // Find user by email or phone
    const user = await User.findOne({
      $or: [
        { email: cleanIdentity },
        { phone: cleanIdentity }
      ]
    });

    if (!user) {
      // General response to avoid user enumeration (optional but good)
      return res.status(200).send({
        message: "If an account exists, your reset instructions have been processed."
      });
    }

    // Restriction check: Once per day
    const now = new Date();
    if (user.lastResetRequest) {
      const lastReset = new Date(user.lastResetRequest);
      if (
        lastReset.getDate() === now.getDate() &&
        lastReset.getMonth() === now.getMonth() &&
        lastReset.getFullYear() === now.getFullYear()
      ) {
        return res.status(403).send({
          error: "You can use this option only one time per day."
        });
      }
    }

    // Reset Allowed: Generate alphabet-only password
    const newPassword = generateSecureAlphabetPassword(12);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user
    user.password = hashedPassword;
    user.lastResetRequest = now;
    await user.save();

    console.log(`🔑 PASSWORD RESET for ${cleanIdentity}: ${newPassword}`);

    // Return success
    res.status(200).send({
      message: "Password reset successful.",
      newPassword: newPassword, // Show in UI for demo
      identity: cleanIdentity
    });

  } catch (error) {
    console.error("❌ Forgot Password Error:", error);
    res.status(500).send({ error: "Something went wrong. Please try again later." });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send({ error: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    // Check if the user has a password set (new system)
    if (!user.password) {
      return res.status(400).send({
        error: "This account uses Google Login or hasn't set a password yet. Please use Google or reset your password."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send({ error: "Invalid credentials" });
    }

    // Sanitize response
    const userObj = user.toObject();
    delete userObj.password;
    res.status(200).send(userObj);

  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).send({ error: "Login failed. Please try again." });
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

    const userData = { ...req.body };
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    const newUser = new User(userData);
    await newUser.save();

    const userObj = newUser.toObject();
    delete userObj.password;
    return res.status(201).send(userObj);
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(400).send({ error: error.message });
  }
});
// Loggedinuser
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

// Push Subscription Endpoints
app.post("/subscribe", async (req, res) => {
  try {
    const { userId, subscription } = req.body;
    if (!userId || !subscription) {
      return res.status(400).send({ error: "UserId and subscription are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).send({ error: "User not found" });

    // Prevent duplicate subscriptions
    const subExists = user.pushSubscriptions.some(
      (s) => s.endpoint === subscription.endpoint
    );

    if (!subExists) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }

    res.status(201).json({ message: "Subscription added successfully" });
  } catch (error) {
    console.error("❌ Subscription error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/unsubscribe", async (req, res) => {
  try {
    const { userId, endpoint } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).send({ error: "User not found" });

    user.pushSubscriptions = user.pushSubscriptions.filter(
      (s) => s.endpoint !== endpoint
    );
    await user.save();
    res.status(200).json({ message: "Unsubscribed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const userObj = updated.toObject();
    delete userObj.password;
    return res.status(200).send(userObj);
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

    // KEYWORD DETECTION & PUSH NOTIFICATION
    const keywords = ["cricket", "science"];
    const content = populatedTweet.content.toLowerCase();
    const matches = keywords.some((k) => content.includes(k));

    if (matches) {
      const users = await User.find({
        notificationEnabled: true,
        pushSubscriptions: { $exists: true, $not: { $size: 0 } },
      });

      const notificationPayload = JSON.stringify({
        title: `New Tweet from ${populatedTweet.author.displayName}`,
        body: populatedTweet.content.length > 100 ? populatedTweet.content.slice(0, 97) + "..." : populatedTweet.content,
        url: "/",
        icon: populatedTweet.author.avatar || "/favicon.ico",
      });

      users.forEach((user) => {
        user.pushSubscriptions.forEach((sub) => {
          webpush.sendNotification(sub, notificationPayload).catch(async (err) => {
            console.error(`❌ Push failed for user ${user._id}:`, err.statusCode);
            if (err.statusCode === 410 || err.statusCode === 404) {
              // Remove expired subscription
              await User.findByIdAndUpdate(user._id, {
                $pull: { pushSubscriptions: { endpoint: sub.endpoint } },
              });
            }
          });
        });
      });
    }

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