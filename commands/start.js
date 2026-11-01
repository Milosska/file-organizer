import { select, input } from "@inquirer/prompts";
import { runScanCommand } from "./scan.js";

export async function runStartCommand() {
  const command = await select({
    message: "What would you like to do?",
    choices: [
      {
        name: "Scan a directory",
        value: "scan",
      },
    ],
  });

  if (command === "scan") {
    const directory = await input({
      message: "Enter the directory path (as a string with quotation marks):",
    });

    await runScanCommand(directory);
  }
}
