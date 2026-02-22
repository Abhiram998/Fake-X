import mongoose from "mongoose";

const loginHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    browser: {
        type: String,
        required: true,
    },
    os: {
        type: String,
        required: true,
    },
    device: {
        type: String,
        required: true,
    },
    ip: {
        type: String,
        required: true,
    },
    loginTime: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.LoginHistory || mongoose.model("LoginHistory", loginHistorySchema);
