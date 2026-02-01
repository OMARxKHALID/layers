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
    <div className="glass-panel w-full rounded-2xl md:rounded-3xl p-3 md:p-6 flex flex-col h-[85vh] max-h-[850px] mb-4 animate-liquid relative isolate">
      <div className="flex items-center justify-between mb-4 shrink-0 pl-1 pr-1">
        <div className="flex items-center gap-3">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-gray-900">
            {allSuccess ? "Completed" : "Queue"}
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-black/5 text-gray-500 rounded-full">
            {queue.length}
          </span>
        </div>
        {!isProcessing && (
          <button
            onClick={onAddMore}
            className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-black transition-colors px-4 py-1.5 hover:bg-white/50 rounded-full border border-black/5"
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

      <div className="grow relative -mx-1 px-1 mt-1">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar pr-1 pb-1 overflow-x-visible">
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

      <div className="shrink-0 pt-4 mt-2 border-t border-black/4">
        {allSuccess ? (
          <div className="flex flex-col sm:flex-row justify-center gap-2 w-full animate-soft sm:flex-nowrap">
            <button
              onClick={onDownloadAll}
              disabled={isZipping}
              className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2 bg-mascot-orange hover:bg-mascot-orange/90 disabled:opacity-70 disabled:cursor-wait text-white rounded-full transition-all font-bold text-sm active:scale-95 shadow-lg shadow-mascot-orange/20"
            >
              {isZipping ? (
                <Loader2 size={16} className="animate-spin" />
              ) : queue.length === 1 ? (
                <Download size={16} />
              ) : (
                <Archive size={16} />
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
              className="px-5 py-2 bg-black/5 hover:bg-black/10 text-gray-800 rounded-full transition-all font-medium text-sm active:scale-95"
            >
              New Session
            </button>
          </div>
        ) : isProcessing ? (
          <div className="flex justify-center w-full animate-soft">
            <button
              disabled
              className="px-10 py-2.5 bg-black/5 text-gray-400 cursor-not-allowed rounded-full font-medium text-sm"
            >
              <span className="animate-pulse">Processing...</span>
            </button>
          </div>
        ) : (
          <div className="flex justify-center w-full animate-soft">
            <button
              onClick={onConvertAll}
              className="px-8 py-2.5 bg-mascot-orange hover:bg-mascot-orange/90 text-white rounded-full transition-all font-bold text-sm flex items-center gap-2 active:scale-95 hover:shadow-xl hover:shadow-mascot-orange/25"
            >
              <span>Convert Files</span>
              <PlayCircle size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
