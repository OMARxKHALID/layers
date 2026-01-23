"use client";

import React, { useState, useRef, useCallback } from "react";
import { AppState, CONVERSION_OPTIONS } from "@/lib/config";
import { getMimeType } from "@/utils/file-utils";
import { getFileMetadata, suggestFormat } from "@/utils/media-utils";
import { useZipDownload } from "@/hooks/useZipDownload";
import { useToasts } from "@/hooks/useToasts";
import { useQueue } from "@/hooks/useQueue";
import { useConversion } from "@/hooks/useConversion";
import { useGlobalDrag } from "@/hooks/useGlobalDrag";

import { Header } from "@/components/header";
import { DropZone } from "@/components/drop-zone";
import { QueueList } from "@/components/queue-list";
import { ActionPanel } from "@/components/action-panel";
import { HistoryModal } from "@/components/history-modal";
import { ToastContainer } from "@/components/toast";
import { CompareView } from "@/components/compare-view";

export default function Home() {
  const [showHistory, setShowHistory] = useState(false);
  const [activeCompare, setActiveCompare] = useState(null);

  const pendingActionFormat = useRef(null);
  const addMoreInputRef = useRef(null);

  // 1. Toast Logic
  const { toasts, addToast } = useToasts();

  // 2. Queue & History Logic
  const {
    appState,
    setAppState,
    queue,
    setQueue,
    history,
    addToHistory,
    updateItem,
    removeItem,
    resetQueue,
    clearHistory,
  } = useQueue(addToast);

  // 3. File Selection Logic
  const handleFilesSelect = useCallback(
    async (files) => {
      const invalidFiles = [];
      const validItems = [];

      await Promise.all(
        files.map(async (file) => {
          const mime = getMimeType(file);
          const options = CONVERSION_OPTIONS.filter((opt) =>
            opt.accepts.includes(mime),
          );

          if (options.length === 0) {
            invalidFiles.push(file);
            return;
          }

          const format =
            pendingActionFormat.current ||
            suggestFormat(mime, file) ||
            options[0].id;

          const metadata = await getFileMetadata(file);

          validItems.push({
            id: crypto.randomUUID(),
            jobId: null,
            file,
            status: "idle",
            progress: 0,
            format,
            availableOptions: options,
            downloadUrl: null,
            customName: file.name,
            metadata,
            settings: {
              quality: 100,
              grayscale: false,
              rotation: 0,
              scale: 100,
              aspectRatio: "original",
              flip: false,
              flop: false,
              multiSize: false,
              fps: null,
              audioBitrate: "192k",
              frameOffset: 0,
            },
          });
        }),
      );

      if (invalidFiles.length > 0) {
        addToast(
          `${invalidFiles.length} file(s) skipped (unsupported or too large)`,
          "error",
        );
      }

      if (validItems.length > 0) {
        setQueue((prev) => [...prev, ...validItems]);
        setAppState(AppState.QUEUE_ACTIVE);
        addToast(`${validItems.length} file(s) added`);
      }

      pendingActionFormat.current = null;
    },
    [addToast, setQueue, setAppState],
  );

  // 4. Conversion & Processing Logic
  const {
    isProcessing,
    handleConvertItem,
    handleConvertAll,
    handleCancelItem,
  } = useConversion(queue, updateItem, addToast, addToHistory);

  // 5. Drag & Drop Logic
  const { isGlobalDragging } = useGlobalDrag(handleFilesSelect);

  // 6. Bulk Actions Logic
  const { downloadAsZip, progress: zipProgress } = useZipDownload({
    zipFileName: "morpho_bundle.zip",
  });

  const handleDownloadAll = async () => {
    const items = queue.filter((q) => q.status === "success" && q.downloadUrl);
    if (!items.length) return;

    addToast("Creating archive...");

    const zipItems = items.map((item) => ({
      fileName: item.customName,
      downloadUrl: item.downloadUrl,
    }));

    try {
      await downloadAsZip(zipItems);
      if (zipProgress.status === "error") {
        addToast(`Archive failed: ${zipProgress.error}`, "error");
      } else {
        addToast("Download started", "success");
      }
    } catch (e) {
      addToast("Archive failed", "error");
    }
  };

  const allSuccess = queue.length && queue.every((q) => q.status === "success");

  return (
    <div className="h-screen w-screen flex flex-col text-gray-900 overflow-hidden relative">
      {isGlobalDragging && (
        <div className="fixed inset-0 z-[2000] bg-white/20 backdrop-blur-xl border-[12px] border-blue-500/20 m-4 rounded-[3rem] pointer-events-none flex flex-col items-center justify-center animate-scale-in">
          <div className="w-32 h-32 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-500 animate-bounce"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
          <p className="text-2xl font-black text-blue-600 uppercase tracking-[0.2em] pixel-font">
            Drop to Morph
          </p>
        </div>
      )}
      <ToastContainer toasts={toasts} />
      <Header onReset={resetQueue} onOpenHistory={() => setShowHistory(true)} />

      <main className="flex-grow flex flex-col items-center px-4 relative z-10 overflow-hidden">
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center flex-grow overflow-hidden pt-2">
          {appState === AppState.IDLE ? (
            <div className="flex flex-col items-center justify-center h-full w-full animate-slide-up pb-20">
              <div className="text-center mb-12">
                <h1 className="text-8xl hero-title mb-2 tracking-tighter">
                  Morpho
                </h1>
                <p className="text-lg text-gray-500 font-bold tracking-[0.2em] opacity-40 uppercase pixel-font">
                  Elegant file conversion
                </p>
                <div className="mt-12">
                  <ActionPanel
                    queue={[]}
                    isProcessing={false}
                    onQuickAction={(fmt) => {
                      pendingActionFormat.current = fmt;
                      document.getElementById("file-upload")?.click();
                    }}
                  />
                </div>
              </div>
              <DropZone onFilesSelect={handleFilesSelect} />
            </div>
          ) : (
            <div className="glass-card w-full rounded-[2.5rem] p-6 flex flex-col h-[82vh] max-h-[850px] mb-4 animate-scale-in overflow-hidden border-white/50">
              <div className="flex items-center justify-between mb-4 px-1 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-[14px] font-black tracking-[0.3em] text-gray-900 uppercase pixel-font">
                    {allSuccess ? "Finished" : "Queue"}
                  </h2>
                  <span className="text-[11px] font-black px-2 py-0.5 bg-black/5 text-gray-400 rounded-lg border border-black/[0.02]">
                    {queue.length}
                  </span>
                </div>
                {!isProcessing && (
                  <button
                    onClick={() => addMoreInputRef.current?.click()}
                    className="apple-button-secondary !text-[11px] !py-2 !px-5 font-bold uppercase tracking-widest bg-white/40 border-white/60 hover:bg-white/80"
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
              <div className="flex-grow overflow-hidden no-scrollbar">
                <QueueList
                  queue={queue}
                  onRemove={removeItem}
                  onCancel={handleCancelItem}
                  onFormatChange={(id, f) => updateItem(id, { format: f })}
                  onSettingsChange={(id, s) => updateItem(id, { settings: s })}
                  onNameChange={(id, n) => updateItem(id, { customName: n })}
                  onCompare={(data) => setActiveCompare(data)}
                  onConvert={handleConvertItem}
                />
              </div>
              <div className="flex-shrink-0 pt-4 border-t border-black/[0.03] mt-3">
                <ActionPanel
                  queue={queue}
                  isProcessing={isProcessing}
                  onConvertAll={handleConvertAll}
                  onConvertMore={resetQueue}
                  onDownloadAll={handleDownloadAll}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {showHistory && (
        <HistoryModal
          history={history}
          onClose={() => setShowHistory(false)}
          onClear={clearHistory}
        />
      )}

      {activeCompare && (
        <CompareView
          original={activeCompare.original}
          converted={activeCompare.converted}
          onClose={() => setActiveCompare(null)}
        />
      )}
    </div>
  );
}
