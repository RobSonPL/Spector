
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
  }
};

const ARCHETYPES = [
  { id: 'closer', icon: <Crown />, color: 'bg-red-500', name: { pl: 'Closer', en: 'The Closer' }, desc: { pl: 'Skupiony na finalizacji i wynikach.', en: 'Focused on finalization and results.' } },
  { id: 'advisor', icon: <HeartHandshake />, color: 'bg-blue-500', name: { pl: 'Advisor', en: 'The Advisor' }, desc: { pl: 'Buduje zaufanie i relacje.', en: 'Builds trust and relations.' } },
  { id: 'hunter', icon: <Zap />, color: 'bg-yellow-500', name: { pl: 'Hunter', en: 'The Hunter' }, desc: { pl: 'Agresywne pozyskiwanie nowych leadów.', en: 'Aggressive lead acquisition.' } },
  { id: 'farmer', icon: <Microscope />, color: 'bg-green-500', name: { pl: 'Analyst', en: 'The Analyst' }, desc: { pl: 'Precyzja oparta na danych.', en: 'Data-driven precision.' } }
];

const MetricBar: React.FC<{ label: string; value: number; max: number; color: string; prefix?: string; suffix?: string }> = ({ label, value, max, color, prefix = '', suffix = '' }) => {
  const percentage = Math.min((value / (max || 1)) * 100, 100);
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
          <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} className="text-blue-600 transition-all duration-1000" />
          {data.map((d, i) => (
            <circle key={i} cx={(i * 100) / (data.length - 1)} cy={100 - ((d - min) / range) * 80 - 10} r="2" className="text-blue-600 fill-white dark:fill-neutral-950 stroke-current" strokeWidth="1.5" />
          ))}
        </svg>
      </div>
    </div>
  );
};

