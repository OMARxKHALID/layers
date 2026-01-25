"use client";

import {
  getFFmpeg,
  writeFileToFFmpeg,
  readFileFromFFmpeg,
  createDownloadUrl,
} from "../client-ffmpeg";

const MIME_TYPES = {
  mp4: "video/mp4",
  mkv: "video/x-matroska",
  webm: "video/webm",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  aac: "audio/aac",
  flac: "audio/flac",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

export class ClientMediaConverter {
  static async convert(file, targetExt, settings, onProgress) {
    const ffmpeg = await getFFmpeg();
    if (!ffmpeg) throw new Error("FFmpeg not available");

    const inputName = `input_${Date.now()}.${file.name.split(".").pop()}`;
    const outputName = `output_${Date.now()}.${targetExt}`;

    onProgress?.(5);

    await writeFileToFFmpeg(ffmpeg, file, inputName);
    onProgress?.(15);

    let duration = 0;
    const logHandler = ({ message }) => {
      if (message.includes("Duration:")) {
        const match = message.match(
          /Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/,
        );
        if (match) {
          const hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          const seconds = parseInt(match[3]);
          duration = hours * 3600 + minutes * 60 + seconds;
        }
      }

      if (message.includes("time=")) {
        const match = message.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
        if (match && duration > 0) {
          const hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          const seconds = parseInt(match[3]);
          const currentTime = hours * 3600 + minutes * 60 + seconds;
          const ratio = currentTime / duration;
          const percent = Math.min(Math.round(ratio * 80) + 15, 95);
          onProgress?.(percent);
        }
      }
    };

    ffmpeg.on("log", logHandler);

    let progressHandler = null;
    if (onProgress) {
      progressHandler = ({ progress }) => {
        const percent = Math.min(Math.round(progress * 80) + 15, 95);
        onProgress(percent);
      };
      ffmpeg.on("progress", progressHandler);
    }

    const args = this.buildArgs(inputName, outputName, targetExt, settings);

    try {
      await ffmpeg.exec(args);
    } finally {
      ffmpeg.off("log", logHandler);
      if (progressHandler) {
        ffmpeg.off("progress", progressHandler);
      }
    }

    onProgress?.(95);

    const data = await readFileFromFFmpeg(ffmpeg, outputName);
    const mimeType = MIME_TYPES[targetExt] || "application/octet-stream";
    const downloadUrl = createDownloadUrl(data, mimeType);

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    onProgress?.(100);

    return { downloadUrl, targetExt };
  }

  static buildArgs(inputName, outputName, ext, settings) {
    const args = ["-threads", "1", "-i", inputName];
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
    if (settings.scale < 100) {
      filters.push(
        `scale=iw*${settings.scale / 100}:ih*${settings.scale / 100}`,
      );
    }
    if (settings.grayscale) filters.push("hue=s=0");
    if (ext === "gif") {
      filters.push(`fps=${settings.fps || 15}`, "scale=480:-1:flags=lanczos");
    }
    if (filters.length) args.push("-vf", filters.join(","));

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

    // Quality & Codec
    const q = settings.quality || 100;
    const crf = Math.round(51 - ((q - 10) / 90) * 33);

    if (ext === "webm") {
      // VP8 + Vorbis allows for safe single-threaded WASM execution
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
      // H.264 + AAC
      args.push(
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
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
      args.unshift("-ss", String(settings.frameOffset));
    }
    if (ext === "jpg" || ext === "jpeg") {
      const qv = Math.max(1, Math.round(31 - ((q - 10) / 90) * 30));
      args.push("-q:v", String(qv));
    }
  }

  static addAudioArgs(args, ext, settings) {
    const bitrate = settings.audioBitrate || "192k";
    const codecMap = {
      mp3: ["libmp3lame", bitrate],
      aac: ["aac", bitrate],
      wav: ["pcm_s16le", null],
      flac: ["flac", null],
    };
    const [codec, br] = codecMap[ext];
    args.push("-c:a", codec);
    if (br) args.push("-b:a", br);
    args.push("-vn");
  }
}
