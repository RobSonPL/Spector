
export type StepId = 
  | 'intro'
  | 'diagnosis'
  | 'dashboard'
  | 'archetype'
  | 'sprint'
  | 'summary';

export type Language = 'pl' | 'en' | 'de' | 'es';

export interface SprintAction {
  id: string;
  text: string;
  completed: boolean;
}

export interface SprintWeek {
  week: string;
  mission: string;
  actions: SprintAction[];
  kpi: string;
}

export interface DashboardMetrics {
  currentLeads: number;
  conversionRate: number;
  avgDealValue: number;
  targetLeads: number;
  cac: number;
  clv: number;
}

export interface ResearchHistory {
  id: string;
  date: string;
  product: string;
  goal: string;
  summary: string;
  metrics?: DashboardMetrics;
}

export interface UserState {
  language: Language;
  theme: 'dark' | 'light';
  productResult: string;
  quarterlyGoal: string;
  mainObjection: string;
  archetypes: string[]; // Zmieniono z archetype: string
  metrics: DashboardMetrics;
  history: ResearchHistory[];
  sprintWeeks: SprintWeek[];
  fieldSuggestions: { [key: string]: string };
}

export interface Step {
  id: StepId;
  title: Record<Language, string>;
  role: Record<Language, string>;
}

export const APP_STEPS: Step[] = [
  { 
    id: 'intro', 
    title: { pl: 'Start', en: 'Start', de: 'Start', es: 'Inicio' }, 
    role: { pl: 'SPECTER', en: 'SPECTER', de: 'SPECTER', es: 'SPECTER' }
  },
  { 
    id: 'diagnosis', 
    title: { pl: 'Diagnoza', en: 'Diagnosis', de: 'Diagnose', es: 'Diagnóstico' }, 
    role: { pl: 'Strateg', en: 'Strategist', de: 'Stratege', es: 'Estratega' }
  },
  { 
    id: 'dashboard', 
    title: { pl: 'Dashboard', en: 'Dashboard', de: 'Dashboard', es: 'Panel' }, 
    role: { pl: 'Analityk', en: 'Analyst', de: 'Analyst', es: 'Analista' }
  },
  { 
    id: 'archetype', 
    title: { pl: 'Archetyp', en: 'Archetype', de: 'Archetyp', es: 'Arquetipo' }, 
    role: { pl: 'Profilowanie', en: 'Profiling', de: 'Profilierung', es: 'Perfilado' }
  },
  { 
    id: 'sprint', 
    title: { pl: 'Sprint 30', en: 'Sprint 30', de: 'Sprint 30', es: 'Sprint 30' }, 
    role: { pl: 'Dowódca', en: 'Commander', de: 'Kommandant', es: 'Comandante' }
  },
  { 
    id: 'summary', 
    title: { pl: 'Wynik', en: 'Result', de: 'Ergebnis', es: 'Resultado' }, 
    role: { pl: 'Raport', en: 'Report', de: 'Bericht', es: 'Informe' }
  },
];
