import { X, ScrollText, File, Download } from "lucide-react";

export const HistoryModal = ({ history, onClose, onClear }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-white/20 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="glass-panel w-full max-w-md rounded-[40px] p-8 relative animate-soft shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-4 text-gray-800">
            <div className="bg-white/60 p-2.5 rounded-2xl shadow-sm ring-1 ring-white/50">
              <ScrollText size={20} strokeWidth={2} className="text-gray-800" />
            </div>
            <h2 className="text-xl font-medium tracking-tight">History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-400 hover:text-gray-900"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="max-h-[45vh] overflow-y-auto pr-2 space-y-3 custom-scrollbar -mr-2 pl-1 py-1">
          {history.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center gap-4 opacity-40">
              <ScrollText size={48} strokeWidth={1} className="text-gray-400" />
              <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">
                No Sessions Yet
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-white/40 hover:bg-white/60 rounded-[24px] transition-all duration-300 group ring-1 ring-white/40 hover:ring-white/80 hover:shadow-lg"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-12 h-12 bg-white/60 rounded-2xl flex items-center justify-center shadow-sm relative overflow-hidden transition-transform">
                    <File size={20} strokeWidth={2} className="text-gray-900" />
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <p className="text-sm font-medium text-gray-800 truncate leading-tight mb-1">
                      {item.fileName}
                    </p>
                    <p className="text-[11px] text-gray-500 font-medium opacity-70">
                      {(item.size / 1024 / 1024).toFixed(1)} MB • {item.date}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0 ml-3">
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-white/50 text-gray-600 rounded-full uppercase tracking-wider">
                    {item.format}
                  </span>
                  {item.downloadUrl && (
                    <a
                      href={item.downloadUrl}
                      className="p-2 bg-gray-900 hover:bg-black text-white rounded-full transition-all shadow-md flex items-center justify-center"
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
