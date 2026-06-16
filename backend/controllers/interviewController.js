import { model } from "../utils/geminiClient.js";
import Interview from "../models/Interview.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfModule = require("pdf-parse");
const pdf = pdfModule.default || pdfModule;

const parseMaybeJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseGeminiJson = (text, fallback) => {
  if (!text || typeof text !== "string") return fallback;

  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return fallback;

    try {
      return JSON.parse(match[0]);
    } catch {
      return fallback;
    }
  }
};

const clampScore = (value) => {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
};

const calculateConfidenceSummary = (history = []) => {
  if (!Array.isArray(history) || history.length === 0) {
    return {
      voiceConfidence: 0,
      facialConfidence: 0,
      overallConfidence: 0,
    };
  }

  const totals = history.reduce(
    (acc, item) => {
      acc.voiceConfidence += clampScore(item.voiceConfidence ?? item.confidence);
      acc.facialConfidence += clampScore(item.facialConfidence);
      acc.overallConfidence += clampScore(item.overallConfidence ?? item.confidence);
      return acc;
    },
    { voiceConfidence: 0, facialConfidence: 0, overallConfidence: 0 }
  );

  return {
    voiceConfidence: Math.round(totals.voiceConfidence / history.length),
    facialConfidence: Math.round(totals.facialConfidence / history.length),
    overallConfidence: Math.round(totals.overallConfidence / history.length),
  };
};

const extractResumeText = async (file) => {
  if (!file) return "";

  const parser = new pdf.PDFParse({
    data: file.buffer,
  });

  try {
    const result = await parser.getText();
    return result.text || "";
  } finally {
    await parser.destroy?.();
  }
};

export const generateQuestion = async (req, res) => {
  try {
    console.log("Resume file present?", !!req.file);
    const { type, role, jd } = req.body;
    const previousQuestions = parseMaybeJsonArray(req.body.previousQuestions);
    const previousAnswers = parseMaybeJsonArray(req.body.previousAnswers);
    console.time("Resume Extraction");
    const resumeText = await extractResumeText(req.file);
    console.timeEnd("Resume Extraction");

    console.log("Resume Length:", resumeText.length);

    const history = previousQuestions
      .map((question, index) => {
        return `Question ${index + 1}: ${question}\nAnswer ${index + 1}: ${previousAnswers[index] || "No answer recorded"
          }`;
      })
      .join("\n\n");

    const prompt = `
You are an expert AI interviewer for a production-grade interview coaching platform.

Interview Type: ${type || "General"}
Role: ${role || "Not specified"}

Candidate Resume:
${resumeText || "No resume provided"}

Job Description:
${jd || "No job description provided"}

Previous Interview Conversation:
${history || "No previous conversation"}

Instructions:
- Ask ONLY ONE interview question.
- Make it relevant to the resume, job description, role, and prior answers.
- Avoid repeating previous questions.
- Keep it natural and concise, like a real interviewer.
- Adapt difficulty based on previous answer quality.
- If the previous answer was strong, ask a deeper follow-up.
- If the previous answer was weak or vague, ask a simpler probing question.
- Do not include explanations, labels, or markdown.
`;
    console.time("Gemini Question");
    const result = await model.generateContent(prompt);
    console.timeEnd("Gemini Question");
    const text = result.response.text().trim();

    res.json({
      question: text,
    });
  } catch (err) {
    console.error("Gemini Error:", err);

    res.status(500).json({
      error: "Failed to generate question",
    });
  }
};

