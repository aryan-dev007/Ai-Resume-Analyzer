const mongoose = require("mongoose");

/**
 * InterviewReport Model
 *
 * Stores the complete AI-generated analysis when a user submits:
 *   - Job description
 *   - Resume text
 *   - Self description
 *
 * The AI returns:
 *   - matchScore          (overall resume ↔ JD fit)
 *   - Technical questions  [{ question, intention, answer }]
 *   - Behavioral questions [{ question, intention, answer }]
 *   - Skill gaps           [{ skill, severity }]
 *   - strengths, keywords, summary, recommendations
 */

// ── Sub-schemas ──────────────────────────────────────────────

const questionSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
        },
        intention: {
            type: String,
            required: true,
        },
        answer: {
            type: String,
            required: true,
        },
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "medium",
        },
        topic: {
            type: String, // e.g. "React", "System Design", "Leadership"
        },
    },
    { _id: false }
);

const skillGapSchema = new mongoose.Schema(
    {
        skill: {
            type: String,
            required: true,
        },
        severity: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            required: true,
        },
        recommendation: {
            type: String, // AI-suggested way to bridge this gap
        },
    },
    { _id: false }
);

const preparationStepSchema = new mongoose.Schema(
    {
        day: {
            type: String, // e.g. "Day 1", "Day 2-3", "Week 2"
            required: true,
        },
        topic: {
            type: String, // What to study or practice
            required: true,
        },
        tasks: {
            type: [String], // Specific actionable tasks
            default: [],
        },
        resources: {
            type: [String], // Recommended links, books, platforms
            default: [],
        },
        estimatedHours: {
            type: Number, // Estimated study hours for this day
            required: true,
        },
    },
    { _id: false }
);

// ── Main schema ──────────────────────────────────────────────

const interviewReportSchema = new mongoose.Schema(
    {
        // ─── User reference ───
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User reference is required"],
            index: true,
        },

        // ─── Inputs (what the user submitted) ───
        jobDescription: {
            type: String,
            required: [true, "Job description is required"],
            trim: true,
        },
        resumeText: {
            type: String,
            required: [true, "Resume text is required"],
            trim: true,
        },
        selfDescription: {
            type: String,
            required: [true, "Self description is required"],
            trim: true,
        },

        // ─── AI Analysis Results ───
        matchScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },

        summary: {
            type: String, // Overall AI-generated summary of the analysis
            required: true,
        },

        // ─── Questions ───
        technicalQuestions: {
            type: [questionSchema],
            required: true,
            validate: {
                validator: (arr) => arr.length > 0,
                message: "At least one technical question is required",
            },
        },

        behavioralQuestions: {
            type: [questionSchema],
            required: true,
            validate: {
                validator: (arr) => arr.length > 0,
                message: "At least one behavioral question is required",
            },
        },

        // ─── Gaps & Strengths ───
        skillGaps: {
            type: [skillGapSchema],
            default: [],
        },

        strengths: {
            type: [String], // e.g. ["Strong React experience", "Good system design"]
            default: [],
        },

        keywordsMatched: {
            type: [String], // JD keywords found in resume
            default: [],
        },

        keywordsMissing: {
            type: [String], // JD keywords NOT found in resume
            default: [],
        },

        // ─── Recommendations ───
        recommendations: {
            type: [String], // Actionable tips to improve the resume / prep
            default: [],
        },

        // ─── Preparation Plan ───
        preparationPlan: {
            type: [preparationStepSchema], // Day-by-day study roadmap
            default: [],
        },

        experienceLevel: {
            type: String,
            enum: ["intern", "junior", "mid", "senior", "lead", "principal"],
        },

        // ─── Meta ───
        jobTitle: {
            type: String, // Extracted or user-provided job title
            trim: true,
        },

        company: {
            type: String, // Optional company name
            trim: true,
        },

        status: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "completed",
        },
    },
    {
        timestamps: true, // createdAt & updatedAt
    }
);

// ── Indexes for fast queries ─────────────────────────────────
interviewReportSchema.index({ user: 1, createdAt: -1 }); // Latest reports first
interviewReportSchema.index({ user: 1, matchScore: -1 }); // Best matches first

const InterviewReport = mongoose.model(
    "InterviewReport",
    interviewReportSchema
);

module.exports = InterviewReport;
