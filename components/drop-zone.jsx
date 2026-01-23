import React, { useCallback, useState } from "react";
import { validateFile } from "@/utils/file-utils";

export const DropZone = ({ onFilesSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault();
      if (disabled) return;
      setIsDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFilesSelect(Array.from(e.dataTransfer.files));
      }
    },
    [onFilesSelect, disabled],
  );

  const handleFileInput = useCallback(
    (e) => {
      if (disabled) return;
      if (e.target.files && e.target.files.length > 0) {
        onFilesSelect(Array.from(e.target.files));
        e.target.value = "";
      }
    },
    [onFilesSelect, disabled],
  );

  return (
    <div className="w-full flex justify-center px-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() =>
          !disabled && document.getElementById("file-upload")?.click()
        }
        className={`
          glass-card
          relative w-full max-w-xl h-[240px] rounded-[2rem] flex flex-col items-center justify-center
          cursor-pointer transition-all duration-700 ease-in-out noise overflow-hidden
          ${isDragging ? "bg-white/80 scale-[1.02] border-blue-200/50 shadow-2xl" : "shadow-xl border-white/50"}
          ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
          ${error ? "bg-red-50/10 border-red-200/50" : ""}
        `}
      >
        <input
          id="file-upload"
          type="file"
          className="hidden"
          multiple
          onChange={handleFileInput}
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-4 px-10 text-center relative z-10">
          {error ? (
            <p className="text-red-500 font-bold text-[14px] animate-pulse uppercase tracking-widest pixel-font">
              {error}
            </p>
          ) : (
            <>
              <div className="w-20 h-20 flex items-center justify-center rounded-[1.75rem] bg-white/30 border border-white/40 mb-1 group-hover:scale-110 transition-transform duration-700 shadow-inner">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-500 relative z-10"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div>
                <p className="text-[18px] text-gray-900 font-bold tracking-tight mb-1 pixel-font uppercase">
                  Morph your files
                </p>
                <p className="text-[13px] text-gray-400 font-medium leading-relaxed max-w-[280px] mx-auto tracking-tight">
                  Drag and drop media here or click to browse. <br />
                  <span className="font-bold text-gray-600">
                    Safe, private & local.
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
