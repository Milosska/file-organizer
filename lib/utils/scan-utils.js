const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;

export const getLastModificationData = (mtimeMs) => {
  const lastModified = new Date(mtimeMs).toLocaleString();
  const tsDiff = Date.now() - mtimeMs;
  const daysSinceModification = Math.floor(tsDiff / MILLISECONDS_IN_DAY);

  return { lastModified, daysSinceModification };
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

export const setDelayToShowFilesFound = async (msToDelay) =>
  new Promise((resolve) => setTimeout(resolve, msToDelay));
