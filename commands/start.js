import { select, input } from "@inquirer/prompts";
import {
  runScanCommand,
  runDuplicatesCommand,
  runOrganizeCommand,
  runCleanupCommand,
} from "./index.js";

export async function runStartCommand() {
  const command = await select({
    message: "What would you like to do?",
    choices: [
      {
        name: "Scan a directory",
        value: "scan",
      },
      {
        name: "Check a directory for duplicates",
        value: "duplicates",
      },
      {
        name: "Copy files to the indicated directory and sort them by types",
        value: "organize",
      },
      {
        name: "List and remove files",
        value: "cleanup",
      },
    ],
  });

  const directory = await input({
    message: `Enter the ${command === "organize" ? "initial" : ""} directory path (as a string with quotation marks):`,
  });

  switch (command) {
    case "scan":
      await runScanCommand(directory);
      break;

    case "duplicates":
      await runDuplicatesCommand(directory);
      break;

    case "organize":
      const output = await input({
        message: `Enter the output directory path (as a string with quotation marks):`,
      });

      await runOrganizeCommand(directory, output);
      break;

    case "cleanup":
      const olderThan = await input({
        message: `Enter the age threshold (in days). Files older than this will be deleted:`,
      });

      const isDryRun = await select({
        message: "Choose the mode",
        choices: [
          {
            name: "Dry run (files will be listed, but not removed)",
            value: false,
          },
          {
            name: "Active (files will be listed and deleted",
            value: true,
          },
        ],
      });

      await runCleanupCommand(directory, olderThan, isDryRun);
      break;
  }
}
