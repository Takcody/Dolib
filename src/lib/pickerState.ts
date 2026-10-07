let pickerStartTime: number | null = null;

/**
 * Call when opening any native file picker or gallery chooser.
 * This marks an ephemeral in-memory intent to pick a file.
 */
export function triggerFilePickerIntent() {
  pickerStartTime = Date.now();
}

/**
 * Checks whether the app was in an ephemeral file picker intent within the last 15 seconds.
 */
export function isFilePickerActive(): boolean {
  if (!pickerStartTime) return false;
  const elapsed = Date.now() - pickerStartTime;
  // Ephemeral intent expires after 15 seconds
  if (elapsed < 15000) {
    return true;
  }
  pickerStartTime = null;
  return false;
}

/**
 * Clears the ephemeral file picker intent immediately.
 */
export function clearFilePickerIntent() {
  pickerStartTime = null;
}
