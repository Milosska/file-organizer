import { EventEmitter } from "events";
import fs from "node:fs/promises";
import {
  verifyAndResolveDirectoryPath,
  getTotalFilesCount,
  showReadableFileSize,
  getFileAgeInDays,
} from "./utils.js";

export class Cleanup extends EventEmitter {
  targetDirectory;
  checkPeriod;
  isDryRunMode;
  totalSize = 0;

  constructor(directory, olderThan, confirm) {
    super();
    const absoluteTargetPath = verifyAndResolveDirectoryPath(directory);
    this.targetDirectory = absoluteTargetPath;

    this.checkPeriod = this.validateDays(olderThan);
    this.isDryRunMode = !confirm;
  }

  validateDays(value) {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue) || numberValue <= 0) {
      throw new Error("--older-than must be a positive number");
    }
    return numberValue;
  }

  getCleanupCompleteMessage(isFinal = false) {
    let message;
    if (this.isDryRunMode) {
      const totalLine = ` \nTotal: ${this.totalFilesCount} files (${showReadableFileSize(this.totalSize)})`;
      message =
        totalLine +
        "\n\n⚠️  DRY RUN MODE: No files were deleted." +
        "\nTo actually delete these files, run with --confirm flag.";
    } else if (isFinal) {
      message =
        "\n ✅ Cleanup complete!" +
        `\n Deleted: ${this.totalFilesCount} files (${showReadableFileSize(this.totalSize)} freed)`;
    } else {
      message = `\n⚠️  DELETING ${this.totalFilesCount} files (${showReadableFileSize(this.totalSize)}). This action cannot be undone!`;
    }

    return message;
  }

  async checkIfRemove(filePath) {
    const stats = await fs.stat(filePath);
    const daysOld = getFileAgeInDays(stats.mtimeMs);
    return daysOld > this.checkPeriod;
  }

  async reportFoundFile({ entry, innerPath }) {
    const fileName = `\n${entry.name}`;

    const { size, mtimeMs } = await fs.stat(innerPath);
    this.totalSize += size;

    const fileSize = `\n\t${showReadableFileSize(size)}`;
    const modifiedLine = `\n\tModified: ${getFileAgeInDays(mtimeMs)} days ago (${new Date(mtimeMs).toISOString().slice(0, 10)})`;

    return fileName + fileSize + modifiedLine;
  }

  async removeFiles() {
    for (const [index, file] of this.collectedFiles.entries()) {
      await fs.unlink(file.innerPath);
      this.emit("file-deleted", this.totalFilesCount, index + 1);
    }
  }

  async cleanupFiles() {
    this.emit("cleanup-start", this.targetDirectory, this.checkPeriod);

    const counters = await getTotalFilesCount({
      directory: this.targetDirectory,
      checkCallback: (filePath) => this.checkIfRemove(filePath),
    });
    this.totalFilesCount = counters.totalFilesCount;
    this.collectedFiles = counters.collectedFiles;

    for (const [index, file] of this.collectedFiles.entries()) {
      const report = await this.reportFoundFile(file);
      this.emit("file-found", this.totalFilesCount, index, report);
    }

    this.emit("cleanup-complete", this.getCleanupCompleteMessage());
    if (this.isDryRunMode) {
      return;
    }

    await this.removeFiles();
    this.emit("cleanup-complete", this.getCleanupCompleteMessage(true));
  }
}
