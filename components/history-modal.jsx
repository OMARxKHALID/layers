import { X, ScrollText, File, Download } from "lucide-react";

export const HistoryModal = ({ history, onClose, onClear }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-white/10 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="glass-card w-full max-w-[340px] rounded-[2.5rem] p-6 relative animate-fade-in shadow-2xl backdrop-blur-3xl overflow-hidden noise border-white/40">
        <div className="flex items-center justify-between mb-5 px-1">
          <div className="flex items-center gap-3 text-gray-900">
            <div className="bg-white/50 p-2 rounded-xl border border-white shadow-sm">
              <ScrollText
                size={16}
                strokeWidth={2.5}
                className="text-gray-600"
              />
            </div>
            <h2 className="text-[15px] font-bold tracking-tight uppercase pixel-font">
              History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-black/5 rounded-full transition-colors text-gray-400 hover:text-gray-900"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="max-h-[35vh] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          {history.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center gap-3 opacity-30">
              <ScrollText size={32} strokeWidth={1} className="text-gray-400" />
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em]">
                No Sessions Yet
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white/30 hover:bg-white/60 rounded-2xl transition-all duration-300 group border border-white/20 hover:border-white/50"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center border border-black/[0.03] flex-shrink-0 shadow-sm relative overflow-hidden group-hover:scale-105 transition-transform">
                    <File size={16} strokeWidth={2} className="text-gray-400" />
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <p className="text-[12px] font-bold text-gray-800 truncate leading-none mb-1">
                      {item.fileName}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter opacity-70">
                      {(item.size / 1024 / 1024).toFixed(1)} MB • {item.date}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                  <span className="text-[9px] font-black px-2 py-0.5 bg-black/5 text-gray-500 rounded-md uppercase tracking-widest border border-black/[0.02]">
                    {item.format}
                  </span>
                  {item.downloadUrl && (
                    <a
                      href={item.downloadUrl}
                      className="p-1.5 bg-black hover:bg-black/80 text-white rounded-lg transition-all shadow-md active:scale-95 flex items-center justify-center translate-x-0.5"
                      title="Download"
                    >
                      <Download size={12} strokeWidth={3} />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {history.length > 0 && (
          <div className="mt-6 pt-4 border-t border-black/[0.03] flex justify-center">
            <button
              onClick={onClear}
              className="text-[10px] text-gray-400 hover:text-red-500 hover:bg-red-50/50 px-6 py-2 rounded-full transition-all font-bold uppercase tracking-[0.2em] border border-transparent hover:border-red-100"
            >
              Clear History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
