import crypto from "crypto";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import { EventEmitter } from "events";
import {
  verifyAndResolveDirectoryPath,
  handleDirectoryError,
  showReadableFileSize,
  getTotalFilesCount,
} from "./utils/utils.js";

export class Duplicates extends EventEmitter {
  targetDirectory;
  totalFilesCount = 0;
  currentFilesCount = 0;
  collectedFiles = [];
  hashes = {};

  constructor(directory) {
    super();
    const absolutePath = verifyAndResolveDirectoryPath(directory);
    this.targetDirectory = absolutePath;
  }

  async calculateHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash("sha256");
      const stream = createReadStream(filePath);

      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", reject);
    });
  }

  async calculateFilesHashes(directory) {
    try {
      if (this.collectedFiles.length === 0) {
        throw new Error("No files found in the directory.");
      }

      for (const { entry, innerPath } of this.collectedFiles) {
        if (entry.isFile()) {
          this.currentFilesCount++;
          const fileHash = await this.calculateHash(innerPath);

          if (!this.hashes[fileHash]) {
            this.hashes[fileHash] = [];
          }

          this.hashes[fileHash].push(innerPath);
          this.emit("file-processed", {
            current: this.currentFilesCount,
            total: this.totalFilesCount,
          });
        }

        if (entry.isDirectory()) {
          await this.calculateFilesHashes(innerPath);
        }
      }
    } catch (error) {
      handleDirectoryError(error, directory);
    }
  }

  async createReportPerDuplicatedGroup(fileGroup, index) {
    const [hash, filePathArray] = fileGroup;
    const { size } = await fs.stat(filePathArray[0]);
    const groupSize = size * filePathArray.length;

    const groupReport = [
      `\n Group ${index + 1} (${filePathArray.length}, copies ${showReadableFileSize(size)} each)`,
      `    SHA-256: ${hash}\n`,
      `${filePathArray.map((filePath) => `\t 📄 ${filePath}`).join("\n")}`,
      `\n    Wasted space: ${showReadableFileSize(groupSize)} \n`,
    ].join("\n");

    return { report: groupReport, groupSize };
  }

  async reportDuplicatedFileGroups() {
    const duplicatedFileGroups = await Promise.all(
      Object.entries(this.hashes)
        .filter(([_, filePathArray]) => filePathArray.length > 1)
        .map((fileGroup, index) =>
          this.createReportPerDuplicatedGroup(fileGroup, index),
        ),
    );

    if (duplicatedFileGroups.length === 0) {
      return "\n💾 No duplicated files found.";
    }

    const totalSize = showReadableFileSize(
      duplicatedFileGroups.reduce(
        (acc, fileGroupData) => (acc += fileGroupData.groupSize),
        0,
      ),
    );

    const startLine = `Found ${duplicatedFileGroups.length} duplicate groups (${totalSize} wasted):`;
    const finalLine = `\n💾 Total wasted space: ${totalSize}`;

    return [
      startLine,
      ...duplicatedFileGroups.map((group) => group.report),
      finalLine,
    ].join(`\n\n${"━".repeat(60)}`);
  }

  async checkDuplicates() {
    try {
      this.emit("duplicates-start", this.targetDirectory);

      const counters = await getTotalFilesCount({
        directory: this.targetDirectory,
      });
      this.totalFilesCount = counters.totalFilesCount;
      this.collectedFiles = counters.collectedFiles;

      if (this.collectedFiles.length === 0) {
        return "No files found in the directory.";
      }

      await this.calculateFilesHashes(this.targetDirectory);
      const report = await this.reportDuplicatedFileGroups();
      this.emit("duplicates-found", report);
    } catch (error) {
      console.error(`Error during scanning: ${error.message}`);
      process.exit(1);
    }
  }
}
