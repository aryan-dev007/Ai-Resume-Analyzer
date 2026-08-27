const userModel = require("../models/user.model");
const blacklistModel = require("../models/blacklist.model");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_key_12345";

// Helper function to generate token and set cookie
const generateToken = (res, userId) => {
    const token = jwt.sign({ id: userId }, JWT_SECRET, {
        expiresIn: "1d",
    });
    
    // Set HTTP-Only Cookie
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return token;
};

// Register user
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Check if user already exists
        const userExists = await userModel.findOne({
            $or: [{ username }, { email: email.toLowerCase() }]
        });

        if (userExists) {
            return res.status(400).json({ success: false, message: "Username or email already exists" });
        }

        // Create new user (password is automatically hashed via mongoose pre-save hook)
        const user = await userModel.create({
            username,
            email,
            password
        });

        // Generate token and set cookie
        const token = generateToken(res, user._id);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
            token
        });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ success: false, message: "Server error during registration" });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email/username and password are required" });
        }

        // Find user by email or username
        const user = await userModel.findOne({
            $or: [{ email: email.toLowerCase() }, { username: email }]
        });

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Generate token and set cookie
        const token = generateToken(res, user._id);

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
            token
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Server error during login" });
    }
};

// Logout user
exports.logout = async (req, res) => {
    try {
        let token = req.cookies?.token;

        // Check if token is passed in the Authorization header (Bearer <token>)
        if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (token) {
            // Save token to blacklist (handles potential duplicate/upsert safely)
            await blacklistModel.findOneAndUpdate(
                { token },
                { token },
                { upsert: true, new: true }
            );
        }

        res.cookie("token", "", {
            httpOnly: true,
            expires: new Date(0),
        });
        res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ success: false, message: "Server error during logout" });
    }
};

// Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("Profile Error:", error);
        res.status(500).json({ success: false, message: "Server error fetching profile" });
    }
};
