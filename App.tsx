
import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  Terminal, 
  Target, 
  Sword, 
  Zap, 
  Flag, 
  Repeat, 
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  FileText,
  Printer,
  PieChart,
  ClipboardList,
  Activity
} from 'lucide-react';
import { APP_STEPS, UserState, Step, SprintWeek, SprintAction } from './types';
import { specterQuery, prompts, sprintSchema } from './geminiService';

// --- Komponenty Pomocnicze ---

const ProgressBar: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => {
  const progress = (currentStep / (totalSteps - 1)) * 100;
  return (
    <div className="w-full bg-neutral-900 h-1.5 mb-8 rounded-full overflow-hidden">
      <div 
        className="h-full bg-blue-600 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(37,99,235,0.5)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

const Header: React.FC = () => (
  <header className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-800 no-print">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-blue-600/10 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.2)]">
        <Terminal className="w-6 h-6 text-blue-500" />
      </div>
      <div>
        <h1 className="text-xl font-black tracking-tight text-white uppercase">SPECTER <span className="text-blue-600">AI</span></h1>
        <p className="text-[10px] text-neutral-500 mono uppercase tracking-[0.2em]">Strategic Sales Warfare</p>
      </div>
    </div>
    <div className="flex flex-col items-end">
      <div className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full text-[10px] mono text-blue-500 font-bold">
        STATUS: ONLINE
      </div>
      <div className="text-[8px] mono text-neutral-600 mt-1 uppercase">Protocol: v2.0.4 // OFFENSIVE</div>
    </div>
  </header>
);

const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  const rendered = lines.map((line, i) => {
    if (line.startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim().length > 0 || line.includes('---'));
      if (line.includes('---')) return <hr key={i} className="my-2 border-neutral-800" />;
      return (
        <div key={i} className="flex border-b border-neutral-900 py-2 last:border-0 hover:bg-neutral-900/50 px-2 transition-colors">
          {cells.map((cell, j) => (
            <div key={j} className={`flex-1 text-sm ${j === 0 ? 'font-semibold text-neutral-300' : 'text-neutral-400'}`}>
              {cell.replace(/\*\*/g, '').trim()}
            </div>
          ))}
        </div>
      );
    }
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)?.[0].length || 1;
      const text = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');
      const sizes = ['text-2xl', 'text-xl', 'text-lg', 'text-md'];
      return <h3 key={i} className={`${sizes[level-1] || 'text-base'} font-bold mt-4 mb-2 text-white flex items-center gap-2`}><Activity className="w-4 h-4 text-blue-600" /> {text}</h3>;
    }
    const boldFormatted = line.split('**').map((part, idx) => 
      idx % 2 === 1 ? <span key={idx} className="text-blue-400 font-bold">{part}</span> : part
    );
    return <p key={i} className="text-sm text-neutral-300 leading-relaxed mb-1">{boldFormatted}</p>;
  });
  return <div className="space-y-1">{rendered}</div>;
};

// Radial Progress Component for Pie Chart Visualization
const RadialProgress: React.FC<{ percentage: number; label: string; mission: string }> = ({ percentage, label, mission }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center bg-neutral-900/40 p-5 rounded-2xl border border-neutral-800 hover:border-blue-500/30 transition-all group">
      <div className="relative w-24 h-24 mb-4">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-neutral-800"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="text-blue-600 transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black text-white">{Math.round(percentage)}%</span>
          <span className="text-[8px] mono text-neutral-500 uppercase tracking-tighter">PROGRESS</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[10px] mono text-blue-500 font-bold uppercase mb-1">{label}</p>
        <p className="text-xs text-neutral-300 font-medium line-clamp-1 h-4">{mission}</p>
      </div>
    </div>
  );
};

const ProgressChart: React.FC<{ weeks: SprintWeek[] }> = ({ weeks }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      {weeks.map((week, idx) => {
        const total = week.actions.length;
        const completed = week.actions.filter(a => a.completed).length;
        const percentage = total > 0 ? (completed / total) * 100 : 0;
        
        return (
          <RadialProgress 
            key={idx} 
            percentage={percentage} 
            label={week.week} 
            mission={week.mission} 
          />
        );
      })}
    </div>
  );
};

// --- Główna Aplikacja ---

