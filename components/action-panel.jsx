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
      <div className="flex justify-center gap-3 w-full">
        <button
          onClick={onDownloadAll}
          className="apple-button flex items-center gap-2 px-8"
        >
          <Archive size={16} />
          <span>Save All</span>
        </button>
        <button onClick={onConvertMore} className="apple-button-secondary px-8">
          New Session
        </button>
      </div>
    );
  }

  if (queue.length > 0 && !isProcessing) {
    return (
      <div className="flex justify-center w-full">
        <button
          onClick={onConvertAll}
          className="apple-button px-10 py-3 text-sm flex items-center gap-2"
        >
          <span>Transform Now</span>
          <PlayCircle size={18} />
        </button>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex justify-center w-full">
        <button
          disabled
          className="apple-button-secondary px-12 py-3.5 opacity-50 cursor-not-allowed animate-pulse"
        >
          Processing...
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-3 w-full max-w-xl mx-auto">
      <button
        onClick={() => onQuickAction(ConversionFormat.TO_WEBP)}
        className="apple-button-secondary flex items-center gap-2.5 py-2.5 px-6"
      >
        <Image size={15} strokeWidth={2.5} className="text-blue-500" />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          Image
        </span>
      </button>
      <button
        onClick={() => onQuickAction(ConversionFormat.TO_MP4)}
        className="apple-button-secondary flex items-center gap-2.5 py-2.5 px-6"
      >
        <Video size={15} strokeWidth={2.5} className="text-purple-500" />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          Video
        </span>
      </button>
      <button
        onClick={() => onQuickAction(ConversionFormat.TO_MP3)}
        className="apple-button-secondary flex items-center gap-2.5 py-2.5 px-6"
      >
        <Music size={15} strokeWidth={2.5} className="text-red-500" />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          Audio
        </span>
      </button>
    </div>
  );
};
