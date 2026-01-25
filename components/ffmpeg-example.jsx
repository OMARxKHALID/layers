"use client";

import React, { useState } from "react";
import {
  getFFmpeg,
  writeFileToFFmpeg,
  readFileFromFFmpeg,
  createDownloadUrl,
} from "@/lib/client-ffmpeg";

export default function FfmpegExample() {
  const [status, setStatus] = useState("Idle");

  const runConversion = async (file) => {
    try {
      setStatus("Initializing...");
      const ffmpeg = await getFFmpeg();

      setStatus("Writing file...");
      await writeFileToFFmpeg(ffmpeg, file, "input.mp4");

      setStatus("Converting...");
      await ffmpeg.exec(["-i", "input.mp4", "output.webm"]);

      setStatus("Reading result...");
      const data = await readFileFromFFmpeg(ffmpeg, "output.webm");
      const url = createDownloadUrl(data, "video/webm");

      const a = document.createElement("a");
      a.href = url;
      a.download = "converted.webm";
      a.click();

      setStatus("Success!");
    } catch (error) {
      console.error(error);
      setStatus("Error: " + error.message);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => e.target.files[0] && runConversion(e.target.files[0])}
      />
      <p>Status: {status}</p>
    </div>
  );
}
