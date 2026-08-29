const InterviewReport = require("../models/interviewReport.model");
const { generateInterviewReport } = require("../services/ai.service");
// POST /api/ai/interview-report — Generate and save a new report
exports.createReport = async (req, res) => {
    try {
        const { resumeText, jobDescription, selfDescription } = req.body;
        // Validate required fields
        if (!resumeText || !jobDescription || !selfDescription) {
            return res.status(400).json({
                success: false,
                message: "resumeText, jobDescription, and selfDescription are all required.",
            });
        }
        // Call Gemini AI to generate structured report
        const aiResult = await generateInterviewReport({
            resumeText,
            jobDescription,
            selfDescription,
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
        console.error("AI Report Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate interview report",
        });
    }
};
// GET /api/ai/interview-reports — Get all reports for the logged-in user
exports.getUserReports = async (req, res) => {
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
};

// GET /api/ai/interview-report/:id — Get a single report by ID
exports.getReportById = async (req, res) => {
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
};

// DELETE /api/ai/interview-report/:id — Delete a report
exports.deleteReport = async (req, res) => {
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
};
