import React from "react";
import { History, Smartphone, Cloud } from "lucide-react";
import { ExecutionMode } from "@/lib/config";

export const Header = ({
  onReset,
  onOpenHistory,
  executionMode,
  onToggleMode,
}) => {
  return (
    <header className="w-full px-4 md:px-6 pt-3 md:pt-4 pb-1 flex justify-between items-center max-w-4xl mx-auto z-100 animate-soft">
      <div
        className="flex items-center gap-2 cursor-pointer px-1 md:px-2 py-0.5 group"
        onClick={onReset}
      >
        <div className="w-7 h-7 md:w-10 md:h-10 flex items-center justify-center relative">
          <img
            src="/mascot.png"
            alt="Layers"
            className="w-full h-full object-cover opacity-85 mix-blend-multiply"
          />
        </div>
        <span className="text-lg md:text-xl font-(family-name:--font-pixelify-sans) font-bold tracking-tight text-mascot-orange">
          Layers
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() =>
            onToggleMode(
              executionMode === ExecutionMode.CLIENT
                ? ExecutionMode.SERVER
                : ExecutionMode.CLIENT,
            )
          }
          className={`
            flex items-center gap-2 px-3 py-1 rounded-full border transition-all active:scale-95 group/mode
            ${
              executionMode === ExecutionMode.CLIENT
                ? "bg-mascot-orange/10 border-mascot-orange/20 text-mascot-orange hover:bg-mascot-orange/15"
                : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"
            }
          `}
        >
          {executionMode === ExecutionMode.CLIENT ? (
            <Smartphone size={12} strokeWidth={2.5} />
          ) : (
            <Cloud size={12} strokeWidth={2.5} />
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {executionMode === ExecutionMode.CLIENT ? "Device" : "Cloud"}
          </span>
        </button>

        <button
          onClick={onOpenHistory}
          className="p-2 glass-card text-gray-900 bg-white/40 hover:bg-white/60 rounded-full transition-all group/hist"
          title="History"
        >
          <History size={16} strokeWidth={2} className="text-gray-800" />
        </button>
      </div>
    </header>
  );
};
