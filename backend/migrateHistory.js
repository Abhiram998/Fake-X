import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.MONGODB_URL || process.env.MONOGDB_URL;

mongoose
    .connect(url)
    .then(async () => {
        console.log("✅ Connected to MongoDB");
        const collection = mongoose.connection.collection('loginhistories');

        // Rename old fields and update missing ones
        const renameResult = await collection.updateMany(
            {},
            {
                $rename: { 'deviceType': 'device', 'ipAddress': 'ip' }
            }
        );
        console.log("Renamed old fields:", renameResult);

        // Clean up any remaining "Unknown IP" values to "Unavailable"
        const cleanResult = await collection.updateMany(
            { ip: "Unknown IP" },
            { $set: { ip: "Unavailable" } }
        );
        console.log("Cleaned Unknown IPs:", cleanResult);

        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    });
