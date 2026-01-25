export const logger = {
  info: (msg, meta = {}) => {
    console.log(
      JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        msg,
        ...meta,
      }),
    );
  },
  error: (msg, error = null, meta = {}) => {
    console.error(
      JSON.stringify({
        level: "error",
        timestamp: new Date().toISOString(),
        msg,
        error: error?.message || error,
        stack: error?.stack,
        ...meta,
      }),
    );
  },
  warn: (msg, meta = {}) => {
    console.warn(
      JSON.stringify({
        level: "warn",
        timestamp: new Date().toISOString(),
        msg,
        ...meta,
      }),
    );
  },
};
