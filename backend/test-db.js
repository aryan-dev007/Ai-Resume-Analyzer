require("dotenv").config();
const mongoose = require("mongoose");
const InterviewReport = require("./src/models/interviewReport.model");

const aiResult = {
  "matchScore": 85,
  "jobTitle": "Backend Developer (Node.js)",
  "company": "InnovateTech Pvt Ltd",
  "experienceLevel": "mid",
  "summary": "Ankur is a strong match...",
  "technicalQuestions": [
    {
      "question": "Q1",
      "intention": "I1",
      "answer": "A1",
      "difficulty": "medium",
      "topic": "Node.js"
    }
  ],
  "behavioralQuestions": [
    {
      "question": "Q1",
      "intention": "I1",
      "answer": "A1",
      "difficulty": "medium",
      "topic": "Leadership"
    }
  ],
  "skillGaps": [],
  "strengths": ["a"],
  "keywordsMatched": ["a"],
  "keywordsMissing": ["a"],
  "recommendations": ["a"],
  "preparationPlan": [
    {
      "day": "Day 1",
      "topic": "T1",
      "tasks": ["T1"],
      "resources": ["R1"],
      "estimatedHours": 2
    }
  ]
};

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/resume-analyzer");
    console.log("Connected to DB");
    
    // We mock a user ID
    const dummyUserId = new mongoose.Types.ObjectId();
    
    const report = new InterviewReport({
      user: dummyUserId,
      jobDescription: "Dummy JD",
      resumeText: "Dummy Resume",
      selfDescription: "",
      ...aiResult,
      status: "completed",
    });
    
    await report.validate();
    console.log("✅ Validation passed!");
  } catch (err) {
    console.error("❌ Validation error:", err);
  } finally {
    mongoose.disconnect();
  }
}
test();
