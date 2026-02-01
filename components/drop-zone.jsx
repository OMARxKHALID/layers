import React, { useCallback, useState } from "react";
import { Upload } from "lucide-react";

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
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            document.getElementById("file-upload")?.click();
          }
        }}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label="Upload files"
        className={`
          glass-card
          relative w-full max-w-2xl h-[220px] md:h-[300px] rounded-2xl md:rounded-3xl flex flex-col items-center justify-center
          cursor-pointer transition-all duration-500 ease-out outline-none focus-visible:ring-2 focus-visible:ring-black/20
          ${isDragging ? "bg-white/80 scale-[1.01] ring-2 ring-white/50" : ""}
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

        <div className="flex flex-col items-center gap-2 md:gap-3 px-6 md:px-10 text-center relative z-10">
          <div
            className={`
            w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg md:rounded-xl
            bg-mascot-orange/10 border border-mascot-orange/30 shadow-2xl shadow-mascot-orange/10
            transition-all duration-500
            ${isDragging ? "bg-mascot-orange/20 scale-110 border-mascot-red/50" : ""}
          `}
          >
            <Upload
              className={`w-5 h-5 md:w-6 md:h-6 transition-colors duration-500 ${isDragging ? "text-mascot-red" : "text-mascot-orange"}`}
            />
          </div>

          <div className="space-y-1 md:space-y-2">
            <p className="text-lg md:text-2xl text-mascot-orange font-bold tracking-tight font-(family-name:--font-pixelify-sans)">
              Drop to Transform
            </p>
            <p className="text-xs md:text-sm text-gray-500 leading-relaxed max-w-[200px] md:max-w-[260px] mx-auto font-normal">
              Drag and drop your images, video, or audio files here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
