"use client";

import { useState, useCallback } from "react";
import { getFriendlyErrorMessage } from "@/utils/error-utils";

export const useConversion = (queue, updateItem, addToast, addToHistory) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const pollJobStatus = useCallback(
    (jobId, itemId) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

        const checkStatus = async () => {
          if (Date.now() - startTime > TIMEOUT_MS) {
            updateItem(itemId, { status: "error", errorMsg: "Timed out" });
            reject(new Error("Conversion timed out"));
            return;
          }

          try {
            const res = await fetch(`/api/jobs/${jobId}`);
            if (!res.ok) {
              const msg = `Server check failed (${res.status})`;
              updateItem(itemId, { status: "error", errorMsg: msg });
              reject(new Error(msg));
              return;
            }

            const data = await res.json();

            if (data.status === "processing") {
              updateItem(itemId, {
                progress: Math.max(10, data.progress || 10),
              });
              setTimeout(checkStatus, 1000);
            } else if (data.status === "done") {
              resolve(data);
            } else if (data.status === "cancelled") {
              updateItem(itemId, { status: "idle", progress: 0 });
              addToast("Conversion cancelled", "info");
              resolve(null);
            } else if (data.status === "error") {
              const friendlyMsg = getFriendlyErrorMessage(data.error);
              updateItem(itemId, { status: "error", errorMsg: friendlyMsg });
              addToast(friendlyMsg, "error");
              reject(new Error(friendlyMsg));
            } else {
              // Fallback for pending or unknown states
              setTimeout(checkStatus, 1000);
            }
          } catch (e) {
            reject(e);
          }
        };

        checkStatus();
      });
    },
    [updateItem, addToast],
  );

  const handleConvertItem = useCallback(
    async (itemId) => {
      // We need to find the item in the current queue
      // Since this is inside a hook, we should be careful about stale 'queue'
      // But usually this is called from an event handler where queue should be relatively fresh
      const item = queue.find((i) => i.id === itemId);
      if (!item || !item.format || isProcessing) return;

      updateItem(itemId, {
        status: "uploading",
        progress: 5,
        errorMsg: undefined,
      });

      try {
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("conversionType", item.format);
        formData.append("settings", JSON.stringify(item.settings));

        const res = await fetch("/api/convert", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Upload failed");
        }

        const { jobId } = await res.json();
        updateItem(itemId, {
          jobId,
          status: "converting",
          progress: 10,
        });

        const data = await pollJobStatus(jobId, itemId);

        if (data && data.status === "done") {
          const targetExt =
            data.targetExt ||
            item.availableOptions.find((o) => o.id === item.format)
              ?.targetExt ||
            "file";
          const parts = item.customName.split(".");
          const nameStem =
            parts.length > 1 ? parts.slice(0, -1).join(".") : item.customName;
          const newName = `${nameStem}.${targetExt}`;
          const downloadUrl = `${data.downloadUrl}?filename=${encodeURIComponent(newName)}`;

          const resultItem = {
            ...item,
            jobId,
            status: "success",
            progress: 100,
            downloadUrl,
            customName: newName,
          };

          updateItem(itemId, resultItem);
          addToast(`${newName} ready!`, "success");
          addToHistory(resultItem);
        }
      } catch (err) {
        console.error("Conversion failed for", itemId, err);
        const friendlyMsg = getFriendlyErrorMessage(err);
        updateItem(itemId, { status: "error", errorMsg: friendlyMsg });
      }
    },
    [queue, isProcessing, updateItem, pollJobStatus, addToast, addToHistory],
  );

  const handleConvertAll = useCallback(async () => {
    const itemsToProcess = queue.filter(
      (q) => q.status === "idle" || q.status === "error",
    );
    if (!itemsToProcess.length) return;

    setIsProcessing(true);

    // Trigger all items in parallel.
    // The server-side queue management (MAX_CONCURRENT_JOBS = 3) will handle the throttling.
    await Promise.all(itemsToProcess.map((item) => handleConvertItem(item.id)));

    setIsProcessing(false);
  }, [queue, handleConvertItem]);

  const handleCancelItem = useCallback(
    async (itemId) => {
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
    },
    [queue, updateItem, addToast],
  );

  return {
    isProcessing,
    setIsProcessing,
    handleConvertItem,
    handleConvertAll,
    handleCancelItem,
  };
};
