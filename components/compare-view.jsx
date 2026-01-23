import React from "react";
import { X, Columns } from "lucide-react";

export const CompareView = ({ original, converted, onClose }) => {
  if (!original || !converted) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-6 bg-white/30 backdrop-blur-2xl animate-in fade-in duration-300">
      {/* Soft background gradient to match your screenshot */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f3e8ff]/50 via-white/40 to-[#e0e7ff]/50 -z-10" />

      <div className="w-full max-w-[1400px] h-full flex flex-col">
        {/* Top Navigation Bar - Matches your Morpho Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-white/50">
              <Columns size={20} className="text-slate-600" />
            </div>
            <div>
              <h2 className="text-slate-800 text-sm font-black uppercase tracking-widest">
                Comparison View
              </h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight">
                  Side-by-Side Review
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-12 h-12 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl flex items-center justify-center transition-all shadow-sm border border-white/80 active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Comparison Cards - Using the white 'Squircle' look from your UI */}
        <main className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-8 min-h-0">
          {/* Original Card */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-2 mb-3 px-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Source
              </span>
              <div className="h-[1px] flex-grow bg-slate-200/50" />
              <span className="text-[10px] font-bold text-slate-500 bg-white/50 px-3 py-1 rounded-full border border-white/60">
                Original
              </span>
            </div>

            <div className="flex-grow bg-white/40 border border-white/80 rounded-[2.5rem] shadow-xl shadow-indigo-100/20 flex items-center justify-center relative overflow-hidden group">
              <img
                src={original}
                alt="Original"
                className="max-w-full max-h-full object-contain p-8 transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Converted Card */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-2 mb-3 px-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Output
              </span>
              <div className="h-[1px] flex-grow bg-slate-200/50" />
              <span className="text-[10px] font-bold text-white bg-slate-900 px-4 py-1 rounded-full shadow-lg">
                Converted
              </span>
            </div>

            <div className="flex-grow bg-white/40 border border-white/80 rounded-[2.5rem] shadow-xl shadow-indigo-100/20 flex items-center justify-center relative overflow-hidden group">
              <img
                src={converted}
                alt="Converted"
                className="max-w-full max-h-full object-contain p-8 transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
