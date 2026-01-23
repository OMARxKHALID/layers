import { MediaConverter } from "./media";
import { ImageConverter } from "./image";

export class ConverterFactory {
  static getConverter(inputPath, targetExt) {
    const inputExt = inputPath.split(".").pop().toLowerCase();
    const mediaExts = [
      "mp4",
      "mp3",
      "wav",
      "mkv",
      "webm",
      "mov",
      "aac",
      "flac",
      "avi",
      "wmv",
      "flv",
      "3gp",
      "ogg",
      "m4a",
    ];

    const isInputMedia = mediaExts.includes(inputExt);
    const isTargetMedia = mediaExts.includes(targetExt);

    // Video/Audio input or Media output (except GIF output from Image input)
    // should generally go to MediaConverter
    if (isInputMedia || (isTargetMedia && targetExt !== "gif")) {
      // Exception: GIF to static image (sharp is better)
      if (
        inputExt === "gif" &&
        ["png", "jpg", "jpeg", "webp", "avif"].includes(targetExt)
      ) {
        return ImageConverter;
      }
      return MediaConverter;
    }

    // Default to ImageConverter for Image-to-Image (including Image-to-GIF)
    return ImageConverter;
  }
}
