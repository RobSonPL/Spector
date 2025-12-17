
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  Terminal, 
  Target, 
  Workflow, 
  UserCircle, 
  LayoutDashboard, 
  Sword, 
  Zap, 
  Clock, 
  Flag, 
  Repeat, 
  BarChart3,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  Download,
  FileText,
  Printer,
  TrendingUp,
  CircleDot
} from 'lucide-react';
import { APP_STEPS, StepId, UserState, Step, SprintWeek, SprintAction, SubTask } from './types';
import { specterQuery, prompts } from './geminiService';

// --- Utility Components ---

const TrendChart: React.FC<{ data: number[], color?: string }> = ({ data, color = "#3b82f6" }) => {
  if (data.length < 2) return <div className="h-32 flex items-center justify-center text-xs text-neutral-600">Brak danych historycznych</div>;
  
  const max = Math.max(...data) * 1.2;
  const min = Math.min(...data) * 0.8;
  const range = max - min;
  const width = 300;
  const height = 100;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative w-full h-32 bg-neutral-900/30 rounded-lg p-2 overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <path
          d={`M ${points}`}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
        />
        {data.map((val, i) => {
          const x = (i / (data.length - 1)) * width;
          const y = height - ((val - min) / range) * height;
          return (
            <circle key={i} cx={x} cy={y} r="4" fill={color} className="animate-pulse" />
          );
        })}
      </svg>
      <div className="absolute top-1 left-2 text-[8px] mono text-neutral-500 uppercase">Trend Wartości Transakcji (PLN)</div>
    </div>
  );
};

const SuccessChart: React.FC<{ weeks: SprintWeek[] }> = ({ weeks }) => {
  const completionData = weeks.map(w => {
    const totalActions = w.actions.length;
    const completedActions = w.actions.filter(a => a.completed).length;
    return totalActions === 0 ? 0 : (completedActions / totalActions) * 100;
  });

  return (
    <div className="grid grid-cols-4 gap-2 h-40 items-end mt-4 px-4">
      {completionData.map((val, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <div className="w-full bg-neutral-900 rounded-t-md relative overflow-hidden h-32">
            <div 
              className="absolute bottom-0 left-0 w-full bg-blue-600 transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              style={{ height: `${val}%` }}
            />
          </div>
          <span className="text-[10px] mono text-neutral-500">T{i+1}</span>
          <span className="text-[10px] font-bold text-white">{Math.round(val)}%</span>
        </div>
      ))}
    </div>
  );
};

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
      return <h3 key={i} className={`${sizes[level-1] || 'text-base'} font-bold mt-4 mb-2 text-white`}>{text}</h3>;
    }
    if (line.trim().length === 0) return <div key={i} className="h-2" />;
    const boldFormatted = line.split('**').map((part, idx) => 
      idx % 2 === 1 ? <span key={idx} className="text-blue-400 font-bold">{part}</span> : part
    );
    return <p key={i} className="text-sm text-neutral-300 leading-relaxed mb-1">{boldFormatted}</p>;
  });
  return <div className="space-y-1">{rendered}</div>;
};

