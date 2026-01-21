
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePlaceDescription = async (placeName: string, category: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a compelling tourism description for a place called "${placeName}" in the city of Touggourt, Algeria. The category is ${category}. Keep it under 60 words and emphasize the cultural significance.`,
      config: {
        temperature: 0.7,
        // Using thinkingConfig to ensure the model reasoning is handled according to latest SDK standards
        thinkingConfig: { thinkingBudget: 0 },
      }
    });
    return response.text || "No description generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate description. Please write manually.";
  }
};

export const suggestTags = async (description: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on this description: "${description}", provide a JSON list of 3-5 relevant short tags for a tourism app.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        // Disable thinking for purely structured extraction tasks to reduce latency
        thinkingConfig: { thinkingBudget: 0 },
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
};
