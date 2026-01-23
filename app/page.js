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
import { ToastContainer } from "@/components/toast";
import dynamic from "next/dynamic";

const HistoryModal = dynamic(() =>
  import("@/components/history-modal").then((mod) => mod.HistoryModal),
);
const CompareView = dynamic(() =>
  import("@/components/compare-view").then((mod) => mod.CompareView),
);

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
      jobId: item.jobId,
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
        <div className="fixed inset-0 z-[2000] bg-white/60 backdrop-blur-md m-6 rounded-[3rem] pointer-events-none flex flex-col items-center justify-center animate-liquid shadow-2xl border border-white/50">
          <div className="w-24 h-24 bg-white/70 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400 animate-bounce"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
          <p className="text-2xl font-light text-gray-800 tracking-tight">
            Release to Morph
          </p>
        </div>
      )}
      <ToastContainer toasts={toasts} />
      <Header onReset={resetQueue} onOpenHistory={() => setShowHistory(true)} />

      <main className="flex-grow flex flex-col items-center px-4 relative z-10 overflow-hidden pb-6">
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center flex-grow overflow-hidden pt-4">
          {appState === AppState.IDLE ? (
            <div className="flex flex-col items-center justify-center h-full w-full animate-soft pb-24">
              <div className="text-center mb-16 space-y-4">
                <h1 className="text-7xl font-[family-name:var(--font-pixelify-sans)] font-normal tracking-wide text-balance text-gray-900 drop-shadow-sm">
                  Morpho
                </h1>
                <p className="text-lg text-gray-500 font-normal tracking-wide">
                  Elegant file conversion.
                </p>
                <div className="pt-8">
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
            <div className="glass-panel w-full rounded-[40px] p-8 flex flex-col h-[85vh] max-h-[850px] mb-6 animate-liquid overflow-hidden relative">
              <div className="flex items-center justify-between mb-6 flex-shrink-0 pl-1 pr-2">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-medium tracking-tight text-gray-800">
                    {allSuccess ? "Completed" : "Queue"}
                  </h2>
                  <span className="text-xs font-medium px-2.5 py-1 bg-black/5 text-gray-500 rounded-full">
                    {queue.length}
                  </span>
                </div>
                {!isProcessing && (
                  <button
                    onClick={() => addMoreInputRef.current?.click()}
                    className="btn-minimal !py-2 !px-4 text-xs uppercase tracking-wider"
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
                    onRemove={removeItem}
                    onCancel={handleCancelItem}
                    onFormatChange={(id, f) => updateItem(id, { format: f })}
                    onSettingsChange={(id, s) =>
                      updateItem(id, { settings: s })
                    }
                    onNameChange={(id, n) => updateItem(id, { customName: n })}
                    onCompare={(data) => setActiveCompare(data)}
                    onConvert={handleConvertItem}
                  />
                </div>
              </div>
              <div className="flex-shrink-0 pt-6 mt-2 border-t border-black/[0.04]">
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
