const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

// ── Zod sub-schemas (mirrors interviewReport.model.js) ───────

const questionSchema = z.object({
    question: z.string().describe("The interview question"),
    intention: z.string().describe("Why this question is being asked — what it evaluates"),
    answer: z.string().describe("How to answer this question, what points to cover, what should be the approach"),
    difficulty: z.enum(["easy", "medium", "hard"]).describe("Difficulty level"),
    topic: z.string().describe("The topic area, e.g. React, Node.js, System Design, Teamwork"),
});

const skillGapSchema = z.object({
    skill: z.string().describe("The missing or weak skill"),
    severity: z.enum(["low", "medium", "high", "critical"]).describe("How critical this gap is"),
    recommendation: z.string().describe("Actionable suggestion to bridge this skill gap"),
});

const preparationStepSchema = z.object({
    day: z.string().describe("The day or day range, e.g. 'Day 1', 'Day 2-3', 'Week 2'"),
    topic: z.string().describe("What to study or practice on this day"),
    tasks: z.array(z.string()).describe("Specific actionable tasks for this day"),
    resources: z.array(z.string()).describe("Recommended resources — links, books, platforms"),
    estimatedHours: z.number().describe("Estimated study hours for this day"),
});

// ── Main response schema ─────────────────────────────────────

const interviewReportSchema = z.object({
    matchScore: z
        .number()
        .describe("Overall resume-to-job-description match score from 0 to 100"),

    summary: z
        .string()
        .describe("A concise overall assessment of the candidate's fit for the role"),

    technicalQuestions: z
        .array(questionSchema)
        .describe("5-8 technical interview questions based on the job description and resume"),

    behavioralQuestions: z
        .array(questionSchema)
        .describe("3-5 behavioral/situational interview questions"),

    skillGaps: z
        .array(skillGapSchema)
        .describe("Skills required by the JD but missing or weak in the resume"),

    strengths: z
        .array(z.string())
        .describe("Key strengths the candidate brings based on their resume"),

    keywordsMatched: z
        .array(z.string())
        .describe("Important JD keywords/technologies found in the resume"),

    keywordsMissing: z
        .array(z.string())
        .describe("Important JD keywords/technologies NOT found in the resume"),

    recommendations: z
        .array(z.string())
        .describe("Actionable tips to improve the resume or interview preparation"),

    preparationPlan: z
        .array(preparationStepSchema)
        .describe("A structured day-by-day interview preparation plan (7-14 days) covering skill gaps, technical topics, and behavioral prep"),

    experienceLevel: z
        .enum(["intern", "junior", "mid", "senior", "lead", "principal"])
        .describe("Estimated experience level based on the resume"),

    jobTitle: z
        .string()
        .describe("The job title extracted from the job description"),

    company: z
        .string()
        .describe("The company name extracted from the job description, or 'Unknown' if not found"),
});

// Convert Zod schema → JSON Schema for Gemini's responseSchema
const rawSchema = zodToJsonSchema(interviewReportSchema, {
    $refStrategy: "none",
});

// zodToJsonSchema adds wrapper keys ($schema, additionalProperties) that
// Gemini doesn't support — strip them to get a clean schema
const { $schema, additionalProperties, ...jsonSchema } = rawSchema;

// ── System prompt ────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert AI career coach and technical interviewer.
You will receive three inputs:
1. A Job Description (JD)
2. The candidate's Resume Text
3. The candidate's Self Description

Your task is to analyze the match between the resume and the job description, then produce a comprehensive interview preparation report.

IMPORTANT: Your response MUST be valid JSON that strictly follows the provided schema. Do not include any text outside the JSON object.

Guidelines for each field:
- matchScore: Be honest and precise (0–100). Consider skills, experience, keywords, and domain fit.
- summary: Write a 3–5 sentence overall assessment of the candidate's fit for this specific role.
- technicalQuestions: Generate 5–8 questions covering key technologies and concepts from the JD. Vary difficulty (easy/medium/hard). For each question provide: the question itself, the intention behind it, a detailed answer with key points to cover and the right approach, the difficulty level, and the topic area.
- behavioralQuestions: Generate 3–5 STAR-format behavioral questions relevant to the role. For each provide: the question, the intention (what trait it evaluates), a strong sample answer using the STAR method, difficulty, and topic (e.g. Leadership, Teamwork, Problem Solving).
- skillGaps: Identify skills the JD requires but the resume lacks or is weak in. Rate severity (low/medium/high/critical) and suggest how to bridge each gap.
- strengths: List the candidate's key strengths relative to the JD requirements.
- keywordsMatched: List important JD keywords/technologies that ARE found in the resume.
- keywordsMissing: List important JD keywords/technologies that are NOT found in the resume.
- recommendations: Provide actionable, specific tips to improve the resume and interview readiness.
- preparationPlan: Create a structured 7–14 day preparation plan. Each step should include: the day/range (e.g. "Day 1", "Day 2-3"), the topic to focus on, specific tasks to complete, recommended resources (courses, docs, practice sites), and estimated study hours.
- experienceLevel: Estimate the candidate's level (intern/junior/mid/senior/lead/principal) based on their resume.
- jobTitle: Extract the job title from the JD (or "Unknown").
- company: Extract the company name from the JD (or "Unknown").`;

// ── Main function ────────────────────────────────────────────

async function generateInterviewReport({ resumeText, selfDescription, jobDescription }) {
    const userPrompt = `
=== JOB DESCRIPTION ===
${jobDescription}

=== RESUME TEXT ===
${resumeText}

=== SELF DESCRIPTION ===
${selfDescription}

Analyze the above and produce a complete interview preparation report.`;

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: userPrompt,
        config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: "application/json",
            responseSchema: jsonSchema,
        },
    });

    // Parse the structured JSON response
    const report = JSON.parse(response.text);
    return report;
}

// ── Simple test function (can be removed later) ──────────────

async function invokeGeminiAi() {
    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: "hello gemini what is an interview.",
    });
    console.log(response.text);
}

module.exports = {
    invokeGeminiAi,
    generateInterviewReport,
};