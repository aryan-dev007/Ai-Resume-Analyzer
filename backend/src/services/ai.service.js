const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

// ── Hand-crafted JSON Schema for Gemini structured output ────
// (Gemini doesn't support $ref, additionalProperties, or nested required)

const questionItem = {
    type: "object",
    properties: {
        question:   { type: "string", description: "The interview question" },
        intention:  { type: "string", description: "Why this question is being asked" },
        answer:     { type: "string", description: "How to answer — key points and approach" },
        difficulty: { type: "string", enum: ["easy", "medium", "hard"], description: "Difficulty level" },
        topic:      { type: "string", description: "Topic area, e.g. React, Node.js, System Design" },
    },
    required: ["question", "intention", "answer", "difficulty", "topic"],
};

const skillGapItem = {
    type: "object",
    properties: {
        skill:          { type: "string", description: "The missing or weak skill" },
        severity:       { type: "string", enum: ["low", "medium", "high", "critical"], description: "How critical this gap is" },
        recommendation: { type: "string", description: "Actionable suggestion to bridge this gap" },
    },
    required: ["skill", "severity", "recommendation"],
};

const preparationStepItem = {
    type: "object",
    properties: {
        day:            { type: "string", description: "Day or range, e.g. 'Day 1', 'Day 2-3'" },
        topic:          { type: "string", description: "What to study or practice" },
        tasks:          { type: "array", items: { type: "string" }, description: "Specific actionable tasks" },
        resources:      { type: "array", items: { type: "string" }, description: "Recommended resources" },
        estimatedHours: { type: "number", description: "Estimated study hours" },
    },
    required: ["day", "topic", "tasks", "resources", "estimatedHours"],
};

const jsonSchema = {
    type: "object",
    properties: {
        matchScore:         { type: "number", description: "Overall resume-to-JD match score 0-100" },
        summary:            { type: "string", description: "3-5 sentence assessment of the candidate's fit" },
        technicalQuestions: { type: "array", items: questionItem, description: "5-8 technical interview questions" },
        behavioralQuestions:{ type: "array", items: questionItem, description: "3-5 behavioral interview questions" },
        skillGaps:          { type: "array", items: skillGapItem, description: "Skills the JD requires but resume lacks" },
        strengths:          { type: "array", items: { type: "string" }, description: "Key strengths from the resume" },
        keywordsMatched:    { type: "array", items: { type: "string" }, description: "JD keywords found in resume" },
        keywordsMissing:    { type: "array", items: { type: "string" }, description: "JD keywords NOT in resume" },
        recommendations:    { type: "array", items: { type: "string" }, description: "Actionable tips for improvement" },
        preparationPlan:    { type: "array", items: preparationStepItem, description: "7-14 day preparation plan" },
        experienceLevel:    { type: "string", enum: ["intern", "junior", "mid", "senior", "lead", "principal"], description: "Estimated experience level" },
        jobTitle:           { type: "string", description: "Job title from the JD" },
        company:            { type: "string", description: "Company name from the JD, or 'Unknown'" },
    },
    required: [
        "matchScore",
        "summary",
        "technicalQuestions",
        "behavioralQuestions",
        "skillGaps",
        "strengths",
        "keywordsMatched",
        "keywordsMissing",
        "recommendations",
        "preparationPlan",
        "experienceLevel",
        "jobTitle",
        "company"
    ],
};

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
- preparationPlan: Create a structured 7–14 day preparation plan. Each step MUST include the exact key "day" (which can be a single day or range like "Day 1", "Day 2-3"), the "topic" to focus on, specific "tasks" to complete, recommended "resources" (courses, docs, practice sites), and "estimatedHours".
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
            maxOutputTokens: 65536,
            temperature: 0.4,
        },
    });

    // Debug: log response metadata
    console.log("📡 Gemini response status:", response.candidates?.[0]?.finishReason || "unknown");

    // Check if the response was blocked or empty
    if (!response.text) {
        console.error("⚠️  Gemini returned empty/blocked response:");
        console.error("  candidates:", JSON.stringify(response.candidates, null, 2));
        console.error("  promptFeedback:", JSON.stringify(response.promptFeedback, null, 2));
        throw new Error("Gemini returned no text — response may have been blocked or timed out");
    }

    // Parse the structured JSON response
    const report = JSON.parse(response.text);
    return report;
}

