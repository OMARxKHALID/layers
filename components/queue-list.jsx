import React from "react";
import { FileCard } from "./file-card";

export const QueueList = ({
  queue,
  onRemove,
  onCancel,
  onFormatChange,
  onSettingsChange,
  onNameChange,
  onCompare,
  onConvert,
}) => {
  return (
    <div className="flex flex-col gap-2 pb-6">
      {queue.map((item) => (
        <FileCard
          key={item.id}
          item={item}
          onRemove={onRemove}
          onCancel={onCancel}
          onFormatChange={onFormatChange}
          onSettingsChange={onSettingsChange}
          onNameChange={onNameChange}
          onCompare={onCompare}
          onConvert={onConvert}
        />
      ))}
    </div>
  );
};
