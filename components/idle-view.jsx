import React from "react";
import { DropZone } from "./drop-zone";

export const IdleView = ({ onFilesSelect }) => {
  return (
    <div className="flex flex-col items-center justify-start h-full w-full animate-soft pb-8 pt-12">
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-5xl md:text-9xl text-gray-800 font-[family-name:var(--font-pixelify-sans)] font-normal tracking-wide text-balance">
          Layers
        </h1>
        <p className="text-md text-gray-500 font-light tracking-wide max-w-md mx-auto">
          The ultimate media conversion tool. Fast, private, and high-quality.
        </p>
      </div>
      <DropZone onFilesSelect={onFilesSelect} />
    </div>
  );
};
