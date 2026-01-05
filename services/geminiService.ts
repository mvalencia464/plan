
import { GoogleGenAI, Type } from "@google/genai";
import { PreloadedEvent } from "../types";

// Always use the process.env.API_KEY string directly for initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateYearlyPlan = async (year: number, theme: string): Promise<PreloadedEvent[]> => {
  const prompt = `Create a yearly plan for ${year} with the theme: "${theme}". 
  Provide exactly 24 events (roughly 2 per month) distributed throughout the year. 
  Categories should be one of: health, work, personal, holiday, milestone.
  Return the dates in YYYY-MM-DD format. Ensure dates are valid for ${year}.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
              title: { type: Type.STRING, description: "Short title of the event" },
              category: { 
                type: Type.STRING, 
                description: "Category of event",
                enum: ['health', 'work', 'personal', 'holiday', 'milestone']
              },
            },
            required: ["date", "title", "category"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as PreloadedEvent[];
  } catch (error) {
    console.error("Error generating yearly plan:", error);
    return [];
  }
};
