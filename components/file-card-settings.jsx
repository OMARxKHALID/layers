import React from "react";
import { RotateCcw, FlipVertical, FlipHorizontal } from "lucide-react";

export const SettingLabel = ({ children, extra }) => (
  <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-0.5">
    <label>{children}</label>
    {extra && (
      <span className="text-mascot-orange font-bold drop-shadow-sm">
        {extra}
      </span>
    )}
  </div>
);

export const SettingButton = ({
  active,
  onClick,
  children,
  title,
  className = "",
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`px-2 py-1 rounded-lg font-bold border transition-all text-[10px] ${
      active
        ? "bg-gray-800 text-white border-transparent"
        : "bg-white/40 text-gray-800 border-white/20"
    } ${className}`}
  >
    {children}
  </button>
);

export const NumericInput = ({
  value,
  onChange,
  placeholder,
  unit,
  step = "1",
  min = "0",
}) => (
  <div className="relative grow">
    <input
      type="number"
      step={step}
      min={min}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/55 border border-black/10 rounded-lg pl-3 pr-8 py-1.5 text-[11px] font-bold focus:bg-white focus:border-mascot-orange/30 outline-none transition-all placeholder:text-gray-400 text-gray-800 shadow-inner"
    />
    {unit && (
      <span className="absolute right-2.5 top-2 text-[8px] text-gray-600 font-bold uppercase pointer-events-none">
        {unit}
      </span>
    )}
  </div>
);

