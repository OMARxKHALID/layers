"use client";

import { useState, useEffect, useCallback } from "react";
import { AppState } from "@/lib/config";

export const useQueue = (addToast) => {
  const [appState, setAppState] = useState(AppState.IDLE);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (queue.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [queue]);

  useEffect(() => {
    const stored = localStorage.getItem("layers_history");
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const addToHistory = useCallback((item) => {
    const targetOption = item.availableOptions.find(
      (o) => o.id === item.format,
    );
    const targetExt = targetOption?.targetExt || "file";
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
      localStorage.setItem("layers_history", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateItem = useCallback((id, updates) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const isTerminalUpdate =
          updates.status === "success" || updates.status === "error";
        const isNamingOnlyOnSuccess =
          item.status === "success" &&
          updates.customName &&
          !updates.format &&
          !updates.settings;

        const needsReset =
          !isTerminalUpdate &&
          !isNamingOnlyOnSuccess &&
          (updates.format || updates.settings || updates.customName);

        if (isNamingOnlyOnSuccess && item.downloadUrl) {
          try {
            const url = new URL(item.downloadUrl, window.location.origin);
            url.searchParams.set("filename", updates.customName);
            updates.downloadUrl = url.pathname + url.search;
          } catch (e) {
            // Fallback if URL is invalid
          }
        }

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

  const removeItem = useCallback(
    (id) => {
      setQueue((prev) => {
        const itemToRemove = prev.find((i) => i.id === id);
        const updated = prev.filter((item) => item.id !== id);
        if (updated.length === 0) setAppState(AppState.IDLE);
        if (itemToRemove) {
          addToast(
            `Removed ${itemToRemove.customName || itemToRemove.file.name}`,
          );
        }
        return updated;
      });
    },
    [setAppState, addToast],
  );

  const resetQueue = useCallback(() => {
    setQueue([]);
    setAppState(AppState.IDLE);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem("layers_history");
    addToast("History cleared", "info");
  }, [addToast]);

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
