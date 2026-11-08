import { EventEmitter } from "events";
import path from "node:path";
import fs from "node:fs/promises";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import {
  verifyAndResolveDirectoryPath,
  handleDirectoryError,
  showReadableFileSize,
  getTotalFilesCount,
} from "./utils/utils.js";
import { setDelayToShowFilesFound } from "./utils/scan-utils.js";

const categories = {
  Documents: [".pdf", ".docx", ".doc", ".txt", ".md", ".xlsx", ".pptx"],
  Images: [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".bmp"],
  Archives: [".zip", ".rar", ".tar", ".gz", ".7z"],
  Code: [".js", ".py", ".java", ".cpp", ".html", ".css", ".json"],
  Videos: [".mp4", ".avi", ".mkv", ".mov", ".webm"],
  Music: [".mp3", ".wma", ".aac", ".m4a", ".wav"],
  Other: [],
};

const hugeFileSizeStart = 10 * 1024 * 1024;

export class Organizer extends EventEmitter {
  targetDirectory;
  outputDirectory;
  totalFilesCount = 0;
  currentFilesCount = 0;
  collectedFiles = [];
  statistics = {
    totalCopied: 0,
    totalCopiedSize: 0,
    totalErrors: 0,
    filesCount: {},
  };

  constructor(directory, output) {
    super();
    const absoluteTargetPath = verifyAndResolveDirectoryPath(directory);
    const absoluteOutputPath = verifyAndResolveDirectoryPath(output);
    this.targetDirectory = absoluteTargetPath;
    this.outputDirectory = absoluteOutputPath;
  }

  showFileData({ entry, size }) {
    const fileExtention = path.extname(entry.name).toLowerCase();
    const fileBazeName = path.basename(entry.name, fileExtention);
    return `\n\t Name: ${fileBazeName.substring(0, 30)}${fileBazeName > 30 ? "..." : ""}${fileExtention}\n\t Size: ${showReadableFileSize(size)}`;
  }

  defineErrorMessage(error, entry) {
    let errorMessage;

    if (error.code === "ENOENT") {
      errorMessage = `File not found: ${entry.name}`;
    } else if (error.code === "EACCES") {
      errorMessage = `❌ Access permission denied: ${entry.name}`;
    } else if (error.code === "EPERM") {
      errorMessage = `❌ Copy permission denied: ${entry.name}`;
    } else {
      errorMessage = `❌ Error copying file: ${entry.name}. ${error.message}`;
    }

    return errorMessage;
  }

  async createFolder(category, index) {
    try {
      const pathToFolder = path.join(this.outputDirectory, category);
      await fs.mkdir(pathToFolder, { recursive: true });

      const startMessage = index === 0 ? "\nCreating folders...\n" : "";
      const folderCreateMessage = `\t✓ ${category}/`;

      this.emit("copy-folder-created", startMessage + folderCreateMessage);
    } catch (error) {
      handleDirectoryError(error, directory);
    }
  }

  async createFolders() {
    try {
      this.emit("copy-folder-created", "\nCreating folders...\n");

      for (const category of Object.keys(categories)) {
        const pathToFolder = path.join(this.outputDirectory, category);
        await fs.mkdir(pathToFolder, { recursive: true });
        this.emit("copy-folder-created", `\t✓ ${category}/`);
      }
    } catch (error) {
      handleDirectoryError(error, this.outputDirectory);
    }
  }

  async defineFilePathForCopy(
    outputFolderForFile,
    fileName,
    extention,
    count = 0,
  ) {
    const suffix = count === 0 ? "" : `(${count})`;
    const baseName = fileName.substring(0, fileName.length - extention.length);

    const outputPath = path.join(
      this.outputDirectory,
      outputFolderForFile,
      `${baseName}${suffix}${extention}`,
    );

    try {
      // Check if file exists, if yes - try next int suffix
      await fs.access(outputPath);
      return this.defineFilePathForCopy(
        outputFolderForFile,
        fileName,
        extention,
        count + 1,
      );
    } catch (error) {
      if (error.code === "ENOENT") {
        // File doesn't exist
        return outputPath;
      }
    }
  }

  async copyFile(entry, innerPath) {
    try {
      this.currentFilesCount++;
      const extention = path.extname(innerPath);
      const outputFolderForFile =
        Object.entries(categories)
          .find(([_, extentions]) => extentions.includes(extention))
          ?.at(0) || "Other";

      const outputPath = await this.defineFilePathForCopy(
        outputFolderForFile,
        entry.name,
        extention,
      );

      const { size } = await fs.stat(innerPath);
      if (size < hugeFileSizeStart) {
        await fs.copyFile(innerPath, outputPath);
      } else {
        await pipeline(
          createReadStream(innerPath),
          createWriteStream(outputPath),
        );
      }

      this.updateStatistics(outputFolderForFile, size);
      this.emit("copy-complete", {
        current: this.currentFilesCount,
        total: this.totalFilesCount,
        fileInfo: this.showFileData({
          entry,
          size,
        }),
      });
    } catch (error) {
      this.statistics.totalErrors++;
      this.emit("copy-error", {
        current: this.currentFilesCount,
        total: this.totalFilesCount,
        errorMessage: this.defineErrorMessage(error, entry),
      });
    }
  }

  async copyFiles() {
    for (const { entry, innerPath } of this.collectedFiles) {
      await this.copyFile(entry, innerPath);
      await setDelayToShowFilesFound(100);
    }
  }

  updateStatistics(folder, size) {
    this.statistics.totalCopied++;
    this.statistics.totalCopiedSize += size;

    if (!this.statistics.filesCount[folder]) {
      this.statistics.filesCount[folder] = 0;
    }

    this.statistics.filesCount[folder]++;
  }

  createStatisticsReport() {
    const completeMessage = "\n\n✅ Organization complete!";
    const totalCopied = `\n\nTotal copied: ${this.statistics.totalCopied} ${this.statistics.totalCopied > 1 ? "file" : "files"} (${showReadableFileSize(this.statistics.totalCopiedSize)})`;
    const totalErrors = `\nTotal errors: ${this.statistics.totalErrors}`;

    const summaryReport = Object.keys(categories).map((category) => {
      const categoryFilesCount = this.statistics.filesCount[category] ?? 0;
      return `\n\t${category}: ${categoryFilesCount} ${categoryFilesCount === 1 ? "file" : "files "} → ${path.join(this.outputDirectory, category)}`;
    });

    return (
      completeMessage +
      "\n\nSummary:" +
      summaryReport +
      totalCopied +
      totalErrors
    );
  }

  async organizeFiles() {
    try {
      this.emit("copy-start", this.targetDirectory, this.outputDirectory);

      const counters = await getTotalFilesCount({
        directory: this.targetDirectory,
      });
      this.totalFilesCount = counters.totalFilesCount;
      this.collectedFiles = counters.collectedFiles;

      await this.createFolders();
      await this.copyFiles();

      this.emit("copy-finished", this.createStatisticsReport());
    } catch (error) {
      console.error(`Error during organizing files: ${error.message}`);
      process.exit(1);
    }
  }
}
