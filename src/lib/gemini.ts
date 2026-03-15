import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const ai = new GoogleGenAI({ apiKey: apiKey! });

export const getGeminiModel = (modelName = "gemini-3-flash-preview") => {
  return ai.models.generateContent({
    model: modelName,
    contents: "", // Placeholder, will be used with specific prompts
  });
};
