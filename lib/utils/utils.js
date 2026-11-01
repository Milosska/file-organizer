import path from "node:path";
import process from "node:process";
import fs from "node:fs/promises";

export const verifyAndResolveDirectoryPath = (inputPath) => {
  if (!inputPath) {
    throw new Error("No directory specified.");
  }

  const cleanPath = String(inputPath)
    .trim()
    .replace(/^(['"])(.*)\1$/, "$2");

  const absolutePath = path.isAbsolute(String(cleanPath))
    ? cleanPath
    : path.resolve(process.cwd(), cleanPath);

  return absolutePath;
};

export const drawProgressBar = (current, total, width = 20) => {
  const percentage = current / total;
  const filled = Math.round(percentage * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  return `${bar} ${current}/${total}`;
};

export const handleDirectoryError = (error, directory) => {
  if (error.code === "ENOENT") {
    console.error(`Directory not found: ${directory}`);
  } else if (error.code === "EACCES") {
    console.error(`❌ Permission denied: ${directory}`);
  } else {
    console.error(`Error reading directory: ${directory}. ${error.message}`);
  }

  process.exit(1);
};

export const showReadableFileSize = (sizeInBytes) => {
  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  } else if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
};

export const getTotalFilesCount = async (
  directory,
  counters = { totalFilesCount: 0, totalFoldersCount: 0, collectedFiles: [] },
) => {
  try {
    const entries = await fs.readdir(directory, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const innerPath = path.join(directory, entry.name);

      if (entry.isFile()) {
        counters.totalFilesCount++;
        counters.collectedFiles.push({ entry, innerPath });
      }

      if (entry.isDirectory()) {
        counters.totalFoldersCount++;
        await getTotalFilesCount(innerPath, counters);
      }
    }

    return counters;
  } catch (error) {
    handleDirectoryError(error, directory);
  }
};
