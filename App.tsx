
import React, { useState, useEffect, useRef } from 'react';
import Dashboard from './components/Dashboard';
import MonthFocus from './components/MonthFocus';
import PreloadedCalendar from './components/PreloadedCalendar';
import Controls from './components/Controls';
import RiceTool from './components/RiceTool';
import { Task, MONTH_NAMES, ColorKey, INITIAL_KEYS, PreloadedEvent, RiceProject, PRESET_COLORS } from './types';
import { generateYearlyPlan } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'month' | 'strategy' | 'rice'>('dashboard');
  const [activeMonth, setActiveMonth] = useState<number>(new Date().getMonth());
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [years, setYears] = useState<number[]>([2024, 2025, 2026]);
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Persistent State
  const [tasksByDate, setTasksByDate] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('war_map_tasks');
    return saved ? JSON.parse(saved) : {};
  });

  const [colorKeys, setColorKeys] = useState<ColorKey[]>(() => {
    const saved = localStorage.getItem('war_map_keys');
    return saved ? JSON.parse(saved) : INITIAL_KEYS;
  });

  const [preloadedEvents, setPreloadedEvents] = useState<PreloadedEvent[]>(() => {
    const saved = localStorage.getItem('war_map_events');
    return saved ? JSON.parse(saved) : [];
  });

  const [riceProjects, setRiceProjects] = useState<RiceProject[]>(() => {
    const saved = localStorage.getItem('war_map_rice');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('war_map_tasks', JSON.stringify(tasksByDate));
  }, [tasksByDate]);

  useEffect(() => {
    localStorage.setItem('war_map_keys', JSON.stringify(colorKeys));
  }, [colorKeys]);

  useEffect(() => {
    localStorage.setItem('war_map_events', JSON.stringify(preloadedEvents));
  }, [preloadedEvents]);

  useEffect(() => {
    localStorage.setItem('war_map_rice', JSON.stringify(riceProjects));
  }, [riceProjects]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowToolsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdateTasks = (date: string, tasks: Task[]) => {
    setTasksByDate(prev => ({
      ...prev,
      [date]: { ...prev[date], tasks }
    }));
  };

  const handleUpdateMeta = (monthIndex: number, type: 'objectives' | 'notes', value: string) => {
    const key = `meta-${monthIndex}`;
    setTasksByDate(prev => ({
      ...prev,
      [key]: { ...prev[key], [type]: value }
    }));
  };

  const handleMonthClick = (idx: number) => {
    setActiveMonth(idx);
    setView('month');
  };

  const handleGeneratePlan = async (theme: string) => {
    setIsGenerating(true);
    const events = await generateYearlyPlan(year, theme);
    setPreloadedEvents(events);
    setIsGenerating(false);
    setView('strategy');
  };

  const handleAddYear = () => {
    const nextYear = Math.max(...years) + 1;
    setYears(prev => [...prev, nextYear]);
  };

  const handleDeployProject = (p: RiceProject) => {
    const newKey: ColorKey = {
      id: Math.random().toString(36).substr(2, 9),
      label: p.name,
      color: PRESET_COLORS[colorKeys.length % PRESET_COLORS.length].class,
    };
    setColorKeys([...colorKeys, newKey]);
    setActiveKeyId(newKey.id);
    setView('dashboard');
    alert(`"${p.name}" has been added to your War Map Key! You can now drag on the calendar to highlight its timeframe.`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-['Inter'] select-none">
      {/* Universal Navigation */}
      <header className="no-print bg-black text-white sticky top-0 z-[60] shadow-lg">
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-3 flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-black uppercase tracking-tighter cursor-pointer" onClick={() => setView('dashboard')}>
              WAR MAP <span className="text-gray-500 font-light">{year}</span>
            </h1>
            <div className="h-6 w-px bg-gray-800 hidden md:block" />
          </div>
          
          <nav className="flex flex-wrap items-center justify-center gap-1 md:gap-2 flex-1">
            <button 
              onClick={() => setView('dashboard')}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded transition-all ${view === 'dashboard' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            >
              Dashboard
            </button>
            <div className="w-px h-4 bg-gray-800 mx-1 hidden md:block" />
            {MONTH_NAMES.map((m, i) => (
              <button
                key={m}
                onClick={() => handleMonthClick(i)}
                className={`px-2.5 py-1.5 text-[10px] font-black rounded uppercase tracking-tighter transition-all ${view === 'month' && activeMonth === i ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
              >
                {m.substring(0, 3)}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded transition-all flex items-center gap-2 ${view === 'strategy' || view === 'rice' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              >
                Tools
                <svg className={`w-3 h-3 transition-transform ${showToolsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
              </button>
              
              {showToolsDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-black border border-gray-800 rounded shadow-2xl py-2 z-[70] animate-in fade-in slide-in-from-top-2 duration-200">
                  <button 
                    onClick={() => { setView('rice'); setShowToolsDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    RICE Scoring
                  </button>
                  <button 
                    onClick={() => { setView('strategy'); setShowToolsDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    Preload Strategy
                  </button>
                </div>
              )}
            </div>

            <select 
              value={year} 
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent text-xs font-black border-none focus:ring-0 cursor-pointer text-gray-400 hover:text-white uppercase"
            >
              {years.map(y => <option key={y} value={y} className="bg-black text-white">{y}</option>)}
            </select>
            <button 
              onClick={() => window.print()}
              className="p-2 text-gray-500 hover:text-white transition-colors"
              title="Print/Export"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Global Controls - Restricted to Strategy View only */}
      {view === 'strategy' && (
        <Controls 
          year={year} 
          years={years} 
          onYearChange={setYear} 
          onAddYear={handleAddYear} 
          onGeneratePlan={handleGeneratePlan}
          isLoading={isGenerating}
        />
      )}

      <main className="flex-1 p-4 md:p-8 xl:p-12 print-area overflow-x-hidden">
        <div className="max-w-[1800px] mx-auto">
          {view === 'dashboard' && (
            <div className="animate-in fade-in duration-500">
              <Dashboard 
                year={year} 
                onMonthClick={handleMonthClick} 
                tasksByDate={tasksByDate} 
                colorKeys={colorKeys}
                onUpdateKeys={setColorKeys}
                activeKeyId={activeKeyId}
                setActiveKeyId={setActiveKeyId}
              />
            </div>
          )}
          
          {view === 'month' && (
            <div className="animate-in slide-in-from-right-8 duration-500">
              <MonthFocus 
                year={year} 
                monthIndex={activeMonth} 
                tasksByDate={tasksByDate}
                colorKeys={colorKeys}
                onUpdateTasks={handleUpdateTasks}
                onUpdateMeta={handleUpdateMeta}
                activeKeyId={activeKeyId}
              />
            </div>
          )}

          {view === 'strategy' && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <PreloadedCalendar 
                year={year} 
                events={preloadedEvents} 
              />
            </div>
          )}

          {view === 'rice' && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
              <RiceTool 
                projects={riceProjects} 
                onUpdateProjects={setRiceProjects} 
                onDeployToKey={handleDeployProject}
              />
            </div>
          )}
        </div>
      </main>

      <footer className="py-12 text-center no-print opacity-20 hover:opacity-100 transition-opacity">
        <p className="text-[10px] text-gray-900 font-black uppercase tracking-[0.8em]">
          Stoke War Map &bull; Strategic Yearly Planner
        </p>
      </footer>
    </div>
  );
};

export default App;