export const evaluateAnswer = async (req, res) => {
  try {
    const { question, answer } = req.body;

    const prompt = `
Evaluate this interview answer.

Question: ${question}
Answer: ${answer}

Return ONLY JSON:
{
  "score": "X/10",
  "feedback": "short paragraph",
  "improvementTips": ["tip1", "tip2"]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = parseGeminiJson(text, {
      score: "N/A",
      feedback: text,
      improvementTips: [],
    });

    res.json({ feedback: parsed });
  } catch (err) {
    console.error("Gemini Error:", err);
    res.status(503).json({
      feedback: "AI is currently busy. Please try again in a few seconds.",
    });
  }
};

export const finalEvaluate = async (req, res) => {

  try {
    const { questions = [], answers = [], confidenceHistory = [] } = req.body;
    console.log("===== FINAL EVALUATION =====");
    console.log("Questions:", questions.length);
    console.log("Answers:", answers.length);
    console.log("Confidence History:", confidenceHistory.length);
    console.log("REQUEST BODY:");
    console.log(JSON.stringify(req.body, null, 2));

    const combined = questions
      .map((question, index) => {
        return `Q${index + 1}: ${question}\nA${index + 1}: ${answers[index] || ""}`;
      })
      .join("\n\n");

    const prompt = `
You are a senior technical and behavioral interviewer.

Evaluate the overall interview.

${combined}

Confidence Signals:
${JSON.stringify(confidenceHistory, null, 2)}

Return response ONLY in valid JSON. Do not wrap it in markdown.

{
  "score": "X/10",
  "strengths": ["point1", "point2"],
  "weaknesses": ["point1", "point2"],
  "suggestions": ["point1", "point2"],
  "communicationAnalysis": "short paragraph",
  "confidenceAnalysis": "short paragraph",
  "behavioralAnalysis": "short paragraph",
  "technicalDepthAnalysis": "short paragraph",
  "leadershipIndicators": ["point1", "point2"],
  "behavioralScores": {
    "confidence": 0,
    "communication": 0,
    "leadership": 0,
    "problemSolving": 0,
    "ownership": 0
  }
}

Use 0-100 numbers for every behavioralScores value.
`;

    console.log("Prompt Size:", prompt.length);
    console.log("Sending request to Gemini...");


    const result = await model.generateContent(prompt);
    console.log("Gemini responded successfully");
    const text = result.response.text();

    const parsed = parseGeminiJson(text, {
      score: "N/A",
      strengths: [text],
      weaknesses: [],
      suggestions: [],
      communicationAnalysis: "",
      confidenceAnalysis: "",
      behavioralAnalysis: "",
      technicalDepthAnalysis: "",
      leadershipIndicators: [],
      behavioralScores: {
        confidence: 0,
        communication: 0,
        leadership: 0,
        problemSolving: 0,
        ownership: 0,
      },
    });

    res.json(parsed);
  } catch (err) {
    console.error("Final evaluation error:", err);
    console.error("================================");
    console.error("FINAL EVALUATION FAILED");
    console.error("Name:", err.name);
    console.error("Message:", err.message);
    console.error("Cause:", err.cause);
    console.error("Stack:", err.stack);
    console.error("================================");
    res.status(503).json({
      feedback: "AI busy. Try again later.",
    });
  }
};

export const saveInterview = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      type,
      role,
      score,
      feedback,
      confidenceHistory = [],
      confidenceSummary,
      behavioralScores,
    } = req.body;

    if (!type || !role || !score || !feedback) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const normalizedConfidenceHistory = Array.isArray(confidenceHistory)
      ? confidenceHistory.map((item, index) => ({
        question: Number(item.question || index + 1),
        confidence: clampScore(item.confidence ?? item.overallConfidence),
        voiceConfidence: clampScore(item.voiceConfidence ?? item.confidence),
        facialConfidence: clampScore(item.facialConfidence),
        overallConfidence: clampScore(item.overallConfidence ?? item.confidence),
        metrics: item.metrics || {},
      }))
      : [];

    const interview = new Interview({
      userId: req.user.id,
      type,
      role,
      score,
      feedback,
      confidenceHistory: normalizedConfidenceHistory,
      confidenceSummary:
        confidenceSummary || calculateConfidenceSummary(normalizedConfidenceHistory),
      behavioralScores: behavioralScores || feedback.behavioralScores || {},
    });

    await interview.save();

    res.json({
      success: true,
      message: "Saved successfully",
      data: interview,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save" });
  }
};

export const getHistory = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const interviews = await Interview.find({
      userId: req.user.id,
    }).sort({ date: -1 });

    res.json({
      success: true,
      data: interviews,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};
