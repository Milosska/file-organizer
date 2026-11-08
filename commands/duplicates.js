import { Duplicates } from "../lib/duplicates.js";
import { drawProgressBar } from "../lib/utils.js";

export async function runDuplicatesCommand(directory) {
  try {
    const duplicates = new Duplicates(directory);

    duplicates.once("duplicates-start", (path) => {
      console.log(`🔍 Searching for duplicates in: ${path}`);
    });

    let isFirstRender = true;
    duplicates.on("file-processed", ({ current, total }) => {
      if (!isFirstRender) {
        process.stdout.write("\x1B[1F");
        process.stdout.write("\x1B[J");
      }

      process.stdout.write(
        `Calculating hashes... ${drawProgressBar(current, total)}\n`,
      );

      isFirstRender = false;
    });

    duplicates.once("duplicates-found", (report) => {
      console.log(report);
    });

    await duplicates.checkDuplicates();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}
