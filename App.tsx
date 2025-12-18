
import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, ChevronLeft, Terminal, Target, Sword, Flag, 
  Loader2, CheckCircle2, XCircle, FileText, Printer, PieChart, 
  ClipboardList, Activity, Sun, Moon, History, Download,
  TrendingUp, Users, DollarSign, Lightbulb, Sparkles, BarChart3,
  Search, ShieldCheck, Briefcase, Rocket, Crown, HeartHandshake, Microscope, Zap,
  FileDown
} from 'lucide-react';
import { APP_STEPS, UserState, Language, SprintWeek, DashboardMetrics, StepId } from './types';
import { specterQuery, prompts, sprintSchema } from './geminiService';

const UI_TEXT = {
  pl: {
    init: 'INICJALIZACJA SYSTEMU...',
    start: 'ROZPOCZNIJ TRANSMISJĘ',
    next: 'DALEJ',
    prev: 'WSTECZ',
    diagnosisBtn: 'WYKONAJ DIAGNOZĘ',
    sprintBtn: 'GENERUJ PLAN BITWY',
    history: 'HISTORIA OPERACJI',
    lightMode: 'TRYB JASNY',
    darkMode: 'TRYB CIEMNY',
    status: 'STATUS: ONLINE',
    archetypeTitle: 'WYBIERZ SWOJE ARCHETYPY',
    archetypeSubtitle: 'Wybierz do 2 stylów walki na rynku',
    metricsTitle: 'DASHBOARD LICZB',
    leadsLabel: 'Leady / Miesiąc',
    convLabel: 'Konwersja (%)',
    avgLabel: 'Śr. Transakcja (PLN)',
    cacLabel: 'CAC',
    clvLabel: 'CLV',
    targetLabel: 'Cel',
    trendTitle: 'TREND WARTOŚCI TRANSAKCJI',
    progressTitle: 'POSTĘP OPERACJI TYGODNIOWEJ',
    exportWord: 'EKSPORT DOCX',
    exportPdf: 'DRUKUJ PDF'
  },
  en: {
    init: 'SYSTEM INITIALIZATION...',
    start: 'START TRANSMISSION',
    next: 'NEXT',
    prev: 'BACK',
    diagnosisBtn: 'PERFORM DIAGNOSIS',
    sprintBtn: 'GENERATE BATTLE PLAN',
    history: 'OPERATION HISTORY',
    lightMode: 'LIGHT MODE',
    darkMode: 'DARK MODE',
    status: 'STATUS: ONLINE',
    archetypeTitle: 'CHOOSE YOUR ARCHETYPES',
    archetypeSubtitle: 'Select up to 2 market combat styles',
    metricsTitle: 'DATA DASHBOARD',
    leadsLabel: 'Leads / Month',
    convLabel: 'Conversion (%)',
    avgLabel: 'Avg Deal (PLN)',
    cacLabel: 'CAC',
    clvLabel: 'CLV',
    targetLabel: 'Target',
    trendTitle: 'DEAL VALUE TREND',
    progressTitle: 'WEEKLY OPERATION PROGRESS',
    exportWord: 'EXPORT DOCX',
    exportPdf: 'PRINT PDF'
  },
  de: {
    init: 'SYSTEM-INITIALISIERUNG...',
    start: 'ÜBERTRAGUNG STARTEN',
    next: 'WEITER',
    prev: 'ZURÜCK',
    diagnosisBtn: 'DIAGNOSE DURCHFÜHREN',
    sprintBtn: 'SCHLACHTPLAN ERSTELLEN',
    history: 'OPERATIONSVERLAUF',
    lightMode: 'HELLER MODUS',
    darkMode: 'DUNKLER MODUS',
    status: 'STATUS: ONLINE',
    archetypeTitle: 'WÄHLEN SIE IHRE ARCHETYPEN',
    archetypeSubtitle: 'Wählen Sie bis zu 2 Kampfstile',
    metricsTitle: 'DATEN-DASHBOARD',
    leadsLabel: 'Leads / Monat',
    convLabel: 'Konvertierung (%)',
    avgLabel: 'Durchschn. Deal (PLN)',
    cacLabel: 'CAC',
    clvLabel: 'CLV',
    targetLabel: 'Ziel',
    trendTitle: 'DEAL-WERT-TREND',
    progressTitle: 'WÖCHENTLICHER FORTSCHRITT',
    exportWord: 'EXPORT DOCX',
    exportPdf: 'DRUCK PDF'
  },
  es: {
    init: 'INICIALIZACIÓN DEL SISTEMA...',
    start: 'INICIAR TRANSMISIÓN',
    next: 'SIGUIENTE',
    prev: 'ATRÁS',
    diagnosisBtn: 'REALIZAR DIAGNÓSTICO',
    sprintBtn: 'GENERAR PLAN DE BATALLA',
    history: 'HISTORIAL',
    lightMode: 'MODO CLARO',
    darkMode: 'MODO OSCURO',
    status: 'ESTADO: EN LÍNEA',
    archetypeTitle: 'ELIGE TUS ARQUETIPOS',
    archetypeSubtitle: 'Selecciona hasta 2 estilos de combate',
    metricsTitle: 'PANEL DE DATOS',
    leadsLabel: 'Leads / Mes',
    convLabel: 'Conversión (%)',
    avgLabel: 'Transacción Media (PLN)',
    cacLabel: 'CAC',
    clvLabel: 'CLV',
    targetLabel: 'Objetivo',
    trendTitle: 'TENDENCIA DE VALOR',
    progressTitle: 'PROGRESO SEMANAL',
    exportWord: 'EXPORTAR DOCX',
    exportPdf: 'IMPRIMIR PDF'
  }
};

