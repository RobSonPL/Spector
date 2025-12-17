
import { GoogleGenAI, Type } from "@google/genai";

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
    return response.text || "Błąd komunikacji ze SPECTEREM.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "SPECTER jest obecnie niedostępny. Sprawdź połączenie.";
  }
};

export const prompts = {
  diagnosis: (product: string, goal: string, objection: string) => `
    ROLE: Jesteś SPECTER, elitarny strateg sprzedaży AI.
    DANE: Rezultat: ${product}, Cel: ${goal}, Obiekcja: ${objection}
    Zwróć wynik w formacie Markdown z tabelą diagnozy.
  `,
  
  journey: (steps: string, leak: string) => `
    ROLE: SPECTER, analityk procesów.
    ZADANIE: Zmapować lejek i postawić hipotezę o przecieku: ${steps}, Przeciek: ${leak}
  `,

  arsenal: (archetype: string, goal: string, objection: string) => `
    ROLE: SPECTER, copywriter.
    Archetyp: ${archetype}, Cel: ${goal}, Obiekcja: ${objection}
  `,

  automation: (tasks: string, time: string) => `
    ROLE: SPECTER, optymalizacja.
    Zadania: ${tasks}, Czas: ${time}
  `,

  sprint: (goal: string) => `
    ROLE: SPECTER, dowódca polowy.
    ZADANIE: Stwórz plan bitwy na 30 dni dla celu: ${goal}.
    Musisz zwrócić tablicę 4 tygodni, każdy z misją, 3-4 konkretnymi działaniami i jednym KPI.
  `,

  workshop: (kpis: string, notes: string) => `
    ROLE: SPECTER, strateg.
    KPI: ${kpis}, Notatki: ${notes}
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
