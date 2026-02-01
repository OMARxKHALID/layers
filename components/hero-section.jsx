import React from "react";
import { DropZone } from "./drop-zone";

export const HeroSection = ({ onFilesSelect }) => {
  return (
    <div className="flex flex-col items-center justify-start h-full w-full animate-soft pb-2 pt-2 md:pt-4">
      <div className="text-center mb-2 md:mb-3 space-y-0.5">
        <h1 className="text-2xl md:text-5xl text-mascot-orange font-(family-name:--font-pixelify-sans) font-normal tracking-wide text-balance">
          Layers
        </h1>
        <p className="text-[10px] md:text-sm text-gray-500 font-light tracking-wide max-w-sm md:max-w-xl mx-auto px-4 leading-relaxed">
          The ultimate media conversion tool. Fast, private, and high-quality.
        </p>
      </div>
      <DropZone onFilesSelect={onFilesSelect} />
    </div>
  );
};
