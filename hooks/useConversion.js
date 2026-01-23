import { useState, useCallback } from "react";

export const useConversion = (queue, updateItem, addToast, addToHistory) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const pollJobStatus = useCallback(
    (jobId, itemId) => {
      return new Promise((resolve, reject) => {
        const poll = setInterval(async () => {
          try {
            const res = await fetch(`/api/jobs/${jobId}`);
            const data = await res.json();

            if (data.status === "processing") {
              updateItem(itemId, {
                progress: Math.max(10, data.progress || 10),
              });
            } else if (data.status === "done") {
              clearInterval(poll);

              let resultItem = null;
              // Note: We need the latest item from the queue to construct the final success state correctly
              // But hooks can be tricky with stale closures if queue is passed as-is.
              // We use functional update in updateItem but here we are constructing a resultItem for history.

              // To be safe, we'll fetch the most recent item using a getter-like approach if needed,
              // but for now, we'll rely on updateItem's internal setQueue and handle history there or separately.

              // Actually, we can just construct the result from the data returned
              // and trigger another update.
              resolve(data);
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
        updateItem(itemId, { status: "error", errorMsg: err.message });
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

    for (const item of itemsToProcess) {
      // Small delay to prevent hitting API instantly for many files if needed,
      // but sequential processing here is already safe.
      await handleConvertItem(item.id);
    }

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
