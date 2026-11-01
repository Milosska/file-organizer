import { select, input } from "@inquirer/prompts";
import { runScanCommand, runDuplicatesCommand } from "./index.js";

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
    ],
  });

  let directory;
  if (command === "scan" || command === "duplicates") {
    directory = await input({
      message: "Enter the directory path (as a string with quotation marks):",
    });
  }

  switch (command) {
    case "scan":
      await runScanCommand(directory);
      break;

    case "duplicates":
      await runDuplicatesCommand(directory);
      break;
  }
}
