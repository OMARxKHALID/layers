"use client";

import { useConversion } from "@/hooks/useConversion";
import { useQueue } from "@/hooks/useQueue";

export function useAppLogic() {
  const {
    queue,
    updateItem,
    removeItem,
    resetQueue,
    history,
    addToHistory,
    appState,
    setAppState,
  } = useQueue();
  const {
    isProcessing,
    handleConvertItem,
    handleConvertAll,
    handleCancelItem,
  } = useConversion(queue, updateItem, null, addToHistory);

  return {
    queue,
    updateItem,
    removeItem,
    resetQueue,
    history,
    addToHistory,
    appState,
    setAppState,
    isProcessing,
    handleConvertItem,
    handleConvertAll,
    handleCancelItem,
  };
}
