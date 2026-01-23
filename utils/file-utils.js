import {
  MIME_TYPE_MAP,
  MAX_FILE_SIZE_BYTES,
  CONVERSION_OPTIONS,
  MAX_FILE_SIZE_MB,
} from "@/lib/config";

export function getMimeType(file) {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return MIME_TYPE_MAP[ext] || "";
}

export function validateFile(file) {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File too large (Max ${MAX_FILE_SIZE_MB}MB)`,
    };
  }

  const mime = getMimeType(file);
  const supported = CONVERSION_OPTIONS.some((opt) =>
    opt.accepts.includes(mime),
  );

  if (!supported) {
    return { valid: false, error: "Unsupported file type" };
  }

  return { valid: true };
}
