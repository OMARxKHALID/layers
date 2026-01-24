import React from "react";
import { History } from "lucide-react";

export const Header = ({ onReset, onOpenHistory }) => {
  return (
    <header className="w-full px-4 md:px-6 pt-4 md:pt-6 pb-2 flex justify-between items-center max-w-5xl mx-auto z-[100] animate-soft">
      <div
        className="flex items-center gap-2 cursor-pointer px-1 md:px-2 py-1 group"
        onClick={onReset}
      >
        <div className="w-8 h-8 md:w-14 md:h-14 flex items-center justify-center relative mascot-animation">
          <img
            src="/mascot.png"
            alt="Layers"
            className="w-full h-full object-cover opacity-85 mix-blend-multiply "
          />
        </div>
        <span className="text-xl font-[family-name:var(--font-pixelify-sans)] font-bold tracking-tight text-gray-800">
          Layers
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onOpenHistory}
          className="p-2.5 glass-card text-gray-900 bg-white/40 hover:bg-white/60 rounded-full transition-all group/hist"
          title="History"
        >
          <History
            size={18}
            strokeWidth={2}
            className="text-gray-800 history-icon"
          />
        </button>
      </div>
    </header>
  );
};
