import React from "react";
import { PlayCircle, Archive } from "lucide-react";

export const ActionPanel = ({
  queue,
  isProcessing,
  onConvertAll,
  onConvertMore,
  onDownloadAll,
}) => {
  const allSuccess =
    queue.length > 0 && queue.every((q) => q.status === "success");

  if (allSuccess) {
    return (
      <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 w-full animate-soft sm:flex-nowrap">
        <button
          onClick={onDownloadAll}
          className="btn-primary flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3"
        >
          <Archive size={16} />
          <span>Save All</span>
        </button>
        <button
          onClick={onConvertMore}
          className="btn-minimal px-6 py-2.5 sm:py-3"
        >
          New Session
        </button>
      </div>
    );
  }

  if (queue.length > 0 && !isProcessing) {
    return (
      <div className="flex justify-center w-full animate-soft">
        <button
          onClick={onConvertAll}
          className="btn-primary px-10 py-3 text-sm flex items-center gap-2"
        >
          <span>Convert Files</span>
          <PlayCircle size={18} />
        </button>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex justify-center w-full animate-soft">
        <button
          disabled
          className="btn-minimal px-12 py-3 cursor-not-allowed border-gray-200/50"
        >
          <span className="animate-pulse text-gray-900 font-bold">
            Processing...
          </span>
        </button>
      </div>
    );
  }

  return null;
};
