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
      className={`glass-card rounded-[1.25rem] p-3 mb-2 last:mb-0 border border-white/40 shadow-sm transition-all duration-300 animate-scale-in ${item.status === "error" ? "bg-red-50/10 border-red-200/20" : ""} ${item.status === "success" ? "border-green-400/20 bg-green-400/5 shadow-green-400/5" : ""}`}
    >
      <div className="flex items-center gap-3">
        {/* Preview / Icon */}
        <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-black/[0.03] overflow-hidden bg-white/50 shadow-inner group relative shrink-0">
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
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                  <Eye size={16} />
                </button>
              )}
            </>
          ) : (
            <div className="text-black/40">
              {inputType === "audio" ? (
                <Music size={20} className="text-red-400" />
              ) : inputType === "video" ? (
                <Video size={20} className="text-purple-400" />
              ) : (
                <FileIcon size={20} />
              )}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex-grow min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-1 w-full scale-in">
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
                    className="text-[13px] bg-white border border-black/10 rounded-lg px-2 py-1 outline-none font-bold flex-grow shadow-sm"
                  />
                  <button
                    onClick={() => {
                      tempName.trim() && onNameChange(item.id, tempName.trim());
                      setIsEditing(false);
                    }}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                  >
                    <Check size={14} strokeWidth={3} />
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
                  <p className="text-[13px] font-bold text-gray-900 truncate tracking-tight">
                    {displayName}
                  </p>
                  {item.status === "idle" && (
                    <PencilLine
                      size={12}
                      className="text-gray-400 group-hover/name:text-blue-500 transition-colors shrink-0"
                    />
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 mt-0.5 opacity-60">
                <span className="text-[10px] font-bold uppercase">
                  {formatSize(item.file.size)}
                </span>
                {item.metadata?.width && (
                  <span className="text-[10px] font-bold">
                    • {item.metadata.width}×{item.metadata.height}
                  </span>
                )}
                {item.metadata?.duration && (
                  <span className="text-[10px] font-bold">
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
            <div className="shrink-0 ml-2">
              {item.status === "idle" ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/[0.04] hover:bg-black/[0.08] rounded-lg border border-black/[0.05] transition-all"
                  >
                    <span className="text-[11px] font-black uppercase text-gray-800">
                      {item.format?.replace("to-", "")}
                    </span>
                    <ChevronDown
                      size={12}
                      className={`transition-transform duration-300 ${showFormatDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showFormatDropdown && (
                    <div className="absolute right-0 mt-2 w-32 bg-white/95 backdrop-blur-xl border border-black/10 rounded-2xl shadow-2xl z-[100] py-2 animate-scale-in origin-top-right overflow-hidden noise">
                      {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => {
                              onFormatChange(item.id, opt.id);
                              setShowFormatDropdown(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-[11px] font-bold uppercase hover:bg-black/5 transition-colors ${item.format === opt.id ? "text-blue-600 bg-blue-50/50" : "text-gray-600"}`}
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
                <div className="px-3 py-1.5 bg-black/[0.03] rounded-lg border border-black/[0.02]">
                  <span className="text-[11px] font-black uppercase text-gray-400">
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
                <span className="text-[9px] font-black uppercase tracking-widest text-black/50">
                  {item.status === "success"
                    ? "Complete"
                    : item.status === "uploading"
                      ? "Preparing"
                      : "Processing"}
                </span>
                <span className="text-[10px] font-black text-black">
                  {item.progress}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-black/[0.05] rounded-full overflow-hidden border border-black/[0.02]">
                <div
                  className={`h-full transition-all duration-500 ease-out fill-mode-forwards ${item.status === "success" ? "bg-green-500" : "bg-black"}`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          )}

          {item.status === "error" && item.errorMsg && (
            <div className="flex items-center gap-1 mt-1 text-red-500 animate-pulse">
              <AlertTriangle size={10} />
              <span className="text-[9px] font-bold uppercase tracking-tight truncate max-w-[200px]">
                {item.errorMsg}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0 ml-1">
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
                  className="p-2 text-black hover:bg-black/5 rounded-lg transition-all"
                >
                  <Eye size={16} />
                </button>
              )}
              <button
                onClick={() => onFormatChange(item.id, item.format)}
                className="p-2 text-gray-500 hover:text-black hover:bg-black/5 rounded-lg transition-all"
              >
                <RefreshCw size={16} />
              </button>
              <a
                href={item.downloadUrl}
                download
                aria-label={`Download ${displayName}`}
                className="p-2 bg-black text-white rounded-lg shadow-lg hover:bg-black/80 transition-all active:scale-95"
              >
                <Download size={16} strokeWidth={2.5} />
              </a>
            </>
          ) : (
            <>
              {item.status === "idle" && (
                <>
                  <button
                    onClick={() => onConvert(item.id)}
                    aria-label="Start conversion"
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Play size={16} fill="currentColor" />
                  </button>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    aria-label="Toggle settings"
                    className={`p-2 rounded-lg transition-all ${showSettings ? "bg-black text-white shadow-md rotate-90" : "text-gray-500 hover:text-black bg-black/[0.02]"}`}
                  >
                    <Settings2 size={16} />
                  </button>
                </>
              )}
              {item.status === "converting" && (
                <button
                  onClick={() => onCancel(item.id)}
                  aria-label="Cancel conversion"
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <XCircle size={16} />
                </button>
              )}
              {item.status === "error" && (
                <button
                  onClick={() => onFormatChange(item.id, item.format)}
                  className="p-2 text-gray-500 hover:text-black hover:bg-black/5 rounded-lg transition-all"
                >
                  <RefreshCw size={16} />
                </button>
              )}
              {item.status !== "converting" && (
                <button
                  onClick={() => onRemove(item.id)}
                  aria-label="Remove file"
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
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
