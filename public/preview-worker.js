// public/preview-worker.js
self.onmessage = async (e) => {
  const { file, id } = e.data;

  try {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(128, 128);
    const ctx = canvas.getContext("2d");

    // Calculate aspect ratio
    const scale = Math.min(128 / bitmap.width, 128 / bitmap.height);
    const w = bitmap.width * scale;
    const h = bitmap.height * scale;
    const x = (128 - w) / 2;
    const y = (128 - h) / 2;

    ctx.drawImage(bitmap, x, y, w, h);
    const blob = await canvas.convertToBlob({
      type: "image/webp",
      quality: 0.7,
    });

    self.postMessage({ id, blob }, [blob]);
    bitmap.close();
  } catch (err) {
    console.error("Worker preview error:", err);
    self.postMessage({ id, error: err.message });
  }
};
