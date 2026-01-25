"use client";

import { useState, useCallback } from "react";
import { getFriendlyErrorMessage } from "@/utils/error-utils";
import { ClientConverterFactory } from "@/lib/client-converters";
import { ExecutionMode } from "@/lib/config";

const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const POLL_INTERVAL_MS = 1000;

export const useConversion = (
  queue,
  updateItem,
  addToast,
  addToHistory,
  executionMode,
) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const pollJobStatus = useCallback(
    (jobId, itemId) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkStatus = async () => {
          if (Date.now() - startTime > POLL_TIMEOUT_MS) {
            const msg = "Conversion timed out";
            updateItem(itemId, { status: "error", errorMsg: msg });
            reject(new Error(msg));
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

            switch (data.status) {
              case "processing":
                updateItem(itemId, {
                  progress: Math.max(10, data.progress || 10),
                });
                setTimeout(checkStatus, POLL_INTERVAL_MS);
                break;
              case "done":
                resolve(data);
                break;
              case "cancelled":
                updateItem(itemId, { status: "idle", progress: 0 });
                addToast("Conversion cancelled", "info");
                resolve(null);
                break;
              case "error":
                const friendlyMsg = getFriendlyErrorMessage(data.error);
                updateItem(itemId, { status: "error", errorMsg: friendlyMsg });
                addToast(friendlyMsg, "error");
                reject(new Error(friendlyMsg));
                break;
              default:
                setTimeout(checkStatus, POLL_INTERVAL_MS);
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

  const processClientConversion = async (item, startTime, modeLabel) => {
    const targetExt = item.format.replace("to-", "");
    const converter = ClientConverterFactory.getConverter(
      item.file.name,
      targetExt,
    );

    updateItem(item.id, { status: "uploading", progress: 0 });

    const result = await converter.convert(
      item.file,
      targetExt,
      item.settings,
      (progress) => updateItem(item.id, { progress }),
    );

    const parts = item.customName.split(".");
    const nameStem =
      parts.length > 1 ? parts.slice(0, -1).join(".") : item.customName;
    const newName = `${nameStem}.${result.targetExt}`;

    const blob = await fetch(result.downloadUrl).then((r) => r.blob());
    const downloadUrl = URL.createObjectURL(
      new File([blob], newName, { type: blob.type }),
    );

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

    const resultItem = {
      ...item,
      status: "success",
      progress: 100,
      downloadUrl,
      outputName: newName,
      elapsedTime,
      modeUsed: modeLabel,
    };

    updateItem(item.id, resultItem);
    addToast(`${newName} ready! (${elapsedTime}s)`, "success");
    addToHistory(resultItem);
  };

  const processServerConversion = async (item, startTime, modeLabel) => {
    updateItem(item.id, { status: "uploading", progress: 5 });

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
    updateItem(item.id, {
      jobId,
      status: "converting",
      progress: 10,
    });

    const data = await pollJobStatus(jobId, item.id);

    if (data && data.status === "done") {
      const targetExt =
        data.targetExt ||
        item.availableOptions.find((o) => o.id === item.format)?.targetExt ||
        "file";
      const parts = item.customName.split(".");
      const nameStem =
        parts.length > 1 ? parts.slice(0, -1).join(".") : item.customName;
      const newName = `${nameStem}.${targetExt}`;
      const downloadUrl = `${data.downloadUrl}?filename=${encodeURIComponent(newName)}`;

      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

      const resultItem = {
        ...item,
        jobId,
        status: "success",
        progress: 100,
        downloadUrl,
        outputName: newName,
        elapsedTime,
        modeUsed: modeLabel,
      };

      updateItem(item.id, resultItem);
      addToast(`${newName} ready!`, "success");
      addToHistory(resultItem);
    }
  };

  const handleConvertItem = useCallback(
    async (itemId) => {
      const item = queue.find((i) => i.id === itemId);
      if (!item || !item.format || isProcessing) return;

      const startTime = Date.now();
      const modeLabel =
        executionMode === ExecutionMode.CLIENT ? "Device" : "Cloud";

      updateItem(itemId, {
        status: "converting",
        progress: 5,
        errorMsg: undefined,
        startTime,
        modeUsed: modeLabel,
      });

      try {
        if (executionMode === ExecutionMode.CLIENT) {
          await processClientConversion(item, startTime, modeLabel);
        } else {
          await processServerConversion(item, startTime, modeLabel);
        }
      } catch (err) {
        console.error("Conversion failed for", itemId, err);
        const friendlyMsg = getFriendlyErrorMessage(err);
        updateItem(itemId, {
          status: "error",
          errorMsg: friendlyMsg,
          modeUsed: modeLabel,
        });
        addToast(friendlyMsg, "error");
      }
    },
    [
      queue,
      isProcessing,
      updateItem,
      addToast,
      addToHistory,
      executionMode,
      pollJobStatus,
    ],
  );

  const handleConvertAll = useCallback(async () => {
    const itemsToProcess = queue.filter(
      (q) => q.status === "idle" || q.status === "error",
    );
    if (!itemsToProcess.length) return;

    setIsProcessing(true);
    await Promise.all(itemsToProcess.map((item) => handleConvertItem(item.id)));
    setIsProcessing(false);
  }, [queue, handleConvertItem]);

  const handleCancelItem = useCallback(
    async (itemId) => {
      const item = queue.find((i) => i.id === itemId);
      updateItem(itemId, { status: "idle", progress: 0 });

      if (executionMode === ExecutionMode.SERVER && item?.jobId) {
        try {
          await fetch(`/api/jobs/${item.jobId}/cancel`, { method: "POST" });
        } catch (e) {
          // Ignore
        }
      }
      addToast("Conversion cancelled", "info");
    },
    [queue, updateItem, addToast, executionMode],
  );

  return {
    isProcessing,
    setIsProcessing,
    handleConvertItem,
    handleConvertAll,
    handleCancelItem,
  };
};
