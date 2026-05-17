import type { Button } from '../types';

/** Toolbar button id — keep in sync with primary toolbar sections across modes. */
export const PDF_EXPORT_TOOLBAR_BUTTON_ID = 'PdfExport';

/** Shared Export (PDF) toolbar control used across OHIF viewer modes. */
export const pdfExportToolbarButton: Button = {
  id: PDF_EXPORT_TOOLBAR_BUTTON_ID,
  uiType: 'ohif.toolButton',
  props: {
    icon: 'Export',
    label: 'Export',
    tooltip: 'Export File',
    showLabel: true,
    hideLabelInTooltip: true,
    className:
      'relative z-[2] mx-5 animate-toolbar-export-float !rounded-xl border border-primary/40 bg-background/95 shadow-lg shadow-primary/20 ring-2 ring-primary/30 backdrop-blur-sm transition-all duration-300 hover:animate-none hover:-translate-y-0.5 hover:border-primary/70 hover:bg-primary/15 hover:shadow-xl hover:ring-primary/50 active:translate-y-0 active:scale-[0.98]',
    commands: 'showDownloadViewportPdfModal',
    evaluate: [
      'evaluate.action',
      {
        name: 'evaluate.viewport.supported',
        unsupportedViewportTypes: ['video', 'wholeSlide'],
      },
    ],
  },
};
