"use client";

class PreviewService {
  constructor() {
    this.worker = null;
    this.callbacks = new Map();
    this.isInitialized = false;
  }

  ensureInitialized() {
    if (this.isInitialized || typeof window === "undefined") return;

    this.worker = new Worker("/preview-worker.js");
    this.worker.onmessage = (e) => {
      const { id, blob, error } = e.data;
      const callback = this.callbacks.get(id);
      if (callback) {
        callback(error ? { error } : { blob });
        this.callbacks.delete(id);
      }
    };
    this.isInitialized = true;
  }

  generatePreview(file, id) {
    this.ensureInitialized();
    if (!this.worker) return Promise.reject("Worker not initialized");

    return new Promise((resolve) => {
      this.callbacks.set(id, resolve);
      this.worker.postMessage({ file, id });
    });
  }

  cancelPreview(id) {
    this.callbacks.delete(id);
  }
}

export const previewService = new PreviewService();
