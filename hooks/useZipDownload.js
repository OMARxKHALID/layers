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
    setProgress({ status: "idle", error: null });
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
        const formData = new FormData();
        const serverItems = [];

        for (const item of items) {
          if (item.downloadUrl?.startsWith("blob:")) {
            try {
              const res = await fetch(item.downloadUrl);
              const blob = await res.blob();
              formData.append("files", blob, item.fileName);
            } catch (e) {
              console.warn("Failed to fetch local blob", item);
            }
          } else if (item.jobId) {
            serverItems.push(item);
          }
        }

        if (serverItems.length > 0) {
          formData.append("serverItems", JSON.stringify(serverItems));
        }

        const response = await fetch("/api/download-all", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          let errorMsg = "Failed to generate zip";
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch (e) {
            /* ignore non-json */
          }
          throw new Error(errorMsg);
        }

        const blob = await response.blob();
        if (blob.size === 0) throw new Error("Received empty archive");

        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = zipFileName;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

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

  return { downloadAsZip, progress, isDownloading, reset };
}

export default useZipDownload;