export default function App() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userState, setUserState] = useState<UserState>({
    productResult: '',
    quarterlyGoal: '',
    mainObjection: '',
    funnelSteps: '',
    funnelLeak: '',
    archetype: '',
    arsenalGoal: '',
    hatedTasks: '',
    timeLost: '',
    kpisConfirmed: false,
    sprintWeeks: [],
  });
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = APP_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < APP_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setAiResponse(null);
      setError(null);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setAiResponse(null);
      setError(null);
    }
  };

  const processQuery = async (prompt: string, config: any = {}) => {
    setIsLoading(true);
    setError(null);
    const result = await specterQuery(prompt, 'gemini-3-pro-preview', config);
    setIsLoading(false);
    return result;
  };

  const handleToggleAction = (weekIdx: number, actionId: string) => {
    const newWeeks = [...userState.sprintWeeks];
    const week = newWeeks[weekIdx];
    const action = week.actions.find(a => a.id === actionId);
    if (action) {
      action.completed = !action.completed;
      setUserState(prev => ({ ...prev, sprintWeeks: newWeeks }));
    }
  };

  const exportToWord = () => {
    const content = `
      # RAPORT STRATEGICZNY SPECTER AI
      Produkt: ${userState.productResult}
      Cel: ${userState.quarterlyGoal}
      
      ## WYNIKI OPERACJI - POSTĘP SPRINTU
      ${userState.sprintWeeks.map(w => {
        const pct = (w.actions.filter(a => a.completed).length / w.actions.length) * 100;
        return `### ${w.week}: ${w.mission} (${Math.round(pct)}% ukończenia)\nKPI: ${w.kpi}\nZadania:\n${w.actions.map(a => `- [${a.completed ? 'X' : ' '}] ${a.text}`).join('\n')}\n`;
      }).join('\n')}
    `;
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SPECTER_REPORT_${new Date().toISOString().split('T')[0]}.doc`;
    a.click();
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'intro':
        return (
          <div className="text-center py-12">
            <div className="mb-6 inline-flex p-6 bg-blue-600/10 rounded-full border border-blue-600/20 relative shadow-[0_0_30px_rgba(37,99,235,0.2)]">
              <Sword className="w-16 h-16 text-blue-500" />
              <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full"></div>
            </div>
            <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent uppercase tracking-tighter">SPECTER AI</h2>
            <p className="text-neutral-500 mono mb-10 uppercase tracking-widest text-xs">Tactical Intelligence Engine</p>
            <button onClick={handleNext} className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center gap-3 mx-auto uppercase group">
              ROZPOCZNIJ TRANSMISJĘ <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        );

      case 'diagnosis':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-blue-600/5 rounded-xl border border-blue-600/20 mb-4">
               <p className="text-[10px] mono text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Target className="w-3 h-3" /> System Diagnosis Required</p>
               <p className="text-xs text-neutral-400">Podaj kluczowe parametry operacyjne, aby SPECTER mógł wyliczyć błędy w Twoim silniku sprzedaży.</p>
            </div>
            <input placeholder="Produkt/Rezultat (Co sprzedajesz?)..." className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-4 text-white focus:border-blue-600 outline-none transition-all" value={userState.productResult} onChange={(e) => setUserState(prev => ({ ...prev, productResult: e.target.value }))} />
            <input placeholder="Cel kwartalny (Ile chcesz zarobić?)..." className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-4 text-white focus:border-blue-600 outline-none transition-all" value={userState.quarterlyGoal} onChange={(e) => setUserState(prev => ({ ...prev, quarterlyGoal: e.target.value }))} />
            <input placeholder="Najczęstsza obiekcja (Dlaczego nie kupują?)..." className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-4 text-white focus:border-blue-600 outline-none transition-all" value={userState.mainObjection} onChange={(e) => setUserState(prev => ({ ...prev, mainObjection: e.target.value }))} />
            {!aiResponse && <button onClick={async () => setAiResponse(await processQuery(prompts.diagnosis(userState.productResult, userState.quarterlyGoal, userState.mainObjection)))} disabled={isLoading} className="w-full py-5 bg-white text-black rounded-xl font-black uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-xl">{isLoading ? <Loader2 className="animate-spin mx-auto" /> : "WYKONAJ DIAGNOZĘ"}</button>}
          </div>
        );

      case 'sprint':
        return (
          <div className="space-y-6">
            {userState.sprintWeeks.length === 0 && !isLoading ? (
              <div className="text-center py-12">
                <div className="p-6 bg-blue-600/10 rounded-full inline-block mb-6">
                   <Flag className="w-16 h-16 text-blue-500 mx-auto" />
                </div>
                <h3 className="text-3xl font-black mb-2 uppercase tracking-tight">WYKUJ PLAN BITWY</h3>
                <p className="text-neutral-500 mb-10 text-sm max-w-sm mx-auto">Algorytm wygeneruje 30-dniową ofensywę opartą na Twoich KPI i archetypie.</p>
                <button 
                  onClick={async () => {
                    const res = await processQuery(prompts.sprint(userState.quarterlyGoal), { responseMimeType: "application/json", responseSchema: sprintSchema });
                    try {
                      const data = JSON.parse(res);
                      setUserState(prev => ({ ...prev, sprintWeeks: data }));
                    } catch (e) {
                      setError("Błąd formatowania planu. Spróbuj ponownie.");
                    }
                  }} 
                  className="px-10 py-5 bg-blue-600 rounded-2xl font-black shadow-xl flex items-center gap-3 mx-auto uppercase hover:bg-blue-700 transition-all"
                >
                   GENERUJ PLAN INTERAKTYWNY
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg font-bold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> AKTYWNE MISJE</h3>
                   <span className="text-[10px] mono text-neutral-500">Kliknij zadanie, aby oznaczyć ukończenie</span>
                </div>
                {userState.sprintWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 transition-all hover:border-neutral-700">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="text-[10px] mono text-blue-500 font-bold uppercase tracking-widest">{week.week}</span>
                        <h4 className="text-xl font-black text-white mt-1 uppercase tracking-tight">{week.mission}</h4>
                      </div>
                      <div className="px-3 py-1 bg-blue-600/10 border border-blue-600/30 rounded-lg text-[10px] mono text-blue-400 font-bold">KPI: {week.kpi}</div>
                    </div>
                    <div className="space-y-3">
                      {week.actions.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleToggleAction(wIdx, action.id)}
                          className={`w-full text-left p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 ${
                            action.completed 
                            ? 'bg-blue-600/5 border-blue-600/20 text-neutral-500' 
                            : 'bg-neutral-800 border-neutral-700 text-white hover:border-blue-600/50 hover:bg-neutral-800/80 shadow-sm'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${action.completed ? 'bg-blue-600 border-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'border-neutral-600 bg-neutral-900'}`}>
                            {action.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                          <span className={`text-sm font-medium ${action.completed ? 'line-through decoration-blue-600/50' : ''}`}>{action.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={handleNext} className="w-full py-5 bg-blue-600 rounded-2xl font-black mt-6 shadow-[0_0_20px_rgba(37,99,235,0.3)] uppercase hover:bg-blue-700 transition-all">PRZEJDŹ DO ANALIZY KOŃCOWEJ</button>
              </div>
            )}
            {isLoading && <div className="flex flex-col items-center py-20"><Loader2 className="animate-spin w-12 h-12 text-blue-600 mb-6" /><p className="mono text-xs uppercase tracking-[0.4em] animate-pulse">SPECTER_ANALYSIS_IN_PROGRESS</p></div>}
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 p-8 opacity-5"><PieChart className="w-48 h-48" /></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-3xl font-black text-white mb-2 flex items-center gap-3 uppercase tracking-tighter"><ClipboardList className="text-blue-500 w-8 h-8" /> RAPORT SKUTECZNOŚCI</h3>
                  <p className="text-xs text-neutral-500 mono uppercase tracking-widest">Postęp Misji w skali 30 dni</p>
                </div>
                <div className="bg-blue-600/10 border border-blue-600/20 px-6 py-3 rounded-2xl">
                   <p className="text-[10px] mono text-blue-500 uppercase font-bold mb-1">Global Success Rate</p>
                   <p className="text-2xl font-black text-white">
                      {Math.round((userState.sprintWeeks.reduce((acc, w) => acc + w.actions.filter(a => a.completed).length, 0) / 
                       (userState.sprintWeeks.reduce((acc, w) => acc + w.actions.length, 0) || 1)) * 100)}%
                   </p>
                </div>
              </div>
              
              <ProgressChart weeks={userState.sprintWeeks} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 no-print">
                <button onClick={() => window.print()} className="p-5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all group">
                  <Printer className="w-6 h-6 group-hover:scale-110 transition-transform" /> 
                  <span className="uppercase tracking-widest text-xs">EKSPORTUJ PDF</span>
                </button>
                <button onClick={exportToWord} className="p-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-lg group">
                  <FileText className="w-6 h-6 group-hover:scale-110 transition-transform" /> 
                  <span className="uppercase tracking-widest text-xs">EKSPORTUJ WORD</span>
                </button>
              </div>
            </div>
            
            {/* Print View Styling */}
            <div className="print-only text-black p-10 bg-white min-h-screen">
              <h1 className="text-3xl font-bold border-b-4 border-black pb-4 mb-8">RAPORT STRATEGICZNY SPECTER AI</h1>
              <div className="grid grid-cols-2 gap-8 mb-10">
                 <div>
                    <h2 className="text-sm font-bold uppercase text-gray-500">Produkt / Rezultat</h2>
                    <p className="text-xl font-bold">{userState.productResult}</p>
                 </div>
                 <div>
                    <h2 className="text-sm font-bold uppercase text-gray-500">Cel Kwartalny</h2>
                    <p className="text-xl font-bold">{userState.quarterlyGoal}</p>
                 </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-6 bg-gray-100 p-2">SZCZEGÓŁY SPRINTU</h2>
              {userState.sprintWeeks.map(w => (
                <div key={w.week} className="mb-8 border-l-4 border-gray-300 pl-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold">{w.week}: {w.mission}</h3>
                    <span className="font-mono text-sm">KPI: {w.kpi}</span>
                  </div>
                  <ul className="space-y-2">
                    {w.actions.map(a => (
                      <li key={a.id} className="flex items-center gap-2">
                        <span className="text-lg">{a.completed ? '☑' : '☐'}</span> {a.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            <button onClick={handleNext} className="w-full py-5 bg-neutral-900 border border-neutral-800 rounded-2xl font-black hover:border-blue-600 hover:text-blue-500 transition-all no-print uppercase tracking-widest text-sm">PRZEJDŹ DO PĘTLI FEEDBACKU</button>
          </div>
        );

      default:
        return (
          <div className="text-center py-20 bg-neutral-900/20 rounded-3xl border border-neutral-800 border-dashed">
            <Loader2 className="w-10 h-10 text-neutral-700 mx-auto mb-4 animate-spin" />
            <p className="text-neutral-500 mono italic uppercase tracking-widest text-xs">Protocol implementation in progress...</p>
            <button onClick={handleNext} className="mt-8 px-10 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-bold transition-all uppercase text-xs tracking-widest">Pomiń etap</button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen specter-gradient flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-4xl flex flex-col min-h-[600px] bg-neutral-950/60 specter-border accent-glow rounded-[3rem] p-6 md:p-12 backdrop-blur-2xl shadow-2xl relative transition-all duration-700">
        <Header />
        
        {currentStep.id !== 'intro' && (
          <div className="mb-10 flex flex-col gap-4 no-print">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-neutral-900 rounded-2xl border border-neutral-800 shadow-inner">
                  <span className="text-sm mono text-blue-500 font-black tracking-widest">{currentStepIndex} / {APP_STEPS.length - 1}</span>
                </div>
                <h2 className="text-xs font-black text-neutral-200 uppercase tracking-[0.3em]">{currentStep.title}</h2>
              </div>
              <div className="text-[10px] mono text-neutral-600 font-bold uppercase">{currentStep.role}</div>
            </div>
            <ProgressBar currentStep={currentStepIndex} totalSteps={APP_STEPS.length} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {error && (
            <div className="mb-8 p-6 bg-red-950/20 border border-red-500/30 rounded-2xl flex items-center gap-4 animate-shake shadow-lg">
              <XCircle className="w-6 h-6 text-red-500 shrink-0" />
              <div>
                <p className="text-xs mono text-red-500 font-black uppercase mb-1">Critical_System_Error</p>
                <p className="text-sm text-red-200/80 font-medium">{error}</p>
              </div>
            </div>
          )}

          {renderStepContent()}

          {aiResponse && !isLoading && (
            <div className="mt-12 p-10 bg-neutral-900/60 border-l-8 border-blue-600 rounded-r-[2rem] shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-700 no-print backdrop-blur-sm border-y border-r border-neutral-800">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-blue-600/20 rounded-lg"><Terminal className="w-5 h-5 text-blue-500" /></div>
                <span className="text-[10px] mono text-neutral-500 uppercase font-black tracking-[0.5em]">STRATEGIC_TRANSMISSION_COMPLETE</span>
              </div>
              <MarkdownContent content={aiResponse} />
              <div className="mt-12 pt-6 border-t border-neutral-800 flex justify-end">
                <button onClick={handleNext} className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-2xl transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(37,99,235,0.3)] uppercase tracking-widest">POTWIERDŹ I DALEJ <ChevronRight className="w-5 h-5" /></button>
              </div>
            </div>
          )}
        </div>

        {currentStep.id !== 'intro' && currentStep.id !== 'workshop' && (
          <div className="mt-10 pt-8 border-t border-neutral-900/50 flex justify-between items-center no-print">
            <button onClick={handlePrev} className="px-6 py-3 text-neutral-500 hover:text-white transition-all flex items-center gap-3 text-xs font-black uppercase tracking-widest disabled:opacity-0 group hover:translate-x-[-4px]">
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Wstecz
            </button>
            <div className="flex items-center gap-3">
              {[...Array(APP_STEPS.length)].map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all duration-500 ${i === currentStepIndex ? 'bg-blue-600 w-12 shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-neutral-800 w-2'}`} />
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="mt-12 text-neutral-700 text-[10px] mono uppercase tracking-[0.5em] font-black no-print opacity-50 hover:opacity-100 transition-opacity">
        SYSTEM_SPECTER // OFFENSIVE_AI_LAYER_ENABLED // © 2025 ROBSON_CORP
      </footer>

      <style>{`
        @media print {
          body { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; position: static !important; width: 100% !important; }
          .specter-gradient, .accent-glow, .specter-border { background: none !important; box-shadow: none !important; border: none !important; }
          #root { width: 100% !important; }
        }
        .print-only { display: none; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
      `}</style>
    </div>
  );
}
