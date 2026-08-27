const mongoose = require("mongoose");
const dns = require("dns");

// Use Google DNS instead of the router's DNS
dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");
    } catch (err) {
        console.log("MongoDB connection error:", err);
    }
}

module.exports = connectDB;