// --- Main App Logic ---

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
    transactionHistory: [1200, 1500, 1400, 1800, 2200], // Mock history
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

  // --- Sprint Logic Helpers ---

  const parseSprintPlan = (text: string) => {
    const lines = text.split('\n');
    const weeks: SprintWeek[] = [];
    const tableLines = lines.filter(l => l.includes('|') && !l.includes('---'));
    
    // Skip header
    for (let i = 1; i < tableLines.length; i++) {
      const cells = tableLines[i].split('|').map(c => c.trim()).filter(c => c.length > 0);
      if (cells.length >= 4) {
        weeks.push({
          week: cells[0],
          mission: cells[1],
          actions: cells[2].split(/\d\./).filter(a => a.trim().length > 0).map((a, idx) => ({
            id: `a-${i}-${idx}`,
            text: a.trim().replace(/^\s*-\s*/, ''),
            completed: false,
            subTasks: []
          })),
          kpi: cells[3]
        });
      }
    }
    return weeks;
  };

  const toggleAction = (weekIdx: number, actionIdx: number) => {
    const newWeeks = [...userState.sprintWeeks];
    newWeeks[weekIdx].actions[actionIdx].completed = !newWeeks[weekIdx].actions[actionIdx].completed;
    setUserState(prev => ({ ...prev, sprintWeeks: newWeeks }));
  };

  const addSubTask = (weekIdx: number, actionIdx: number, text: string) => {
    if (!text) return;
    const newWeeks = [...userState.sprintWeeks];
    newWeeks[weekIdx].actions[actionIdx].subTasks.push({
      id: Math.random().toString(36).substr(2, 9),
      text,
      completed: false
    });
    setUserState(prev => ({ ...prev, sprintWeeks: newWeeks }));
  };

  const toggleSubTask = (weekIdx: number, actionIdx: number, subIdx: number) => {
    const newWeeks = [...userState.sprintWeeks];
    newWeeks[weekIdx].actions[actionIdx].subTasks[subIdx].completed = !newWeeks[weekIdx].actions[actionIdx].subTasks[subIdx].completed;
    setUserState(prev => ({ ...prev, sprintWeeks: newWeeks }));
  };

  // --- API Handlers ---

  const processDiagnosis = async () => {
    if (!userState.productResult || !userState.quarterlyGoal || !userState.mainObjection) {
      setError("Wypełnij wszystkie pola!");
      return;
    }
    setIsLoading(true);
    const result = await specterQuery(prompts.diagnosis(userState.productResult, userState.quarterlyGoal, userState.mainObjection));
    setAiResponse(result);
    setIsLoading(false);
  };

  const processSprint = async () => {
    setIsLoading(true);
    const result = await specterQuery(prompts.sprint(userState.quarterlyGoal));
    const weeks = parseSprintPlan(result);
    setUserState(prev => ({ ...prev, sprintWeeks: weeks }));
    setAiResponse(result);
    setIsLoading(false);
  };

  const exportPDF = () => {
    window.print();
  };

  const exportWord = () => {
    const content = `
      <h1>Raport SPECTER AI - Plan Sprzedaży</h1>
      <p>Produkt: ${userState.productResult}</p>
      <p>Cel: ${userState.quarterlyGoal}</p>
      <h2>Plan Sprintu:</h2>
      ${userState.sprintWeeks.map(w => `
        <h3>${w.week}: ${w.mission}</h3>
        <ul>
          ${w.actions.map(a => `<li>[${a.completed ? 'X' : ' '}] ${a.text}</li>`).join('')}
        </ul>
      `).join('')}
    `;
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'SPECTER_Report.doc';
    link.click();
  };

  // --- Step Rendering ---

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'intro':
        return (
          <div className="text-center py-12">
            <div className="mb-6 inline-flex p-4 bg-blue-600/10 rounded-full border border-blue-600/20">
              <Sword className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent">
              Agent AI RobSon: SPECTER
            </h2>
            <p className="text-neutral-400 max-w-lg mx-auto mb-10 text-lg leading-relaxed">
              Inicjalizacja systemu. Przejmiemy kontrolę nad Twoim lejkiem. Bez wymówek.
            </p>
            <button 
              onClick={handleNext}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center gap-2 mx-auto"
            >
              INICJUJ DIAGNOZĘ <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
              <h4 className="text-xs font-bold text-neutral-500 uppercase mono mb-4">Wydajność w Czasie</h4>
              <TrendChart data={userState.transactionHistory} />
              <div className="mt-4 flex gap-2">
                <input 
                  type="number" 
                  placeholder="Dodaj wartość PLN..."
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-1 text-xs text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = parseFloat((e.target as HTMLInputElement).value);
                      if (!isNaN(val)) {
                        setUserState(prev => ({ ...prev, transactionHistory: [...prev.transactionHistory, val] }));
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
                <button className="p-1.5 bg-neutral-800 rounded text-neutral-400"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-xl space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
                  <p className="text-[10px] text-neutral-500 uppercase mb-1">Aktywność</p>
                  <p className="font-bold text-white text-sm">Rozmowy / Tydzień</p>
                </div>
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
                  <p className="text-[10px] text-neutral-500 uppercase mb-1">Skuteczność</p>
                  <p className="font-bold text-white text-sm">CR (Oferta -&gt; Umowa)</p>
                </div>
              </div>
            </div>
            <button onClick={handleNext} className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold">AKCEPTUJĘ DASHBOARD</button>
          </div>
        );

      case 'sprint':
        return (
          <div className="space-y-6">
            {!aiResponse ? (
              <div className="text-center py-8">
                <Flag className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <button onClick={processSprint} disabled={isLoading} className="px-10 py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 mx-auto">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "GENERUJ PLAN BITWY"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {userState.sprintWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="p-5 bg-neutral-900/40 border border-neutral-800 rounded-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-bold text-white mono">{week.week}: <span className="text-blue-500">{week.mission}</span></h4>
                      <span className="text-[10px] px-2 py-0.5 bg-blue-600/10 text-blue-500 border border-blue-600/20 rounded-full mono">KPI: {week.kpi}</span>
                    </div>
                    <div className="space-y-3">
                      {week.actions.map((action, aIdx) => (
                        <div key={action.id} className="space-y-2">
                          <div className="flex items-start gap-3 group">
                            <button 
                              onClick={() => toggleAction(wIdx, aIdx)}
                              className={`mt-0.5 shrink-0 w-5 h-5 rounded border transition-colors flex items-center justify-center ${action.completed ? 'bg-blue-600 border-blue-600' : 'bg-neutral-950 border-neutral-700'}`}
                            >
                              {action.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                            </button>
                            <div className="flex-1">
                              <p className={`text-sm ${action.completed ? 'text-neutral-500 line-through' : 'text-neutral-300'}`}>{action.text}</p>
                              <div className="mt-2 pl-4 border-l border-neutral-800 space-y-2">
                                {action.subTasks.map((sub, sIdx) => (
                                  <div key={sub.id} className="flex items-center gap-2">
                                    <button 
                                      onClick={() => toggleSubTask(wIdx, aIdx, sIdx)}
                                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${sub.completed ? 'bg-green-600 border-green-600' : 'bg-neutral-950 border-neutral-800'}`}
                                    >
                                      {sub.completed && <CheckCircle2 className="w-2 h-2 text-white" />}
                                    </button>
                                    <span className={`text-xs ${sub.completed ? 'text-neutral-600' : 'text-neutral-400'}`}>{sub.text}</span>
                                  </div>
                                ))}
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="text" 
                                    placeholder="Dodaj pod-zadanie..."
                                    className="bg-transparent text-[10px] text-neutral-500 outline-none w-full"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        addSubTask(wIdx, aIdx, (e.target as HTMLInputElement).value);
                                        (e.target as HTMLInputElement).value = '';
                                      }
                                    }}
                                  />
                                  <Plus className="w-3 h-3 text-neutral-700" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-8">
            <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-3xl text-center">
              <div className="inline-flex p-4 bg-green-500/10 rounded-full mb-6">
                <Target className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Misja Zaplanowana</h3>
              <p className="text-neutral-400 mb-8 max-w-sm mx-auto">Twoja strategia SPECTER jest gotowa. Pobierz plan i przejdź do egzekucji.</p>
              
              <div className="mb-10">
                <h4 className="text-xs font-bold text-neutral-500 uppercase mono mb-4 tracking-widest">Postęp Sprintu (Wykres Sukcesu)</h4>
                <SuccessChart weeks={userState.sprintWeeks} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={exportPDF} className="p-4 bg-blue-600 hover:bg-blue-700 rounded-xl flex flex-col items-center gap-2 transition-all group">
                  <Printer className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">DRUKUJ / PDF</span>
                </button>
                <button onClick={exportWord} className="p-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl flex flex-col items-center gap-2 transition-all group">
                  <FileText className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">EKSPORT WORD</span>
                </button>
                <button onClick={() => window.location.reload()} className="p-4 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl flex flex-col items-center gap-2 transition-all">
                  <Repeat className="w-6 h-6" />
                  <span className="text-xs font-bold">NOWA SESJA</span>
                </button>
              </div>
            </div>
            
            <div className="p-6 bg-blue-600/5 border border-blue-600/10 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Terminal className="w-5 h-5 text-blue-500" />
                <h4 className="text-sm font-bold text-white mono">LOGS::FINAL_ADVICE</h4>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed italic">
                "Pamiętaj: Plan to 1% sukcesu. Pozostałe 99% to dyscyplina w zbijaniu obiekcji i konsekwentny follow-up. 
                SPECTER nie akceptuje porażki. Powodzenia na polu bitwy."
              </p>
            </div>
          </div>
        );

      // Fix: Added missing 'archetype' and 'feedback' cases to allow proper TypeScript narrowing inside the block.
      case 'diagnosis':
      case 'journey':
      case 'archetype':
      case 'arsenal':
      case 'automation':
      case 'feedback':
      case 'workshop':
        // Standard AI input steps (logic remains from previous version)
        return (
          <div className="space-y-6">
            {currentStep.id === 'diagnosis' && (
              <div className="grid gap-4">
                <input placeholder="Główny Rezultat..." className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white" value={userState.productResult} onChange={e => setUserState(p => ({...p, productResult: e.target.value}))} />
                <input placeholder="Cel kwartalny..." className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white" value={userState.quarterlyGoal} onChange={e => setUserState(p => ({...p, quarterlyGoal: e.target.value}))} />
                <input placeholder="Obiekcja..." className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white" value={userState.mainObjection} onChange={e => setUserState(p => ({...p, mainObjection: e.target.value}))} />
                {!aiResponse && <button onClick={processDiagnosis} disabled={isLoading} className="py-4 bg-neutral-100 text-black rounded-lg font-bold">{isLoading ? <Loader2 className="animate-spin mx-auto" /> : "GENERUJ DIAGNOZĘ"}</button>}
              </div>
            )}
            {currentStep.id === 'journey' && (
              <div className="grid gap-4">
                <textarea rows={3} placeholder="Lejek..." className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white" value={userState.funnelSteps} onChange={e => setUserState(p => ({...p, funnelSteps: e.target.value}))} />
                <input placeholder="Gdzie uciekają leady?" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white" value={userState.funnelLeak} onChange={e => setUserState(p => ({...p, funnelLeak: e.target.value}))} />
                {!aiResponse && <button onClick={async () => { setIsLoading(true); setAiResponse(await specterQuery(prompts.journey(userState.funnelSteps, userState.funnelLeak))); setIsLoading(false); }} className="py-4 bg-neutral-100 text-black rounded-lg font-bold">{isLoading ? <Loader2 className="animate-spin mx-auto" /> : "AUDYTUJ LEJEK"}</button>}
              </div>
            )}
            {currentStep.id === 'arsenal' && (
              <div className="grid gap-4">
                <input placeholder="Cel amunicji (np. umówienie demo)..." className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white" value={userState.arsenalGoal} onChange={e => setUserState(p => ({...p, arsenalGoal: e.target.value}))} />
                {!aiResponse && <button onClick={async () => { setIsLoading(true); setAiResponse(await specterQuery(prompts.arsenal(userState.archetype, userState.arsenalGoal, userState.mainObjection))); setIsLoading(false); }} className="py-4 bg-neutral-100 text-black rounded-lg font-bold">{isLoading ? <Loader2 className="animate-spin mx-auto" /> : "WYKUJ ARSENAŁ"}</button>}
              </div>
            )}
            {currentStep.id === 'automation' && (
              <div className="grid gap-4">
                <textarea rows={3} placeholder="Hated tasks..." className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white" value={userState.hatedTasks} onChange={e => setUserState(p => ({...p, hatedTasks: e.target.value}))} />
                {!aiResponse && <button onClick={async () => { setIsLoading(true); setAiResponse(await specterQuery(prompts.automation(userState.hatedTasks, userState.timeLost))); setIsLoading(false); }} className="py-4 bg-neutral-100 text-black rounded-lg font-bold">{isLoading ? <Loader2 className="animate-spin mx-auto" /> : "OPTYMALIZUJ CZAS"}</button>}
              </div>
            )}
            {currentStep.id === 'archetype' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['The Challenger', 'The Builder', 'The Solver', 'The Closer'].map(a => (
                  <button key={a} onClick={() => setUserState(p => ({...p, archetype: a}))} className={`p-6 text-left rounded-xl border transition-all ${userState.archetype === a ? 'bg-blue-600 border-blue-500 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-400'}`}>
                    <h4 className="font-bold">{a}</h4>
                  </button>
                ))}
                <button onClick={handleNext} disabled={!userState.archetype} className="col-span-full py-4 bg-neutral-100 text-black rounded-lg font-bold disabled:opacity-30">POTWIERDŹ</button>
              </div>
            )}
            {currentStep.id === 'workshop' && (
              <div className="grid gap-4">
                <textarea rows={4} placeholder="Wnioski ze sprintu..." className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white" value={userState.sprintResultData} onChange={e => setUserState(p => ({...p, sprintResultData: e.target.value}))} />
                {!aiResponse && <button onClick={async () => { setIsLoading(true); setAiResponse(await specterQuery(prompts.workshop("KPI Sprintu", userState.sprintResultData || "Brak danych"))); setIsLoading(false); }} className="py-4 bg-blue-600 text-white rounded-lg font-bold">{isLoading ? <Loader2 className="animate-spin mx-auto" /> : "ZAPLANUJ Q2"}</button>}
              </div>
            )}
            {currentStep.id === 'feedback' && (
              <div className="space-y-4">
                <div className="p-6 bg-neutral-900 rounded-xl border border-neutral-800">
                  <h4 className="text-white font-bold mb-2">Pętla Feedbacku</h4>
                  <p className="text-xs text-neutral-400">Regularna analiza Win/Loss to fundament progresu.</p>
                </div>
                <button onClick={handleNext} className="w-full py-4 bg-neutral-100 text-black rounded-lg font-bold">ZROZUMIAŁEM</button>
              </div>
            )}
          </div>
        );

      default:
        return <div>W budowie...</div>;
    }
  };

  return (
    <div className="min-h-screen specter-gradient flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-3xl flex flex-col h-full bg-neutral-950/40 specter-border accent-glow rounded-3xl p-6 md:p-10 backdrop-blur-sm relative">
        <Header />
        
        {currentStep.id !== 'intro' && (
          <div className="mb-6 flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-neutral-900 rounded-md">
                <span className="text-xs mono text-neutral-500 font-bold">{currentStepIndex} / {APP_STEPS.length - 1}</span>
              </div>
              <h2 className="text-sm font-bold text-neutral-300 uppercase tracking-wide">{currentStep.title}</h2>
            </div>
            <ProgressBar currentStep={currentStepIndex} totalSteps={APP_STEPS.length} />
          </div>
        )}

        {/* Hidden section for Printing only */}
        <div className="print-only mb-10">
          <h1 className="text-4xl font-bold mb-4">Raport Strategiczny SPECTER AI</h1>
          <p className="text-sm">Wygenerowano dla: ${userState.productResult}</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {error && <div className="mb-6 p-4 bg-red-600/10 border border-red-600/30 rounded-lg flex items-center gap-3"><XCircle className="w-5 h-5 text-red-500" /><p className="text-sm text-red-400">{error}</p></div>}
          
          {renderStepContent()}

          {aiResponse && (
            <div className="mt-8 p-6 bg-neutral-900/80 border-l-4 border-blue-600 rounded-r-xl shadow-2xl no-print">
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] mono text-neutral-500 uppercase tracking-widest">SPECTER OUTPUT: TRANSMISSION_RECEIVED</span>
              </div>
              <MarkdownContent content={aiResponse} />
              <div className="mt-8 pt-4 border-t border-neutral-800 flex justify-end">
                <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg flex items-center gap-2">PRZEJDŹ DALEJ <ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>

        {currentStep.id !== 'intro' && currentStep.id !== 'summary' && (
          <div className="mt-8 pt-6 border-t border-neutral-900 flex justify-between items-center no-print">
            <button onClick={handlePrev} className="px-4 py-2 text-neutral-500 hover:text-white flex items-center gap-2 disabled:opacity-0" disabled={currentStepIndex === 0}><ChevronLeft className="w-4 h-4" /> Wstecz</button>
            <div className="flex items-center gap-1.5">
              {[...Array(APP_STEPS.length)].map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentStepIndex ? 'bg-blue-500 w-4' : 'bg-neutral-800'}`} />
              ))}
            </div>
          </div>
        )}
      </div>
      <footer className="mt-8 text-neutral-600 text-[10px] mono uppercase tracking-[0.2em] no-print">
        &copy; 2025 AGENT AI ROBSON // SPECTER MODULE v2 // PROTOCOL: SALE_MAX
      </footer>
    </div>
  );
}

const Header: React.FC = () => (
  <header className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-800 no-print">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-blue-600/10 rounded-lg"><Terminal className="w-6 h-6 text-blue-500" /></div>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">SPECTER <span className="text-neutral-500 font-light">AI</span></h1>
        <p className="text-xs text-neutral-400 mono uppercase tracking-widest">Strategic Sales Engine</p>
      </div>
    </div>
    <div className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full text-[10px] mono text-neutral-500 uppercase tracking-tighter">OS_INTEL::PRO</div>
  </header>
);
