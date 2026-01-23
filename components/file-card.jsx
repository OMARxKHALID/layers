import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  File as FileIcon,
  Trash2,
  Settings2,
  Download,
  PencilLine,
  RotateCcw,
  ChevronDown,
  Check,
  X,
  Eye,
  RefreshCw,
  XCircle,
  FlipHorizontal,
  FlipVertical,
  Music,
  Video,
} from "lucide-react";

// --- Reusable Sub-components ---

const SettingLabel = ({ children, extra }) => (
  <div className="flex justify-between text-[9px] font-bold text-black/50 uppercase tracking-[0.1em] mb-1.5">
    <label>{children}</label>
    {extra && <span className="text-black">{extra}</span>}
  </div>
);

const SettingButton = ({
  active,
  onClick,
  children,
  title,
  className = "",
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`px-3 py-1.5 rounded-lg font-bold border transition-all text-[9px] ${
      active
        ? "bg-black text-white border-black shadow-sm"
        : "bg-black/[0.02] text-gray-500 border-black/[0.02] hover:border-black/10"
    } ${className}`}
  >
    {children}
  </button>
);

const NumericInput = ({
  value,
  onChange,
  placeholder,
  unit,
  step = "1",
  min = "0",
}) => (
  <div className="relative flex-grow">
    <input
      type="number"
      step={step}
      min={min}
      placeholder={placeholder}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-black/[0.03] border border-black/[0.05] rounded-xl pl-3 pr-8 py-2 text-[12px] font-bold focus:bg-white focus:border-black/20 outline-none transition-all placeholder:font-medium placeholder:text-black/20"
    />
    {unit && (
      <span className="absolute right-3 top-2.5 text-[8px] text-black/30 font-bold uppercase pointer-events-none">
        {unit}
      </span>
    )}
  </div>
);

// --- Main Component ---

