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
  Image as ImageIcon,
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
  const [imageError, setImageError] = useState(false);
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
        glass-card rounded-[24px] p-4
        transition-all duration-500
        ${item.status === "error" ? "bg-red-50/20" : ""}
        ${item.status === "success" ? "bg-white/40" : ""}
      `}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        {/* Preview / Icon */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-[24px] flex items-center justify-center overflow-hidden bg-white/50 group relative shrink-0">
          {previewUrl && !imageError ? (
            <>
              <img
                src={previewUrl}
                alt="preview"
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
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
                <Music className="w-6 h-6 sm:w-8 sm:h-8" />
              ) : inputType === "video" ? (
                <Video className="w-6 h-6 sm:w-8 sm:h-8" />
              ) : inputType === "image" || imageError ? (
                <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8" />
              ) : (
                <FileIcon className="w-6 h-6 sm:w-8 sm:h-8" />
              )}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-grow min-w-0 w-full sm:w-auto">
          <div className="flex items-center justify-between mb-1">
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
                    className="text-xs sm:text-sm bg-white/60 rounded-lg px-2 py-1 outline-none font-medium flex-grow text-gray-800"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      tempName.trim() && onNameChange(item.id, tempName.trim());
                      setIsEditing(false);
                    }}
                    className="p-1 text-gray-800 hover:bg-black/5 rounded-lg"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <div
                  className="group/name cursor-pointer inline-flex items-center gap-2 max-w-full"
                  onClick={() => (setTempName(displayName), setIsEditing(true))}
                >
                  <p className="text-xs sm:text-sm font-medium text-gray-800 truncate tracking-tight">
                    {displayName}
                  </p>
                  <PencilLine
                    size={10}
                    className="text-gray-600 group-hover/name:text-gray-800 transition-colors shrink-0"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 mt-0.5 opacity-60">
                <span className="text-[9px] sm:text-[11px] font-medium text-gray-600">
                  {formatSize(item.file.size)}
                </span>
                {item.metadata?.width && (
                  <span className="text-[9px] sm:text-[11px] font-medium text-gray-600">
                    • {item.metadata.width}×{item.metadata.height}
                  </span>
                )}
              </div>
            </div>

            {/* Format Selector */}
            <div className="shrink-0 ml-2">
              {item.status === "idle" ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                    className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 bg-white/40 hover:bg-white/[0.38] rounded-full border border-white/20 transition-all"
                  >
                    <span className="text-[9px] sm:text-[11px] font-bold uppercase text-gray-600">
                      {item.format?.replace("to-", "")}
                    </span>
                    <ChevronDown
                      size={10}
                      className={`text-gray-800 transition-transform duration-300 ${showFormatDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showFormatDropdown && (
                    <div className="absolute right-0 mt-2 w-28 sm:w-32 bg-white/90 backdrop-blur-xl border border-white/40 rounded-xl sm:rounded-2xl z-[100] py-2 animate-soft origin-top-right overflow-hidden">
                      {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => {
                              onFormatChange(item.id, opt.id);
                              setShowFormatDropdown(false);
                            }}
                            className={`w-full px-3 py-1.5 sm:px-4 sm:py-2 text-left text-[9px] sm:text-[11px] font-bold uppercase hover:bg-black/[0.03] transition-colors ${item.format === opt.id ? "text-black bg-black/[0.03]" : "text-gray-500"}`}
                          >
                            {opt.label}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-1.5 text-[9px] font-bold text-gray-400 italic">
                          No targets
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-2 py-1 sm:px-3 sm:py-1.5 bg-white/30 rounded-full border border-white/10">
                  <span className="text-[9px] sm:text-[11px] font-bold uppercase text-gray-400">
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
            <div className="mt-2 mb-1">
              <div className="flex justify-between items-center mb-1">
                <span
                  className={`text-[9px] sm:text-[10px] font-medium tracking-tight ${item.status === "success" ? "text-gray-600" : "text-gray-500"}`}
                >
                  {item.status === "success"
                    ? "Complete"
                    : item.status === "uploading"
                      ? "Preparing..."
                      : "Processing..."}
                </span>
                <span
                  className={`text-[9px] sm:text-[10px] font-medium ${item.status === "success" ? "text-gray-600" : "text-gray-500"}`}
                >
                  {item.progress}%
                </span>
              </div>
              <div className="h-1 w-full bg-black/[0.03] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ease-out ${item.status === "success" ? "bg-gray-500" : "bg-gray-300"}`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          )}

          {item.status === "error" && item.errorMsg && (
            <div className="flex items-center gap-1.5 mt-1.5 text-red-500">
              <AlertTriangle size={10} />
              <span className="text-[9px] sm:text-[10px] font-medium truncate max-w-[150px] sm:max-w-[200px]">
                {item.errorMsg}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex sm:flex-col items-center gap-2 shrink-0 ml-0 sm:ml-2 w-full sm:w-auto justify-end mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-black/[0.02] sm:border-t-0">
          {item.status === "success" ? (
            <>
              <div className="flex items-center gap-1 bg-white/40 p-1 rounded-full border border-white/30">
                {isImageOutput && !item.settings.multiSize && (
                  <button
                    onClick={() =>
                      onCompare({
                        original: previewUrl,
                        converted: `${item.downloadUrl}&preview=1`,
                      })
                    }
                    className="p-1.5 sm:p-2 text-gray-800 hover:text-black hover:bg-black/[0.03] rounded-full transition-all"
                    title="View"
                  >
                    <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                )}
                <button
                  onClick={() => onFormatChange(item.id, item.format)}
                  className="p-1.5 sm:p-2 text-gray-800 hover:text-black hover:bg-black/[0.03] rounded-full transition-all"
                  title="Restart"
                >
                  <RefreshCw size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
              <a
                href={item.downloadUrl}
                download
                aria-label={`Download ${displayName}`}
                className="p-2 sm:p-2.5 bg-gray-900 text-white rounded-full transition-all"
              >
                <Download size={14} className="sm:w-[16px] sm:h-[16px]" />
              </a>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 bg-white/40 p-1 rounded-full border border-white/30">
                {item.status === "idle" && (
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    aria-label="Toggle settings"
                    className={`p-1.5 sm:p-2 rounded-full transition-all ${showSettings ? "bg-black/5 text-black" : "text-gray-800 hover:text-black hover:bg-black/5"}`}
                  >
                    <Settings2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                )}
                {item.status === "converting" && (
                  <button
                    onClick={() => onCancel(item.id)}
                    aria-label="Cancel conversion"
                    className="p-1.5 sm:p-2 text-gray-800 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                  >
                    <XCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                )}
                {item.status === "error" && (
                  <button
                    onClick={() => onFormatChange(item.id, item.format)}
                    className="p-1.5 sm:p-2 text-gray-800 hover:text-black hover:bg-black/[0.03] rounded-full transition-all"
                  >
                    <RefreshCw size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                )}
                {item.status !== "converting" && (
                  <button
                    onClick={() => onRemove(item.id)}
                    aria-label="Remove file"
                    className="p-1.5 sm:p-2 text-gray-800 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                  >
                    <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                )}
              </div>
              {item.status === "idle" && (
                <button
                  onClick={() => onConvert(item.id)}
                  aria-label="Start conversion"
                  className="p-2 sm:p-2.5 bg-gray-900 text-white rounded-full transition-all"
                >
                  <Play
                    size={14}
                    fill="currentColor"
                    className="sm:w-[16px] sm:h-[16px]"
                  />
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
