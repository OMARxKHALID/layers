import React, { useCallback, useState } from "react";

export const DropZone = ({ onFilesSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

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

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

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
    <div className="w-full flex justify-center px-4 animate-soft">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() =>
          !disabled && document.getElementById("file-upload")?.click()
        }
        className={`
          glass-card
          relative w-full max-w-xl h-[280px] rounded-[32px] flex flex-col items-center justify-center
          cursor-pointer transition-all duration-500 ease-out
          ${isDragging ? "bg-white/60 scale-[1.01] shadow-2xl ring-2 ring-white/50" : "hover:bg-white/40"}
          ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
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

        <div className="flex flex-col items-center gap-6 px-10 text-center relative z-10">
          <div
            className={`
            w-16 h-16 flex items-center justify-center rounded-2xl
            bg-white/40 border border-white/60 shadow-lg
            transition-all duration-500
            ${isDragging ? "bg-white/60 shadow-xl" : ""}
          `}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-900"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>

          <div className="space-y-2">
            <p className="text-xl text-gray-800 font-medium tracking-tight">
              Morph your files
            </p>
            <p className="text-sm text-gray-500 leading-relaxed max-w-[260px] mx-auto font-normal">
              Drag and drop media here or click to browse. Safe, private &
              local.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
