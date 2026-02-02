import React from 'react';
import { supabase } from '../services/supabaseClient';

const Landing: React.FC = () => {
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) console.error('Login error:', error.message);
  };

  const isConfigured = !!(supabase as any).supabaseUrl && !!(supabase as any).supabaseKey;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-['Inter']">
      {!isConfigured && (
        <div className="bg-red-600 text-white px-4 py-3 text-center text-sm font-bold animate-pulse">
          CRITICAL ERROR: Supabase Configuration Missing. Check Netlify Environment Variables.
        </div>
      )}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 md:p-12 border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-8">
            <h1 className="text-4xl font-black tracking-tighter mb-2">WAR MAP</h1>
            <p className="text-gray-400 font-medium tracking-wide text-sm">STRATEGIC YEARLY PLANNER</p>
          </div>

          <div className="space-y-6">
            <p className="text-gray-600 leading-relaxed text-sm">
              Map your year, track your initiatives, and align your strategy.
              Sign in to access your personal War Map.
            </p>

            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 bg-black text-white px-6 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all transform active:scale-95 shadow-lg hover:shadow-xl group"
            >
              <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <p className="text-xs text-gray-400 mt-4">
              Secure authentication powered by Google & Supabase.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center opacity-40">
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Stoke Planner &bull; 2026</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
