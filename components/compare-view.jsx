import React from "react";
import { X, Columns } from "lucide-react";

export const CompareView = ({ original, converted, onClose }) => {
  if (!original || !converted) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-6 bg-white/20 backdrop-blur-xl animate-soft">
      <div className="w-full max-w-6xl h-full flex flex-col">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/40 rounded-2xl flex items-center justify-center shadow-sm border border-white/50">
              <Columns size={20} className="text-gray-600" />
            </div>
            <div>
              <h2 className="text-gray-800 text-sm font-medium uppercase tracking-widest">
                Comparison
              </h2>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-gray-500 text-[10px] font-medium uppercase tracking-tight">
                  Live View
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/40 hover:bg-white/60 text-gray-800 rounded-full flex items-center justify-center transition-all shadow-sm ring-1 ring-white/50 active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        <main className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0 pb-4">
          {/* Original Card */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-2 mb-3 px-2">
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                Source
              </span>
              <div className="h-[1px] flex-grow bg-black/[0.03]" />
              <span className="text-[10px] font-bold text-gray-500 bg-white/40 px-3 py-1 rounded-full ring-1 ring-white/40">
                Original
              </span>
            </div>

            <div className="flex-grow glass-panel rounded-[32px] flex items-center justify-center relative overflow-hidden group">
              <img
                src={original}
                alt="Original"
                className="max-w-full max-h-full object-contain p-8 transition-transform duration-700"
              />
            </div>
          </div>

          {/* Converted Card */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-2 mb-3 px-2">
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                Output
              </span>
              <div className="h-[1px] flex-grow bg-black/[0.03]" />
              <span className="text-[10px] font-bold text-white bg-gray-900 px-4 py-1 rounded-full shadow-lg">
                Converted
              </span>
            </div>

            <div className="flex-grow glass-panel rounded-[32px] flex items-center justify-center relative overflow-hidden group">
              <img
                src={converted}
                alt="Converted"
                className="max-w-full max-h-full object-contain p-8 transition-transform duration-700"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
