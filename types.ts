
export type StepId = 
  | 'intro'
  | 'diagnosis'
  | 'journey'
  | 'archetype'
  | 'dashboard'
  | 'arsenal'
  | 'automation'
  | 'sprint'
  | 'feedback'
  | 'workshop'
  | 'summary';

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface SprintAction {
  id: string;
  text: string;
  completed: boolean;
  subTasks: SubTask[];
}

export interface SprintWeek {
  week: string;
  mission: string;
  actions: SprintAction[];
  kpi: string;
}

export interface UserState {
  productResult: string;
  quarterlyGoal: string;
  mainObjection: string;
  funnelSteps: string;
  funnelLeak: string;
  archetype: string;
  arsenalGoal: string;
  hatedTasks: string;
  timeLost: string;
  kpisConfirmed: boolean;
  sprintResultData?: string;
  sprintWeeks: SprintWeek[];
  transactionHistory: number[];
}

export interface Step {
  id: StepId;
  title: string;
  role: string;
  task: string;
}

export const APP_STEPS: Step[] = [
  { id: 'intro', title: 'Start', role: 'SPECTER', task: 'Inicjalizacja' },
  { id: 'diagnosis', title: 'Diagnoza Silnika', role: 'Strateg', task: 'Analiza wąskich gardeł' },
  { id: 'journey', title: 'Mapa Podróży', role: 'Analityk Procesów', task: 'Identyfikacja punktów tarcia' },
  { id: 'archetype', title: 'Archetyp Sprzedawcy', role: 'Strateg Brandingu', task: 'Definicja stylu' },
  { id: 'dashboard', title: 'Dashboard Liczb', role: 'Analityk Wydajności', task: 'Ustalenie KPI' },
  { id: 'arsenal', title: 'Arsenał Handlowca', role: 'Copywriter Sprzedażowy', task: 'Budowa amunicji' },
  { id: 'automation', title: 'Automatyzacja', role: 'Specjalista Optymalizacji', task: 'Odzyskiwanie czasu' },
  { id: 'sprint', title: 'Sprint 30 Dni', role: 'Dowódca Polowy', task: 'Plan bitwy' },
  { id: 'feedback', title: 'Pętla Feedbacku', role: 'Analityk Pola Bitwy', task: 'Analiza Win/Loss' },
  { id: 'workshop', title: 'Warsztat Strategiczny', role: 'Strateg Sprzedaży', task: 'Plan na kolejny kwartał' },
  { id: 'summary', title: 'Podsumowanie', role: 'SPECTER', task: 'Eksport Raportu' },
];