// ── Tailored Resume HTML Generator ───────────────────────────

/**
 * Asks Gemini to generate a tailored HTML resume based on user inputs and target Job Description.
 */
async function generateTailoredResumeHtml({ resumeText, selfDescription, jobDescription }) {
    const RESUME_SYSTEM_PROMPT = `You are a world-class executive resume writer, designer, and ATS optimization expert.
Your task is to take the candidate's existing background (resume text and self-description) and target Job Description, and craft a single, beautifully structured HTML document containing a tailored resume.

CRITICAL FORMATTING INSTRUCTIONS:
1. Output ONLY pure standalone HTML markup (starting with <!DOCTYPE html> and containing <html>, <head>, <style>, and <body>).
2. DO NOT wrap the output in markdown code fence syntax (do NOT use \`\`\`html or \`\`\`).
3. Include an internal CSS <style> block inside <head> with elegant, modern, print-ready CSS.
4. CSS Guidelines:
   - Fonts: System sans-serif fonts ('Inter', 'Segoe UI', Arial, sans-serif).
   - Color Palette: Professional slate palette (dark header #0f172a, accent #e91e73 or #2563eb, text #334155, subtle borders #e2e8f0, gray accents #f8fafc).
   - Page dimensions: Clean layout suited for standard A4 printing. Box-sizing border-box, max-width 800px, clean spacing.
   - Layout Sections:
     * Header: Candidate Name (large bold), Target Professional Title, Contact details (Email, Phone, Location, Portfolio/LinkedIn).
     * Professional Summary: High-impact 3-4 sentence summary tailored directly to the target role's key requirements.
     * Core Competencies & Skills: Styled pill tags or categorized list matching job keywords.
     * Professional Experience: Job titles, company, dates, bullet points highlighting key achievements and metrics.
     * Key Projects: Project title, technologies used, concise description of impact.
     * Education & Certifications: Degree, institution, year, relevant certifications.
5. Human-Written & Authentic Content Guidelines:
   - Tailor the candidate's skills, summary, and experience specifically to match the target Job Description.
   - The writing style MUST sound natural, authentic, and written by a real industry professional.
   - Strictly AVOID generic AI fluff, overused buzzwords, and stereotypical AI phrasing (e.g., avoid terms like 'testament to', 'tapestry', 'delved into', 'passionate individual dedicated to driving synergy', 'leveraged dynamic capabilities').
   - Write clear, concise, high-impact bullet points with realistic metrics and natural action verbs (e.g., 'Built', 'Engineered', 'Optimized', 'Designed', 'Led', 'Scaled').
   - Keep bullet points grounded in real technical concepts and natural job responsibilities.
6. STRICT SINGLE-PAGE CONSTRAINT:
   - The entire resume MUST fit onto EXACTLY ONE single A4 page without spilling over into a second page.
   - Use concise bullet points (2-3 per experience entry), compact CSS padding/margins (e.g., padding 15px-20px), tight line-height (1.3-1.4), and concise descriptions to guarantee a clean 1-page PDF output.`;

    const userPrompt = `
=== TARGET JOB DESCRIPTION ===
${jobDescription || "Not provided"}

=== CANDIDATE RESUME TEXT ===
${resumeText || "Not provided"}

=== CANDIDATE SELF DESCRIPTION ===
${selfDescription || "Not provided"}

Generate the complete tailored HTML resume now.`;

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: userPrompt,
        config: {
            systemInstruction: RESUME_SYSTEM_PROMPT,
            temperature: 0.3,
            maxOutputTokens: 65536,
        },
    });

    if (!response.text) {
        throw new Error("Gemini API returned empty response while generating HTML resume.");
    }

    let html = response.text.trim();
    if (html.startsWith("```")) {
        html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "").trim();
    }
    return html;
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
    generateTailoredResumeHtml,
};