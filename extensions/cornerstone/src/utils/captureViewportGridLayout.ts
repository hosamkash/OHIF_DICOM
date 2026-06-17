import html2canvas from 'html2canvas';
import { getEnabledElement as getOHIFEnabledElement } from '../state';

export type ViewportGridLayoutCell = {
  viewportId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CaptureViewportGridLayoutOptions = {
  cells: ViewportGridLayoutCell[];
  /** Has at least one display set in this viewport. */
  hasContent: (viewportId: string) => boolean;
  outputWidth?: number;
  outputHeight?: number;
  background?: string;
};

/**
 * Captures each populated viewport pane and composites them to match the on-screen grid layout.
 */
export async function captureViewportGridLayout(
  options: CaptureViewportGridLayoutOptions
): Promise<HTMLCanvasElement | null> {
  const { cells, hasContent, background = '#000000' } = options;
  const populated = cells.filter(c => hasContent(c.viewportId));

  if (!populated.length) {
    return null;
  }

  const outW = options.outputWidth ?? 2048;
  const outH = options.outputHeight ?? Math.round(outW * 0.75);

  const sheet = document.createElement('canvas');
  sheet.width = outW;
  sheet.height = outH;
  const ctx = sheet.getContext('2d');
  if (!ctx) {
    return null;
  }

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, outW, outH);

  for (const cell of populated) {
    const enabled = getOHIFEnabledElement(cell.viewportId);
    const element = enabled?.element as HTMLElement | undefined;
    const pane =
      (element?.closest('[data-cy="viewport-pane"]') as HTMLElement | null) ??
      (element?.parentElement as HTMLElement | null) ??
      element;

    if (!pane) {
      continue;
    }

    const frame = await html2canvas(pane, {
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: null,
    });

    const dx = Math.round(cell.x * outW);
    const dy = Math.round(cell.y * outH);
    const dw = Math.round(cell.width * outW);
    const dh = Math.round(cell.height * outH);
    ctx.drawImage(frame, dx, dy, dw, dh);
  }

  return sheet;
}

export function getViewportGridLayoutCells(
  viewportGridService: {
    getState: () => { viewports: Map<string, { x?: number; y?: number; width?: number; height?: number }> };
    getLayoutOptionsFromState: (state: unknown) => ViewportGridLayoutCell[];
  }
): ViewportGridLayoutCell[] {
  const state = viewportGridService.getState();
  const layoutOptions = viewportGridService.getLayoutOptionsFromState(state);
  const entries = Array.from(state.viewports.entries());

  return entries.map(([viewportId, viewport], index) => {
    const layout = layoutOptions[index];
    return {
      viewportId,
      x: layout?.x ?? viewport.x ?? 0,
      y: layout?.y ?? viewport.y ?? 0,
      width: layout?.width ?? viewport.width ?? 1,
      height: layout?.height ?? viewport.height ?? 1,
    };
  });
}

export function countPopulatedLayoutViewports(
  viewportGridService: {
    getState: () => {
      viewports: Map<string, { displaySetInstanceUIDs?: string[] }>;
    };
  }
): number {
  const { viewports } = viewportGridService.getState();
  let count = 0;
  for (const [, viewport] of viewports) {
    if (viewport.displaySetInstanceUIDs?.length) {
      count += 1;
    }
  }
  return count;
}
