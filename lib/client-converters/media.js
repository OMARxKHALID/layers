"use client";

import {
  getFFmpeg,
  writeFileToFFmpeg,
  readFileFromFFmpeg,
  createDownloadUrl,
} from "../client-ffmpeg";

import { MIME_TYPE_MAP } from "@/lib/config";

export class ClientMediaConverter {
  static async convert(file, targetExt, settings, onProgress) {
    const ffmpeg = await getFFmpeg();
    if (!ffmpeg) throw new Error("FFmpeg not available");

    const inputName = `input_${Date.now()}.${file.name.split(".").pop()}`;
    const outputName = `output_${Date.now()}.${targetExt}`;

    onProgress?.(5);
    await writeFileToFFmpeg(ffmpeg, file, inputName);
    onProgress?.(15);

    let progressHandler = null;
    if (onProgress) {
      progressHandler = ({ progress }) => {
        // FFmpeg WASM progress is 0 to 1
        const percent = Math.min(Math.round(progress * 80) + 15, 95);
        onProgress(percent);
      };
      ffmpeg.on("progress", progressHandler);
    }

    const args = this.buildArgs(inputName, outputName, targetExt, settings);

    try {
      await ffmpeg.exec(args);
    } finally {
      if (progressHandler) ffmpeg.off("progress", progressHandler);
    }

    onProgress?.(95);
    const data = await readFileFromFFmpeg(ffmpeg, outputName);
    const downloadUrl = createDownloadUrl(
      data,
      MIME_TYPE_MAP[targetExt] || "application/octet-stream",
    );

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    onProgress?.(100);
    return { downloadUrl, targetExt };
  }

  static buildArgs(inputName, outputName, ext, settings) {
    const threadCount =
      typeof navigator !== "undefined" && navigator.hardwareConcurrency
        ? Math.min(navigator.hardwareConcurrency, 2)
        : 2;
    const args = ["-threads", String(threadCount)];

    // Position matters for -ss. Before -i is faster (input seeking).
    if (
      settings.frameOffset &&
      ["png", "jpg", "jpeg", "webp", "avif"].includes(ext)
    ) {
      args.push("-ss", String(settings.frameOffset));
    }

    args.push("-i", inputName);

    const isVideoOutput = ["mp4", "mkv", "webm", "mov"].includes(ext);
    const isImageOutput = ["png", "jpg", "jpeg", "webp", "avif"].includes(ext);

    // Video Filters
    const filters = [];
    if (settings.rotation) {
      if (settings.rotation === 90) filters.push("transpose=1");
      else if (settings.rotation === 180)
        filters.push("transpose=2,transpose=2");
      else if (settings.rotation === 270) filters.push("transpose=2");
    }

    if (settings.flip) filters.push("vflip");
    if (settings.flop) filters.push("hflip");

    if (settings.scale < 100) {
      filters.push(
        `scale=iw*${settings.scale / 100}:ih*${settings.scale / 100}`,
      );
    }

    if (settings.grayscale) filters.push("hue=s=0");

    if (ext === "gif") {
      filters.push(`fps=${settings.fps || 15}`, "scale=480:-1:flags=lanczos");
    }

    if (
      filters.length > 0 &&
      (isVideoOutput || isImageOutput || ext === "gif")
    ) {
      args.push("-vf", filters.join(","));
    }

    // Codec Settings
    if (isVideoOutput) {
      this.addVideoArgs(args, ext, settings);
    } else if (isImageOutput) {
      this.addImageArgs(args, ext, settings);
    } else if (["mp3", "aac", "wav", "flac"].includes(ext)) {
      this.addAudioArgs(args, ext, settings);
    } else if (ext === "gif") {
      args.push("-loop", "0");
    }

    args.push("-y", outputName);
    return args;
  }

  static addVideoArgs(args, ext, settings) {
    if (settings.fps) args.push("-r", String(settings.fps));
    const q = settings.quality || 100;
    const crf = Math.round(51 - ((q - 10) / 90) * 33);

    if (ext === "webm") {
      args.push(
        "-c:v",
        "libvpx",
        "-b:v",
        "1M",
        "-deadline",
        "realtime",
        "-cpu-used",
        "5",
        "-c:a",
        "libvorbis",
      );
    } else {
      const preset = settings.proMode ? "medium" : "ultrafast";
      args.push(
        "-c:v",
        "libx264",
        "-preset",
        preset,
        "-crf",
        String(crf),
        "-c:a",
        "aac",
        "-b:a",
        settings.audioBitrate || "192k",
      );
    }
  }

  static addImageArgs(args, ext, settings) {
    args.push("-frames:v", "1");
    if (settings.frameOffset) {
      // ss must be before -i for efficiency, but buildArgs already handles input.
      // We'll just stick it here for now or fix buildArgs.
    }
    if (ext === "jpg" || ext === "jpeg") {
      const q = settings.quality || 100;
      const qv = Math.max(1, Math.round(31 - ((q - 10) / 90) * 30));
      args.push("-q:v", String(qv));
    }
  }

  static addAudioArgs(args, ext, settings) {
    const bitrate = settings.audioBitrate || "192k";
    const codecMap = {
      mp3: "libmp3lame",
      aac: "aac",
      wav: "pcm_s16le",
      flac: "flac",
    };
    args.push("-c:a", codecMap[ext]);
    if (ext !== "wav" && ext !== "flac") args.push("-b:a", bitrate);
    args.push("-vn");
  }
}
