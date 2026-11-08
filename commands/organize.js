import { Organizer } from "../lib/organizer.js";
import { renderProgress } from "../lib/utils/utils.js";

export async function runOrganizeCommand(directory, output) {
  try {
    const organizer = new Organizer(directory, output);

    organizer.once("copy-start", (startDirectory, outputFolder) => {
      console.log(
        `📦 Organizing: ${startDirectory} \n Target:  ${outputFolder}`,
      );
    });

    organizer.on("copy-folder-created", (message) => {
      console.log(message);
    });

    let isFirstRender = true;
    organizer.on("copy-complete", ({ current, total, fileInfo }) => {
      const progress = renderProgress({
        isFirstRender,
        current,
        total,
        fileInfo,
        numberOfLines: 5,
      });
      isFirstRender = progress;
    });

    organizer.on("copy-error", ({ current, total, errorMessage }) => {
      const progress = renderProgress({
        isFirstRender,
        current,
        total,
        errorMessage,
        numberOfLines: 5,
      });
      isFirstRender = progress;
    });

    organizer.once("copy-finished", (statisticsReport) => {
      console.log(statisticsReport);
    });

    await organizer.organizeFiles();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}
