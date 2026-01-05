
import React, { useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './services/supabaseClient';
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
  
  // Auth State
  const [session, setSession] = useState<Session | null>(null);

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

  // Auth & Data Sync Effects
  useEffect(() => {
    // 1. Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadUserData(session.user.id);
    });

    // 2. Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    const { data, error } = await supabase
      .from('war_map_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading data:', error);
      return;
    }

    if (data) {
      if (data.tasks_by_date) setTasksByDate(data.tasks_by_date);
      if (data.color_keys) setColorKeys(data.color_keys);
      if (data.preloaded_events) setPreloadedEvents(data.preloaded_events);
      if (data.rice_projects) setRiceProjects(data.rice_projects);
    }
  };

  const saveData = async () => {
    if (!session) return;
    
    const { error } = await supabase
      .from('war_map_data')
      .upsert({
        user_id: session.user.id,
        tasks_by_date: tasksByDate,
        color_keys: colorKeys,
        preloaded_events: preloadedEvents,
        rice_projects: riceProjects,
        updated_at: new Date().toISOString(),
      });

    if (error) console.error('Error saving data:', error);
  };

  // Debounced Save
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (session) saveData();
      // Also keep local storage in sync as backup
      localStorage.setItem('war_map_tasks', JSON.stringify(tasksByDate));
      localStorage.setItem('war_map_keys', JSON.stringify(colorKeys));
      localStorage.setItem('war_map_events', JSON.stringify(preloadedEvents));
      localStorage.setItem('war_map_rice', JSON.stringify(riceProjects));
    }, 2000); // Save after 2 seconds of inactivity

    return () => clearTimeout(timeout);
  }, [tasksByDate, colorKeys, preloadedEvents, riceProjects, session]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowToolsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) console.error('Login error:', error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setTasksByDate({});
    setColorKeys(INITIAL_KEYS);
    setPreloadedEvents([]);
    setRiceProjects([]);
    localStorage.removeItem('war_map_tasks');
    localStorage.removeItem('war_map_keys');
    localStorage.removeItem('war_map_events');
    localStorage.removeItem('war_map_rice');
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !session) return;
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update User Metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { custom_avatar_url: publicUrl }
      });

      if (updateError) {
        throw updateError;
      }

      // 4. Update local session to reflect change immediately
      const { data: { session: newSession } } = await supabase.auth.refreshSession();
      setSession(newSession);

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar. Please ensure a public "avatars" bucket exists in your Supabase project.');
    }
  };

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
    const eventsWithIds = events.map(e => ({
      ...e,
      id: Math.random().toString(36).substr(2, 9)
    }));
    setPreloadedEvents(eventsWithIds);
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
    alert(`"${p.name}" has been added to your Stoke Planner Key! You can now drag on the calendar to highlight its timeframe.`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-['Inter'] select-none">
      {/* Universal Navigation */}
      <header className="no-print bg-black text-white sticky top-0 z-[60] shadow-lg">
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-3 flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-black uppercase tracking-tighter cursor-pointer" onClick={() => setView('dashboard')}>
              STOKE PLANNER <span className="text-gray-500 font-light">{year}</span>
            </h1>
            <div className="h-6 w-px bg-gray-800 hidden md:block" />
          </div>
          
          <nav className="flex items-center gap-1 md:gap-2 flex-1 w-full md:w-auto overflow-x-auto md:overflow-visible md:flex-wrap no-scrollbar pb-2 md:pb-0 px-1">
            <button 
              onClick={() => setView('dashboard')}
              className={`whitespace-nowrap px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded transition-all shrink-0 ${view === 'dashboard' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            >
              Dashboard
            </button>
            <div className="w-px h-4 bg-gray-800 mx-1 hidden md:block shrink-0" />
            {MONTH_NAMES.map((m, i) => (
              <button
                key={m}
                onClick={() => handleMonthClick(i)}
                className={`whitespace-nowrap px-2.5 py-1.5 text-[10px] font-black rounded uppercase tracking-tighter transition-all shrink-0 ${view === 'month' && activeMonth === i ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
              >
                {m.substring(0, 3)}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {/* Auth Button */}
            {session ? (
               <div className="flex items-center gap-3">
                 <label className="relative group cursor-pointer">
                   <input 
                     type="file" 
                     className="hidden" 
                     accept="image/*"
                     onChange={handleAvatarUpload}
                   />
                   {session.user.user_metadata.custom_avatar_url || session.user.user_metadata.avatar_url || session.user.user_metadata.picture ? (
                      <img 
                        src={session.user.user_metadata.custom_avatar_url || session.user.user_metadata.avatar_url || session.user.user_metadata.picture} 
                        alt="User Avatar" 
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full border border-gray-700 object-cover group-hover:opacity-75 transition-opacity"
                        title="Click to upload custom avatar" 
                      />
                   ) : (
                      <div 
                        className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs text-white font-bold border border-gray-700 group-hover:bg-gray-700 transition-colors"
                        title="Click to upload custom avatar"
                      >
                        {session.user.email?.charAt(0).toUpperCase()}
                      </div>
                   )}
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full pointer-events-none">
                     <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                   </div>
                 </label>
                 <button 
                   onClick={handleLogout}
                   className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-gray-700 rounded hover:bg-white hover:text-black transition-all"
                 >
                   Logout
                 </button>
               </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white rounded hover:bg-blue-500 transition-all flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                Sign In
              </button>
            )}

            <div className="h-6 w-px bg-gray-800 mx-2 hidden md:block" />

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

            <div className="flex items-center gap-2">
              <select 
                value={year} 
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-transparent text-xs font-black border-none focus:ring-0 cursor-pointer text-gray-400 hover:text-white uppercase"
              >
                {years.map(y => <option key={y} value={y} className="bg-black text-white">{y}</option>)}
              </select>
              <button 
                onClick={handleAddYear}
                className="text-gray-500 hover:text-white transition-colors"
                title="Add Next Year"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
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
                onAddEvent={(e) => setPreloadedEvents(prev => [...prev, { ...e, id: Math.random().toString(36).substr(2, 9) }])}
                onUpdateEvent={(oldE, newE) => {
                  setPreloadedEvents(prev => prev.map(e => {
                    // Match by ID if available, otherwise fallback to exact match of properties
                    if (e.id && oldE.id) return e.id === oldE.id ? newE : e;
                    return (e.date === oldE.date && e.title === oldE.title && e.category === oldE.category) ? newE : e;
                  }));
                }}
                onDeleteEvent={(eToDelete) => {
                  setPreloadedEvents(prev => prev.filter(e => {
                     if (e.id && eToDelete.id) return e.id !== eToDelete.id;
                     return !(e.date === eToDelete.date && e.title === eToDelete.title && e.category === eToDelete.category);
                  }));
                }}
                onClearEvents={() => setPreloadedEvents([])}
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
          Stoke Planner &bull; Strategic Yearly Planner
        </p>
      </footer>
    </div>
  );
};

export default App;
