# File Organizer

File Organizer is a command-line tool for analyzing directories, finding duplicate files, sorting copies of files into categories, and identifying or deleting files older than a chosen age.

## Requirements

- Node.js 24.22 or later

## Installation

```bash
git clone https://github.com/Milosska/file-organizer.git
cd file-organizer
npm install
```

## Usage

Start the interactive menu with one of the commands below:

```bash
npm start
node file-organizer.js start
```

Choose an operation and enter the requested directory paths. The menu provides scanning, duplicate detection, file organization, and cleanup.

You can also run each operation directly. Quote paths that contain spaces. With npm scripts, put `--` before the command arguments:

### Scan a directory

Recursively reports file and folder counts, totals by file extension, file-age groups, the three largest files, and the oldest file(s).

```bash
npm run scan -- "path/to/directory"
node file-organizer.js scan "path/to/directory"
```

### Find duplicate files

Compares file contents using SHA-256 hashes and reports duplicate groups and their sizes.

```bash
npm run duplicates -- "path/to/directory"
node file-organizer.js duplicates "path/to/directory"
```

### Organize files

Copies files from the source directory into category folders under the required output directory. Existing files are not overwritten; a numbered suffix is added to name conflicts. Categories are Documents, Images, Archives, Code, Videos, Music, and Other.

```bash
npm run organize -- "path/to/source" --output "path/to/output"
node file-organizer.js organize "path/to/source" --output "path/to/output"
```

### Clean up old files

Lists files whose last-modified time is more than the specified number of days old. By default, cleanup is a dry run and does not delete anything. Add `--confirm` to permanently delete the listed files.

```bash
# Preview files older than 365 days
npm run cleanup -- "path/to/directory" --older-than 365
node file-organizer.js cleanup "path/to/directory" --older-than 365

# Delete files older than 365 days
npm run cleanup -- "path/to/directory" --older-than 365 --confirm
node file-organizer.js cleanup "path/to/directory" --older-than 365 --confirm
```

Use `--help` to see CLI commands and options:

```bash
npm run help
node file-organizer.js --help
node file-organizer.js cleanup --help
```

Paths may be absolute or relative to the directory where the command is run.

## Project Structure

```text
file-organizer/
├── commands/                  # CLI command handlers and interactive menu
│   ├── index.js               # Exports command handlers
│   ├── start.js               # Interactive menu
│   ├── scan.js                # Directory scan output
│   ├── duplicates.js          # Duplicate search output
│   ├── organize.js            # File organization output
│   └── cleanup.js             # Cleanup output
├── lib/                       # Scanning, organization, and cleanup logic
│   ├── scanner.js             # Directory statistics
│   ├── duplicates.js          # SHA-256 duplicate detection
│   ├── organizer.js           # Categorizes and copies files
│   ├── cleanup.js             # Finds and optionally removes old files
│   └── utils.js               # Shared path, traversal, and display utilities
├── file-organizer.js          # CLI entry point and command definitions
├── package.json               # Project metadata, dependencies, and npm scripts
├── package-lock.json          # Locked dependency versions
├── .gitignore                 # Ignores installed dependencies
└── README.md
```

## Technologies

- Node.js with JavaScript ES modules
- [Yargs](https://yargs.js.org/) for command-line parsing
- [Inquirer](https://github.com/SBoudrias/Inquirer.js) for interactive prompts

## License

ISC. See the `license` field in [package.json](./package.json).
