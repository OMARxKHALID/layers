import sharp from "sharp";
import path from "path";
import { cpus } from "os";

sharp.concurrency(Math.max(1, cpus().length - 1));

export class ImageConverter {
  static async convert(job, settings, onProgress, checkCancelled) {
    if (checkCancelled && (await checkCancelled())) return "cancelled";
    if (onProgress) await onProgress(10);
    let img = sharp(job.inputFile);

    let meta = await img.metadata();
    if (checkCancelled && (await checkCancelled())) return "cancelled";
    if (onProgress) await onProgress(20);

    img = img.rotate(settings.rotation || undefined);

    let currentWidth = meta.width;
    let currentHeight = meta.height;
    if (settings.rotation === 90 || settings.rotation === 270) {
      currentWidth = meta.height;
      currentHeight = meta.width;
    }

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

    if (settings.grayscale) img = img.grayscale();
    if (settings.flip) img = img.flip();
    if (settings.flop) img = img.flop();

    if (!settings.stripMetadata) {
      img = img.withMetadata();
    }

    const q = settings.quality || 100;
    const ext = job.targetExt;

    if (checkCancelled && (await checkCancelled())) return "cancelled";

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

          if (checkCancelled && (await checkCancelled())) return;

          await this.saveImage(sImg, ext, settings, outPath);
          completed++;
          if (onProgress)
            await onProgress(60 + Math.floor((completed / sizes.length) * 30));
        }),
      );

      await this.saveImage(img, ext, settings, job.outputFile);
      outputFiles.push(job.outputFile);
      if (onProgress) await onProgress(95);

      return { outputFiles };
    } else {
      await this.saveImage(img, ext, settings, job.outputFile);
      if (onProgress) await onProgress(95);
    }
  }

  static async saveImage(img, ext, settings, outputPath) {
    const q = settings.quality || 100;
    const pro = settings.proMode;

    const formatMap = {
      jpg: () =>
        img
          .flatten({ background: "#ffffff" })
          .jpeg({ quality: q, mozjpeg: true }),
      jpeg: () =>
        img
          .flatten({ background: "#ffffff" })
          .jpeg({ quality: q, mozjpeg: true }),
      png: () => img.png({ compressionLevel: 9, palette: pro }),
      webp: () =>
        img.webp({
          quality: q,
          lossless: q === 100,
          effort: pro ? 6 : 4,
        }),
      avif: () =>
        img.avif({
          quality: q,
          lossless: q === 100,
          effort: pro ? 9 : 4,
        }),
      gif: () => img.gif(),
    };

    const processor = formatMap[ext.toLowerCase()];
    if (processor) img = processor();

    await img.toFile(outputPath);
  }
}
