const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const authRouter = require("./routes/auth.routes");
const aiRouter = require("./routes/ai.routes");
const interviewRouter = require("./routes/interview.routes");

const app = express();

// Global Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/ai", aiRouter);
app.use("/api/interview", interviewRouter);

module.exports = app;