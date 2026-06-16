import express from "express";
import multer from "multer";
import { analyzeResume } from "../controllers/resumeController.js";

const router = express.Router();

// store file in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ROUTE
router.post("/analyze", upload.single("resume"), analyzeResume);

export default router;