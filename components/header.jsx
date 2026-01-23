import React from "react";
import { History } from "lucide-react";

export const Header = ({ onReset, onOpenHistory }) => {
  return (
    <header className="w-full px-6 py-8 flex justify-between items-center max-w-5xl mx-auto z-[100] animate-soft">
      <div
        className="flex items-center gap-4 cursor-pointer px-2 py-1"
        onClick={onReset}
      >
        <div className="w-10 h-10 flex items-center justify-center relative bg-white/40 rounded-xl overflow-hidden shadow-sm ring-1 ring-white/50">
          <img
            src="/mascot.png"
            alt="Morpho"
            className="w-full h-full object-cover opacity-85 mix-blend-multiply"
          />
        </div>
        <span className="text-xl font-medium tracking-tight text-gray-800">
          Morpho
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onOpenHistory}
          className="p-2.5 glass-card text-gray-600 hover:text-gray-900 rounded-full transition-all"
          title="History"
        >
          <History size={18} strokeWidth={2.5} className="text-gray-900" />
        </button>
      </div>
    </header>
  );
};
