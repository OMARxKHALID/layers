"use client";

import { useState, useCallback } from "react";
import JSZip from "jszip";

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
        const zip = new JSZip();
        const serverItems = [];
        let hasLocalFiles = false;

        // Process all items
        for (const item of items) {
          if (item.downloadUrl?.startsWith("blob:")) {
            try {
              const res = await fetch(item.downloadUrl);
              const blob = await res.blob();
              zip.file(item.fileName, blob);
              hasLocalFiles = true;
            } catch (e) {
              console.warn("Failed to fetch local blob", item);
            }
          } else if (item.jobId) {
            serverItems.push(item);
          }
        }

        let finalBlob;

        // If we have mixed or only server items, we might still need the server
        // BUT, if we have server items, we should fetch them too to zip locally
        // OR if many server items, use the server's zip endpoint.
        // For simplicity and best performance, let's fetch server files and zip locally if possible
        // to keep the logic consistent and avoid complex hybrid multipart uploads.

        if (serverItems.length > 0) {
          await Promise.all(
            serverItems.map(async (item) => {
              try {
                const res = await fetch(item.downloadUrl);
                if (!res.ok) throw new Error("Server file fetch failed");
                const blob = await res.blob();
                zip.file(item.fileName, blob);
                hasLocalFiles = true;
              } catch (e) {
                console.warn(
                  "Failed to fetch server file for local zipping",
                  item,
                );
              }
            }),
          );
        }

        if (!hasLocalFiles && serverItems.length === 0) {
          throw new Error("No files available for zipping");
        }

        // Generate zip locally
        finalBlob = await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        });

        const blobUrl = URL.createObjectURL(finalBlob);
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
