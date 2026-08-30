const { Router } = require("express");
const aiController = require("../controllers/ai.controller");
const protect = require("../middleware/auth.middleware");

const aiRouter = Router();
// All AI routes require authentication
aiRouter.post("/interview-report", protect, aiController.createReport);
aiRouter.get("/interview-reports", protect, aiController.getUserReports);
aiRouter.get("/interview-report/:id", protect, aiController.getReportById);
aiRouter.delete("/interview-report/:id", protect, aiController.deleteReport);

module.exports = aiRouter;
