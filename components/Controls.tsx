
import React, { useState } from 'react';

interface ControlsProps {
  year: number;
  years: number[];
  onYearChange: (year: number) => void;
  onAddYear: () => void;
  onGeneratePlan: (theme: string) => void;
  isLoading: boolean;
}

const Controls: React.FC<ControlsProps> = ({ year, years, onYearChange, onAddYear, onGeneratePlan, isLoading }) => {
  const [theme, setTheme] = useState('');

  const handleGenerate = () => {
    if (!theme.trim()) return;
    onGeneratePlan(theme);
  };

  return (
    <div className="bg-white border-b border-gray-200 p-3 no-print flex flex-col md:flex-row gap-4 items-center justify-center shadow-sm">
      <div className="flex-1 w-full max-w-2xl flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Preload your year with a theme (e.g. Focus on AI & Scaling)..."
            className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-xs font-bold uppercase tracking-tight"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 uppercase select-none">
            Gemini AI
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading || !theme.trim()}
          className="px-6 py-2.5 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md active:scale-95"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Thinking...
            </>
          ) : 'Generate Plan'}
        </button>
      </div>
    </div>
  );
};

export default Controls;
