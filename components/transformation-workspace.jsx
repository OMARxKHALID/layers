import React from "react";
import { QueueList } from "./queue-list";
import { PlayCircle, Archive, Download, Loader2 } from "lucide-react";

export const TransformationWorkspace = ({
  queue,
  isProcessing,
  allSuccess,
  onAddMore,
  onRemoveItem,
  onCancelItem,
  onUpdateItem,
  onConvertItem,
  onConvertAll,
  onResetQueue,
  onDownloadAll,
  onCompare,
  addMoreInputRef,
  handleFilesSelect,
  zipProgress,
}) => {
  const isZipping = zipProgress?.status === "zipping";

  return (
    <div className="glass-panel w-full rounded-[30px] md:rounded-[40px] p-4 md:p-8 flex flex-col h-[85vh] max-h-[850px] mb-6 animate-liquid relative isolate">
      <div className="flex items-center justify-between mb-6 flex-shrink-0 pl-1 pr-2">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">
            {allSuccess ? "Completed" : "Queue"}
          </h2>
          <span className="text-xs font-bold px-2 py-0.5 bg-black/5 text-gray-500 rounded-full">
            {queue.length}
          </span>
        </div>
        {!isProcessing && (
          <button
            onClick={onAddMore}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors px-6 py-2 hover:bg-white/50 rounded-full border border-black/5"
          >
            + Add More
          </button>
        )}
        <input
          ref={addMoreInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              handleFilesSelect(Array.from(e.target.files));
              e.target.value = "";
            }
          }}
        />
      </div>

      <div className="flex-grow relative -mx-2 px-2 mt-2">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar pr-2 pb-2 overflow-x-visible">
          <QueueList
            queue={queue}
            onRemove={onRemoveItem}
            onCancel={onCancelItem}
            onFormatChange={(id, f) => onUpdateItem(id, { format: f })}
            onSettingsChange={(id, s) => onUpdateItem(id, { settings: s })}
            onNameChange={(id, n) => onUpdateItem(id, { customName: n })}
            onCompare={onCompare}
            onConvert={onConvertItem}
          />
        </div>
      </div>

      <div className="flex-shrink-0 pt-6 mt-2 border-t border-black/[0.04]">
        {allSuccess ? (
          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 w-full animate-soft sm:flex-nowrap">
            <button
              onClick={onDownloadAll}
              disabled={isZipping}
              className="flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-mascot-orange hover:bg-mascot-orange/90 disabled:opacity-70 disabled:cursor-wait text-white rounded-full transition-all font-bold text-sm sm:text-base active:scale-95 shadow-lg shadow-mascot-orange/20"
            >
              {isZipping ? (
                <Loader2 size={18} className="animate-spin" />
              ) : queue.length === 1 ? (
                <Download size={18} />
              ) : (
                <Archive size={18} />
              )}
              <span>
                {isZipping
                  ? "Zipping..."
                  : queue.length === 1
                    ? "Save"
                    : "Save All"}
              </span>
            </button>
            <button
              onClick={onResetQueue}
              className="px-6 py-2.5 sm:py-3 bg-black/5 hover:bg-black/10 text-gray-800 rounded-full transition-all font-medium text-sm sm:text-base active:scale-95"
            >
              New Session
            </button>
          </div>
        ) : isProcessing ? (
          <div className="flex justify-center w-full animate-soft">
            <button
              disabled
              className="px-12 py-3 bg-black/5 text-gray-400 cursor-not-allowed rounded-full font-medium"
            >
              <span className="animate-pulse">Processing...</span>
            </button>
          </div>
        ) : (
          <div className="flex justify-center w-full animate-soft">
            <button
              onClick={onConvertAll}
              className="px-10 py-3 bg-mascot-orange hover:bg-mascot-orange/90 text-white rounded-full transition-all font-bold text-sm sm:text-base flex items-center gap-2 active:scale-95 hover:shadow-xl hover:shadow-mascot-orange/25"
            >
              <span>Convert Files</span>
              <PlayCircle size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
