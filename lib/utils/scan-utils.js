const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;

export const getLastModificationData = (mtimeMs) => {
  const lastModified = new Date(mtimeMs).toLocaleString();
  const tsDiff = Date.now() - mtimeMs;
  const daysSinceModification = Math.floor(tsDiff / MILLISECONDS_IN_DAY);

  return { lastModified, daysSinceModification };
};

export const setDelayToShowFilesFound = async (msToDelay) =>
  new Promise((resolve) => setTimeout(resolve, msToDelay));