const WeeklyProgressChart: React.FC<{ weeks: SprintWeek[] }> = ({ weeks }) => {
  if (!weeks || weeks.length === 0) return null;
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
               </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] mono text-blue-600 font-black uppercase tracking-widest">{week.week}</p>
              <h4 className="text-sm font-black text-neutral-900 dark:text-white uppercase truncate">{week.mission}</h4>
              <p className="text-[9px] text-neutral-500 mt-2 font-bold uppercase">{completed} / {total} DONE</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function App() {
  const [userState, setUserState] = useState<UserState>(() => {
    const defaultState: UserState = {
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

    try {
      const saved = localStorage.getItem('specter_state_v8');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { 
          ...defaultState, 
          ...parsed,
          archetypes: Array.isArray(parsed.archetypes) ? parsed.archetypes : []
        };
      }
    } catch (e) {
      console.warn("Storage restore error:", e);
    }
    return defaultState;
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = UI_TEXT[userState.language] || UI_TEXT.pl;
  const currentStep = APP_STEPS[currentStepIndex];

  useEffect(() => {
    localStorage.setItem('specter_state_v8', JSON.stringify(userState));
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
    try {
      const ctx = `Product: ${userState.productResult}, Goal: ${userState.quarterlyGoal}`;
      const res = await specterQuery(prompts.fieldSuggestion(fieldName, ctx, userState.language));
      setUserState(p => ({ ...p, fieldSuggestions: { ...p.fieldSuggestions, [fieldName]: res } }));
    } catch (e) {} finally { setIsSuggesting(null); }
  };

  const generateSprint = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await specterQuery(prompts.sprint(userState.quarterlyGoal, userState.language), 'gemini-3-pro-preview', { 
        responseMimeType: "application/json", 
        responseSchema: sprintSchema 
      });
      setUserState(p => ({ ...p, sprintWeeks: JSON.parse(res) }));
    } catch (e: any) {
      setError("DOWÓDCA: Nie udało się wygenerować planu bitwy. Spróbuj ponownie.");
    } finally { setIsLoading(false); }
  };

  const performDiagnosis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await specterQuery(prompts.diagnosis(userState.productResult, userState.quarterlyGoal, userState.mainObjection, userState.language));
      setAiResponse(res);
    } catch (e: any) {
      setError("SPECTER: Błąd diagnozy. Przekroczono limit lub błąd połączenia.");
    } finally { setIsLoading(false); }
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
    const content = `SPECTER - STRATEGIC REPORT\n\nProduct: ${userState.productResult}\nGoal: ${userState.quarterlyGoal}\n\nPLAN:\n` + 
      userState.sprintWeeks.map(w => `${w.week}: ${w.mission}\n${w.actions.map(a => `- [${a.completed ? 'X' : ' '}] ${a.text}`).join('\n')}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SPECTER_REPORT.txt`;
    link.click();
  };

  if (!currentStep) return <div className="p-20 text-center text-red-600">ERROR: Invalid Step</div>;

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'intro':
        return (
          <div className="text-center py-10 space-y-12">
            <div className="relative inline-block">
              <div className="absolute -inset-10 bg-blue-600/10 blur-[80px] rounded-full"></div>
              <div className="relative p-12 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full shadow-2xl">
                <ShieldCheck className="w-24 h-24 text-blue-600" />
              </div>
            </div>
            <h2 className="text-7xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">SPECTER</h2>
            <div className="flex justify-center gap-3">
              {['pl', 'en'].map(l => (
                <button key={l} onClick={() => setUserState(p => ({ ...p, language: l as Language }))} className={`px-8 py-3 rounded-2xl border text-xs font-black transition-all ${userState.language === l ? 'bg-blue-600 text-white' : 'bg-white dark:bg-neutral-900'}`}>{l.toUpperCase()}</button>
              ))}
            </div>
            <button onClick={handleNext} className="px-16 py-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-black flex items-center gap-4 mx-auto uppercase shadow-2xl shadow-blue-500/40 text-xl">{t.start} <ChevronRight /></button>
          </div>
        );

      case 'diagnosis':
        return (
          <div className="space-y-6">
            {[
              { id: 'productResult', icon: <Briefcase />, val: userState.productResult },
              { id: 'quarterlyGoal', icon: <Target />, val: userState.quarterlyGoal },
              { id: 'mainObjection', icon: <Search />, val: userState.mainObjection }
            ].map(f => (
              <div key={f.id} className="relative">
                <input className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full pl-14 pr-16 py-6" value={f.val} onChange={e => setUserState(p => ({ ...p, [f.id]: e.target.value }))} placeholder="..." />
                <div className="absolute left-6 top-7 text-neutral-400">{f.icon}</div>
                <button onClick={() => getAiProposal(f.id)} className="absolute right-5 top-5 p-2 bg-blue-50 text-blue-600 rounded-full">{isSuggesting === f.id ? <Loader2 className="animate-spin" /> : <Sparkles />}</button>
              </div>
            ))}
            {!aiResponse && <button onClick={performDiagnosis} className="w-full py-7 bg-blue-600 text-white rounded-full font-black uppercase text-lg">{isLoading ? <Loader2 className="animate-spin mx-auto" /> : t.diagnosisBtn}</button>}
          </div>
        );

      case 'dashboard':
        return (
          <div className="space-y-12">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: t.leadsLabel, key: 'currentLeads', icon: <Users /> },
                { label: t.convLabel, key: 'conversionRate', icon: <TrendingUp /> },
                { label: t.avgLabel, key: 'avgDealValue', icon: <DollarSign /> }
              ].map(m => (
                <div key={m.key} className="p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl">
                  <div className="flex items-center gap-3 mb-4 opacity-50"><span className="text-[10px] mono font-bold">{m.label}</span></div>
                  <input type="number" className="bg-transparent text-4xl font-black w-full outline-none" value={(userState.metrics as any)[m.key]} onChange={e => setUserState(p => ({ ...p, metrics: { ...p.metrics, [m.key]: +e.target.value } }))} />
                </div>
              ))}
            </div>
            <div className="p-10 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[3rem] shadow-xl">
               <MetricBar label="Leads Efficiency" value={userState.metrics.currentLeads} max={userState.metrics.targetLeads} color="#3b82f6" />
               <TrendLine value={userState.metrics.avgDealValue} label={t.trendTitle} />
            </div>
            <button onClick={handleNext} className="w-full py-7 bg-blue-600 text-white rounded-full font-black uppercase text-lg">{t.next}</button>
          </div>
        );

      case 'archetype':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {ARCHETYPES.map(arch => {
                const isSelected = userState.archetypes.includes(arch.id);
                return (
                  <button key={arch.id} onClick={() => {
                    setUserState(p => {
                      const exists = p.archetypes.includes(arch.id);
                      if (exists) return { ...p, archetypes: p.archetypes.filter(a => a !== arch.id) };
                      if (p.archetypes.length < 2) return { ...p, archetypes: [...p.archetypes, arch.id] };
                      return p;
                    });
                  }} className={`p-10 rounded-[3rem] border-2 flex items-start gap-8 transition-all ${isSelected ? 'border-blue-600 bg-blue-50/10' : 'border-neutral-200 dark:border-neutral-800'}`}>
                    <div className={`p-6 rounded-3xl text-white ${arch.color}`}>{arch.icon}</div>
                    <div className="text-left"><h4 className="text-2xl font-black uppercase">{(arch.name as any)[userState.language]}</h4></div>
                  </button>
                );
              })}
            </div>
            <button onClick={handleNext} className="w-full py-7 bg-blue-600 text-white rounded-full font-black uppercase text-lg">{t.next}</button>
          </div>
        );

      case 'sprint':
        return (
          <div className="space-y-8">
            {userState.sprintWeeks.length === 0 ? (
              <button onClick={generateSprint} className="w-full py-10 bg-blue-600 text-white rounded-[3rem] font-black uppercase text-2xl">{isLoading ? <Loader2 className="animate-spin mx-auto" /> : t.sprintBtn}</button>
            ) : (
              <div className="space-y-8">
                {userState.sprintWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[3rem] p-10">
                    <h4 className="text-2xl font-black uppercase mb-6">{week.mission}</h4>
                    <div className="space-y-3">
                      {week.actions.map(a => (
                        <button key={a.id} onClick={() => toggleTask(wIdx, a.id)} className={`w-full text-left p-5 rounded-2xl border flex items-center gap-4 ${a.completed ? 'bg-blue-50/10 opacity-50' : ''}`}>
                          <div className={`w-6 h-6 rounded border flex items-center justify-center ${a.completed ? 'bg-blue-600' : ''}`}>{a.completed && <CheckCircle2 className="w-4 h-4 text-white" />}</div>
                          <span className={a.completed ? 'line-through' : ''}>{a.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={handleNext} className="w-full py-7 bg-blue-600 text-white rounded-full font-black uppercase text-lg">{t.next}</button>
              </div>
            )}
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-12">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[4rem] p-12 shadow-2xl">
               <div className="flex justify-between items-center mb-16">
                 <h3 className="text-4xl font-black uppercase tracking-tighter">SPECTER STATUS</h3>
                 <div className="flex gap-4">
                   <button onClick={() => window.print()} className="p-6 bg-neutral-100 dark:bg-neutral-800 rounded-full"><Printer /></button>
                   <button onClick={exportToDocx} className="p-6 bg-blue-600 text-white rounded-full"><Download /></button>
                 </div>
               </div>
               <WeeklyProgressChart weeks={userState.sprintWeeks} />
            </div>
            <button onClick={() => setCurrentStepIndex(0)} className="w-full py-8 bg-neutral-100 dark:bg-neutral-900 rounded-full font-black uppercase">RESTART</button>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-black transition-colors duration-500">
      {currentStep.id !== 'intro' && (
        <aside className="w-80 hidden lg:flex flex-col bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 p-10 shadow-2xl">
           <div className="flex items-center gap-4 mb-16">
              <div className="p-3 bg-blue-600 text-white rounded-2xl"><Terminal /></div>
              <h1 className="text-2xl font-black uppercase">SPECTER</h1>
           </div>
           <nav className="flex-1 space-y-4">
              {APP_STEPS.map((step, idx) => (
                <button key={step.id} onClick={() => jumpToStep(idx)} disabled={idx > currentStepIndex} className={`w-full flex items-center gap-4 p-5 rounded-3xl border ${idx === currentStepIndex ? 'bg-blue-600 text-white border-blue-600' : 'text-neutral-400 border-transparent'}`}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-xs border">{idx}</div>
                  <p className="text-xs font-black uppercase">{(step.title as any)[userState.language]}</p>
                </button>
              ))}
           </nav>
           <button onClick={() => setUserState(p => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))} className="mt-10 p-6 bg-neutral-50 dark:bg-neutral-900 rounded-3xl flex items-center gap-4">
             {userState.theme === 'dark' ? <Sun className="text-yellow-500" /> : <Moon className="text-blue-600" />} {userState.theme === 'dark' ? 'LIGHT' : 'DARK'}
           </button>
        </aside>
      )}
      <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-20 relative">
        <div className={`w-full transition-all duration-1000 ${currentStep.id === 'intro' ? 'max-w-3xl' : 'max-w-5xl'}`}>
          {error && <div className="mb-12 p-8 bg-red-50 text-red-600 rounded-3xl border border-red-200 flex items-center gap-4"><XCircle /> {error}</div>}
          {renderStepContent()}
          {aiResponse && !isLoading && (
            <div className="mt-20 p-12 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[3rem] shadow-2xl relative">
               <div className="absolute -top-6 left-10 p-4 bg-blue-600 text-white rounded-2xl"><Terminal /></div>
               <div className="prose dark:prose-invert max-w-none text-xl font-medium whitespace-pre-wrap">{aiResponse}</div>
               <button onClick={handleNext} className="mt-10 px-12 py-5 bg-blue-600 text-white rounded-full font-black uppercase flex items-center gap-4 ml-auto">NEXT <ChevronRight /></button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
