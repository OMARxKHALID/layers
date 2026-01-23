import sharp from "sharp";
import path from "path";

sharp.concurrency(1);

export class ImageConverter {
  static async convert(job, settings, onProgress) {
    if (onProgress) await onProgress(10);
    let img = sharp(job.inputFile);

    let meta = await img.metadata();
    if (onProgress) await onProgress(20);

    // 1. Initial rotation handling:
    img = img.rotate(settings.rotation || undefined);

    // If we rotated 90 or 270, swap dimensions for calculations
    let currentWidth = meta.width;
    let currentHeight = meta.height;
    if (settings.rotation === 90 || settings.rotation === 270) {
      currentWidth = meta.height;
      currentHeight = meta.width;
    }

    // 2. Aspect Ratio Cropping
    if (settings.aspectRatio && settings.aspectRatio !== "original") {
      const [wRatio, hRatio] = settings.aspectRatio.split(":").map(Number);
      const currentRatio = currentWidth / currentHeight;
      const targetRatio = wRatio / hRatio;

      let cropW = currentWidth;
      let cropH = currentHeight;

      if (currentRatio > targetRatio) {
        cropW = Math.round(currentHeight * targetRatio);
      } else {
        cropH = Math.round(currentWidth / targetRatio);
      }

      img = img.extract({
        left: Math.max(0, Math.round((currentWidth - cropW) / 2)),
        top: Math.max(0, Math.round((currentHeight - cropH) / 2)),
        width: cropW,
        height: cropH,
      });
      currentWidth = cropW;
      currentHeight = cropH;
    }
    if (onProgress) await onProgress(40);

    // 3. Resizing
    if (settings.width || settings.height) {
      img = img.resize({
        width: settings.width || null,
        height: settings.height || null,
        fit: "inside",
        withoutEnlargement: false,
      });
    } else if (settings.scale < 100 && currentWidth) {
      img = img.resize(Math.round((currentWidth * settings.scale) / 100));
    }
    if (onProgress) await onProgress(60);

    // 4. Transformations
    if (settings.grayscale) img = img.grayscale();
    if (settings.flip) img = img.flip();
    if (settings.flop) img = img.flop();

    // Preserve metadata/quality
    img = img.withMetadata();

    const q = settings.quality || 100;
    const ext = job.targetExt;

    // Handle multi-size generation if requested
    if (settings.multiSize) {
      const sizes = [
        { name: "thumb", width: 150 },
        { name: "medium", width: 800 },
        { name: "full", width: null },
      ];

      const dir = path.dirname(job.outputFile);
      const base = path.basename(job.outputFile, `.${ext}`);
      const outputFiles = [];

      let completed = 0;
      await Promise.all(
        sizes.map(async (s) => {
          let sImg = img.clone();
          if (s.width) sImg = sImg.resize(s.width);

          const outPath = path.join(dir, `${base}_${s.name}.${ext}`);
          outputFiles.push(outPath);
          await this.saveImage(sImg, ext, q, outPath);
          completed++;
          if (onProgress)
            await onProgress(60 + Math.floor((completed / sizes.length) * 30));
        }),
      );

      // Also save the default one
      await this.saveImage(img, ext, q, job.outputFile);
      outputFiles.push(job.outputFile);
      if (onProgress) await onProgress(95);

      return { outputFiles };
    } else {
      await this.saveImage(img, ext, q, job.outputFile);
      if (onProgress) await onProgress(95);
    }
  }

  static async saveImage(img, ext, q, outputPath) {
    const formatMap = {
      jpg: () => img.jpeg({ quality: q, mozjpeg: true }),
      jpeg: () => img.jpeg({ quality: q, mozjpeg: true }),
      png: () => img.png({ compressionLevel: q === 100 ? 0 : 9 }),
      webp: () => img.webp({ quality: q, lossless: q === 100 }),
      avif: () => img.avif({ quality: q, lossless: q === 100 }),
      gif: () => img.gif(),
    };

    const processor = formatMap[ext.toLowerCase()];
    if (processor) img = processor();

    await img.toFile(outputPath);
  }
}
