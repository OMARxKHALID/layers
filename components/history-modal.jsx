import { X, History, File, Download } from "lucide-react";

export const HistoryModal = ({ history, onClose, onClear }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-white/20 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="glass-panel w-full max-w-md rounded-[32px] md:rounded-[40px] p-6 md:p-8 relative animate-soft overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-3 md:gap-4 text-gray-800">
            <div className="bg-white/60 p-2 md:p-2.5 rounded-xl md:rounded-2xl ring-1 ring-white/50">
              <History
                size={18}
                strokeWidth={2}
                className="text-gray-800 md:w-5 md:h-5"
              />
            </div>
            <h2 className="text-lg md:text-xl font-medium tracking-tight">
              History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 md:p-2 hover:bg-black/[0.03] rounded-full transition-colors text-gray-800"
          >
            <X size={18} strokeWidth={2} className="md:w-5 md:h-5" />
          </button>
        </div>

        <div className="max-h-[45vh] overflow-y-auto pr-2 space-y-3 custom-scrollbar -mr-2 pl-1 py-1">
          {history.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center gap-4 opacity-40">
              <History size={48} strokeWidth={1} className="text-gray-600" />
              <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">
                No Sessions Yet
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 bg-white/40 hover:bg-white/[0.38] rounded-[20px] md:rounded-[24px] transition-all duration-300 group ring-1 ring-white/40 gap-3"
              >
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden w-full sm:w-auto">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/60 rounded-xl md:rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0">
                    <File
                      size={18}
                      strokeWidth={2}
                      className="text-gray-900 md:w-5 md:h-5"
                    />
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <p className="text-xs md:text-sm font-medium text-gray-800 truncate leading-tight mb-1">
                      {item.fileName}
                    </p>
                    <p className="text-[10px] md:text-[11px] text-gray-500 font-medium opacity-70">
                      {(item.size / 1024 / 1024).toFixed(1)} MB • {item.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/40 p-1 rounded-full border border-white/30 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-[9px] md:text-[10px] font-medium px-2 py-1 text-gray-700 uppercase tracking-wider">
                    {item.format}
                  </span>
                  {item.downloadUrl && (
                    <a
                      href={item.downloadUrl}
                      className="p-1.5 md:p-2 bg-gray-900 hover:bg-black text-white rounded-full transition-all flex items-center justify-center"
                      title="Download"
                    >
                      <Download size={14} strokeWidth={2.5} />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {history.length > 0 && (
          <div className="mt-8 pt-6 border-t border-black/[0.04] flex justify-center">
            <button
              onClick={onClear}
              className="text-xs text-gray-400 hover:text-red-500 hover:bg-red-50/50 px-6 py-2.5 rounded-full transition-all font-medium uppercase tracking-widest"
            >
              Clear History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
