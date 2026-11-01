import { EventEmitter } from "events";
import fs from "node:fs/promises";
import path from "node:path";
import {
  showReadableFileSize,
  getLastModificationData,
  setDelayToShowFilesFound,
} from "./utils/scan-utils.js";
import {
  verifyAndResolveDirectoryPath,
  handleDirectoryError,
} from "./utils/utils.js";

export class Scanner extends EventEmitter {
  targetDirectory;
  currentDirectory;
  collectedFiles = [];
  totalFilesCount = 0;
  currentFilesCount = 0;
  totalFoldersCount = 0;
  totalSize = 0;
  filesByType = {};
  filesByAge = {
    "Last 7 days": 0,
    "Last 30 days": 0,
    "Last 90 days": 0,
    "Older than 90 days": 0,
  };
  largestFiles = [];
  oldestFile = {
    age: 0,
    names: [],
  };

  constructor(directory) {
    super();
    const absolutePath = verifyAndResolveDirectoryPath(directory);
    this.targetDirectory = absolutePath;
    this.currentDirectory = absolutePath;
  }

  showFileData({ name, extention, size, lastModified, daysSinceModification }) {
    return `\n\t Name: ${name.substring(0, 30)}${name > 30 ? "..." : ""}${extention}\n\t Size: ${showReadableFileSize(size)} \n\t Last modified: ${lastModified}\n\t Days since modification: ${daysSinceModification}`;
  }

  showStatistics() {
    const totalFilesCount = `\n Total files: ${this.totalFilesCount}`;
    const totalFoldersCount = `\n Total folders: ${this.totalFoldersCount}`;

    const filesByTypeStats = `\n\n By File Type:${Object.entries(
      this.filesByType,
    )
      .map(
        ([extention, { count, totalSize }]) =>
          `\n\t ${extention}: ${count} files, ${showReadableFileSize(totalSize)}`,
      )
      .join("")}`;

    const filesModificationStats = `\n\n File Age: ${Object.entries(
      this.filesByAge,
    )
      .map(([age, count]) => `\n\t ${age}: ${count}`)
      .join("")}`;

    const largestFilesStats = `\n\n Largest Files:${this.largestFiles
      .sort(({ size: a }, { size: b }) => b - a)
      .map(({ name, size }) => `\n\t ${name} (${showReadableFileSize(size)})`)
      .join("")}`;

    const oldestFileStats = `\n\n Oldest File${this.oldestFile.names.length > 1 ? "s" : ""}: ${this.oldestFile.names.map((name) => `\n\t ${name}(modified ${this.oldestFile.age} days ago)`)}`;

    const totalStats =
      totalFilesCount +
      totalFoldersCount +
      filesByTypeStats +
      filesModificationStats +
      largestFilesStats +
      oldestFileStats;

    return totalStats;
  }

  updateFileByAge(daysSinceModification, name) {
    switch (true) {
      case daysSinceModification <= 7:
        this.filesByAge["Last 7 days"]++;
        break;

      case daysSinceModification <= 30:
        this.filesByAge["Last 30 days"]++;
        break;

      case daysSinceModification <= 90:
        this.filesByAge["Last 90 days"]++;
        break;

      default:
        this.filesByAge["Older than 90 days"]++;
    }

    if (this.oldestFile.age === daysSinceModification) {
      this.oldestFile.names.push(name);
    }

    if (this.oldestFile.age < daysSinceModification) {
      this.oldestFile.age = daysSinceModification;
      this.oldestFile.names = [name];
    }
  }

  updateFileByType({ extention, size }) {
    if (!this.filesByType[extention]) {
      this.filesByType[extention] = {
        count: 0,
        totalSize: 0,
      };
    }

    this.filesByType[extention].count++;
    this.filesByType[extention].totalSize += size;
  }

  updateLargestFiles({ name, size }) {
    if (this.largestFiles.length < 3) {
      this.largestFiles.push({ name, size });
    } else {
      const currentSmallestSize = Math.min(
        ...this.largestFiles.map((file) => file.size),
      );

      if (size > currentSmallestSize) {
        this.largestFiles.splice(
          this.largestFiles.findIndex(
            (file) => file.size === currentSmallestSize,
          ),
          1,
          { name, size },
        );
      }
    }
  }

  async getTotalFilesCount(directory) {
    try {
      const entries = await fs.readdir(directory, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        const innerPath = path.join(directory, entry.name);

        if (entry.isFile()) {
          this.totalFilesCount++;
          this.collectedFiles.push({ entry, innerPath });
        }

        if (entry.isDirectory()) {
          this.totalFoldersCount++;
          await this.getTotalFilesCount(innerPath);
        }
      }
    } catch (error) {
      handleDirectoryError(error, directory);
    }
  }

  async scanFiles(directory) {
    try {
      if (this.collectedFiles.length === 0) {
        return "No files found in the directory.";
      }

      for (const { entry, innerPath } of this.collectedFiles) {
        if (entry.isFile()) {
          this.currentFilesCount++;
          const { size, mtimeMs } = await fs.stat(innerPath);
          this.totalSize += size;

          const { lastModified, daysSinceModification } =
            getLastModificationData(mtimeMs);
          this.updateFileByAge(daysSinceModification, entry.name);

          const fileExtention = path.extname(entry.name).toLowerCase();
          const fileBazeName = path.basename(entry.name, fileExtention);
          this.updateFileByType({ extention: fileExtention, size });
          this.updateLargestFiles({ name: entry.name, size });

          this.emit("file-found", {
            current: this.currentFilesCount,
            total: this.totalFilesCount,
            fileInfo: this.showFileData({
              name: fileBazeName,
              extention: fileExtention,
              size,
              lastModified,
              daysSinceModification,
            }),
          });

          await setDelayToShowFilesFound(100);
        }

        if (entry.isDirectory()) {
          await this.scanFiles(innerPath);
        }
      }
    } catch (error) {
      handleDirectoryError(error, directory);
    }
  }

  async scan() {
    try {
      this.emit("scan-start", this.targetDirectory);
      await this.getTotalFilesCount(this.targetDirectory);
      await this.scanFiles(this.targetDirectory);
      this.emit("scan-complete", this.showStatistics());
    } catch (error) {
      console.error(`Error during scanning: ${error.message}`);
      process.exit(1);
    }
  }
}
