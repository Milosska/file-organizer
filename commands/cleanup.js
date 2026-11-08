import { Cleanup } from "../lib/cleanup.js";
import { drawProgressBar } from "../lib/utils/utils.js";

export async function runCleanupCommand(directory, olderThan, confirm) {
  try {
    const cleanup = new Cleanup(directory, olderThan, confirm);

    cleanup.once("cleanup-start", (directory, period) => {
      console.log(
        `🧹 Cleanup: ${directory}` +
          `\n Looking for files older than ${period} days...`,
      );
    });

    cleanup.on("file-found", (total, count, fileReport) => {
      const startLine = count > 0 ? "" : `\nFound ${total} files to delete:\n`;
      const topSeparator =
        count === 0 ? "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" : "";
      const bottomSeparator =
        count === total - 1 ? "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" : "";

      console.log(startLine + topSeparator + fileReport + bottomSeparator);
    });

    let isFirstRender = true;
    cleanup.on("file-deleted", (total, current) => {
      if (!isFirstRender) {
        process.stdout.write("\x1B[2F");
        process.stdout.write("\x1B[J");
      }

      process.stdout.write(
        `\nDeleting...  ${drawProgressBar(current, total)}\n`,
      );

      isFirstRender = false;
    });

    cleanup.on("cleanup-complete", (message) => {
      console.log(message);
    });

    await cleanup.cleanupFiles();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}
