
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSquadStrategy = async (playstyle: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `כגורו גיימינג, בנה אסטרטגיית סקוואד מושלמת עבור שחקן שמתאר את עצמו כך: "${playstyle}". 
    החזר את התשובה בפורמט JSON בלבד עם המבנה הבא:
    {
      "strategyName": "שם האסטרטגיה",
      "description": "תיאור קצר",
      "roles": [
        {"role": "שם התפקיד", "description": "מה הוא עושה", "heroType": "סוג דמות מומלץ"}
      ],
      "tips": ["טיפ 1", "טיפ 2"]
    }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          strategyName: { type: Type.STRING },
          description: { type: Type.STRING },
          roles: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                role: { type: Type.STRING },
                description: { type: Type.STRING },
                heroType: { type: Type.STRING }
              }
            }
          },
          tips: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return null;
  }
};
