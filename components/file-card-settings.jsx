import React from "react";
import { RotateCcw, FlipVertical, FlipHorizontal } from "lucide-react";

export const SettingLabel = ({ children, extra }) => (
  <div className="flex justify-between text-[9px] font-bold text-black/50 uppercase tracking-[0.1em] mb-1.5">
    <label>{children}</label>
    {extra && <span className="text-black">{extra}</span>}
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
    className={`px-3 py-1.5 rounded-lg font-bold border transition-all text-[9px] ${
      active
        ? "bg-black text-white border-black shadow-sm"
        : "bg-black/[0.02] text-gray-500 border-black/[0.02] hover:border-black/10"
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
      className="w-full bg-black/[0.03] border border-black/[0.05] rounded-xl pl-3 pr-8 py-2 text-[12px] font-bold focus:bg-white focus:border-black/20 outline-none transition-all placeholder:font-medium placeholder:text-black/20"
    />
    {unit && (
      <span className="absolute right-3 top-2.5 text-[8px] text-black/30 font-bold uppercase pointer-events-none">
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
              onChange={(e) => updateSetting("scale", parseInt(e.target.value))}
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
  );
};
