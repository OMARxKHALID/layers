"use client";

import { ClientMediaConverter } from "./media";
import { ClientImageConverter } from "./image";

export class ClientConverterFactory {
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

    if (isInputMedia || (isTargetMedia && targetExt !== "gif")) {
      if (
        inputExt === "gif" &&
        ["png", "jpg", "jpeg", "webp", "avif"].includes(targetExt)
      ) {
        return ClientImageConverter;
      }
      return ClientMediaConverter;
    }

    return ClientImageConverter;
  }
}
