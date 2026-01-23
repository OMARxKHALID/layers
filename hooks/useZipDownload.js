"use client";

import { useState, useCallback } from "react";

export function useZipDownload(options = {}) {
  const { zipFileName = "layers_bundle.zip" } = options;

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
          let errorMsg = "Failed to generate zip";
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch (e) {
            // Not JSON
          }
          throw new Error(errorMsg);
        }

        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error("Received empty archive");
        }

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

        const successState = { status: "done", error: null };
        setProgress(successState);
        return successState;
      } catch (error) {
        const errorState = {
          status: "error",
          error: error.message || "Failed to download zip",
        };
        setProgress(errorState);
        return errorState;
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
