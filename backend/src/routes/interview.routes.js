const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const upload = require("../middleware/file.middleware");
const interviewController = require("../controllers/interview.controller");

const interviewRouter = express.Router();

// All routes require authentication
// POST   /api/interview/generate    — Upload PDF + JD + selfDescription → AI report
// GET    /api/interview/reports     — Get all reports for logged-in user
// GET    /api/interview/report/:id  — Get a single report by ID
// DELETE /api/interview/report/:id  — Delete a report

interviewRouter.post(
    "/generate",
    authMiddleware,
    upload.single("resume"),
    interviewController.generateReportController
);

interviewRouter.get(
    "/reports",
    authMiddleware,
    interviewController.getUserReportsController
);

interviewRouter.get(
    "/report/:id",
    authMiddleware,
    interviewController.getReportByIdController
);

interviewRouter.delete(
    "/report/:id",
    authMiddleware,
    interviewController.deleteReportController
);

interviewRouter.post(
    "/generate-pdf",
    authMiddleware,
    upload.single("resume"),
    interviewController.generateResumePdfController
);

interviewRouter.get(
    "/report/:id/pdf",
    authMiddleware,
    interviewController.generateReportPdfByIdController
);

module.exports = interviewRouter;