export const FileCardSettings = React.memo(
  ({
    item,
    updateSetting,
    updateSettings,
    showQuality,
    isVideoOutput,
    showAudioSettings,
    showVideoToImage,
    showAspectRatio,
    showDimensions,
    showTransforms,
    showMultiSize,
  }) => {
    const { settings } = item;

    const handleDimensionChange = (key, value) => {
      const val = parseInt(value);
      if (val > 0) {
        updateSetting(key, val);
        updateSetting("scale", 100);
      } else if (!value) {
        updateSetting(key, null);
      }
    };

    const hasTransforms =
      (settings.rotation || 0) !== 0 ||
      settings.flip ||
      settings.flop ||
      settings.grayscale;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 px-1 animate-soft origin-top transition-all duration-500 ease-out">
        <div className="space-y-2.5">
          {showQuality && (
            <div>
              <SettingLabel extra={`${settings.quality}%`}>
                Quality / CRF
              </SettingLabel>
              <input
                type="range"
                min="10"
                max="100"
                value={settings.quality}
                onChange={(e) =>
                  updateSetting("quality", parseInt(e.target.value))
                }
                className="w-full h-1 bg-black/5 rounded-full appearance-none accent-black cursor-pointer"
              />
            </div>
          )}

          {showDimensions && (
            <div>
              <SettingLabel>Target Dimensions</SettingLabel>
              <div className="flex items-center gap-2">
                <NumericInput
                  placeholder="Width"
                  unit="PX"
                  value={settings.width}
                  onChange={(v) => handleDimensionChange("width", v)}
                />
                <span className="text-black/10">×</span>
                <NumericInput
                  placeholder="Height"
                  unit="PX"
                  value={settings.height}
                  onChange={(v) => handleDimensionChange("height", v)}
                />
              </div>
            </div>
          )}

          {showQuality && !settings.width && !settings.height && (
            <div>
              <SettingLabel extra={`${settings.scale}%`}>Scaling</SettingLabel>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={settings.scale}
                onChange={(e) =>
                  updateSetting("scale", parseInt(e.target.value))
                }
                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none accent-gray-800 cursor-pointer"
              />
            </div>
          )}

          {showAspectRatio && (
            <div>
              <SettingLabel>Aspect Ratio / Cropping</SettingLabel>
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
                    active={settings.aspectRatio === r.value}
                    onClick={() => updateSetting("aspectRatio", r.value)}
                  >
                    {r.label}
                  </SettingButton>
                ))}
              </div>
            </div>
          )}

          {isVideoOutput && (
            <div>
              <SettingLabel extra={`${settings.fps || "Auto"} FPS`}>
                Frame Rate
              </SettingLabel>
              <div className="flex gap-1.5">
                {[null, 24, 30, 60].map((v) => (
                  <SettingButton
                    key={String(v)}
                    active={settings.fps === v}
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
              <SettingLabel extra={settings.audioBitrate || "192k"}>
                Audio Bitrate
              </SettingLabel>
              <div className="flex flex-wrap gap-1.5">
                {["128k", "192k", "256k", "320k"].map((v) => (
                  <SettingButton
                    key={v}
                    active={settings.audioBitrate === v}
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
              <SettingLabel extra={`${settings.frameOffset || 0}s`}>
                Capture Frame at
              </SettingLabel>
              <NumericInput
                step="0.1"
                unit="SEC"
                placeholder="0.0"
                value={settings.frameOffset}
                onChange={(val) =>
                  updateSetting("frameOffset", parseFloat(val) || 0)
                }
              />
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          {showTransforms && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <SettingLabel>Visual Transformations</SettingLabel>
                {hasTransforms && (
                  <button
                    onClick={() => {
                      updateSettings({
                        rotation: 0,
                        flip: false,
                        flop: false,
                        grayscale: false,
                        proMode: false,
                        stripMetadata: false,
                      });
                    }}
                    className="text-[9px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-tight"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="flex gap-1.5">
                <SettingButton
                  active={(settings.rotation || 0) !== 0}
                  onClick={() =>
                    updateSetting(
                      "rotation",
                      ((settings.rotation || 0) + 90) % 360,
                    )
                  }
                  title="Rotate 90°"
                >
                  <div className="flex items-center gap-1">
                    <RotateCcw size={14} />
                    {settings.rotation !== 0 && (
                      <span>{settings.rotation}°</span>
                    )}
                  </div>
                </SettingButton>
                <SettingButton
                  active={settings.flip}
                  onClick={() => updateSetting("flip", !settings.flip)}
                  title="Flip Vertical"
                >
                  <FlipVertical size={14} />
                </SettingButton>
                <SettingButton
                  active={settings.flop}
                  onClick={() => updateSetting("flop", !settings.flop)}
                  title="Flip Horizontal"
                >
                  <FlipHorizontal size={14} />
                </SettingButton>
                <SettingButton
                  active={settings.grayscale}
                  onClick={() =>
                    updateSetting("grayscale", !settings.grayscale)
                  }
                >
                  B&W
                </SettingButton>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            {showMultiSize && (
              <div className="flex items-center justify-between p-2.5 bg-white/50 rounded-xl border border-white/60 shadow-sm transition-all hover:bg-white/60">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-tight">
                    Multi-Size Pack
                  </label>
                  <span className="text-[9px] text-gray-400 font-medium tracking-wide">
                    S / M / L Exports
                  </span>
                </div>
                <button
                  onClick={() =>
                    updateSetting("multiSize", !settings.multiSize)
                  }
                  className={`w-8 h-4.5 rounded-full relative transition-all ${settings.multiSize ? "bg-gray-800" : "bg-gray-200"}`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 bg-white w-3.5 h-3.5 rounded-full transition-transform ${settings.multiSize ? "translate-x-3.5" : ""}`}
                  />
                </button>
              </div>
            )}

            {(isVideoOutput || showQuality) && (
              <div className="flex items-center justify-between p-2.5 bg-white/50 rounded-xl border border-white/60 shadow-sm transition-all hover:bg-white/60">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-tight">
                    Professional Mode
                  </label>
                  <span className="text-[9px] text-gray-400 font-medium tracking-wide">
                    Max Compression (Slower)
                  </span>
                </div>
                <button
                  onClick={() => updateSetting("proMode", !settings.proMode)}
                  className={`w-8 h-4.5 rounded-full relative transition-all ${settings.proMode ? "bg-gray-800" : "bg-gray-200"}`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 bg-white w-3.5 h-3.5 rounded-full transition-transform ${settings.proMode ? "translate-x-3.5" : ""}`}
                  />
                </button>
              </div>
            )}

            {showQuality && !isVideoOutput && (
              <div className="flex items-center justify-between p-2.5 bg-white/50 rounded-xl border border-white/60 shadow-sm transition-all hover:bg-white/60">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-tight">
                    Strip Metadata
                  </label>
                  <span className="text-[9px] text-gray-400 font-medium tracking-wide">
                    Remove EXIF / Privacy
                  </span>
                </div>
                <button
                  onClick={() =>
                    updateSetting("stripMetadata", !settings.stripMetadata)
                  }
                  className={`w-8 h-4.5 rounded-full relative transition-all ${settings.stripMetadata ? "bg-gray-800" : "bg-gray-200"}`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 bg-white w-3.5 h-3.5 rounded-full transition-transform ${settings.stripMetadata ? "translate-x-3.5" : ""}`}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);
