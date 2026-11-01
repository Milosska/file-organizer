import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import process from "node:process";
import { runStartCommand, runScanCommand } from "./commands/index.js";

yargs(hideBin(process.argv))
  .command(
    "start",
    "Start cli in interactive mode and select the command to run.",
    () => {},
    async () => {
      await runStartCommand();
    },
  )
  .command(
    "scan <directory>",
    "Scan a directory and gather statistics about its contents.",
    (yargs) => {
      return yargs.positional("directory", {
        describe: "Path to the directory to scan",
        type: "string",
      });
    },
    async (argv) => {
      await runScanCommand(argv.directory);
    },
  )
  .help()
  .strict()
  .fail((msg, err, yargs) => {
    if (msg?.includes("Unknown argument")) {
      console.error(`❌ Unknown command for ${yargs.help()}.`);
    } else if (msg?.includes("Not enough non-option arguments")) {
      console.error("❌ Error: No directory specified for scanning.");
    } else {
      console.error(msg || err?.message);
    }

    process.exit(1);
  })
  .parse();
