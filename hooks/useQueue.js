import { useState, useEffect, useCallback } from "react";
import { AppState } from "@/lib/config";

export const useQueue = (addToast) => {
  const [appState, setAppState] = useState(AppState.IDLE);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("morpho_history");
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  const addToHistory = useCallback((item) => {
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
  }, []);

  const updateItem = useCallback((id, updates) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        // Only reset to idle if user CHANGED something but didn't provide a terminal status
        const isTerminalUpdate =
          updates.status === "success" || updates.status === "error";
        const needsReset =
          !isTerminalUpdate &&
          (updates.format || updates.settings || updates.customName);

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
  }, []);

  const removeItem = useCallback((id) => {
    setQueue((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (updated.length === 0) setAppState(AppState.IDLE);
      return updated;
    });
  }, []);

  const resetQueue = useCallback(() => {
    setQueue([]);
    setAppState(AppState.IDLE);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem("morpho_history");
  }, []);

  return {
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
  };
};
