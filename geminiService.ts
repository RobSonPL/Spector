
import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "./types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const specterQuery = async (prompt: string, model: string = 'gemini-3-pro-preview', configOverride: any = {}) => {
  const ai = getAI();
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
    return response.text || "Communication error.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "SPECTER is currently unavailable.";
  }
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
    Generate a JSON array of 4 weeks for a sales sprint.
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
