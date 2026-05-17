import html2canvas from 'html2canvas';

const DOWNLOAD_VIEWPORT_UID = 'cornerstone-viewport-download-form';

export type CaptureFilmSheetOptions = {
  imageIds: string[];
  maxFrames: number;
  cellWidth: number;
  cellHeight: number;
  loadImageForDimensions: (width: number, height: number, imageId: string) => Promise<void>;
  resizeAndRender: () => void;
};

/**
 * Renders each stack image in the hidden download viewport and captures one canvas per frame.
 */
export async function captureFilmSheetFrames(
  options: CaptureFilmSheetOptions
): Promise<HTMLCanvasElement[]> {
  const { imageIds, maxFrames, cellWidth, cellHeight, loadImageForDimensions, resizeAndRender } =
    options;

  const container = document.querySelector(
    `div[data-viewport-uid="${DOWNLOAD_VIEWPORT_UID}"]`
  ) as HTMLElement | null;

  if (!container) {
    throw new Error('Download viewport element not found');
  }

  const ids = imageIds.slice(0, Math.max(1, maxFrames));
  const canvases: HTMLCanvasElement[] = [];

  for (const imageId of ids) {
    await loadImageForDimensions(cellWidth, cellHeight, imageId);
    resizeAndRender();
    await new Promise(r => setTimeout(r, 100));
    canvases.push(await html2canvas(container));
  }

  return canvases;
}