export const FileCard = ({
  item,
  onRemove,
  onCancel,
  onFormatChange,
  onSettingsChange,
  onNameChange,
  onCompare,
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

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const f = item.format;
  const targetType = ["to-mp3", "to-wav", "to-aac", "to-flac"].includes(f)
    ? "audio"
    : ["to-mp4", "to-mkv", "to-webm", "to-mov"].includes(f)
      ? "video"
      : "image";
  const inputType = (item.file.type || "").split("/")[0] || "image";

  const isImageOutput = targetType === "image";
  const isVideoOutput = targetType === "video";
  const isAudioOutput = targetType === "audio";

  const showQuality = isImageOutput || isVideoOutput;
  const showTransforms = isImageOutput;
  const showDimensions = isImageOutput;
  const showAspectRatio = isImageOutput;
  const showMultiSize = isImageOutput && inputType === "image";
  const showVideoToImage = inputType === "video" && isImageOutput;
  const showAudioSettings = isAudioOutput;

  const previewUrl = useMemo(
    () =>
      item.file.type.startsWith("image/")
        ? URL.createObjectURL(item.file)
        : null,
    [item.file],
  );
  const displayName = item.customName || item.file.name;

  const updateSetting = (key, val) => {
    onSettingsChange(item.id, { ...item.settings, [key]: val });
  };

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
              {item.status === "success" && (
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

        {/* Info & Name Mapping */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-2">
            {isEditing ? (
              <div className="flex items-center gap-1 w-full scale-in">
                <input
                  ref={inputRef}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      tempName.trim() && onNameChange(item.id, tempName.trim());
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
                className="flex items-center gap-2 cursor-pointer group/name truncate flex-grow"
                onClick={() =>
                  item.status === "idle" &&
                  (setTempName(displayName), setIsEditing(true))
                }
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-bold text-gray-900 truncate tracking-tight">
                      {displayName}
                    </p>
                    {item.status === "idle" && (
                      <PencilLine
                        size={12}
                        className="text-gray-300 group-hover/name:text-blue-500 transition-colors"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 opacity-60">
                    <span className="text-[10px] font-bold uppercase">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    {item.metadata?.width && (
                      <span className="text-[10px] font-bold">
                        • {item.metadata.width}×{item.metadata.height}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Format Dropdown */}
            <div className="flex items-center gap-2">
              {item.status === "idle" ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/[0.04] hover:bg-black/[0.08] rounded-lg border border-black/[0.05] transition-all"
                  >
                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-tight">
                      {item.format?.replace("to-", "") || "select"}
                    </span>
                    <ChevronDown
                      size={10}
                      className={`text-gray-400 transition-transform ${showFormatDropdown ? "rotate-180" : ""}`}
                    />
                  </button>
                  {showFormatDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-32 glass rounded-xl border border-black/[0.08] shadow-2xl z-[100] p-1 animate-fade-in origin-top-right">
                      <div className="max-h-48 overflow-y-auto no-scrollbar">
                        {item.availableOptions.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => {
                              onFormatChange(item.id, opt.id);
                              setShowFormatDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors ${item.format === opt.id ? "bg-black text-white" : "hover:bg-black/5 text-gray-600"}`}
                          >
                            {opt.targetExt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-end">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full ${item.status === "success" ? "bg-green-100 text-green-700" : item.status === "error" ? "bg-red-100 text-red-700" : "bg-black/5 text-gray-500"}`}
                  >
                    {item.status}
                  </span>
                  {item.status === "converting" && (
                    <span className="text-[10px] font-bold text-black mt-1">
                      {item.progress}%
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1 w-full bg-black/[0.03] rounded-full overflow-hidden border border-black/[0.01]">
            <div
              className={`h-full transition-all duration-700 ${item.status === "error" ? "bg-red-500" : item.status === "success" ? "bg-green-500" : "bg-black"} ${item.status === "converting" ? "shimmer" : ""}`}
              style={{
                width: `${item.status === "error" || item.status === "success" ? 100 : item.progress}%`,
              }}
            />
          </div>
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
                  title="Preview Result"
                >
                  <Eye size={16} />
                </button>
              )}
              <button
                onClick={() => onFormatChange(item.id, item.format)}
                className="p-2 text-gray-500 hover:text-black hover:bg-black/5 rounded-lg transition-all"
                title="Re-Morph"
              >
                <RotateCcw size={16} />
              </button>
              <a
                href={item.downloadUrl}
                className="p-2 bg-black text-white hover:bg-black/80 rounded-lg transition-all shadow-md"
                title="Download"
              >
                <Download size={16} />
              </a>
            </>
          ) : (
            <>
              {item.status === "idle" && (
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 rounded-lg transition-all ${showSettings ? "bg-black text-white shadow-md rotate-90" : "text-gray-500 hover:text-black bg-black/[0.02]"}`}
                >
                  <Settings2 size={16} />
                </button>
              )}
              {item.status === "converting" && (
                <button
                  onClick={() => onCancel(item.id)}
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
        <div className="mt-3 pt-3 border-t border-black/[0.03] grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 px-1 animate-scale-in origin-top">
          {/* Left Column Settings */}
          <div className="space-y-4">
            {showQuality && (
              <div>
                <SettingLabel extra={`${item.settings.quality}%`}>
                  Quality / CRF
                </SettingLabel>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={item.settings.quality}
                  onChange={(e) =>
                    updateSetting("quality", parseInt(e.target.value))
                  }
                  className="w-full h-1 bg-black/[0.05] rounded-full appearance-none accent-black cursor-pointer"
                />
              </div>
            )}

            {isVideoOutput && (
              <div>
                <SettingLabel extra={`${item.settings.fps || "Auto"} FPS`}>
                  Frame Rate
                </SettingLabel>
                <div className="flex gap-1.5">
                  {[null, 24, 30, 60].map((v) => (
                    <SettingButton
                      key={String(v)}
                      active={item.settings.fps === v}
                      onClick={() => updateSetting("fps", v)}
                    >
                      {v || "Auto"}
                    </SettingButton>
                  ))}
                </div>
              </div>
            )}

            {showAudioSettings && (
              <div>
                <SettingLabel extra={item.settings.audioBitrate || "192k"}>
                  Audio Bitrate
                </SettingLabel>
                <div className="flex flex-wrap gap-1.5">
                  {["128k", "192k", "256k", "320k"].map((v) => (
                    <SettingButton
                      key={v}
                      active={item.settings.audioBitrate === v}
                      onClick={() => updateSetting("audioBitrate", v)}
                    >
                      {v}
                    </SettingButton>
                  ))}
                </div>
              </div>
            )}

            {showVideoToImage && (
              <div>
                <SettingLabel extra={`${item.settings.frameOffset || 0}s`}>
                  Capture Frame at
                </SettingLabel>
                <NumericInput
                  step="0.1"
                  unit="SEC"
                  placeholder="0.0"
                  value={item.settings.frameOffset}
                  onChange={(val) =>
                    updateSetting("frameOffset", parseFloat(val) || 0)
                  }
                />
              </div>
            )}

            {showAspectRatio && (
              <div>
                <SettingLabel>Aspect Ratio</SettingLabel>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: "Original", value: "original" },
                    { label: "1:1", value: "1:1" },
                    { label: "16:9", value: "16:9" },
                    { label: "4:3", value: "4:3" },
                    { label: "2:3", value: "2:3" },
                  ].map((r) => (
                    <SettingButton
                      key={r.value}
                      active={item.settings.aspectRatio === r.value}
                      onClick={() => updateSetting("aspectRatio", r.value)}
                    >
                      {r.label}
                    </SettingButton>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column Settings */}
          <div className="space-y-4">
            {showDimensions && (
              <div>
                <SettingLabel>Target Dimensions</SettingLabel>
                <div className="flex items-center gap-2">
                  <NumericInput
                    placeholder="Width"
                    unit="PX"
                    value={item.settings.width}
                    onChange={(v) => {
                      updateSetting("width", v ? parseInt(v) : null);
                      updateSetting("scale", 100);
                    }}
                  />
                  <span className="text-black/10">×</span>
                  <NumericInput
                    placeholder="Height"
                    unit="PX"
                    value={item.settings.height}
                    onChange={(v) => {
                      updateSetting("height", v ? parseInt(v) : null);
                      updateSetting("scale", 100);
                    }}
                  />
                </div>
              </div>
            )}

            {showQuality && !item.settings.width && !item.settings.height && (
              <div>
                <SettingLabel extra={`${item.settings.scale}%`}>
                  Scaling
                </SettingLabel>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={item.settings.scale}
                  onChange={(e) =>
                    updateSetting("scale", parseInt(e.target.value))
                  }
                  className="w-full h-1 bg-black/[0.05] rounded-full appearance-none accent-black cursor-pointer"
                />
              </div>
            )}

            {showTransforms && (
              <div>
                <SettingLabel>Visual Transformations</SettingLabel>
                <div className="flex gap-1.5">
                  <SettingButton
                    active={(item.settings.rotation || 0) !== 0}
                    onClick={() =>
                      updateSetting(
                        "rotation",
                        ((item.settings.rotation || 0) + 90) % 360,
                      )
                    }
                    title="Rotate 90°"
                  >
                    <div className="flex items-center gap-1">
                      <RotateCcw size={12} />
                      {item.settings.rotation !== 0 && (
                        <span>{item.settings.rotation}°</span>
                      )}
                    </div>
                  </SettingButton>
                  <SettingButton
                    active={item.settings.flip}
                    onClick={() => updateSetting("flip", !item.settings.flip)}
                    title="Flip Vertical"
                  >
                    <FlipVertical size={12} />
                  </SettingButton>
                  <SettingButton
                    active={item.settings.flop}
                    onClick={() => updateSetting("flop", !item.settings.flop)}
                    title="Flip Horizontal"
                  >
                    <FlipHorizontal size={12} />
                  </SettingButton>
                  <SettingButton
                    active={item.settings.grayscale}
                    onClick={() =>
                      updateSetting("grayscale", !item.settings.grayscale)
                    }
                  >
                    B&W
                  </SettingButton>
                </div>
              </div>
            )}

            {showMultiSize && (
              <div className="flex items-center justify-between p-2 bg-black/[0.02] rounded-xl border border-black/[0.03]">
                <div className="flex flex-col">
                  <label className="text-[9px] font-bold text-gray-900 uppercase tracking-tight">
                    Multi-Size Pack
                  </label>
                  <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                    S / M / L Exports
                  </span>
                </div>
                <button
                  onClick={() =>
                    updateSetting("multiSize", !item.settings.multiSize)
                  }
                  className={`w-10 h-5.5 rounded-full relative transition-all ${item.settings.multiSize ? "bg-black" : "bg-black/10"}`}
                >
                  <div
                    className={`absolute top-1 left-1 bg-white w-3.5 h-3.5 rounded-full shadow-sm transition-transform ${item.settings.multiSize ? "translate-x-4.5" : ""}`}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
