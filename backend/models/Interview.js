import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  type: String,
  role: String,
  score: String,
  feedback: Object,
  confidenceHistory: [
    {
      question: Number,
      confidence: Number,
      voiceConfidence: Number,
      facialConfidence: Number,
      overallConfidence: Number,
      metrics: Object,
    },
  ],
  confidenceSummary: {
    voiceConfidence: Number,
    facialConfidence: Number,
    overallConfidence: Number,
  },
  behavioralScores: {
    confidence: Number,
    communication: Number,
    leadership: Number,
    problemSolving: Number,
    ownership: Number,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Interview", interviewSchema);
