import React from "react";
import { History } from "lucide-react";

export const Header = ({ onReset, onOpenHistory }) => {
  return (
    <header className="w-full px-8 py-6 flex justify-between items-center max-w-[1400px] mx-auto z-[100] animate-fade-in">
      <div
        className="flex items-center gap-3 cursor-pointer group px-4 py-2 rounded-2xl hover:bg-white/50 transition-all border border-transparent hover:border-white/20"
        onClick={onReset}
      >
        <div className="w-14 h-14 flex items-center justify-center relative">
          <img
            src="/mascot.png"
            alt="Morpho"
            className="w-full h-full object-contain drop-shadow-md opacity-90 transition-transform group-hover:scale-110"
          />
        </div>
        <span className="text-lg font-black tracking-tight text-gray-900 uppercase pixel-font mt-1">
          Morpho
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onOpenHistory}
          className="p-3 glass hover:bg-white/80 text-gray-600 hover:text-black rounded-2xl transition-all shadow-sm group border border-white/40"
          title="History"
        >
          <History
            size={20}
            strokeWidth={2.2}
            className="transition-transform group-hover:scale-110"
          />
        </button>
      </div>
    </header>
  );
};
