import express from "express";
import {
  generateQuestion,
  evaluateAnswer,
  finalEvaluate,
  saveInterview,
  getHistory,
} from "../controllers/interviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/question",
  protect,
  upload.single("resume"),
  generateQuestion
);
router.post("/evaluate", evaluateAnswer);
router.post("/final-evaluate", finalEvaluate);
router.post("/save", protect, saveInterview);
router.get("/history", protect, getHistory);

export default router;