const ARCHETYPES = [
  { id: 'closer', icon: <Crown />, color: 'bg-red-500', name: { pl: 'Closer', en: 'The Closer', de: 'Der Closer', es: 'El Cerrador' }, desc: { pl: 'Skupiony na finalizacji i wynikach.', en: 'Focused on finalization and results.', de: 'Fokussiert auf Ergebnisse.', es: 'Enfocado en resultados.' } },
  { id: 'advisor', icon: <HeartHandshake />, color: 'bg-blue-500', name: { pl: 'Advisor', en: 'The Advisor', de: 'Der Berater', es: 'El Asesor' }, desc: { pl: 'Buduje zaufanie i relacje.', en: 'Builds trust and relations.', de: 'Baut Vertrauen auf.', es: 'Genera confianza.' } },
  { id: 'hunter', icon: <Zap />, color: 'bg-yellow-500', name: { pl: 'Hunter', en: 'The Hunter', de: 'Der Jäger', es: 'El Cazador' }, desc: { pl: 'Agresywne pozyskiwanie nowych leadów.', en: 'Aggressive lead acquisition.', de: 'Aggressive Neukundengewinnung.', es: 'Adquisición agresiva.' } },
  { id: 'farmer', icon: <Microscope />, color: 'bg-green-500', name: { pl: 'Analyst', en: 'The Analyst', de: 'Der Analyst', es: 'El Analista' }, desc: { pl: 'Precyzja oparta na danych.', en: 'Data-driven precision.', de: 'Datengesteuerte Präzision.', es: 'Precisión basada en datos.' } }
];

const MetricBar: React.FC<{ label: string; value: number; max: number; color: string; prefix?: string; suffix?: string }> = ({ label, value, max, color, prefix = '', suffix = '' }) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="mb-4">
      <div className="flex justify-between text-[10px] mono mb-1 uppercase font-bold opacity-60">
        <span>{label}</span>
        <span>{prefix}{value}{suffix}</span>
      </div>
      <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-inner">
        <div className="h-full transition-all duration-1000 ease-out rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

