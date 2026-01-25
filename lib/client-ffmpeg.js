"use client";

let ffmpegInstance = null;
let loadPromise = null;

async function toBlobURL(url, type) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const blob = new Blob([buf], { type });
  return URL.createObjectURL(blob);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function getFFmpeg() {
  if (typeof window === "undefined") return null;
  if (ffmpegInstance) return ffmpegInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      await loadScript("/ffmpeg/ffmpeg.js");

      // The UMD build of @ffmpeg/ffmpeg exports to window.FFmpegWASM
      const FFmpegLib = window.FFmpegWASM;
      if (!FFmpegLib || !FFmpegLib.FFmpeg) {
        throw new Error(
          "FFmpeg script loaded but window.FFmpegWASM.FFmpeg not found",
        );
      }

      const ffmpeg = new FFmpegLib.FFmpeg();

      ffmpeg.on("log", ({ message }) => {
        console.log("[FFmpeg]", message);
      });

      await ffmpeg.load({
        coreURL: await toBlobURL("/ffmpeg/ffmpeg-core.js", "text/javascript"),
        wasmURL: await toBlobURL(
          "/ffmpeg/ffmpeg-core.wasm",
          "application/wasm",
        ),
      });

      ffmpegInstance = ffmpeg;
      return ffmpeg;
    } catch (error) {
      console.error("FFmpeg initialization failed:", error);
      loadPromise = null;
      throw error;
    }
  })();

  return loadPromise;
}

export async function writeFileToFFmpeg(ffmpeg, file, filename) {
  const data = await file.arrayBuffer();
  await ffmpeg.writeFile(filename, new Uint8Array(data));
}

export async function readFileFromFFmpeg(ffmpeg, filename) {
  return await ffmpeg.readFile(filename);
}

export function createDownloadUrl(data, mimeType) {
  const blob = new Blob([data], { type: mimeType });
  return URL.createObjectURL(blob);
}
