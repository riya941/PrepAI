import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY?.trim();

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing. Add it to backend/.env before starting the server.");
}

const genAI = new GoogleGenerativeAI(apiKey);

export const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
});
