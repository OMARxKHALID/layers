"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AppState, CONVERSION_OPTIONS } from "@/lib/config";
import { getMimeType } from "@/utils/file-utils";
import { useZipDownload } from "@/hooks/useZipDownload";

import { Header } from "@/components/header";
import { DropZone } from "@/components/drop-zone";
import { QueueList } from "@/components/queue-list";
import { ActionPanel } from "@/components/action-panel";
import { HistoryModal } from "@/components/history-modal";
import { ToastContainer } from "@/components/toast";
import { CompareView } from "@/components/compare-view";

export default function Home() {
  const [appState, setAppState] = useState(AppState.IDLE);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [activeCompare, setActiveCompare] = useState(null);

  const pendingActionFormat = useRef(null);
  const addMoreInputRef = useRef(null);

  const addToast = useCallback((message, type = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("morpho_history");
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  const addToHistory = (item) => {
    const targetExt =
      item.availableOptions.find((o) => o.id === item.format)?.targetExt ||
      "file";
    const displayName = item.customName || item.file.name;
    const nameStem = displayName.split(".")[0];

    const newEntry = {
      id: crypto.randomUUID(),
      fileName: `${nameStem}.${targetExt}`,
      format: targetExt,
      date: new Date().toLocaleDateString(),
      size: item.file.size,
      downloadUrl: item.downloadUrl,
    };

    setHistory((prev) => {
      const updated = [newEntry, ...prev].slice(0, 20);
      localStorage.setItem("morpho_history", JSON.stringify(updated));
      return updated;
    });
  };

  const getFileMetadata = (file) => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) return resolve({});
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => resolve({});
      img.src = URL.createObjectURL(file);
    });
  };

  const suggestFormat = (mime, file) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (mime.startsWith("image/")) {
      if (ext === "webp") return "to-jpg"; // Already webp, suggest jpg
      return "to-webp";
    }
    if (mime.startsWith("video/")) {
      if (ext === "mp4") return "to-webm"; // Already mp4, suggest webm
      return "to-mp4";
    }
    if (mime.startsWith("audio/")) {
      if (ext === "mp3") return "to-wav"; // Already mp3, suggest wav
      return "to-mp3";
    }
    return null;
  };

  const handleFilesSelect = async (files) => {
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
  };

  const updateItem = (id, updates) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const needsReset =
          updates.format || updates.settings || updates.customName;
        return {
          ...item,
          ...updates,
          ...(needsReset && {
            status: "idle",
            errorMsg: undefined,
            progress: 0,
          }),
        };
      }),
    );
  };

  const pollJobStatus = (jobId, itemId) => {
    return new Promise((resolve, reject) => {
      const poll = setInterval(async () => {
        try {
          const res = await fetch(`/api/jobs/${jobId}`);
          const data = await res.json();

          if (data.status === "processing") {
            updateItem(itemId, { progress: Math.max(10, data.progress || 10) });
          } else if (data.status === "done") {
            clearInterval(poll);

            let resultItem = null;
            setQueue((q) => {
              const item = q.find((i) => i.id === itemId);
              if (!item) return q;

              const targetExt =
                data.targetExt ||
                item.availableOptions.find((o) => o.id === item.format)
                  ?.targetExt ||
                "file";

              const parts = item.customName.split(".");
              const nameStem =
                parts.length > 1
                  ? parts.slice(0, -1).join(".")
                  : item.customName;
              const newName = `${nameStem}.${targetExt}`;
              const downloadUrl = `${data.downloadUrl}?filename=${encodeURIComponent(newName)}`;

              resultItem = {
                ...item,
                status: "success",
                progress: 100,
                downloadUrl,
                customName: newName,
              };

              addToast(`${newName} ready!`, "success");
              addToHistory(resultItem);

              return q.map((i) => (i.id === itemId ? resultItem : i));
            });

            // Wait for state update to settle if needed, or just return result
            resolve(resultItem);
          } else if (data.status === "cancelled") {
            clearInterval(poll);
            updateItem(itemId, { status: "idle", progress: 0 });
            addToast("Conversion cancelled", "info");
            resolve(null);
          } else if (data.status === "error") {
            clearInterval(poll);
            updateItem(itemId, { status: "error", errorMsg: data.error });
            addToast(`Failed: ${data.error}`, "error");
            reject(new Error(data.error));
          }
        } catch (e) {
          clearInterval(poll);
          reject(e);
        }
      }, 1000);
    });
  };

  const handleConvertAll = async () => {
    const itemsToProcess = queue.filter(
      (q) => q.status === "idle" || q.status === "error",
    );
    if (!itemsToProcess.length) return;

    setIsProcessing(true);

    for (const item of itemsToProcess) {
      if (!item.format) continue;

      // Ensure we have the latest item state from the queue
      const currentItem = await new Promise((resolve) => {
        setQueue((q) => {
          const found = q.find((i) => i.id === item.id);
          resolve(found);
          return q;
        });
      });

      if (!currentItem || currentItem.status === "success") continue;

      updateItem(currentItem.id, {
        status: "uploading",
        progress: 5,
        errorMsg: undefined,
      });

      try {
        const formData = new FormData();
        formData.append("file", currentItem.file);
        formData.append("conversionType", currentItem.format);
        formData.append("settings", JSON.stringify(currentItem.settings));

        const res = await fetch("/api/convert", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Upload failed");
        }

        const { jobId } = await res.json();
        updateItem(currentItem.id, {
          jobId,
          status: "converting",
          progress: 10,
        });

        // Await the job completion before starting the next one
        await pollJobStatus(jobId, currentItem.id);
      } catch (err) {
        console.error("Conversion failed for", currentItem.id, err);
        updateItem(currentItem.id, { status: "error", errorMsg: err.message });
        // We continue to next item even if one fails
      }
    }

    setIsProcessing(false);
  };

  const handleCancelItem = async (itemId) => {
    const item = queue.find((i) => i.id === itemId);
    if (!item || !item.jobId) {
      updateItem(itemId, { status: "idle", progress: 0 });
      return;
    }

    try {
      await fetch(`/api/jobs/${item.jobId}/cancel`, { method: "POST" });
      updateItem(itemId, { status: "idle", progress: 0, jobId: null });
    } catch (e) {
      addToast("Cancel failed", "error");
    }
  };

  const { downloadAsZip, progress: zipProgress } = useZipDownload({
    zipFileName: "morpho_bundle.zip",
  });

  const handleDownloadAll = async () => {
    const items = queue.filter((q) => q.status === "success" && q.downloadUrl);
    if (!items.length) return;

    addToast("Creating archive...");

    const zipItems = items.map((item) => {
      // Name is already updated with extension in the poll completion
      return {
        fileName: item.customName,
        downloadUrl: item.downloadUrl,
      };
    });

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

  const handleReset = () => {
    setQueue([]);
    setAppState(AppState.IDLE);
    setIsProcessing(false);
  };

  const allSuccess = queue.length && queue.every((q) => q.status === "success");

  return (
    <div className="h-screen w-screen flex flex-col text-gray-900 overflow-hidden">
      <ToastContainer toasts={toasts} />
      <Header
        onReset={handleReset}
        onOpenHistory={() => setShowHistory(true)}
      />

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
                  onRemove={(id) => {
                    const n = queue.filter((i) => i.id !== id);
                    setQueue(n);
                    if (!n.length) handleReset();
                  }}
                  onCancel={handleCancelItem}
                  onFormatChange={(id, f) => updateItem(id, { format: f })}
                  onSettingsChange={(id, s) => updateItem(id, { settings: s })}
                  onNameChange={(id, n) => updateItem(id, { customName: n })}
                  onCompare={(data) => setActiveCompare(data)}
                />
              </div>
              <div className="flex-shrink-0 pt-4 border-t border-black/[0.03] mt-3">
                <ActionPanel
                  queue={queue}
                  isProcessing={isProcessing}
                  onConvertAll={handleConvertAll}
                  onConvertMore={handleReset}
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
          onClear={() => {
            setHistory([]);
            localStorage.removeItem("morpho_history");
          }}
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
