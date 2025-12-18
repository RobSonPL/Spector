
import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "./types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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
      
      // If it's a rate limit error (429), try exponential backoff
      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(`Quota exceeded. Retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${retries})`);
        await delay(waitTime);
        continue;
      }
      
      // For other errors, break early or handle specifically
      console.error("Gemini Query Error:", error);
      throw error; 
    }
  }

  throw lastError || new Error("SPECTER failed to respond after multiple attempts.");
};

export const prompts = {
  diagnosis: (product: string, goal: string, objection: string, lang: Language) => `
    ROLE: SPECTER, Elite Sales Strategist.
    LANGUAGE: Respond strictly in ${lang}.
    DATA: Product: ${product}, Goal: ${goal}, Objection: ${objection}.
    Provide a detailed diagnosis table and a short recommendation.
    Additionally, at the very end, provide a section "NEXT_STEP_HINT" with one sentence of tactical advice.
  `,
  
  fieldSuggestion: (fieldName: string, currentContext: string, lang: Language) => `
    ROLE: SPECTER, Sales Assistant.
    FIELD: ${fieldName}
    CONTEXT: ${currentContext}
    LANGUAGE: Respond strictly in ${lang}.
    GIVE 3 brief, professional suggestions for this field in sales context.
    Format: Suggestion 1 | Suggestion 2 | Suggestion 3
  `,

  sprint: (goal: string, lang: Language) => `
    ROLE: SPECTER, Tactical Commander.
    LANGUAGE: Respond strictly in ${lang}.
    GOAL: ${goal}.
    Generate a JSON array of 4 weeks for a sales sprint. Each week object must have: week, mission, actions (array of {id, text, completed: false}), and kpi.
    Return ONLY valid JSON.
  `,

  metricsAnalysis: (metrics: any, lang: Language) => `
    ROLE: SPECTER, Performance Analyst.
    LANGUAGE: Respond strictly in ${lang}.
    Analyze: Leads: ${metrics.currentLeads}, Conv: ${metrics.conversionRate}%, Avg Deal: ${metrics.avgDealValue}, CAC: ${metrics.cac}.
    Provide a quick SWOT analysis of these numbers.
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
