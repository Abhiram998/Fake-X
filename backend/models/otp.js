import mongoose from "mongoose";

const OtpSchema = mongoose.Schema({
    email: { type: String, required: true },
    code: { type: String, required: true },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, expires: 300 }, // Auto delete after 5 minutes
});

export default mongoose.models.Otp || mongoose.model("Otp", OtpSchema);
