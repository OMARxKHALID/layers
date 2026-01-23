import React from "react";
import { RotateCcw, FlipVertical, FlipHorizontal } from "lucide-react";

export const SettingLabel = ({ children, extra }) => (
  <div className="flex justify-between text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">
    <label>{children}</label>
    {extra && <span className="text-gray-900 font-semibold">{extra}</span>}
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
    className={`px-3 py-1.5 rounded-lg font-medium border transition-all text-xs ${
      active
        ? "bg-gray-800 text-white border-transparent shadow-md"
        : "bg-white/40 text-gray-600 border-white/20"
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
  <div className="relative flex-grow">
    <input
      type="number"
      step={step}
      min={min}
      placeholder={placeholder}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/40 border border-white/20 rounded-xl pl-3 pr-8 py-2 text-xs font-medium focus:bg-white focus:border-black/5 outline-none transition-all placeholder:text-gray-400 text-gray-800 shadow-sm"
    />
    {unit && (
      <span className="absolute right-3 top-2.5 text-[9px] text-gray-400 font-bold uppercase pointer-events-none">
        {unit}
      </span>
    )}
  </div>
);

export const FileCardSettings = ({
  item,
  updateSetting,
  showQuality,
  isVideoOutput,
  showAudioSettings,
  showVideoToImage,
  showAspectRatio,
  showDimensions,
  showTransforms,
  showMultiSize,
}) => {
  return (
    <div className="mt-4 pt-4 border-t border-black/[0.04] grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 px-1 animate-soft origin-top transition-all duration-500 ease-out">
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
                  const val = parseInt(v);
                  if (val > 0) {
                    updateSetting("width", val);
                    updateSetting("scale", 100);
                  } else if (!v) {
                    updateSetting("width", null);
                  }
                }}
              />
              <span className="text-black/10">×</span>
              <NumericInput
                placeholder="Height"
                unit="PX"
                value={item.settings.height}
                onChange={(v) => {
                  const val = parseInt(v);
                  if (val > 0) {
                    updateSetting("height", val);
                    updateSetting("scale", 100);
                  } else if (!v) {
                    updateSetting("height", null);
                  }
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
              onChange={(e) => updateSetting("scale", parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-full appearance-none accent-gray-800 cursor-pointer"
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
                  <RotateCcw size={14} />
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
                <FlipVertical size={14} />
              </SettingButton>
              <SettingButton
                active={item.settings.flop}
                onClick={() => updateSetting("flop", !item.settings.flop)}
                title="Flip Horizontal"
              >
                <FlipHorizontal size={14} />
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
          <div className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white/20">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-tight">
                Multi-Size Pack
              </label>
              <span className="text-[9px] text-gray-400 font-medium tracking-wide mt-0.5">
                S / M / L Exports
              </span>
            </div>
            <button
              onClick={() =>
                updateSetting("multiSize", !item.settings.multiSize)
              }
              className={`w-10 h-6 rounded-full relative transition-all ${item.settings.multiSize ? "bg-gray-800" : "bg-gray-200"}`}
            >
              <div
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${item.settings.multiSize ? "translate-x-4" : ""}`}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
