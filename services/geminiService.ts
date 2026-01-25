
import { GoogleGenAI, Type } from "@google/genai";

// Always initialize the client with the apiKey named parameter using process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a concise, high-quality description for a tourist landmark in Touggourt.
 * Uses the gemini-3-flash-preview model for high-performance text generation.
 */
export const generatePlaceDescription = async (placeName: string, category: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a professional and engaging 2-sentence description for a tourist location in Touggourt, Algeria. 
                 Name: ${placeName}
                 Category: ${category}
                 Return only the plain text description.`,
    });
    // Directly access the text property of the GenerateContentResponse object
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini description generation failed:", error);
    return "";
  }
};

/**
 * Suggests relevant search tags based on a place description.
 * Utilizes JSON output with responseSchema for structured results.
 */
export const suggestTags = async (description: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on this description of a tourist site in Touggourt, suggest 5 short, relevant SEO tags: "${description}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const jsonText = response.text?.trim();
    if (!jsonText) return [];
    
    try {
      return JSON.parse(jsonText);
    } catch (parseErr) {
      console.error("Failed to parse Gemini tags JSON:", parseErr);
      return [];
    }
  } catch (error) {
    console.error("Gemini tag suggestion failed:", error);
    return [];
  }
};
