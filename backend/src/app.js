const express = require("express");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth.routes");
const aiRouter = require("./routes/ai.routes");

const app = express();

// Global Middlewares
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/ai", aiRouter);

module.exports = app;