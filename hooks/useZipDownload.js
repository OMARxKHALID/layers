"use client";

import { useState, useCallback } from "react";

export function useZipDownload(options = {}) {
  const { zipFileName = "morpho_bundle.zip" } = options;

  const [progress, setProgress] = useState({
    status: "idle",
    error: null,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const reset = useCallback(() => {
    setProgress({
      status: "idle",
      error: null,
    });
    setIsDownloading(false);
  }, []);

  const downloadAsZip = useCallback(
    async (items) => {
      if (!items || items.length === 0) {
        setProgress({ status: "error", error: "No files to download" });
        return;
      }

      setIsDownloading(true);
      setProgress({ status: "zipping", error: null });

      try {
        const response = await fetch("/api/download-all", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate zip");
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = zipFileName;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

        setProgress({ status: "done", error: null });
      } catch (error) {
        setProgress({
          status: "error",
          error: error.message || "Failed to download zip",
        });
      } finally {
        setIsDownloading(false);
      }
    },
    [zipFileName],
  );

  return {
    downloadAsZip,
    progress,
    isDownloading,
    reset,
  };
}

export default useZipDownload;
