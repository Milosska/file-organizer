# File Organizer

## Overview

File Organizer is a command-line tool that recursively scans a directory and reports statistics about its files.

## Features

- Scan a directory and its subdirectories with a live progress indicator.
- Summarize file counts and sizes by file extension.
- Group files by age and report the three largest files and the oldest file(s).

## Requirements

- Node.js 24.22 or later

## Installation

```bash
git clone https://github.com/Milosska/file-organizer.git
cd file-organizer
npm install
```

## Usage

The CLI provides two commands, `start` and `scan`, plus Yargs help. You can run them through the npm scripts or invoke the entry point directly with Node.js.

### Interactive Mode (`start`)

Start the interactive menu and choose **Scan a directory**:

```bash
npm start
```

The menu currently offers one action: **Scan a directory**. Select it, then enter the directory path when prompted. For example:

```text
What would you like to do?  Scan a directory
Enter the directory path:   "C:\Users\YourName\Documents"
```

The path is the only input required in interactive mode. You can enter an absolute path or a path relative to the directory where you started the command.

Equivalent direct invocation:

```bash
node file-organizer.js start
```

### Scan Command (`scan <directory>`)

Run a scan without opening the interactive menu:

```bash
npm run scan "path/to/directory"
```

The required `<directory>` argument is the path to the directory to scan. Quote paths that contain spaces. Examples:

```bash
# Relative path (resolved from the current working directory)
npm run scan "./documents"

# Absolute path on Windows
npm run scan "C:\Users\YourName\My Documents"

# Absolute path on macOS or Linux
npm run scan "/home/yourname/Documents"
```

The command recursively visits subdirectories. It displays progress and per-file details, then reports file and folder counts, totals by file extension, file-age groups, the three largest files, and the oldest file(s).

Equivalent direct invocation:

```bash
node file-organizer.js scan "path/to/directory"
```

The directory argument is required. If it is omitted, the CLI reports that no directory was specified. The CLI also supports help:

```bash
node file-organizer.js --help
node file-organizer.js scan --help
```

## Technologies

- Node.js
- JavaScript (ES modules)
- [Yargs](https://yargs.js.org/) for command-line parsing
- [Inquirer](https://github.com/SBoudrias/Inquirer.js) prompts for the interactive menu

## Project Structure

```text
file-organizer/
├── commands/                  # Command handlers called by the CLI
│   ├── index.js               # Re-exports the start and scan handlers
│   ├── start.js               # Interactive menu and directory prompt
│   └── scan.js                # Runs a scan and prints progress and results
├── lib/                       # Scanning logic and shared utilities
│   ├── scanner.js             # Recursively scans directories and aggregates statistics
│   └── utils/
│       ├── scan-utils.js      # Utils for scanner class: formats sizes and dates; provides scan display delay
│       └── utils.js           # Global utils: Resolves paths, draws progress, handles read errors
├── file-organizer.js          # Yargs CLI entry point and command definitions
├── package.json               # Project metadata, dependencies, and npm scripts
├── package-lock.json          # Locked dependency versions for reproducible installs
├── .gitignore                 # Excludes installed node_modules from Git
└── README.md                  # Project documentation
```

## How It Works

The CLI dispatches `start` and `scan` commands to handlers in `commands/`. The `Scanner` in `lib/scanner.js` walks the directory tree, gathers file metadata, and emits events used by the scan handler to display progress and results. Utility modules format file information and handle paths and directory errors.

## Error Handling

The CLI reports missing scan paths, unknown commands, directories that cannot be found, and permission or read errors. It exits with a non-zero status when a command or scan fails.

## License

ISC. See the `license` field in `package.json`.
