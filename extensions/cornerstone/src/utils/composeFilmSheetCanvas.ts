/**
 * Composes multiple frame canvases into one film-sheet layout (columns × rows).
 */
export type FilmSheetLayout = {
  columns: number;
  rows: number;
  /** Pixel size of each cell (square). */
  cellSize?: number;
  /** Gap between cells in pixels. */
  gap?: number;
  background?: string;
};

export function composeFilmSheetCanvas(
  frames: HTMLCanvasElement[],
  layout: FilmSheetLayout
): HTMLCanvasElement {
  const columns = Math.max(1, Math.min(12, Math.floor(layout.columns)));
  const rows = Math.max(1, Math.min(12, Math.floor(layout.rows)));
  const cellSize = layout.cellSize ?? 256;
  const gap = layout.gap ?? 4;
  const background = layout.background ?? '#000000';
  const capacity = columns * rows;

  const sheet = document.createElement('canvas');
  sheet.width = columns * cellSize + (columns + 1) * gap;
  sheet.height = rows * cellSize + (rows + 1) * gap;
  const ctx = sheet.getContext('2d');
  if (!ctx) {
    throw new Error('Cannot create film sheet canvas context');
  }

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, sheet.width, sheet.height);

  for (let slot = 0; slot < capacity; slot++) {
    const col = slot % columns;
    const row = Math.floor(slot / columns);
    const x = gap + col * (cellSize + gap);
    const y = gap + row * (cellSize + gap);
    const frame = frames[slot];
    if (!frame) {
      continue;
    }
    ctx.drawImage(frame, x, y, cellSize, cellSize);
  }

  return sheet;
}
