const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const protect = require("../middleware/auth.middleware");
 
const authRouter = Router();

// Public routes
authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/logout", authController.logout);
// Protected routes
authRouter.get("/profile", protect, authController.getProfile);

module.exports = authRouter;