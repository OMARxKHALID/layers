export function getFriendlyErrorMessage(error) {
  if (!error) return "An unknown error occurred";

  const msg = typeof error === "string" ? error : error.message || "";

  if (
    msg.includes("ffmpeg exited with code") ||
    msg.includes("Invalid argument")
  ) {
    if (msg.includes(".mp3") || msg.includes(".wav") || msg.includes(".aac")) {
      return "Failed to process audio. The source file might be corrupted or incompatible.";
    }
    if (msg.includes(".mp4") || msg.includes(".mkv") || msg.includes(".webm")) {
      return "Failed to process video. Please check if the file is a valid media format.";
    }
    return "Conversion failed. Please try a different output format or check your settings.";
  }

  if (msg.includes("ENOENT") || msg.includes("no such file")) {
    return "File not found. It may have been moved or deleted during processing.";
  }

  if (msg.includes("Upload failed") || msg.includes("fetch")) {
    return "Connection lost. Please check your internet and try again.";
  }

  return "Something went wrong during conversion. Please try again.";
}
