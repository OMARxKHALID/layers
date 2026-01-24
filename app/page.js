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
import { ToastContainer } from "@/components/toast";
import { HeroSection } from "@/components/hero-section";
import { TransformationWorkspace } from "@/components/transformation-workspace";
import { Plus } from "lucide-react";
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
    zipFileName: "Layers_bundle.zip",
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
      const result = await downloadAsZip(zipItems);
      if (result.status === "error") {
        addToast(`Archive failed: ${result.error}`, "error");
      } else {
        addToast("Download started", "success");
      }
    } catch (e) {
      addToast("Archive failed", "error");
    }
  };

  const allSuccess = queue.length && queue.every((q) => q.status === "success");

  return (
    <div className="h-screen w-screen flex flex-col text-gray-900 overflow-hidden relative selection:bg-black/5">
      {isGlobalDragging && (
        <div className="fixed inset-0 z-[2000] bg-white/40 backdrop-blur-xl m-6 rounded-[3rem] pointer-events-none flex flex-col items-center justify-center animate-liquid border border-white/40">
          <div className="w-20 h-20 bg-white/60 rounded-full flex items-center justify-center mb-6 border border-white/60">
            <Plus size={40} className="text-gray-800" strokeWidth={1.5} />
          </div>
          <p className="text-xl md:text-2xl font-medium text-gray-800 tracking-tight">
            Drop to Transform
          </p>
        </div>
      )}
      <ToastContainer toasts={toasts} />
      <Header onReset={resetQueue} onOpenHistory={() => setShowHistory(true)} />

      <main className="flex-grow flex flex-col items-center px-4 md:px-6 relative z-10 overflow-hidden pb-6">
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center flex-grow overflow-hidden">
          {appState === AppState.IDLE ? (
            <HeroSection onFilesSelect={handleFilesSelect} />
          ) : (
            <TransformationWorkspace
              queue={queue}
              isProcessing={isProcessing}
              allSuccess={allSuccess}
              onAddMore={() => addMoreInputRef.current?.click()}
              onRemoveItem={removeItem}
              onCancelItem={handleCancelItem}
              onUpdateItem={updateItem}
              onConvertItem={handleConvertItem}
              onConvertAll={handleConvertAll}
              onResetQueue={resetQueue}
              onDownloadAll={handleDownloadAll}
              onCompare={(data) => setActiveCompare(data)}
              addMoreInputRef={addMoreInputRef}
              handleFilesSelect={handleFilesSelect}
            />
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
