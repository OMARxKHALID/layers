export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { runCleanup, restoreQueue } = await import("./utils/server-utils");

      // Recover pending jobs on startup
      restoreQueue().catch(console.error);

      // Run cleanup every 10 minutes
      setInterval(
        () => {
          runCleanup().catch(console.error);
        },
        10 * 60 * 1000,
      );
    } catch (e) {
      console.error("Failed to register cleanup task", e);
    }
  }
}
