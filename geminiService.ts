
import { GoogleGenAI } from "@google/genai";

/**
 * SPECTER AI Service
 * Inicjalizuje klienta przy każdym zapytaniu, aby zawsze korzystać 
 * z najaktualniejszej konfiguracji environment variables.
 */
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const specterQuery = async (prompt: string, model: string = 'gemini-3-pro-preview') => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
        // Używamy thinkingConfig tylko dla modeli serii 3 i 2.5
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    // Zgodnie z wytycznymi: dostęp przez właściwość .text
    return response.text || "Błąd: SPECTER nie zwrócił treści.";
  } catch (error: any) {
    console.error("SPECTER AI Error:", error);
    if (error.message?.includes("API_KEY")) {
      return "BŁĄD KRYTYCZNY: Brak klucza API w konfiguracji Vercel.";
    }
    return `SYSTEM ERROR: ${error.message || "Nieznany błąd połączenia."}`;
  }
};

export const prompts = {
  diagnosis: (product: string, goal: string, objection: string) => `
    ROLE: Jesteś SPECTER, elitarny strateg sprzedaży AI.
    ZADANIE: Na podstawie danych użytkownika przygotuj bezlitosną diagnozę.
    DANE: Produkt/Rezultat: ${product}, Cel: ${goal}, Obiekcja: ${objection}.
    
    Zwróć wynik w formacie Markdown z tabelą ocen. Skup się na brutalnej szczerości.
  `,
  
  journey: (steps: string, leak: string) => `
    ROLE: SPECTER, analityk procesów.
    ZADANIE: Zidentyfikuj "dziury" w lejku: ${steps}. Największy wyciek: ${leak}.
    Postaw hipotezę psychologiczną, dlaczego klienci tam rezygnują.
  `,

  arsenal: (archetype: string, goal: string, objection: string) => `
    ROLE: SPECTER, copywriter sprzedażowy.
    ARCHETYP: ${archetype}.
    ZADANIE: Stwórz 3 szablony amunicji (Mail AIDA, LinkedIn, Skrypt na obiekcję: ${objection}).
    CEL: ${goal}.
  `,

  automation: (tasks: string, time: string) => `
    ROLE: SPECTER, optymalizator czasu.
    ZADANIE: Zaproponuj automatyzację dla: ${tasks}. Czas do odzyskania: ${time}.
  `,

  sprint: (goal: string) => `
    ROLE: SPECTER, dowódca polowy.
    ZADANIE: Stwórz plan bitwy na 30 dni dla celu: ${goal}.
    Zwróć tabelę z 4 tygodniami, misjami i konkretnymi KPI.
  `,

  workshop: (kpis: string, notes: string) => `
    ROLE: SPECTER, strateg Q2.
    ZADANIE: Przeanalizuj wyniki: ${kpis} i wnioski: ${notes}. Zaproponuj 3 priorytety strategiczne.
  `
};