const TrendLine: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  // Mock trend data based on user input
  const data = [value * 0.85, value * 0.92, value * 0.88, value * 1.05, value * 0.98, value];
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((d, i) => `${(i * 100) / (data.length - 1)},${100 - ((d - min) / range) * 80 - 10}`).join(' ');

  return (
    <div className="mt-6 p-6 bg-blue-50/30 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30">
      <h4 className="text-[10px] mono font-bold uppercase mb-4 text-blue-600 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> {label}</h4>
      <div className="h-32 w-full relative">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            points={points}
            className="text-blue-600 transition-all duration-1000"
          />
          {data.map((d, i) => (
            <circle key={i} cx={(i * 100) / (data.length - 1)} cy={100 - ((d - min) / range) * 80 - 10} r="2" className="text-blue-600 fill-white dark:fill-neutral-950 stroke-current" strokeWidth="1.5" />
          ))}
        </svg>
        <div className="flex justify-between mt-2 text-[8px] mono text-neutral-400">
          <span>T-5</span>
          <span>T-4</span>
          <span>T-3</span>
          <span>T-2</span>
          <span>T-1</span>
          <span className="font-bold text-blue-600">TERAZ</span>
        </div>
      </div>
    </div>
  );
};

const WeeklyProgressChart: React.FC<{ weeks: SprintWeek[] }> = ({ weeks }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
      {weeks.map((week, idx) => {
        const completed = week.actions.filter(a => a.completed).length;
        const total = week.actions.length || 1;
        const pct = (completed / total) * 100;
        
        return (
          <div key={idx} className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow">
            <div className="relative w-24 h-24 shrink-0">
               <svg className="w-full h-full transform -rotate-90">
                 <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-neutral-100 dark:text-neutral-800" />
                 <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" strokeDasharray={251.2} strokeDashoffset={251.2 - (pct / 100) * 251.2} strokeLinecap="round" fill="transparent" className="text-blue-600 transition-all duration-1000" />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-black text-lg text-neutral-900 dark:text-white leading-none">{Math.round(pct)}%</span>
                  <span className="text-[8px] mono font-bold uppercase opacity-40">DONE</span>
               </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] mono text-blue-600 font-black uppercase tracking-widest">{week.week}</p>
              <h4 className="text-sm font-black text-neutral-900 dark:text-white uppercase truncate">{week.mission}</h4>
              <div className="mt-3 flex gap-1 h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                 {week.actions.map((a, i) => (
                   <div key={i} className={`flex-1 ${a.completed ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'} transition-colors duration-500`} />
                 ))}
              </div>
              <p className="text-[9px] text-neutral-500 mt-2 font-bold uppercase">{completed} / {total} ZADANIA UKOŃCZONE</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function App() {
  const [userState, setUserState] = useState<UserState>(() => {
    const saved = localStorage.getItem('specter_state_v7');
    return saved ? JSON.parse(saved) : {
      language: 'pl',
      theme: 'light',
      productResult: '',
      quarterlyGoal: '',
      mainObjection: '',
      archetypes: [],
      metrics: { currentLeads: 100, conversionRate: 5, avgDealValue: 1000, targetLeads: 200, cac: 50, clv: 5000 },
      history: [],
      sprintWeeks: [],
      fieldSuggestions: {}
    };
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = UI_TEXT[userState.language];
  const currentStep = APP_STEPS[currentStepIndex];

  useEffect(() => {
    localStorage.setItem('specter_state_v7', JSON.stringify(userState));
    document.documentElement.classList.toggle('dark', userState.theme === 'dark');
  }, [userState]);

  const handleNext = () => currentStepIndex < APP_STEPS.length - 1 && setCurrentStepIndex(i => i + 1);
  const handlePrev = () => currentStepIndex > 0 && setCurrentStepIndex(i => i - 1);
  const jumpToStep = (idx: number) => {
    if (idx <= currentStepIndex) {
      setCurrentStepIndex(idx);
      setAiResponse(null);
      setError(null);
    }
  };

  const getAiProposal = async (fieldName: string) => {
    setIsSuggesting(fieldName);
    setError(null);
    try {
      const ctx = `Product: ${userState.productResult}, Goal: ${userState.quarterlyGoal}`;
      const res = await specterQuery(prompts.fieldSuggestion(fieldName, ctx, userState.language));
      setUserState(p => ({ ...p, fieldSuggestions: { ...p.fieldSuggestions, [fieldName]: res } }));
    } catch (e: any) {
      console.error("Proposal Error:", e);
    } finally {
      setIsSuggesting(null);
    }
  };

  const generateSprint = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await specterQuery(prompts.sprint(userState.quarterlyGoal, userState.language), 'gemini-3-pro-preview', { 
        responseMimeType: "application/json", 
        responseSchema: sprintSchema 
      });
      
      const data = JSON.parse(res);
      setUserState(p => ({ ...p, sprintWeeks: data }));
    } catch (e: any) {
      console.error("Sprint Gen Error:", e);
      const msg = e?.message || "";
      if (msg.includes("429") || msg.includes("quota")) {
        setError("Przekroczono limit zapytań API (Quota Exceeded). Poczekaj chwilę i spróbuj ponownie.");
      } else {
        setError("BŁĄD DOWÓDCY: Nie udało się wygenerować planu bitwy. Spróbuj ponownie za chwilę.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const performDiagnosis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await specterQuery(prompts.diagnosis(userState.productResult, userState.quarterlyGoal, userState.mainObjection, userState.language));
      setAiResponse(res);
    } catch (e: any) {
      console.error("Diagnosis Error:", e);
      const msg = e?.message || "";
      if (msg.includes("429") || msg.includes("quota")) {
        setError("Quota Exceeded: Serwery są przeciążone. Poczekaj 30 sekund.");
      } else {
        setError("SPECTER: Błąd komunikacji ze sztabem analitycznym.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleArchetype = (id: string) => {
    setUserState(p => {
      const exists = p.archetypes.includes(id);
      if (exists) return { ...p, archetypes: p.archetypes.filter(a => a !== id) };
      if (p.archetypes.length < 2) return { ...p, archetypes: [...p.archetypes, id] };
      return p;
    });
  };

  const toggleTask = (wIdx: number, aId: string) => {
    const nw = [...userState.sprintWeeks];
    const item = nw[wIdx].actions.find(it => it.id === aId);
    if (item) {
      item.completed = !item.completed;
      setUserState(p => ({ ...p, sprintWeeks: nw }));
    }
  };

  const exportToDocx = () => {
    const content = `
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif;">
          <h1>SPECTER - RAPORT STRATEGICZNY</h1>
          <p>Produkt: ${userState.productResult}</p>
          <p>Cel: ${userState.quarterlyGoal}</p>
          <p>Obiekcja: ${userState.mainObjection}</p>
          <hr>
          <h2>PLAN SPRINTU 30 DNI</h2>
          ${userState.sprintWeeks.map(w => `
            <h3>${w.week}: ${w.mission}</h3>
            <ul>
              ${w.actions.map(a => `<li>[${a.completed ? 'X' : ' '}] ${a.text}</li>`).join('')}
            </ul>
            <p>KPI: ${w.kpi}</p>
          `).join('')}
        </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SPECTER_PLAN_${new Date().toISOString().split('T')[0]}.doc`;
    link.click();
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'intro':
        return (
          <div className="text-center py-10 space-y-12 animate-in fade-in duration-1000">
            <div className="relative inline-block">
              <div className="absolute -inset-10 bg-blue-600/10 blur-[80px] rounded-full"></div>
              <div className="relative p-12 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full shadow-2xl">
                <ShieldCheck className="w-24 h-24 text-blue-600" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-7xl font-black tracking-tighter text-neutral-900 dark:text-white uppercase">SPECTER</h2>
              <p className="text-xs mono text-neutral-400 uppercase tracking-[0.6em] font-bold">{t.init}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {(['pl', 'en', 'de', 'es'] as Language[]).map(l => (
                <button key={l} onClick={() => setUserState(p => ({ ...p, language: l }))} className={`px-8 py-3 rounded-2xl border text-xs font-black transition-all ${userState.language === l ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-105' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 hover:border-blue-400'}`}>{l.toUpperCase()}</button>
              ))}
            </div>
            <button onClick={handleNext} className="px-16 py-8 bg-blue-600 hover:bg-blue-700 text-white rounded-[3rem] font-black transition-all shadow-2xl shadow-blue-500/40 flex items-center gap-4 mx-auto uppercase group text-xl">
              {t.start} <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        );

      case 'diagnosis':
        return (
          <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
             <div className="space-y-6">
              {[
                { id: 'productResult', icon: <Briefcase />, placeholder: 'Produkt / Usługa...', val: userState.productResult },
                { id: 'quarterlyGoal', icon: <Target />, placeholder: 'Cel Kwartalny...', val: userState.quarterlyGoal },
                { id: 'mainObjection', icon: <Search />, placeholder: 'Główna obiekcja...', val: userState.mainObjection }
              ].map(f => (
                <div key={f.id} className="relative">
                  <input placeholder={f.placeholder} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2rem] pl-14 pr-16 py-6 text-neutral-900 dark:text-white focus:ring-4 ring-blue-500/10 focus:border-blue-600 outline-none transition-all shadow-sm font-medium" value={f.val} onChange={e => setUserState(p => ({ ...p, [f.id]: (e.target as HTMLInputElement).value }))} />
                  <div className="absolute left-6 top-7 text-neutral-400">{f.icon}</div>
                  <button onClick={() => getAiProposal(f.id)} className="absolute right-5 top-5 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
                    {isSuggesting === f.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  </button>
                </div>
              ))}
             </div>
             {!aiResponse && <button onClick={performDiagnosis} disabled={isLoading} className="w-full py-7 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-lg shadow-xl hover:bg-blue-700 transition-all">{isLoading ? <Loader2 className="animate-spin mx-auto" /> : t.diagnosisBtn}</button>}
          </div>
        );

      case 'dashboard':
        return (
          <div className="space-y-12 animate-in fade-in">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: t.leadsLabel, key: 'currentLeads', icon: <Users />, color: 'text-blue-500' },
                { label: t.convLabel, key: 'conversionRate', icon: <TrendingUp />, color: 'text-green-500' },
                { label: t.avgLabel, key: 'avgDealValue', icon: <DollarSign />, color: 'text-yellow-500' },
                { label: t.cacLabel, key: 'cac', icon: <BarChart3 />, color: 'text-red-500' },
                { label: t.clvLabel, key: 'clv', icon: <Activity />, color: 'text-purple-500' },
                { label: t.targetLabel, key: 'targetLeads', icon: <Target />, color: 'text-orange-500' }
              ].map(m => (
                <div key={m.key} className="p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all">
                  <div className="flex items-center gap-3 mb-4 opacity-50"><div className={`p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 ${m.color}`}>{m.icon}</div><span className="text-[10px] mono font-bold uppercase">{m.label}</span></div>
                  <input type="number" className="bg-transparent text-4xl font-black w-full outline-none text-neutral-900 dark:text-white" value={(userState.metrics as any)[m.key]} onChange={e => setUserState(p => ({ ...p, metrics: { ...p.metrics, [m.key]: +e.target.value } }))} />
                </div>
              ))}
            </div>
            <div className="p-10 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[3.5rem] shadow-xl">
               <h3 className="text-lg font-black mb-8 uppercase flex items-center gap-3"><Sparkles className="text-blue-600" /> Tactical Visuals</h3>
               <MetricBar label="Leads Projection" value={userState.metrics.currentLeads} max={userState.metrics.targetLeads * 1.2 || 1} color="#3b82f6" />
               <MetricBar label="Conv Rate %" value={userState.metrics.conversionRate} max={100} color="#10b981" />
               <MetricBar label="CAC vs Value" value={userState.metrics.cac} max={userState.metrics.clv / 5 || 1} color="#f59e0b" />
               
               <TrendLine value={userState.metrics.avgDealValue} label={t.trendTitle} />
            </div>
            <button onClick={handleNext} className="w-full py-7 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-lg hover:bg-blue-700 transition-all shadow-xl">{t.next}</button>
          </div>
        );

      case 'archetype':
        return (
          <div className="space-y-12 animate-in zoom-in-95 duration-500">
            <div className="text-center space-y-2">
              <h3 className="text-4xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">{t.archetypeTitle}</h3>
              <p className="text-neutral-500 text-sm font-medium">{t.archetypeSubtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {ARCHETYPES.map(arch => {
                const isSelected = userState.archetypes.includes(arch.id);
                return (
                  <button key={arch.id} onClick={() => toggleArchetype(arch.id)} className={`p-10 rounded-[3.5rem] border-2 transition-all text-left flex items-start gap-8 relative overflow-hidden group ${isSelected ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 shadow-2xl scale-[1.03]' : 'border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-300 shadow-sm'}`}>
                    <div className={`p-6 rounded-3xl text-white shadow-lg ${arch.color} group-hover:scale-110 transition-transform shrink-0`}>{arch.icon}</div>
                    <div>
                      <h4 className="text-2xl font-black text-neutral-900 dark:text-white uppercase mb-3">{(arch.name as any)[userState.language]}</h4>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium">{(arch.desc as any)[userState.language]}</p>
                    </div>
                    {isSelected && <div className="absolute top-6 right-8 p-1 bg-blue-600 rounded-full text-white"><CheckCircle2 className="w-6 h-6" /></div>}
                  </button>
                );
              })}
            </div>
            <button onClick={handleNext} disabled={userState.archetypes.length === 0} className="w-full py-7 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-lg hover:bg-blue-700 transition-all shadow-xl disabled:opacity-50">{t.next}</button>
          </div>
        );

      case 'sprint':
        return (
          <div className="space-y-10 animate-in fade-in">
            {userState.sprintWeeks.length === 0 && !isLoading ? (
              <div className="text-center py-20 space-y-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[4rem] shadow-xl">
                <div className="p-8 bg-blue-600/10 rounded-full inline-block"><Flag className="w-20 h-20 text-blue-600" /></div>
                <div className="space-y-2"><h3 className="text-3xl font-black uppercase tracking-tight">Gotowy na Ofensywę?</h3><p className="text-neutral-500 text-sm">DOWÓDCA wyliczy plan 30-dniowy na bazie Twoich archetypów.</p></div>
                <button onClick={generateSprint} className="px-16 py-7 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase shadow-2xl hover:bg-blue-700 transition-all text-lg">{t.sprintBtn}</button>
              </div>
            ) : (
              <div className="space-y-8">
                {userState.sprintWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[3rem] p-10 shadow-sm transition-all hover:shadow-xl">
                    <div className="flex justify-between items-start mb-8"><div><span className="text-[10px] mono text-blue-600 font-black uppercase tracking-widest">{week.week}</span><h4 className="text-2xl font-black text-neutral-900 dark:text-white mt-1 uppercase tracking-tight">{week.mission}</h4></div><div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl text-xs mono text-blue-600 font-bold uppercase">{week.kpi}</div></div>
                    <div className="space-y-3">{week.actions.map(a => (
                      <button key={a.id} onClick={() => toggleTask(wIdx, a.id)} className={`w-full text-left p-5 rounded-2xl border flex items-center gap-4 transition-all group ${a.completed ? 'bg-blue-50/50 dark:bg-blue-900/5 border-blue-200 dark:border-blue-900 text-neutral-400' : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-100 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-blue-400'}`}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${a.completed ? 'bg-blue-600 border-blue-600 shadow-lg' : 'border-neutral-300 dark:border-neutral-600 group-hover:border-blue-400'}`}>{a.completed && <CheckCircle2 className="w-5 h-5 text-white" />}</div>
                        <span className={`text-base font-bold transition-all ${a.completed ? 'line-through opacity-50' : ''}`}>{a.text}</span>
                      </button>
                    ))}</div>
                  </div>
                ))}
                <button onClick={handleNext} className="w-full py-7 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase shadow-xl text-lg hover:bg-blue-700 transition-all">{t.next}</button>
              </div>
            )}
            {isLoading && <div className="flex flex-col items-center py-20 animate-pulse"><Loader2 className="animate-spin w-16 h-16 text-blue-600 mb-6" /><p className="mono text-xs uppercase tracking-[0.6em] font-black text-neutral-500">DOWÓDCA_STRATEGII_AKTYWNY...</p></div>}
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-12 animate-in fade-in duration-1000">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[4rem] p-12 md:p-20 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-5"><ShieldCheck className="w-48 h-48" /></div>
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16 relative z-10">
                  <div>
                    <h3 className="text-4xl font-black text-neutral-900 dark:text-white mb-4 uppercase tracking-tighter">{t.status}</h3>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                      <ShieldCheck className="w-5 h-5 text-blue-600" />
                      <span className="text-xs mono text-blue-600 font-black uppercase tracking-widest">OFFENSIVE_PROTOCOL_ACTIVE</span>
                    </div>
                  </div>
                  <div className="flex gap-4 no-print flex-wrap">
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-[2rem] hover:bg-blue-600 hover:text-white transition-all shadow-md font-bold uppercase text-xs">
                      <Printer className="w-5 h-5" /> {t.exportPdf}
                    </button>
                    <button onClick={exportToDocx} className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-[2rem] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/30 font-bold uppercase text-xs">
                      <FileDown className="w-5 h-5" /> {t.exportWord}
                    </button>
                  </div>
               </div>

               <div className="relative z-10">
                  <h4 className="text-[11px] mono font-black uppercase tracking-[0.4em] text-neutral-400 mb-8 flex items-center gap-3"><PieChart className="w-5 h-5 text-blue-600" /> {t.progressTitle}</h4>
                  <WeeklyProgressChart weeks={userState.sprintWeeks} />
               </div>

               <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                 {userState.sprintWeeks.map((week, idx) => {
                   const completed = week.actions.filter(a => a.completed).length;
                   const total = week.actions.length || 1;
                   const pct = (completed / total) * 100;
                   return (
                     <div key={idx} className="flex flex-col items-center p-8 bg-neutral-50 dark:bg-neutral-800/40 rounded-[3rem] border border-neutral-100 dark:border-neutral-800 group hover:border-blue-500 transition-all shadow-sm">
                        <div className="w-24 h-24 mb-6 relative">
                           <svg className="w-full h-full transform -rotate-90">
                             <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-neutral-200 dark:text-neutral-800" />
                             <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" strokeDasharray={251.2} strokeDashoffset={251.2 - (pct / 100) * 251.2} strokeLinecap="round" fill="transparent" className="text-blue-600 transition-all duration-1000" />
                           </svg>
                           <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-neutral-900 dark:text-white">{Math.round(pct)}%</div>
                        </div>
                        <span className="text-[10px] mono font-black text-neutral-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">W{idx + 1}</span>
                     </div>
                   );
                 })}
               </div>
            </div>
            <button onClick={() => setCurrentStepIndex(0)} className="w-full py-8 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[3rem] font-black uppercase text-neutral-400 hover:text-blue-600 hover:border-blue-600 transition-all text-lg no-print">RESTART SEQUENCE</button>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex font-sans overflow-x-hidden">
      
      {/* Sidebar Navigation */}
      {currentStep.id !== 'intro' && (
        <aside className="w-80 hidden lg:flex flex-col bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 p-10 no-print animate-in slide-in-from-left duration-700 relative z-50 shadow-2xl">
           <div className="flex items-center gap-4 mb-16">
              <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20"><Terminal className="w-7 h-7" /></div>
              <h1 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">SPECTER</h1>
           </div>
           <nav className="flex-1 space-y-4">
              {APP_STEPS.map((step, idx) => {
                const isPast = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <button key={step.id} onClick={() => jumpToStep(idx)} disabled={idx > currentStepIndex} className={`w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all border text-left group ${isCurrent ? 'bg-blue-600 border-blue-600 text-white shadow-2xl translate-x-2' : isPast ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800 text-blue-600' : 'bg-transparent border-transparent text-neutral-400 opacity-50'}`}>
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs border transition-all ${isCurrent ? 'bg-white text-blue-600 border-white' : isPast ? 'bg-blue-600 text-white border-blue-600' : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'}`}>{idx}</div>
                    <div className="flex-1"><p className={`text-[10px] mono font-bold uppercase tracking-widest ${isCurrent ? 'text-blue-100' : 'text-neutral-500'}`}>{step.role[userState.language]}</p><p className="text-xs font-black uppercase tracking-tight">{step.title[userState.language]}</p></div>
                    {isPast && <CheckCircle2 className="w-5 h-5" />}
                  </button>
                );
              })}
           </nav>
           <div className="mt-10 pt-10 border-t border-neutral-100 dark:border-neutral-800 space-y-6">
              <button onClick={() => setUserState(p => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))} className="w-full p-6 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-[2rem] flex items-center gap-4 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all font-black text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-400 shadow-sm">{userState.theme === 'dark' ? <><Sun className="w-6 h-6 text-yellow-500" /> {t.lightMode}</> : <><Moon className="w-6 h-6 text-blue-600" /> {t.darkMode}</>}</button>
              <div className="text-[10px] mono text-neutral-400 font-bold uppercase tracking-[0.2em] leading-relaxed">Specter_Tactical_v3.2.0 <br/><span className="text-blue-600">Made by R | H synapsehub.pl</span></div>
           </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 lg:p-20 relative overflow-hidden bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100">
        <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-blue-500/5 blur-[180px] -z-10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-2/3 h-2/3 bg-purple-500/5 blur-[180px] -z-10 rounded-full animate-pulse"></div>
        
        <div className={`w-full transition-all duration-1000 ${currentStep.id === 'intro' ? 'max-w-3xl' : 'max-w-5xl'}`}>
          {currentStep.id === 'intro' && (
             <header className="flex justify-between items-center mb-16 no-print">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-blue-600 text-white rounded-[2rem] shadow-2xl shadow-blue-500/30"><Terminal className="w-10 h-10" /></div>
                  <h1 className="text-3xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">SPECTER</h1>
                </div>
                <button onClick={() => setUserState(p => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))} className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] shadow-xl hover:scale-110 transition-transform">{userState.theme === 'dark' ? <Sun className="w-8 h-8 text-yellow-500" /> : <Moon className="w-8 h-8 text-blue-600" />}</button>
             </header>
          )}

          <div className="relative z-10">
            {error && (
              <div className="mb-12 p-10 bg-red-50 dark:bg-red-950/20 border-2 border-red-100 dark:border-red-900/30 rounded-[3rem] flex items-center gap-8 animate-shake shadow-2xl relative overflow-hidden"><div className="absolute inset-0 bg-red-600/5 animate-pulse"></div><div className="p-5 bg-red-600 text-white rounded-3xl shadow-xl relative z-10"><XCircle className="w-10 h-10" /></div><div className="relative z-10"><p className="text-xs mono text-red-600 dark:text-red-400 font-black uppercase mb-1">CRITICAL_ERROR</p><p className="text-xl text-neutral-900 dark:text-white font-black">{error}</p></div></div>
            )}

            {renderStepContent()}

            {aiResponse && !isLoading && (
              <div className="mt-24 p-12 md:p-20 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[4.5rem] shadow-2xl animate-in slide-in-from-bottom-12 duration-700 no-print border-l-[20px] border-l-blue-600 relative overflow-hidden backdrop-blur-xl">
                 <div className="absolute -top-8 left-16 p-5 bg-blue-600 text-white rounded-3xl shadow-2xl shadow-blue-500/30"><Terminal className="w-8 h-8" /></div>
                 <div className="text-[10px] mono text-neutral-400 font-black uppercase tracking-[0.7em] mb-16">DECODING_STRATEGIC_TRANSMISSION...</div>
                 <div className="prose dark:prose-invert max-w-none text-xl text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                    {aiResponse.split('\n').map((line, i) => {
                      if (line.includes('|')) return (
                        <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-8 my-10">
                          {line.split('|').map((cell, j) => <div key={j} className="p-8 bg-neutral-50 dark:bg-neutral-800/80 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 text-sm font-black shadow-sm hover:border-blue-600 transition-all uppercase tracking-tight">{cell.trim()}</div>)}
                        </div>
                      );
                      return <p key={i} className="mb-8">{line}</p>;
                    })}
                 </div>
                 <div className="mt-20 pt-12 border-t border-neutral-100 dark:border-neutral-800 flex justify-end"><button onClick={handleNext} className="px-20 py-7 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-blue-500/40 hover:bg-blue-700 transition-all flex items-center gap-6 group">{t.next} <ChevronRight className="w-8 h-8 group-hover:translate-x-3 transition-transform" /></button></div>
              </div>
            )}
          </div>
        </div>

        {currentStep.id === 'intro' && (
           <footer className="mt-24 text-center space-y-4 no-print opacity-60">
              <div className="text-[11px] mono font-black uppercase tracking-[0.6em] text-neutral-400">Specter_Tactical_v3.2.0</div>
              <div className="text-sm font-black text-blue-600 uppercase tracking-widest animate-pulse">Made by R | H synapsehub.pl</div>
           </footer>
        )}
      </main>

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
        .animate-shake { animation: shake 0.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
