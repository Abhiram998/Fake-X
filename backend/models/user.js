import mongoose from "mongoose";
const UserSchema = mongoose.Schema({
  username: { type: String, required: true },
  displayName: { type: String, required: true },
  avatar: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: {
    type: String,
    required: false,
    validate: {
      validator: function (v) {
        if (!v) return true; // Optional
        return /^[0-9]{10,15}$/.test(v);
      },
      message: "Invalid mobile number format"
    }
  },
  phone: { type: String, sparse: true }, // Keep for legacy, but mobile is now primary
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
  loginOtp: { type: String },
  loginOtpExpiry: { type: Date },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
