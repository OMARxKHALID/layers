import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import ffprobePath from "@ffprobe-installer/ffprobe";

ffmpeg.setFfmpegPath(ffmpegPath.path);
ffmpeg.setFfprobePath(ffprobePath.path);

export class MediaConverter {
  static async convert(job, settings, onProgress, checkCancelled) {
    if (checkCancelled && (await checkCancelled())) return "cancelled";
    const duration = await new Promise((resolve) => {
      ffmpeg.ffprobe(job.inputFile, (err, metadata) => {
        if (err) resolve(0);
        else resolve(metadata.format.duration || 0);
      });
    });

    return new Promise((resolve, reject) => {
      const ext = job.targetExt;
      const isVideoOutput = ["mp4", "mkv", "webm", "mov"].includes(ext);
      const isImageOutput = ["png", "jpg", "jpeg", "webp", "avif"].includes(
        ext,
      );
      const isAudioInput = /\.(mp3|wav|flac|aac|ogg|m4a)$/i.test(job.inputFile);

      const cmd = ffmpeg();

      if (isVideoOutput && isAudioInput) {
        cmd
          .input("color=c=black:s=1280x720:r=25")
          .inputOptions(["-f", "lavfi"]);
      }

      cmd.input(job.inputFile);

      if (isImageOutput && !isAudioInput && settings.frameOffset) {
        cmd.seekInput(settings.frameOffset);
      }

      cmd.outputOptions(
        "-map_metadata",
        isVideoOutput && isAudioInput ? "1" : "0",
      );
      if (isVideoOutput && isAudioInput) cmd.outputOptions("-shortest");

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
      } else if (isVideoOutput && settings.fps) {
        cmd.fps(settings.fps);
      }

      if (filters.length) cmd.videoFilters(filters);

      const q = settings.quality || 100;
      if (isVideoOutput) {
        const crf = Math.round(51 - ((q - 10) / 90) * 33);
        const preset = settings.proMode ? "medium" : "superfast";
        if (ext === "webm") {
          cmd
            .videoCodec("libvpx-vp9")
            .outputOptions([
              "-b:v",
              "0",
              "-crf",
              String(crf),
              "-preset",
              preset,
              "-deadline",
              settings.proMode ? "good" : "realtime",
            ]);
        } else {
          cmd
            .videoCodec("libx264")
            .audioCodec("aac")
            .outputOptions(["-crf", String(crf), "-preset", preset]);
        }
      } else if (isImageOutput) {
        cmd.frames(1);
        if (ext === "jpg" || ext === "jpeg") {
          const qv = Math.max(1, Math.round(31 - ((q - 10) / 90) * 30));
          cmd.outputOptions("-q:v", String(qv));
        }
      } else if (["mp3", "aac", "wav", "flac"].includes(ext)) {
        const defaultBitrate = settings.proMode ? "192k" : "128k";
        const codecParm = {
          mp3: ["libmp3lame", settings.audioBitrate || defaultBitrate],
          aac: ["aac", settings.audioBitrate || defaultBitrate],
          wav: ["pcm_s16le", null],
          flac: ["flac", null],
        }[ext];
        cmd.audioCodec(codecParm[0]);
        if (codecParm[1]) cmd.audioBitrate(codecParm[1]);
        cmd.noVideo();
      } else if (ext === "gif") {
        cmd.outputOptions(["-loop", "0"]);
      }

      cmd.outputOptions("-threads", "0");

      cmd
        .output(job.outputFile)
        .on("start", (commandLine) => {
          if (job.onCommand) job.onCommand(cmd);
        })
        .on("progress", (p) => {
          let percent = 0;
          if (p.percent) percent = Math.round(p.percent);
          else if (duration > 0 && p.timemark) {
            const parts = p.timemark.split(":");
            const secs =
              parseFloat(parts[0]) * 3600 +
              parseFloat(parts[1]) * 60 +
              parseFloat(parts[2]);
            percent = Math.round((secs / duration) * 100);
          }
          onProgress(Math.min(percent, 99));
        })
        .on("end", () => resolve())
        .on("error", (err) => {
          if (
            err.message &&
            (err.message.includes("SIGKILL") || err.message.includes("SIGTERM"))
          ) {
            return resolve("cancelled");
          }
          reject(err);
        })
        .run();
    });
  }
}
