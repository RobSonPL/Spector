
import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "./types";

const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  return (window as any).API_KEY || '';
};

const getAI = () => new GoogleGenAI({ apiKey: getApiKey() });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const specterQuery = async (
  prompt: string, 
  model: string = 'gemini-3-pro-preview', 
  configOverride: any = {},
  retries: number = 3
): Promise<string> => {
  const ai = getAI();
  let lastError: any = null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          ...configOverride
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("Empty AI response");
      return text;
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || "";
      
      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await delay(waitTime);
        continue;
      }
      throw error; 
    }
  }
  throw lastError || new Error("SPECTER communication failed.");
};

export const prompts = {
  diagnosis: (product: string, goal: string, objection: string, lang: Language) => `
    ROLE: SPECTER, Elite Sales Strategist.
    LANGUAGE: Respond strictly in ${lang}.
    DATA: Product: ${product}, Goal: ${goal}, Objection: ${objection}.
    Provide a detailed diagnosis table and tactical advice.
  `,
  
  fieldSuggestion: (fieldName: string, currentContext: string, lang: Language) => `
    ROLE: SPECTER, Assistant.
    FIELD: ${fieldName}
    CONTEXT: ${currentContext}
    LANGUAGE: Respond strictly in ${lang}.
    GIVE 3 brief tactical suggestions.
  `,

  sprint: (goal: string, lang: Language) => `
    ROLE: SPECTER, Commander.
    LANGUAGE: Respond strictly in ${lang}.
    GOAL: ${goal}.
    Generate a JSON array of 4 weeks. Each week: {week, mission, actions (array of {id, text, completed: false}), kpi}.
    Return ONLY JSON.
  `
};

export const sprintSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      week: { type: Type.STRING },
      mission: { type: Type.STRING },
      actions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            text: { type: Type.STRING },
            completed: { type: Type.BOOLEAN }
          },
          required: ["id", "text", "completed"]
        }
      },
      kpi: { type: Type.STRING }
    },
    required: ["week", "mission", "actions", "kpi"]
  }
};
