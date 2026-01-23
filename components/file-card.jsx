import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  File as FileIcon,
  Trash2,
  Settings2,
  Download,
  PencilLine,
  ChevronDown,
  Check,
  Eye,
  RefreshCw,
  XCircle,
  Music,
  Video,
  Play,
  AlertTriangle,
} from "lucide-react";
import { FileCardSettings } from "./file-card-settings";

export const FileCard = ({
  item,
  onRemove,
  onCancel,
  onFormatChange,
  onSettingsChange,
  onNameChange,
  onCompare,
  onConvert,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [tempName, setTempName] = useState("");
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFormatDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateSetting = (key, value) => {
    onSettingsChange(item.id, { ...item.settings, [key]: value });
  };

  const previewUrl = useMemo(() => {
    if (item.file.type.startsWith("image/")) {
      return URL.createObjectURL(item.file);
    }
    return null;
  }, [item.file]);

  const displayName = item.customName || item.file.name;
  const inputExt = item.file.name.split(".").pop()?.toLowerCase();
  const inputType = item.file.type.split("/")[0];

  const targetType =
    item.availableOptions.find((o) => o.id === item.format)?.category ||
    "image";

  const isImageOutput = targetType === "Image";
  const isVideoOutput =
    ["mp4", "mkv", "webm", "mov"].includes(item.format?.replace("to-", "")) &&
    item.availableOptions.find((o) => o.id === item.format)?.category ===
      "Audio / Video";
  const isAudioOutput =
    ["mp3", "wav", "aac", "flac"].includes(item.format?.replace("to-", "")) &&
    item.availableOptions.find((o) => o.id === item.format)?.category ===
      "Audio / Video";

  const showQuality = isImageOutput || isVideoOutput;
  const showTransforms = isImageOutput;
  const showDimensions = isImageOutput;
  const showAspectRatio = isImageOutput;
  const showMultiSize = isImageOutput && inputType === "image";
  const showAudioSettings =
    isAudioOutput ||
    (isVideoOutput &&
      ["mp4", "mkv", "webm", "mov"].includes(item.format?.replace("to-", "")));
  const showVideoToImage = isImageOutput && inputType === "video";

  const formatSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const filteredOptions = item.availableOptions.filter(
    (opt) => opt.targetExt.toLowerCase() !== inputExt,
  );

  return (
    <div
      className={`
        glass-card rounded-[24px] p-4 mb-3 last:mb-0
        transition-all duration-500
        ${item.status === "error" ? "bg-red-50/20" : ""}
        ${item.status === "success" ? "bg-white/40" : ""}
      `}
    >
      <div className="flex items-center gap-4">
        {/* Preview / Icon */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden bg-white/50 shadow-sm group relative shrink-0">
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="preview"
                className="w-full h-full object-cover"
              />
              {item.status === "success" && !item.settings.multiSize && (
                <button
                  onClick={() =>
                    onCompare({
                      original: previewUrl,
                      converted: `${item.downloadUrl}&preview=1`,
                    })
                  }
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                  <Eye size={18} />
                </button>
              )}
            </>
          ) : (
            <div className="text-gray-800 opacity-100">
              {inputType === "audio" ? (
                <Music size={24} />
              ) : inputType === "video" ? (
                <Video size={24} />
              ) : (
                <FileIcon size={24} />
              )}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex-grow min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    ref={inputRef}
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        tempName.trim() &&
                          onNameChange(item.id, tempName.trim());
                        setIsEditing(false);
                      } else if (e.key === "Escape") setIsEditing(false);
                    }}
                    className="text-sm bg-white/60 rounded-lg px-2 py-1 outline-none font-medium flex-grow shadow-sm text-gray-800"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      tempName.trim() && onNameChange(item.id, tempName.trim());
                      setIsEditing(false);
                    }}
                    className="p-1.5 text-gray-500 hover:bg-black/5 rounded-lg"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <div
                  className="group/name cursor-pointer inline-flex items-center gap-2 max-w-full"
                  onClick={() =>
                    item.status === "idle" &&
                    (setTempName(displayName), setIsEditing(true))
                  }
                >
                  <p className="text-sm font-medium text-gray-800 truncate tracking-tight">
                    {displayName}
                  </p>
                  {item.status === "idle" && (
                    <PencilLine
                      size={12}
                      className="text-gray-300 group-hover/name:text-gray-500 transition-colors shrink-0"
                    />
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 mt-0.5 opacity-50">
                <span className="text-[11px] font-medium text-gray-600">
                  {formatSize(item.file.size)}
                </span>
                {item.metadata?.width && (
                  <span className="text-[11px] font-medium text-gray-600">
                    • {item.metadata.width}×{item.metadata.height}
                  </span>
                )}
                {item.metadata?.duration && (
                  <span className="text-[11px] font-medium text-gray-600">
                    • {Math.floor(item.metadata.duration / 60)}:
                    {Math.floor(item.metadata.duration % 60)
                      .toString()
                      .padStart(2, "0")}
                    s
                  </span>
                )}
              </div>
            </div>

            {/* Format Selector */}
            <div className="shrink-0 ml-4">
              {item.status === "idle" ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/40 hover:bg-white/60 rounded-full border border-white/20 transition-all ছায়া-sm"
                  >
                    <span className="text-[11px] font-bold uppercase text-gray-600">
                      {item.format?.replace("to-", "")}
                    </span>
                    <ChevronDown
                      size={12}
                      className={`text-gray-400 transition-transform duration-300 ${showFormatDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showFormatDropdown && (
                    <div className="absolute right-0 mt-2 w-32 bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl z-[100] py-2 animate-soft origin-top-right overflow-hidden">
                      {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => {
                              onFormatChange(item.id, opt.id);
                              setShowFormatDropdown(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-[11px] font-bold uppercase hover:bg-black/5 transition-colors ${item.format === opt.id ? "text-black bg-black/5" : "text-gray-500"}`}
                          >
                            {opt.label}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-[10px] font-bold text-gray-400 italic">
                          No targets
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-3 py-1.5 bg-white/30 rounded-full border border-white/10">
                  <span className="text-[11px] font-bold uppercase text-gray-400">
                    {item.format?.replace("to-", "")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {(item.status === "converting" ||
            item.status === "uploading" ||
            item.status === "success") && (
            <div className="mt-2.5 mb-1">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-medium text-gray-400">
                  {item.status === "success"
                    ? "Complete"
                    : item.status === "uploading"
                      ? "Preparing..."
                      : "Processing..."}
                </span>
                <span className="text-[10px] font-bold text-gray-600">
                  {item.progress}%
                </span>
              </div>
              <div className="h-1 w-full bg-black/[0.03] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ease-out ${item.status === "success" ? "bg-gray-800" : "bg-gray-400"}`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          )}

          {item.status === "error" && item.errorMsg && (
            <div className="flex items-center gap-1.5 mt-2 text-red-500/80">
              <AlertTriangle size={12} />
              <span className="text-[10px] font-medium truncate max-w-[200px]">
                {item.errorMsg}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {item.status === "success" ? (
            <>
              {isImageOutput && !item.settings.multiSize && (
                <button
                  onClick={() =>
                    onCompare({
                      original: previewUrl,
                      converted: `${item.downloadUrl}&preview=1`,
                    })
                  }
                  className="p-2 text-gray-500 hover:text-black hover:bg-black/5 rounded-full transition-all"
                  title="View"
                >
                  <Eye size={18} />
                </button>
              )}
              <button
                onClick={() => onFormatChange(item.id, item.format)}
                className="p-2 text-gray-400 hover:text-black hover:bg-black/5 rounded-full transition-all"
                title="Restart"
              >
                <RefreshCw size={18} />
              </button>
              <a
                href={item.downloadUrl}
                download
                aria-label={`Download ${displayName}`}
                className="p-2.5 bg-gray-900 text-white rounded-full shadow-lg hover:bg-black transition-all"
              >
                <Download size={16} />
              </a>
            </>
          ) : (
            <>
              {item.status === "idle" && (
                <>
                  <button
                    onClick={() => onConvert(item.id)}
                    aria-label="Start conversion"
                    className="p-2 text-gray-800 hover:text-black hover:bg-black/5 rounded-full transition-all"
                  >
                    <Play
                      size={18}
                      fill="currentColor"
                      className="opacity-100"
                    />
                  </button>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    aria-label="Toggle settings"
                    className={`p-2 rounded-full transition-all ${showSettings ? "bg-black/5 text-black" : "text-gray-800 hover:text-black hover:bg-black/5"}`}
                  >
                    <Settings2 size={18} />
                  </button>
                </>
              )}
              {item.status === "converting" && (
                <button
                  onClick={() => onCancel(item.id)}
                  aria-label="Cancel conversion"
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                >
                  <XCircle size={18} />
                </button>
              )}
              {item.status === "error" && (
                <button
                  onClick={() => onFormatChange(item.id, item.format)}
                  className="p-2 text-gray-400 hover:text-black hover:bg-black/5 rounded-full transition-all"
                >
                  <RefreshCw size={18} />
                </button>
              )}
              {item.status !== "converting" && (
                <button
                  onClick={() => onRemove(item.id)}
                  aria-label="Remove file"
                  className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showSettings && item.status === "idle" && (
        <div className="mt-4 pt-4 border-t border-black/[0.03]">
          <FileCardSettings
            item={item}
            updateSetting={updateSetting}
            showQuality={showQuality}
            isVideoOutput={isVideoOutput}
            showAudioSettings={showAudioSettings}
            showVideoToImage={showVideoToImage}
            showAspectRatio={showAspectRatio}
            showDimensions={showDimensions}
            showTransforms={showTransforms}
            showMultiSize={showMultiSize}
          />
        </div>
      )}
    </div>
  );
};
