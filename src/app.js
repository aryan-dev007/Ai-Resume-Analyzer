const express = require("express");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth.route");

const app = express();

// Global Middlewares
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRouter);

module.exports = app;