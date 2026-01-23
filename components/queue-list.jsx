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
}) => {
  return (
    <div className="h-full overflow-y-auto px-2 pr-4 custom-scrollbar flex flex-col gap-3 pb-6">
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
        />
      ))}
    </div>
  );
};
