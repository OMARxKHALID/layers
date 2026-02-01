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
  Music,
  Video,
  Play,
  AlertTriangle,
  Image as ImageIcon,
  Square,
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
  const [openUpward, setOpenUpward] = useState(false);
  const [tempName, setTempName] = useState("");
  const [visualProgress, setVisualProgress] = useState(item.progress || 0);
  const [workerPreviewUrl, setWorkerPreviewUrl] = useState(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!item.file.type.startsWith("image/")) return;

    const worker = new Worker("/preview-worker.js");
    worker.onmessage = (e) => {
      const { blob } = e.data;
      if (blob) {
        setWorkerPreviewUrl(URL.createObjectURL(blob));
      }
      worker.terminate();
    };
    worker.postMessage({ file: item.file, id: item.id });

    return () => {
      worker.terminate();
      if (workerPreviewUrl) URL.revokeObjectURL(workerPreviewUrl);
    };
  }, [item.file, item.id]);

  useEffect(() => {
    if (item.status === "converting" || item.status === "uploading") {
      const step = item.status === "uploading" ? 0.5 : 0.2;
      const interval = setInterval(() => {
        setVisualProgress((prev) => {
          if (prev >= 99) return 99;
          if (prev < item.progress) return item.progress;
          return +(prev + step).toFixed(2);
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setVisualProgress(item.progress);
    }
  }, [item.status, item.progress]);

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

  const updateSettings = (updates) => {
    onSettingsChange(item.id, { ...item.settings, ...updates });
  };

  const previewUrl = useMemo(() => {
    return item.file.type.startsWith("image/")
      ? URL.createObjectURL(item.file)
      : null;
  }, [item.file]);

  const displayName = item.customName || item.file.name;
  const inputExt = item.file.name.split(".").pop()?.toLowerCase();
  const inputType = item.file.type.split("/")[0];
  const targetOption = item.availableOptions.find((o) => o.id === item.format);
  const targetType = targetOption?.category || "image";

  const isImageOutput = targetType === "Image";
  const isVideoOutput =
    ["mp4", "mkv", "webm", "mov"].includes(item.format?.replace("to-", "")) &&
    targetType === "Audio / Video";
  const isAudioOutput =
    ["mp3", "wav", "aac", "flac"].includes(item.format?.replace("to-", "")) &&
    targetType === "Audio / Video";

  const showQuality = isImageOutput || isVideoOutput;
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

  const getCompareUrl = () => {
    return item.downloadUrl?.startsWith("blob:")
      ? item.downloadUrl
      : `${item.downloadUrl}${item.downloadUrl?.includes("?") ? "&" : "?"}preview=1`;
  };

  const renderPreview = () => {
    if (workerPreviewUrl || (previewUrl && !imageError)) {
      return (
        <>
          <img
            src={workerPreviewUrl || previewUrl}
            alt="preview"
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          {item.status === "success" && !item.settings.multiSize && (
            <button
              onClick={() =>
                onCompare({
                  original: previewUrl,
                  converted: getCompareUrl(),
                })
              }
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
            >
              <Eye size={18} />
            </button>
          )}
        </>
      );
    }

    if (inputType === "audio")
      return <Music className="w-6 h-6 sm:w-8 sm:h-8" />;
    if (inputType === "video")
      return <Video className="w-6 h-6 sm:w-8 sm:h-8" />;
    if (inputType === "image" || imageError)
      return <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8" />;
    return <FileIcon className="w-6 h-6 sm:w-8 sm:h-8" />;
  };

  return (
    <div
      className={`
        glass-card rounded-xl p-2.5
        transition-all duration-500 relative overflow-visible
        ${showFormatDropdown || showSettings ? "z-50" : "z-1"}
        ${item.status === "error" ? "bg-red-50/20" : ""}
        ${item.status === "success" ? "bg-white/40" : ""}
      `}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center overflow-hidden bg-white/50 group relative shrink-0">
          {renderPreview()}
        </div>

        <div className="grow min-w-0 w-full sm:w-auto">
          <div className="flex items-center justify-between mb-1">
            <div className="grow min-w-0">
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
                    className="text-xs sm:text-sm bg-white/60 rounded-lg px-2 py-1 outline-none font-medium grow text-gray-800"
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
                  onClick={() => {
                    setTempName(displayName);
                    setIsEditing(true);
                  }}
                >
                  <p className="text-[11px] sm:text-xs font-semibold text-gray-800 truncate tracking-tight">
                    {displayName}
                  </p>
                  <PencilLine
                    className="text-gray-600 group-hover/name:text-gray-800 transition-colors shrink-0"
                    size={10}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 mt-0.5 opacity-60">
                <span className="text-xs font-medium text-gray-500">
                  {formatSize(item.file.size)}
                </span>
                {item.metadata?.width && (
                  <span className="text-xs font-medium text-gray-500">
                    • {item.metadata.width}×{item.metadata.height}
                  </span>
                )}
                {item.elapsedTime && (
                  <span className="text-[10px] font-bold text-mascot-orange bg-mascot-orange/5 px-1.5 py-0.5 rounded-md ml-1 inline-flex items-center gap-1 border border-mascot-orange/10">
                    {item.elapsedTime}s
                    {item.modeUsed && (
                      <span className="opacity-60 font-medium border-l border-mascot-orange/20 pl-1 ml-0.5 text-[9px] uppercase tracking-tighter">
                        {item.modeUsed}
                      </span>
                    )}
                  </span>
                )}
                {item.status === "error" && (
                  <span className="text-[10px] font-bold text-mascot-red bg-mascot-red/5 px-1.5 py-0.5 rounded-md ml-1 uppercase tracking-tighter border border-mascot-red/10">
                    Failed {item.modeUsed && `• ${item.modeUsed}`}
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 ml-2">
              {item.status === "idle" ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const spaceBelow = window.innerHeight - rect.bottom;
                      setOpenUpward(spaceBelow < 180);
                      setShowFormatDropdown(!showFormatDropdown);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/40 hover:bg-white/60 rounded-full border border-white/20 transition-all duration-300 group"
                  >
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase text-gray-700 tracking-tight">
                      {item.format?.replace("to-", "")}
                    </span>
                    <ChevronDown
                      size={10}
                      className={`text-gray-900 transition-transform duration-500 ${showFormatDropdown ? "rotate-180" : "group-hover:translate-y-0.5"}`}
                    />
                  </button>

                  {showFormatDropdown && (
                    <div
                      className={`absolute right-0 min-w-[100px] w-fit bg-white/95 backdrop-blur-3xl border border-white/60 rounded-xl z-1000 p-1 overflow-hidden whitespace-nowrap shadow-sm shadow-black/5 ${openUpward ? "bottom-full mb-1.5 origin-bottom-right animate-dropdown-up" : "top-full mt-1.5 origin-top-right animate-dropdown"}`}
                    >
                      {filteredOptions.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {filteredOptions.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onFormatChange(item.id, opt.id);
                                setTimeout(
                                  () => setShowFormatDropdown(false),
                                  200,
                                );
                              }}
                              className={`w-full px-3 py-1.5 text-left rounded-lg transition-all flex items-center justify-between gap-4 group/opt ${item.format === opt.id ? "bg-black/5 text-gray-900" : "text-gray-500 hover:bg-black/3 hover:text-gray-900"}`}
                            >
                              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-tight">
                                {opt.label}
                              </span>
                              {item.format === opt.id && (
                                <Check
                                  size={12}
                                  strokeWidth={3}
                                  className="text-gray-900 animate-in zoom-in-50 duration-300"
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-2 text-[10px] font-bold text-gray-400 italic">
                          No targets
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-2 py-1 sm:px-3 sm:py-1.5 bg-white/30 rounded-full border border-white/10">
                  <span className="text-xs font-bold uppercase text-gray-400">
                    {item.format?.replace("to-", "")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {["converting", "uploading", "success"].includes(item.status) && (
            <div className="mt-2 mb-1">
              <div className="flex justify-between items-center mb-1">
                <span
                  className={`text-[10px] font-medium tracking-tight ${item.status === "success" ? "text-gray-600" : "text-gray-500"}`}
                >
                  {item.status === "success"
                    ? "Complete"
                    : item.status === "uploading"
                      ? "Preparing..."
                      : "Processing..."}
                </span>
                <span
                  className={`text-[10px] font-medium ${item.status === "success" ? "text-mascot-orange" : "text-gray-500"}`}
                >
                  {Math.floor(visualProgress)}%
                </span>
              </div>
              <div className="h-1 w-full bg-black/3 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ease-out ${item.status === "success" ? "bg-mascot-orange" : "bg-linear-to-r from-mascot-yellow to-mascot-orange shadow-[0_0_8px_rgba(255,140,0,0.4)]"}`}
                  style={{ width: `${visualProgress}%` }}
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

        <div className="flex flex-row sm:flex-col items-center gap-1.5 sm:gap-2 shrink-0 ml-0 sm:ml-2 w-full sm:w-auto justify-between sm:justify-end mt-3 sm:mt-0 pt-3 sm:pt-0 border-t border-black/3 sm:border-t-0">
          {item.status === "success" ? (
            <>
              <div className="flex items-center gap-1 bg-white/40 p-0.5 rounded-full border border-white/30">
                {isImageOutput && !item.settings.multiSize && (
                  <button
                    onClick={() =>
                      onCompare({
                        original: previewUrl,
                        converted: getCompareUrl(),
                      })
                    }
                    className="p-1 px-2 text-gray-800 hover:text-black hover:bg-black/3 rounded-full transition-all"
                    title="View"
                  >
                    <Eye size={14} />
                  </button>
                )}
                <button
                  onClick={() => onFormatChange(item.id, item.format)}
                  className="p-1 px-2 text-gray-800 hover:text-black hover:bg-black/3 rounded-full transition-all"
                  title="Restart"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              <a
                href={item.downloadUrl}
                download={item.outputName || displayName}
                className="p-1.5 bg-gray-900 text-white rounded-full transition-all flex items-center justify-center"
              >
                <Download size={14} />
              </a>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 bg-white/40 p-0.5 rounded-full border border-white/30">
                {item.status === "idle" && (
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-1 px-2 rounded-full transition-all ${showSettings ? "bg-black/5 text-black" : "text-gray-800 hover:text-black hover:bg-black/5"}`}
                  >
                    <Settings2
                      size={14}
                      className={`transition-transform duration-500 ease-out ${showSettings ? "rotate-90" : "rotate-0"}`}
                    />
                  </button>
                )}
                {item.status === "converting" && (
                  <button
                    onClick={() => onCancel(item.id)}
                    className="p-1 px-2 text-gray-800 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                  >
                    <Square size={12} fill="currentColor" />
                  </button>
                )}
                {item.status === "error" && (
                  <button
                    onClick={() => onConvert(item.id)}
                    className="p-1 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-all"
                    title="Retry"
                  >
                    <RefreshCw size={14} />
                  </button>
                )}
                <button
                  onClick={() => onRemove(item.id)}
                  className="p-1 px-2 text-gray-800 hover:text-red-500 hover:bg-red-50 rounded-full transition-all group/trash"
                >
                  <Trash2 size={14} className="transition-colors" />
                </button>
              </div>
              {item.status === "idle" && (
                <button
                  onClick={() => onConvert(item.id)}
                  className="p-2 bg-mascot-orange hover:bg-mascot-orange/90 text-white rounded-full transition-all active:scale-95 group/play shadow-lg shadow-mascot-orange/20"
                >
                  <Play
                    size={14}
                    fill="currentColor"
                    className="group-hover/play:translate-x-0.5 transition-transform"
                  />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showSettings && item.status === "idle" && (
        <div className="mt-4 pt-4 border-t border-black/3">
          <FileCardSettings
            item={item}
            updateSetting={updateSetting}
            updateSettings={updateSettings}
            showQuality={showQuality}
            isVideoOutput={isVideoOutput}
            showAudioSettings={showAudioSettings}
            showVideoToImage={showVideoToImage}
            showAspectRatio={true}
            showDimensions={showQuality}
            showTransforms={isImageOutput}
            showMultiSize={showMultiSize}
          />
        </div>
      )}
    </div>
  );
};
