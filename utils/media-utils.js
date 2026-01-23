export const getFileMetadata = (file) => {
  return new Promise((resolve) => {
    if (file.type.startsWith("image/")) {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => resolve({});
      img.src = URL.createObjectURL(file);
    } else if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
        });
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => resolve({});
      video.src = URL.createObjectURL(file);
    } else {
      resolve({});
    }
  });
};

export const suggestFormat = (mime, file) => {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (mime.startsWith("image/")) {
    if (ext === "webp") return "to-jpg";
    return "to-webp";
  }
  if (mime.startsWith("video/")) {
    if (ext === "mp4") return "to-webm";
    return "to-mp4";
  }
  if (mime.startsWith("audio/")) {
    if (ext === "mp3") return "to-wav";
    return "to-mp3";
  }
  return null;
};
