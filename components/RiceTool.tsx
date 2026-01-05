
import React from 'react';
import { RiceProject, PRESET_COLORS } from '../types';

interface RiceToolProps {
  projects: RiceProject[];
  onUpdateProjects: (projects: RiceProject[]) => void;
  onDeployToKey: (project: RiceProject) => void;
}

const RiceTool: React.FC<RiceToolProps> = ({ projects, onUpdateProjects, onDeployToKey }) => {
  const calculateScore = (p: Partial<RiceProject>) => {
    const reach = p.reach || 0;
    const impact = p.impact || 0;
    const confidence = (p.confidence || 0) / 100;
    const effort = p.effort || 1;
    return Math.round((reach * impact * confidence) / effort);
  };

  const handleUpdate = (id: string, updates: Partial<RiceProject>) => {
    onUpdateProjects(projects.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        updated.score = calculateScore(updated);
        return updated;
      }
      return p;
    }));
  };

  const handleAddProject = () => {
    const newProject: RiceProject = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Strategic Initiative',
      reach: 1000,
      impact: 1,
      confidence: 100,
      effort: 1,
      score: 1000
    };
    onUpdateProjects([...projects, newProject]);
  };

  const handleRemove = (id: string) => {
    onUpdateProjects(projects.filter(p => p.id !== id));
  };

  const handleSort = () => {
    onUpdateProjects([...projects].sort((a, b) => b.score - a.score));
  };

  return (
    <div className="bg-white border border-gray-300 shadow-2xl overflow-hidden rounded-xl">
      <div className="bg-black text-white p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-widest">RICE Project Scoring</h2>
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">Priority = (Reach × Impact × Confidence) / Effort</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleSort}
            className="px-4 py-2 border border-white/20 rounded-md text-[10px] font-black uppercase hover:bg-white/10 transition-colors"
          >
            Sort by Score
          </button>
          <button 
            onClick={handleAddProject}
            className="px-6 py-2 bg-white text-black rounded-md text-[10px] font-black uppercase hover:bg-gray-200 transition-colors"
          >
            Add Project +
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-400 w-1/4">Project Name</th>
              <th className="px-4 py-4 text-[11px] font-black uppercase text-gray-400">Reach</th>
              <th className="px-4 py-4 text-[11px] font-black uppercase text-gray-400">Impact</th>
              <th className="px-4 py-4 text-[11px] font-black uppercase text-gray-400">Confidence (%)</th>
              <th className="px-4 py-4 text-[11px] font-black uppercase text-gray-400">Effort (Months)</th>
              <th className="px-6 py-4 text-[11px] font-black uppercase text-black text-right">RICE Score</th>
              <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-400 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.map((p, index) => (
              <tr key={p.id} className="hover:bg-gray-50/50 group transition-colors">
                <td className="px-6 py-4">
                  <input 
                    className="w-full bg-transparent border-none focus:ring-0 font-bold text-gray-800 p-0"
                    value={p.name}
                    onChange={(e) => handleUpdate(p.id, { name: e.target.value })}
                  />
                </td>
                <td className="px-4 py-4">
                  <input 
                    type="number"
                    className="w-20 bg-gray-50 border-gray-200 rounded text-xs font-bold px-2 py-1"
                    value={p.reach}
                    onChange={(e) => handleUpdate(p.id, { reach: Number(e.target.value) })}
                  />
                </td>
                <td className="px-4 py-4">
                  <select 
                    className="bg-gray-50 border-gray-200 rounded text-xs font-bold px-2 py-1"
                    value={p.impact}
                    onChange={(e) => handleUpdate(p.id, { impact: Number(e.target.value) })}
                  >
                    <option value={0.25}>0.25 (Minimal)</option>
                    <option value={0.5}>0.5 (Small)</option>
                    <option value={1}>1.0 (Medium)</option>
                    <option value={2}>2.0 (High)</option>
                    <option value={3}>3.0 (Massive)</option>
                  </select>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      className="accent-black w-24"
                      value={p.confidence}
                      onChange={(e) => handleUpdate(p.id, { confidence: Number(e.target.value) })}
                    />
                    <span className="text-xs font-black w-8">{p.confidence}%</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <input 
                    type="number"
                    step="0.25"
                    className="w-16 bg-gray-50 border-gray-200 rounded text-xs font-bold px-2 py-1"
                    value={p.effort}
                    onChange={(e) => handleUpdate(p.id, { effort: Number(e.target.value) })}
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`text-lg font-black ${index === 0 ? 'text-blue-600' : 'text-black'}`}>
                    {p.score.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onDeployToKey(p)}
                        className="p-1 text-gray-400 hover:text-black transition-colors"
                        title="Plot on Stoke Planner"
                      >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleRemove(p.id)}
                      className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-sm">No projects prioritized yet</p>
            <button onClick={handleAddProject} className="mt-4 text-black font-bold underline text-xs">Start Scoring Projects</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiceTool;
