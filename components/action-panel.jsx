import React from "react";
import { PlayCircle, Archive, Image, Music, Video } from "lucide-react";
import { ConversionFormat } from "@/lib/config";

export const ActionPanel = ({
  queue,
  isProcessing,
  onConvertAll,
  onConvertMore,
  onDownloadAll,
  onQuickAction,
}) => {
  const allSuccess =
    queue.length > 0 && queue.every((q) => q.status === "success");

  if (allSuccess) {
    return (
      <div className="flex justify-center gap-3 w-full animate-soft">
        <button
          onClick={onDownloadAll}
          className="btn-primary flex items-center gap-2 px-8"
        >
          <Archive size={16} />
          <span>Save All</span>
        </button>
        <button onClick={onConvertMore} className="btn-minimal px-6">
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
          <span>Morph Files</span>
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
          className="btn-minimal px-12 py-3 opacity-60 cursor-not-allowed"
        >
          <span className="animate-pulse">Processing...</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 w-full max-w-lg mx-auto animate-soft">
      <button
        onClick={() => onQuickAction(ConversionFormat.TO_WEBP)}
        className="btn-minimal flex items-center gap-2 text-gray-900"
      >
        <Image size={16} strokeWidth={2.5} />
        <span className="font-medium">Image</span>
      </button>
      <button
        onClick={() => onQuickAction(ConversionFormat.TO_MP4)}
        className="btn-minimal flex items-center gap-2 text-gray-900"
      >
        <Video size={16} strokeWidth={2.5} />
        <span className="font-medium">Video</span>
      </button>
      <button
        onClick={() => onQuickAction(ConversionFormat.TO_MP3)}
        className="btn-minimal flex items-center gap-2 text-gray-900"
      >
        <Music size={16} strokeWidth={2.5} />
        <span className="font-medium">Audio</span>
      </button>
    </div>
  );
};
