export const MAX_FILE_SIZE_MB = 100;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const AppState = {
  IDLE: "idle",
  QUEUE_ACTIVE: "queue_active",
};

export const ConversionCategory = {
  AUDIO_VIDEO: "Audio / Video",
  IMAGE: "Image",
};

export const ExecutionMode = {
  CLIENT: "client",
  SERVER: "server",
};

export const ConversionFormat = {
  TO_MP3: "to-mp3",
  TO_WAV: "to-wav",
  TO_AAC: "to-aac",
  TO_FLAC: "to-flac",
  TO_MP4: "to-mp4",
  TO_MKV: "to-mkv",
  TO_WEBM: "to-webm",
  TO_MOV: "to-mov",
  TO_JPG: "to-jpg",
  TO_PNG: "to-png",
  TO_WEBP: "to-webp",
  TO_AVIF: "to-avif",
  TO_GIF: "to-gif",
};

export const MIME_TYPE_MAP = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  aac: "audio/aac",
  ogg: "audio/ogg",
  flac: "audio/flac",
  m4a: "audio/mp4",
  mp4: "video/mp4",
  mkv: "video/x-matroska",
  webm: "video/webm",
  avi: "video/x-msvideo",
  mov: "video/quicktime",
  wmv: "video/x-ms-wmv",
  flv: "video/x-flv",
  "3gp": "video/3gpp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  bmp: "image/bmp",
  tiff: "image/tiff",
};

export const SUPPORTED_MIME_TYPES = Object.values(MIME_TYPE_MAP);

const AUDIO_MIMES = [
  "audio/mpeg",
  "audio/wav",
  "audio/aac",
  "audio/ogg",
  "audio/flac",
  "audio/mp4",
];
const VIDEO_MIMES = [
  "video/mp4",
  "video/x-matroska",
  "video/webm",
  "video/x-msvideo",
  "video/quicktime",
  "video/x-ms-wmv",
  "video/x-flv",
  "video/3gpp",
];
const IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/bmp",
  "image/tiff",
];

export const MIME_GROUPS = {
  AUDIO: AUDIO_MIMES,
  VIDEO: VIDEO_MIMES,
  IMAGE: IMAGE_MIMES,
};

const MEDIA_ACCEPT = [...AUDIO_MIMES, ...VIDEO_MIMES];

export const CONVERSION_OPTIONS = [
  ...[
    { id: ConversionFormat.TO_MP3, label: "MP3", targetExt: "mp3" },
    { id: ConversionFormat.TO_WAV, label: "WAV", targetExt: "wav" },
    { id: ConversionFormat.TO_AAC, label: "AAC", targetExt: "aac" },
    { id: ConversionFormat.TO_FLAC, label: "FLAC", targetExt: "flac" },
  ].map((o) => ({
    ...o,
    category: ConversionCategory.AUDIO_VIDEO,
    accepts: MEDIA_ACCEPT,
  })),

  ...[
    { id: ConversionFormat.TO_MP4, label: "MP4", targetExt: "mp4" },
    { id: ConversionFormat.TO_WEBM, label: "WEBM", targetExt: "webm" },
    { id: ConversionFormat.TO_MOV, label: "MOV", targetExt: "mov" },
    { id: ConversionFormat.TO_MKV, label: "MKV", targetExt: "mkv" },
  ].map((o) => ({
    ...o,
    category: ConversionCategory.AUDIO_VIDEO,
    accepts: VIDEO_MIMES,
  })),

  ...[
    { id: ConversionFormat.TO_JPG, label: "JPG", targetExt: "jpg" },
    { id: ConversionFormat.TO_PNG, label: "PNG", targetExt: "png" },
    { id: ConversionFormat.TO_WEBP, label: "WEBP", targetExt: "webp" },
    { id: ConversionFormat.TO_AVIF, label: "AVIF", targetExt: "avif" },
    { id: ConversionFormat.TO_GIF, label: "GIF", targetExt: "gif" },
  ].map((o) => ({
    ...o,
    category: ConversionCategory.IMAGE,
    accepts: [...IMAGE_MIMES, ...VIDEO_MIMES],
  })),
];
