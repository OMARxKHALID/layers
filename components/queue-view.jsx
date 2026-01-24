import React from "react";
import { QueueList } from "./queue-list";
import { ActionPanel } from "./action-panel";

export const QueueView = ({
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
}) => {
  return (
    <div className="glass-panel w-full rounded-[30px] md:rounded-[40px] p-4 md:p-8 flex flex-col h-[85vh] max-h-[850px] mb-6 animate-liquid overflow-hidden relative">
      <div className="flex items-center justify-between mb-6 flex-shrink-0 pl-1 pr-2">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">
            {allSuccess ? "Completed" : "Queue"}
          </h2>
          <span className="text-[10px] md:text-xs font-bold px-2 py-0.5 bg-black/5 text-gray-500 rounded-full">
            {queue.length}
          </span>
        </div>
        {!isProcessing && (
          <button
            onClick={onAddMore}
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black transition-colors px-5 py-2 hover:bg-white/50 rounded-full border border-black/5"
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

      <div className="flex-grow overflow-hidden relative -mx-2 px-2">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar pr-2 pb-2">
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
        <ActionPanel
          queue={queue}
          isProcessing={isProcessing}
          onConvertAll={onConvertAll}
          onConvertMore={onResetQueue}
          onDownloadAll={onDownloadAll}
        />
      </div>
    </div>
  );
};
