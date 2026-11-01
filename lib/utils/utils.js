import path from "node:path";
import process from "node:process";

export const verifyAndResolveDirectoryPath = (inputPath) => {
  console.log(`Verifying directory path: ${inputPath}`);
  if (!inputPath) {
    throw new Error("No directory specified for scanning.");
  }

  const cleanPath = String(inputPath)
    .trim()
    .replace(/^(['"])(.*)\1$/, "$2");

  const absolutePath = path.isAbsolute(String(cleanPath))
    ? cleanPath
    : path.resolve(process.cwd(), cleanPath);

  console.log(`Verifying absolutePath: ${absolutePath}`);

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
