const pdfParse = require("pdf-parse");
const { generateInterviewReport, generateTailoredResumeHtml } = require("../services/ai.service");
const { generatePdfFromHtml } = require("../services/pdf.service");
const InterviewReport = require("../models/interviewReport.model");

// POST /api/interview/generate — Upload PDF resume + JD + self-description → AI report
async function generateReportController(req, res) {
    try {
        const resumeFile = req.file;
        const { selfDescription, jobDescription } = req.body;

        // Validate inputs
        if (!jobDescription) {
            return res.status(400).json({
                success: false,
                message: "jobDescription is required.",
            });
        }
        if (!resumeFile && !selfDescription) {
            return res.status(400).json({
                success: false,
                message: "Either a Resume PDF or a self-description is required.",
            });
        }

        let resumeText = "";
        if (resumeFile) {
            // Extract text from uploaded PDF
            const pdfData = await pdfParse(resumeFile.buffer);
            resumeText = pdfData.text;

            if (!resumeText || resumeText.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Could not extract text from the PDF. Please ensure it is not a scanned image.",
                });
            }
        } else {
            resumeText = selfDescription;
        }

        // Call Gemini AI to generate the interview report
        const aiResult = await generateInterviewReport({
            resumeText,
            selfDescription,
            jobDescription,
        });

        // Fix potential Gemini schema deviation (range vs day, capitalization, missing required strings)
        const rawTech = aiResult.technicalQuestions || aiResult.technical_questions || [];
        const rawBehav = aiResult.behavioralQuestions || aiResult.behavioral_questions || [];
        const rawGaps = aiResult.skillGaps || aiResult.skill_gaps || [];

        const normalizedAiResult = {
            ...aiResult,
            technicalQuestions: rawTech.map(q => ({
                question: q.question || "Technical Question",
                intention: q.intention || q.intent || "Evaluates core technical skills.",
                answer: q.answer || q.sampleAnswer || q.solution || "Formulate an answer covering core concepts, syntax, and performance implications.",
                difficulty: (q.difficulty || "medium").toLowerCase(),
                topic: q.topic || "Engineering",
            })),
            behavioralQuestions: rawBehav.map(q => ({
                question: q.question || "Behavioral Question",
                intention: q.intention || q.intent || "Evaluates teamwork and problem-solving.",
                answer: q.answer || q.sampleAnswer || q.solution || "Use the STAR method (Situation, Task, Action, Result) to frame your response.",
                difficulty: (q.difficulty || "medium").toLowerCase(),
                topic: q.topic || "Behavioral",
            })),
            skillGaps: rawGaps.map(sg => ({
                skill: typeof sg === "string" ? sg : (sg.skill || "Missing Skill"),
                severity: (sg.severity || "medium").toLowerCase(),
                recommendation: sg.recommendation || "Review official documentation and complete practice exercises.",
            })),
            keywordsMatched: aiResult.keywordsMatched || aiResult.keywords_matched || [],
            keywordsMissing: aiResult.keywordsMissing || aiResult.keywords_missing || [],
            preparationPlan: (aiResult.preparationPlan || aiResult.preparation_plan || []).map(step => ({
                ...step,
                day: step.day || step.range || "Unknown Day"
            }))
        };

        // Save to database with user reference and original inputs
        const report = await InterviewReport.create({
            user: req.user.id,
            jobDescription,
            resumeText,
            selfDescription: selfDescription || "",
            ...normalizedAiResult,
            status: "completed",
        });

        res.status(201).json({
            success: true,
            message: "Interview report generated successfully",
            report,
        });
    } catch (error) {
        console.error("Interview Report Error:", error);
        require("fs").writeFileSync("error_debug.txt", error.stack || String(error));
        res.status(500).json({
            success: false,
            message: error.message || "Failed to generate interview report",
            error: error.stack || error.message,
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

// POST /api/interview/generate-pdf — Generate tailored resume PDF directly from inputs
async function generateResumePdfController(req, res) {
    try {
        const resumeFile = req.file;
        const { selfDescription, jobDescription } = req.body;

        if (!jobDescription) {
            return res.status(400).json({
                success: false,
                message: "jobDescription is required.",
            });
        }
        if (!resumeFile && !selfDescription) {
            return res.status(400).json({
                success: false,
                message: "Either a Resume PDF or a self-description is required.",
            });
        }

        let resumeText = "";
        if (resumeFile) {
            const pdfData = await pdfParse(resumeFile.buffer);
            resumeText = pdfData.text;
        } else {
            resumeText = selfDescription;
        }

        // 1. Generate tailored HTML using Gemini AI
        console.log("🤖 Generating HTML resume with Gemini...");
        const html = await generateTailoredResumeHtml({
            resumeText,
            selfDescription,
            jobDescription,
        });

        // 2. Convert HTML to PDF using Puppeteer
        console.log("📄 Converting HTML to PDF with Puppeteer...");
        const pdfBuffer = await generatePdfFromHtml(html);

        // 3. Send PDF binary response
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'attachment; filename="Tailored_Resume.pdf"');
        res.setHeader("Content-Length", pdfBuffer.length);
        return res.end(pdfBuffer);
    } catch (error) {
        console.error("Generate Resume PDF Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to generate tailored resume PDF",
        });
    }
}

// GET /api/interview/report/:id/pdf — Generate tailored resume PDF from an existing saved report
async function generateReportPdfByIdController(req, res) {
    try {
        const report = await InterviewReport.findOne({
            _id: req.params.id,
            user: req.user.id,
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found",
            });
        }

        console.log(`🤖 Generating tailored HTML resume for report ${report._id}...`);
        const html = await generateTailoredResumeHtml({
            resumeText: report.resumeText,
            selfDescription: report.selfDescription,
            jobDescription: report.jobDescription,
        });

        console.log("📄 Converting HTML to PDF with Puppeteer...");
        const pdfBuffer = await generatePdfFromHtml(html);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="Tailored_Resume_${report.jobTitle ? report.jobTitle.replace(/[^a-zA-Z0-9]/g, "_") : "Report"}.pdf"`);
        res.setHeader("Content-Length", pdfBuffer.length);
        return res.end(pdfBuffer);
    } catch (error) {
        console.error("Generate Report PDF Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to generate PDF for this report",
        });
    }
}

module.exports = {
    generateReportController,
    getUserReportsController,
    getReportByIdController,
    deleteReportController,
    generateResumePdfController,
    generateReportPdfByIdController,
};