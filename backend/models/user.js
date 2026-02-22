import mongoose from "mongoose";
const UserSchema = mongoose.Schema({
  username: { type: String, required: true },
  displayName: { type: String, required: true },
  avatar: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, select: false }, // Hashed password
  bio: { type: String, default: "" },
  location: { type: String, default: "" },
  website: { type: String, default: "" },
  joinedDate: { type: Date, default: Date.now },
  notificationEnabled: { type: Boolean, default: false },
  pushSubscriptions: { type: Array, default: [] },
  lastResetDate: { type: Date }, // For "once per day" restriction
  subscriptionPlan: { type: String, default: "Free" },
  subscriptionStartDate: { type: Date },
  subscriptionExpiryDate: { type: Date },
  tweetCount: { type: Number, default: 0 },
  preferredLanguage: { type: String, default: "en" },
  pendingLanguage: { type: String },
  languageOtp: { type: String },
  languageOtpExpiry: { type: Date },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
