/**
 * Saving and opening files in the browser – no server involved.
 *
 * Saving: put the text in a Blob, point a temporary link at it and click it;
 * the browser treats that as a download. Opening is done with an
 * `<input type="file">` in the component and `file.text()`.
 */

/** Offers `text` as a download called `fileName`. */
export function downloadTextFile(fileName: string, text: string, mimeType = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  // The click starts the download synchronously, so the URL can be released right after.
  URL.revokeObjectURL(url);
}
