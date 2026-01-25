"use client";

const MIME_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

export class ClientImageConverter {
  static async convert(file, targetExt, settings, onProgress) {
    onProgress?.(10);

    const img = await this.loadImage(file);
    onProgress?.(30);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    let { width, height } = this.calculateDimensions(img, settings);

    canvas.width = width;
    canvas.height = height;

    this.applyTransforms(ctx, img, settings, width, height);
    onProgress?.(50);

    ctx.drawImage(img, 0, 0, width, height);

    if (settings.grayscale) {
      this.applyGrayscale(ctx, width, height);
    }
    onProgress?.(70);

    const blob = await this.canvasToBlob(canvas, targetExt, settings.quality);
    onProgress?.(90);

    const downloadUrl = URL.createObjectURL(blob);
    onProgress?.(100);

    return { downloadUrl, targetExt };
  }

  static loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  static calculateDimensions(img, settings) {
    let width = img.width;
    let height = img.height;

    if (settings.rotation === 90 || settings.rotation === 270) {
      [width, height] = [height, width];
    }

    if (settings.aspectRatio && settings.aspectRatio !== "original") {
      const [wRatio, hRatio] = settings.aspectRatio.split(":").map(Number);
      const targetRatio = wRatio / hRatio;
      const currentRatio = width / height;

      if (currentRatio > targetRatio) {
        width = Math.round(height * targetRatio);
      } else {
        height = Math.round(width / targetRatio);
      }
    }

    if (settings.width || settings.height) {
      if (settings.width && settings.height) {
        width = settings.width;
        height = settings.height;
      } else if (settings.width) {
        const ratio = settings.width / width;
        width = settings.width;
        height = Math.round(height * ratio);
      } else {
        const ratio = settings.height / height;
        height = settings.height;
        width = Math.round(width * ratio);
      }
    } else if (settings.scale < 100) {
      width = Math.round(width * (settings.scale / 100));
      height = Math.round(height * (settings.scale / 100));
    }

    return { width, height };
  }

  static applyTransforms(ctx, img, settings, width, height) {
    ctx.save();

    if (settings.rotation) {
      ctx.translate(width / 2, height / 2);
      ctx.rotate((settings.rotation * Math.PI) / 180);
      ctx.translate(-width / 2, -height / 2);
    }

    if (settings.flip) {
      ctx.scale(1, -1);
      ctx.translate(0, -height);
    }

    if (settings.flop) {
      ctx.scale(-1, 1);
      ctx.translate(-width, 0);
    }

    ctx.restore();
  }

  static applyGrayscale(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  static canvasToBlob(canvas, ext, quality) {
    return new Promise((resolve) => {
      const mimeType = MIME_TYPES[ext] || "image/png";
      const q = (quality || 100) / 100;

      canvas.toBlob(
        (blob) => resolve(blob),
        mimeType,
        ["jpg", "jpeg", "webp"].includes(ext) ? q : undefined,
      );
    });
  }
}
