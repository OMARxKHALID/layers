import { useState, useEffect } from "react";

export const useGlobalDrag = (onDropFiles) => {
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);

  useEffect(() => {
    const handleDragOver = (e) => {
      e.preventDefault();
      setIsGlobalDragging(true);
    };
    const handleDragLeave = (e) => {
      e.preventDefault();
      if (!e.relatedTarget) setIsGlobalDragging(false);
    };
    const handleDrop = (e) => {
      e.preventDefault();
      setIsGlobalDragging(false);
      if (e.dataTransfer.files?.length) {
        onDropFiles(Array.from(e.dataTransfer.files));
      }
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [onDropFiles]);

  return { isGlobalDragging };
};
