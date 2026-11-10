import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import process from "node:process";
import {
  runStartCommand,
  runScanCommand,
  runDuplicatesCommand,
  runOrganizeCommand,
  runCleanupCommand,
} from "./commands/index.js";

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
        demandOption: true,
        describe: "Path to the directory to scan",
        type: "string",
      });
    },
    async (argv) => {
      await runScanCommand(argv.directory);
    },
  )
  .command(
    "duplicates <directory>",
    "Check a directory for duplicates and calculate wasted space.",
    (yargs) => {
      return yargs.positional("directory", {
        demandOption: true,
        describe: "Path to the directory to check for duplicates",
        type: "string",
      });
    },
    async (argv) => {
      await runDuplicatesCommand(argv.directory);
    },
  )
  .command(
    "organize <directory>",
    "Copy files to the indicated directory and sort them by types.",
    (yargs) => {
      return yargs
        .positional("directory", {
          demandOption: true,
          describe: "Path to the directory to scan",
          type: "string",
        })
        .option("output", {
          demandOption: true,
          describe: "Path to output folder",
          type: "string",
        });
    },
    async (argv) => {
      await runOrganizeCommand(argv.directory, argv.output);
    },
  )
  .command(
    "cleanup <directory>",
    "List and remove files older than indicated period in days.",
    (yargs) => {
      return yargs
        .positional("directory", {
          demandOption: true,
          describe: "Path to the directory to scan",
          type: "string",
        })
        .option("older-than", {
          demandOption: true,
          describe: "Check period in days",
          type: "number",
          requiresArg: true,
        })
        .option("confirm", {
          default: false,
          describe: "Confirm deletion of matching files",
          type: "boolean",
        });
    },
    async (argv) => {
      await runCleanupCommand(argv.directory, argv.olderThan, argv.confirm);
    },
  )
  .demandCommand(
    1,
    "Please, specify at least one command. Use --help to get more information.",
  )
  .help()
  .strict()
  .fail((msg, err, yargs) => {
    if (msg?.includes("Unknown argument")) {
      console.error(`❌ Unknown command for ${yargs.help()}.`);
    } else if (msg?.includes("Not enough non-option arguments")) {
      console.error("❌ Error: No directory specified.");
    } else {
      console.error(msg || err?.message);
    }

    process.exit(1);
  })
  .parse();
