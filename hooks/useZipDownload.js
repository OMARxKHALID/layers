"use client";

import { useState, useCallback } from "react";
import JSZip from "jszip";

export function useZipDownload(options = {}) {
  const { zipFileName = "morpho_bundle.zip", fetchTimeout = 30000 } = options;

  const [progress, setProgress] = useState({
    status: "idle",
    fetchProgress: 0,
    zipProgress: 0,
    totalProgress: 0,
    error: null,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const reset = useCallback(() => {
    setProgress({
      status: "idle",
      fetchProgress: 0,
      zipProgress: 0,
      totalProgress: 0,
      error: null,
    });
    setIsDownloading(false);
  }, []);

  const fetchWithTimeout = async (url, timeout) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      return await response.blob();
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const downloadAsZip = useCallback(
    async (items) => {
      if (!items || items.length === 0) {
        setProgress((prev) => ({
          ...prev,
          status: "error",
          error: "No files to download",
        }));
        return;
      }

      setIsDownloading(true);
      setProgress({
        status: "fetching",
        fetchProgress: 0,
        zipProgress: 0,
        totalProgress: 0,
        error: null,
      });

      const zip = new JSZip();
      let blobUrl = null;

      try {
        const totalItems = items.length;

        for (let i = 0; i < totalItems; i++) {
          const item = items[i];

          try {
            const blob = await fetchWithTimeout(item.downloadUrl, fetchTimeout);
            zip.file(item.fileName, blob);
          } catch (fetchError) {
            console.warn(`Failed to fetch ${item.fileName}:`, fetchError);
          }

          const fetchProgress = Math.round(((i + 1) / totalItems) * 100);
          setProgress((prev) => ({
            ...prev,
            fetchProgress,
            totalProgress: Math.round(fetchProgress * 0.5),
          }));
        }

        setProgress((prev) => ({
          ...prev,
          status: "zipping",
        }));

        const zipBlob = await zip.generateAsync(
          {
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 6 },
          },
          (metadata) => {
            const zipProgress = Math.round(metadata.percent);
            setProgress((prev) => ({
              ...prev,
              zipProgress,
              totalProgress: 50 + Math.round(zipProgress * 0.5),
            }));
          },
        );

        blobUrl = URL.createObjectURL(zipBlob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = zipFileName;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setProgress({
          status: "done",
          fetchProgress: 100,
          zipProgress: 100,
          totalProgress: 100,
          error: null,
        });
      } catch (error) {
        setProgress((prev) => ({
          ...prev,
          status: "error",
          error: error.message || "Failed to create ZIP",
        }));
      } finally {
        if (blobUrl) {
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
          }, 1000);
        }
        setIsDownloading(false);
      }
    },
    [zipFileName, fetchTimeout],
  );

  return {
    downloadAsZip,
    progress,
    isDownloading,
    reset,
  };
}

export async function createAndDownloadZip(
  items,
  zipFileName = "morpho_bundle.zip",
  onProgress,
) {
  if (!items || items.length === 0) {
    throw new Error("No files to download");
  }

  const zip = new JSZip();
  let blobUrl = null;

  try {
    const totalItems = items.length;
    for (let i = 0; i < totalItems; i++) {
      const item = items[i];
      const response = await fetch(item.downloadUrl);
      if (!response.ok) throw new Error(`Failed to fetch ${item.fileName}`);
      const blob = await response.blob();
      zip.file(item.fileName, blob);

      if (onProgress) {
        onProgress(Math.round(((i + 1) / totalItems) * 50));
      }
    }

    const zipBlob = await zip.generateAsync(
      {
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      },
      (metadata) => {
        if (onProgress) {
          onProgress(50 + Math.round(metadata.percent * 0.5));
        }
      },
    );

    blobUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = zipFileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onProgress) onProgress(100);
  } finally {
    if (blobUrl) {
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    }
  }
}

export default useZipDownload;
