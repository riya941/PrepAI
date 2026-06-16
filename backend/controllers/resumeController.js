import { model } from "../utils/geminiClient.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfModule = require("pdf-parse");
const pdf = pdfModule.default || pdfModule;

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

const extractResumeText = async (file) => {
  if (!file) return "";

  const parser = new pdf.PDFParse({ data: file.buffer });

  try {
    const result = await parser.getText();
    return result.text || "";
  } finally {
    await parser.destroy?.();
  }
};

export const analyzeResume = async (req, res) => {
  try {
    const jd = req.body.jd || "";
    const resumeText = await extractResumeText(req.file);

    if (!resumeText.trim()) {
      return res.status(400).json({ error: "Please upload a readable PDF resume." });
    }

    const prompt = `
You are a senior ATS and technical recruiting analyst.

Analyze this resume against the job description.

Resume:
${resumeText}

Job Description:
${jd || "No job description provided"}

Return ONLY valid JSON. Do not wrap it in markdown.

{
  "score": "X/100",
  "keywordMatchScore": 0,
  "strengths": ["..."],
  "missingKeywords": ["..."],
  "missingSkills": ["..."],
  "suggestions": ["..."],
  "atsHeatmap": [
    { "label": "Role Alignment", "score": 0, "status": "strong|moderate|weak" },
    { "label": "Technical Keywords", "score": 0, "status": "strong|moderate|weak" },
    { "label": "Impact Metrics", "score": 0, "status": "strong|moderate|weak" },
    { "label": "Formatting", "score": 0, "status": "strong|moderate|weak" }
  ],
  "sectionAnalysis": {
    "summary": { "score": 0, "feedback": "..." },
    "skills": { "score": 0, "feedback": "..." },
    "projects": { "score": 0, "feedback": "..." },
    "experience": { "score": 0, "feedback": "..." },
    "education": { "score": 0, "feedback": "..." }
  }
}

Use 0-100 numbers for all numeric scores.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const parsed = parseGeminiJson(text, {
      score: "N/A",
      keywordMatchScore: 0,
      strengths: [],
      missingKeywords: [],
      missingSkills: [],
      suggestions: [text],
      atsHeatmap: [],
      sectionAnalysis: {},
    });

    res.json(parsed);
  } catch (err) {
    console.error("Resume analysis error:", err);
    res.status(500).json({ error: "Failed to analyze" });
  }
};
