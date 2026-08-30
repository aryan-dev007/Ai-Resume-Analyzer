const pdfParse = require("pdf-parse");
const { generateInterviewReport } = require("../services/ai.service");
const InterviewReport = require("../models/interviewReport.model");

// POST /api/interview/generate — Upload PDF resume + JD + self-description → AI report
async function generateReportController(req, res) {
    try {
        const resumeFile = req.file;

        // Validate file was uploaded
        if (!resumeFile) {
            return res.status(400).json({
                success: false,
                message: "Resume PDF file is required.",
            });
        }

        const { selfDescription, jobDescription } = req.body;

        // Validate required text fields
        if (!selfDescription || !jobDescription) {
            return res.status(400).json({
                success: false,
                message: "selfDescription and jobDescription are required.",
            });
        }

        // Extract text from uploaded PDF
        const pdfData = await pdfParse(resumeFile.buffer);
        const resumeText = pdfData.text;

        if (!resumeText || resumeText.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Could not extract text from the PDF. Please ensure it is not a scanned image.",
            });
        }

        // Call Gemini AI to generate the interview report
        const aiResult = await generateInterviewReport({
            resumeText,
            selfDescription,
            jobDescription,
        });

        // Save to database with user reference and original inputs
        const report = await InterviewReport.create({
            user: req.user.id,
            jobDescription,
            resumeText,
            selfDescription,
            ...aiResult,
            status: "completed",
        });

        res.status(201).json({
            success: true,
            message: "Interview report generated successfully",
            report,
        });
    } catch (error) {
        console.error("Interview Report Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate interview report",
            error: error.message,
        });
    }
}

// GET /api/interview/reports — Get all reports for the logged-in user
async function getUserReportsController(req, res) {
    try {
        const reports = await InterviewReport.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resumeText -jobDescription -selfDescription"); // Exclude large text fields in list view

        res.status(200).json({ success: true, reports });
    } catch (error) {
        console.error("Fetch Reports Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch reports",
        });
    }
}

// GET /api/interview/report/:id — Get a single report by ID
async function getReportByIdController(req, res) {
    try {
        const report = await InterviewReport.findOne({
            _id: req.params.id,
            user: req.user.id, // Ensure user can only access their own reports
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found",
            });
        }

        res.status(200).json({ success: true, report });
    } catch (error) {
        console.error("Fetch Report Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch report",
        });
    }
}

// DELETE /api/interview/report/:id — Delete a report
async function deleteReportController(req, res) {
    try {
        const report = await InterviewReport.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id,
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Report deleted successfully",
        });
    } catch (error) {
        console.error("Delete Report Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete report",
        });
    }
}

module.exports = {
    generateReportController,
    getUserReportsController,
    getReportByIdController,
    deleteReportController,
};