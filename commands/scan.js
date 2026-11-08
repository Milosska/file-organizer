import { Scanner } from "../lib/scanner.js";
import { drawProgressBar } from "../lib/utils.js";

export async function runScanCommand(directory) {
  try {
    const scanner = new Scanner(directory);

    scanner.once("scan-start", (path) => {
      console.log(`📂 Scanning: ${path}`);
    });

    let isFirstRender = true;
    scanner.on("file-found", ({ current, total, fileInfo }) => {
      if (!isFirstRender) {
        // Return to the beginning of the previous status block
        process.stdout.write("\x1B[7F");
        // Clear everything below the cursor
        process.stdout.write("\x1B[J");
      }

      process.stdout.write(
        `Processing... ${drawProgressBar(current, total)}\n` +
          "\n📄 File found:" +
          fileInfo +
          "\n",
      );

      isFirstRender = false;
    });

    scanner.once("scan-complete", (statistics) => {
      console.log(`\n\n 📊 Scan Results: \n ${"━".repeat(60)} ${statistics}`);
    });

    await scanner.scan();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}
