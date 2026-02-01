"use client";

import { MIME_TYPE_MAP } from "@/lib/config";

export class ClientImageConverter {
  static async convert(file, targetExt, settings, onProgress) {
    onProgress?.(10);

    const objectUrl = URL.createObjectURL(file);
    let img;
    try {
      img = await this.loadImage(objectUrl);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
    onProgress?.(30);

    const canvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(1, 1)
        : document.createElement("canvas");

    const ctx = canvas.getContext("2d", {
      willReadFrequently: false, // Set to false since we want GPU acceleration for filters
      alpha: true,
    });

    // 1. Calculate base logical dimensions (considering rotation box)
    const isRotated90 = settings.rotation === 90 || settings.rotation === 270;
    const originalWidth = img.width;
    const originalHeight = img.height;

    // Logical dimensions are what the user "sees" after rotation
    let logicalWidth = isRotated90 ? originalHeight : originalWidth;
    let logicalHeight = isRotated90 ? originalWidth : originalHeight;

    // 2. Define source crop (on the ORIGINAL image coordinates)
    let srcX = 0,
      srcY = 0,
      srcW = originalWidth,
      srcH = originalHeight;

    // 3. Handle Aspect Ratio Cropping
    // This happens on the logical (perceived) dimensions
    if (settings.aspectRatio && settings.aspectRatio !== "original") {
      const [wRatio, hRatio] = settings.aspectRatio.split(":").map(Number);
      const targetRatio = wRatio / hRatio;
      const currentRatio = logicalWidth / logicalHeight;

      if (currentRatio > targetRatio) {
        // Source is wider than target ratio -> crop width
        const newLogicalWidth = logicalHeight * targetRatio;
        const cropDiff = logicalWidth - newLogicalWidth;

        if (isRotated90) {
          srcH = Math.round(newLogicalWidth);
          srcY = Math.round(cropDiff / 2);
        } else {
          srcW = Math.round(newLogicalWidth);
          srcX = Math.round(cropDiff / 2);
        }
        logicalWidth = Math.round(newLogicalWidth);
      } else {
        // Source is taller than target ratio -> crop height
        const newLogicalHeight = logicalWidth / targetRatio;
        const cropDiff = logicalHeight - newLogicalHeight;

        if (isRotated90) {
          srcW = Math.round(newLogicalHeight);
          srcX = Math.round(cropDiff / 2);
        } else {
          srcH = Math.round(newLogicalHeight);
          srcY = Math.round(cropDiff / 2);
        }
        logicalHeight = Math.round(newLogicalHeight);
      }
    }

    // 4. Handle Sizing/Scaling
    let targetWidth = logicalWidth;
    let targetHeight = logicalHeight;

    if (settings.width || settings.height) {
      if (settings.width && settings.height) {
        targetWidth = settings.width;
        targetHeight = settings.height;
      } else if (settings.width) {
        targetWidth = settings.width;
        targetHeight = Math.round(
          logicalHeight * (settings.width / logicalWidth),
        );
      } else {
        targetHeight = settings.height;
        targetWidth = Math.round(
          logicalWidth * (settings.height / logicalHeight),
        );
      }
    } else if (settings.scale < 100) {
      targetWidth = Math.round(logicalWidth * (settings.scale / 100));
      targetHeight = Math.round(logicalHeight * (settings.scale / 100));
    }

    // 5. Finalize Canvas Size
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // 6. Apply Transformations and Draw
    ctx.save();

    // Move to center to perform rotation/scaling
    ctx.translate(targetWidth / 2, targetHeight / 2);

    if (settings.rotation) {
      ctx.rotate((settings.rotation * Math.PI) / 180);
    }

    const scaleX = settings.flop ? -1 : 1;
    const scaleY = settings.flip ? -1 : 1;
    if (scaleX !== 1 || scaleY !== 1) {
      ctx.scale(scaleX, scaleY);
    }

    // When drawing, we need to draw the cropped source area.
    // The 'draw target box' is the un-rotated version of our targetWidth/targetHeight.
    const drawW = isRotated90 ? targetHeight : targetWidth;
    const drawH = isRotated90 ? targetWidth : targetHeight;

    if (settings.grayscale) {
      ctx.filter = "grayscale(100%)";
    }

    ctx.drawImage(
      img,
      srcX,
      srcY,
      srcW,
      srcH, // Source: The calculated crop
      -drawW / 2,
      -drawH / 2, // Destination: Centered
      drawW,
      drawH, // Destination: Scaled
    );

    ctx.restore();
    onProgress?.(80);

    const blob = await this.canvasToBlob(canvas, targetExt, settings.quality);
    onProgress?.(100);

    return {
      downloadUrl: URL.createObjectURL(blob),
      targetExt,
    };
  }

  static loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });
  }

  // Removed applyGrayscale manual loop in favor of ctx.filter GPU acceleration

  static canvasToBlob(canvas, ext, quality) {
    const mimeType = MIME_TYPE_MAP[ext] || "image/png";
    const blobOptions = {
      type: mimeType,
      quality: ["jpg", "jpeg", "webp"].includes(ext)
        ? (quality || 100) / 100
        : undefined,
    };

    if (canvas instanceof OffscreenCanvas) {
      return canvas.convertToBlob(blobOptions);
    }

    return new Promise((resolve) =>
      canvas.toBlob(resolve, mimeType, blobOptions.quality),
    );
  }
}
