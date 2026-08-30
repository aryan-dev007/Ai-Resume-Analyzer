require("dotenv").config();

const { generateInterviewReport } = require("./src/services/ai.service");

// ── Sample Data ──────────────────────────────────────────────

const resumeText = `
ANKUR SHARMA
Backend Developer | Node.js | MongoDB | Express.js
Email: ankur.sharma@email.com | Phone: +91-9876543210
LinkedIn: linkedin.com/in/ankursharma | GitHub: github.com/ankursharma

SUMMARY
Passionate backend developer with 3+ years of experience building scalable RESTful APIs 
using Node.js and Express.js. Strong expertise in MongoDB, Redis caching, and real-time 
applications using Socket.io. Proven track record of optimizing database queries and 
reducing API response times by 35%.

EXPERIENCE

Senior Backend Developer — TechCorp Solutions (Jan 2022 – Present)
- Designed and built RESTful APIs serving 15,000+ active users daily
- Implemented JWT-based authentication and role-based access control
- Optimized MongoDB aggregation pipelines, reducing query time by 40%
- Integrated Redis caching layer, improving response time by 35%
- Built real-time notification system using Socket.io

Backend Developer — StartupXYZ (Jun 2020 – Dec 2021)
- Developed microservices architecture handling 500+ requests/second
- Built payment integration with Razorpay and Stripe APIs
- Implemented automated testing with Jest, achieving 85% code coverage
- Set up CI/CD pipelines using GitHub Actions and Docker

EDUCATION
B.Tech in Computer Science — Delhi Technological University (2016–2020) | CGPA: 8.2

SKILLS
Languages: JavaScript, TypeScript, Python
Backend: Node.js, Express.js, Fastify
Databases: MongoDB, PostgreSQL, Redis
Tools: Docker, Git, GitHub Actions, Postman, Nginx
Other: Socket.io, JWT, OAuth2, REST API Design
`;

const jobDescription = `
BACKEND DEVELOPER (Node.js) — InnovateTech Pvt Ltd

Location: Bengaluru, India (Hybrid)
Experience: 3-5 Years

About the Role:
We are looking for a skilled Backend Developer to join our engineering team. You will be 
responsible for designing, developing, and maintaining scalable backend services that 
power our SaaS platform used by 50,000+ businesses.

Requirements:
- Strong experience in Node.js and Express.js for RESTful API development
- Proven track record in MongoDB optimization using indexing and aggregation pipelines
- Solid understanding and implementation of authentication/authorization using JWT
- Experience with caching strategies, specifically Redis
- Familiarity with message queues (Kafka, RabbitMQ) for event-driven architecture
- Experience with Docker and CI/CD workflows
- Strong knowledge of data structures and algorithms
- Experience with microservices architecture
- Familiarity with distributed systems concepts

Nice to Have:
- Experience with TypeScript
- Knowledge of GraphQL
- Experience with Kubernetes
- Familiarity with cloud services (AWS/GCP)

What We Offer:
- Competitive salary (18-25 LPA)
- Stock options
- Flexible working hours
- Learning & development budget
`;

const selfDescription = `
I am a backend developer with 3 years of experience, primarily working with Node.js 
and MongoDB. I have built several production APIs and I'm comfortable with Express.js, 
JWT auth, and Redis caching. I want to transition into a more senior role where I can 
work on system design and distributed systems. I'm currently learning about message 
queues and Kafka. My strength is in API optimization and database query tuning. I am 
also exploring TypeScript and want to get better at it.
`;

// ── Run the test ─────────────────────────────────────────────

async function main() {
    console.log("⏳ Calling Gemini AI... (this may take 15-30 seconds)\n");

    try {
        const report = await generateInterviewReport({
            resumeText,
            selfDescription,
            jobDescription,
        });

        // ── Raw debug: see exactly what keys Gemini returned ──
        console.log("✅ AI Response received!");
        console.log("📦 Keys returned:", Object.keys(report).join(", "));
        console.log();

        // ── Pretty print the entire JSON ──
        console.log("═══════════════════════════════════════════════════");
        console.log("           FULL AI REPORT (RAW JSON)");
        console.log("═══════════════════════════════════════════════════\n");
        console.log(JSON.stringify(report, null, 2));

        // ── Quick summary ──
        console.log("\n═══════════════════════════════════════════════════");
        console.log("               QUICK SUMMARY");
        console.log("═══════════════════════════════════════════════════");
        console.log("  Match Score:", report.matchScore ?? "N/A");
        console.log("  Job Title:", report.jobTitle ?? report.job_title ?? "N/A");
        console.log("  Company:", report.company ?? "N/A");
        console.log("  Experience:", report.experienceLevel ?? report.experience_level ?? "N/A");
        console.log("  Summary:", (report.summary || "N/A").substring(0, 150) + "...");
        console.log("  Technical Qs:", (report.technicalQuestions || report.technical_questions || []).length);
        console.log("  Behavioral Qs:", (report.behavioralQuestions || report.behavioral_questions || []).length);
        console.log("  Skill Gaps:", (report.skillGaps || report.skill_gaps || []).length);
        console.log("  Strengths:", (report.strengths || []).length);
        console.log("  Keywords Matched:", (report.keywordsMatched || report.keywords_matched || []).length);
        console.log("  Keywords Missing:", (report.keywordsMissing || report.keywords_missing || []).length);
        console.log("  Recommendations:", (report.recommendations || []).length);
        console.log("  Prep Plan Steps:", (report.preparationPlan || report.preparation_plan || []).length);
        console.log("═══════════════════════════════════════════════════");
        console.log("  ✅ TEST COMPLETE");
        console.log("═══════════════════════════════════════════════════\n");

    } catch (error) {
        console.error("❌ ERROR:", error.message || error);
        if (error.stack) console.error(error.stack);
    }
}

main();
