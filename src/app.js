const express= require("express");
const authRouter = require("./routes/auth.route")
const app= express()

app.use("/api/auth",authRouter)
app.use(express.json())

module.exports = app