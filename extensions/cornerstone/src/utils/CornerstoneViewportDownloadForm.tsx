import { utils } from '@ohif/core';
import i18n from '@ohif/i18n';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { getEnabledElement, StackViewport, BaseVolumeViewport } from '@cornerstonejs/core';
import { ToolGroupManager, segmentation, Enums } from '@cornerstonejs/tools';
import { getEnabledElement as OHIFgetEnabledElement } from '../state';
import { useSystem } from '@ohif/core/src';
import {
  buildSecondaryCaptureDicomBlob,
  type SourceDisplaySetLike,
} from './buildSecondaryCaptureDicomBlob';
import {
  captureViewportGridLayout,
  countPopulatedLayoutViewports,
  getViewportGridLayoutCells,
} from './captureViewportGridLayout';

const { downloadUrl, downloadDicom, downloadBlob } = utils;

type ExportArtifact = {
  blob: Blob;
  filename: string;
  mimeType: string;
};

const DEFAULT_SIZE = 512;
const MAX_TEXTURE_SIZE = 10000;
const VIEWPORT_ID = 'cornerstone-viewport-download-form';

const DEFAULT_FILE_TYPE_OPTIONS = [
  {
    value: 'jpg',
    label: 'JPG',
  },
  {
    value: 'png',
    label: 'PNG',
  },
];

const EXTRA_FILE_TYPE_OPTIONS = [
  {
    value: 'pdf',
    label: 'PDF',
  },
  {
    value: 'dcm',
    label: 'DICOM',
  },
];

type ViewportDownloadFormProps = {
  hide: () => void;
  activeViewportId: string;
  /** Limit which formats appear (e.g. only PDF when opened from the PDF toolbar button). */
  preferredFileFormats?: ('jpg' | 'png' | 'pdf' | 'dcm')[];
};

const CornerstoneViewportDownloadForm = ({
  hide,
  activeViewportId: activeViewportIdProp,
  preferredFileFormats,
}: ViewportDownloadFormProps) => {
  const { servicesManager } = useSystem();
  const {
    customizationService,
    cornerstoneViewportService,
    displaySetService,
    viewportGridService,
    uiNotificationService,
  } = servicesManager.services;
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [viewportDimensions, setViewportDimensions] = useState({
    width: DEFAULT_SIZE,
    height: DEFAULT_SIZE,
  });

  const warningState = customizationService.getCustomization('viewportDownload.warningMessage') as {
    enabled: boolean;
    value: string;
  };

  const captureContext = useMemo(() => {
    if (!activeViewportIdProp || !cornerstoneViewportService?.getRenderingEngine) {
      return null;
    }
    const refOHIF = OHIFgetEnabledElement(activeViewportIdProp);
    const element = refOHIF?.element;
    if (!element) {
      return null;
    }
    try {
      const { viewportId, renderingEngineId } = getEnabledElement(element);
      const renderingEngine = cornerstoneViewportService.getRenderingEngine();
      if (!renderingEngine) {
        return null;
      }
      const toolGroup = ToolGroupManager.getToolGroupForViewport(viewportId, renderingEngineId);
      return {
        element,
        viewportId,
        renderingEngineId,
        renderingEngine,
        toolGroup,
      };
    } catch (e) {
      console.warn('CornerstoneViewportDownloadForm: viewport not ready for capture', e);
      return null;
    }
  }, [activeViewportIdProp, cornerstoneViewportService]);

  const activeViewportElement = captureContext?.element ?? null;
  const activeViewportId = captureContext?.viewportId ?? '';
  const renderingEngineId = captureContext?.renderingEngineId ?? '';
  const renderingEngine = captureContext?.renderingEngine ?? null;
  const toolGroup = captureContext?.toolGroup ?? null;

  const captureFailureNotified = useRef(false);

  const layoutViewportCount = useMemo(
    () => (viewportGridService ? countPopulatedLayoutViewports(viewportGridService) : 0),
    [viewportGridService, activeViewportIdProp]
  );

  const gridLayout = useMemo(() => {
    const state = viewportGridService?.getState?.();
    return {
      numRows: state?.layout?.numRows ?? 1,
      numCols: state?.layout?.numCols ?? 1,
    };
  }, [viewportGridService, activeViewportIdProp]);

  const canExportLayout = layoutViewportCount >= 1;

  useEffect(() => {
    if (captureContext !== null || canExportLayout || !activeViewportIdProp || captureFailureNotified.current) {
      return;
    }
    captureFailureNotified.current = true;
    uiNotificationService?.show({
      title: i18n.t('Tools:Download Image'),
      message: i18n.t('Tools:Image cannot be downloaded'),
      type: 'error',
    });
    hide();
  }, [activeViewportIdProp, canExportLayout, captureContext, hide, uiNotificationService]);

  useEffect(() => {
    if (!toolGroup?.toolOptions) {
      return undefined;
    }

    const toolModeAndBindings = Object.keys(toolGroup.toolOptions).reduce((acc, toolName) => {
      const tool = toolGroup.toolOptions[toolName];
      const { mode, bindings } = tool;

      return {
        ...acc,
        [toolName]: { mode, bindings },
      };
    }, {});

    return () => {
      Object.keys(toolModeAndBindings).forEach(toolName => {
        const { mode, bindings } = toolModeAndBindings[toolName];
        try {
          toolGroup.setToolMode(toolName, mode, { bindings });
        } catch (error) {
          // Handle errors when restoring tool mode during cleanup (e.g., when tool state is undefined)
          console.debug('Error restoring tool mode during cleanup:', toolName, error);
        }
      });
    };
  }, [toolGroup]);

  const handleEnableViewport = (viewportElement: HTMLElement) => {
    if (!viewportElement || !activeViewportElement || !renderingEngine) {
      return;
    }

    const enabled = getEnabledElement(activeViewportElement);
    if (!enabled?.viewport) {
      return;
    }
    const { viewport } = enabled;

    const viewportInput = {
      viewportId: VIEWPORT_ID,
      element: viewportElement,
      type: viewport.type,
      defaultOptions: {
        background: viewport.defaultOptions.background,
        orientation: viewport.defaultOptions.orientation,
      },
    };

    renderingEngine.enableElement(viewportInput);
  };

  const handleDisableViewport = async () => {
    if (!renderingEngine) {
      return;
    }
    renderingEngine.disableElement(VIEWPORT_ID);
  };

  const handleLoadImage = async (width: number, height: number, imageIdOverride?: string) => {
    if (!activeViewportElement) {
      return;
    }

    const activeViewportEnabledElement = getEnabledElement(activeViewportElement);
    if (!activeViewportEnabledElement || !renderingEngine) {
      return;
    }

    const segmentationRepresentations =
      segmentation.state.getViewportSegmentationRepresentations(activeViewportId);

    const { viewport } = activeViewportEnabledElement;
    const downloadViewport = renderingEngine.getViewport(VIEWPORT_ID);
    if (!downloadViewport) {
      return;
    }
    try {
      // Capture current viewport state
      // - properties: VOI, colormap, interpolation, etc.
      // - viewPresentation: flip/rotate/zoom presentation state added for
      //   saving flip and rotation for capture
      // - viewReference: image/volume reference
      const properties = viewport.getProperties();
      const viewPresentation = viewport.getViewPresentation?.();
      const viewRef = viewport.getViewReference?.();

      if (downloadViewport instanceof StackViewport) {
        const imageId = imageIdOverride || viewport.getCurrentImageId();
        await downloadViewport.setStack([imageId]);
      } else if (downloadViewport instanceof BaseVolumeViewport) {
        const volumeIds = viewport.getAllVolumeIds();
        await downloadViewport.setVolumes([{ volumeId: volumeIds[0] }]);
      }

      // Apply presentation state so captured image preserves flip/rotate
      if (viewPresentation && downloadViewport.setViewPresentation) {
        downloadViewport.setViewPresentation(viewPresentation);
      }

      // Apply viewport display properties
      downloadViewport.setProperties(properties);

      // Ensure correct image/volume reference
      if (viewRef && downloadViewport.setViewReference) {
        downloadViewport.setViewReference(viewRef);
      }

      downloadViewport.render();

      // Re-apply segmentation overlays to the download viewport
      if (segmentationRepresentations?.length) {
        segmentationRepresentations.forEach(segRepresentation => {
          const { segmentationId, colorLUTIndex, type } = segRepresentation;

          if (type === Enums.SegmentationRepresentations.Labelmap) {
            segmentation.addLabelmapRepresentationToViewportMap({
              [downloadViewport.id]: [
                {
                  segmentationId,
                  type: Enums.SegmentationRepresentations.Labelmap,
                  config: { colorLUTOrIndex: colorLUTIndex },
                },
              ],
            });
          }

          if (type === Enums.SegmentationRepresentations.Contour) {
            segmentation.addContourRepresentationToViewportMap({
              [downloadViewport.id]: [
                {
                  segmentationId,
                  type: Enums.SegmentationRepresentations.Contour,
                  config: { colorLUTOrIndex: colorLUTIndex },
                },
              ],
            });
          }
        });
      }

      return {
        width: Math.min(width || DEFAULT_SIZE, MAX_TEXTURE_SIZE),
        height: Math.min(height || DEFAULT_SIZE, MAX_TEXTURE_SIZE),
      };
    } catch (error) {
      console.error('Error loading image:', error);
    }
  };

  const handleToggleAnnotations = (show: boolean) => {
    if (!activeViewportElement || !renderingEngine) {
      return;
    }
    const activeViewportEnabledElement = getEnabledElement(activeViewportElement);
    if (!activeViewportEnabledElement) {
      return;
    }

    const downloadViewport = renderingEngine.getViewport(VIEWPORT_ID);
    if (!downloadViewport) {
      return;
    }

    const { viewportId: activeViewportId, renderingEngineId } = activeViewportEnabledElement;
    const { id: downloadViewportId } = downloadViewport;

    const toolGroupLocal = ToolGroupManager.getToolGroupForViewport(activeViewportId, renderingEngineId);
    if (!toolGroupLocal) {
      return;
    }
    toolGroupLocal.addViewport(downloadViewportId, renderingEngineId);

    const toolInstances = toolGroupLocal.getToolInstances();
    const toolInstancesArray = Object.values(toolInstances);

    toolInstancesArray.forEach(toolInstance => {
      if (toolInstance.constructor.isAnnotation !== false) {
        if (show) {
          toolGroupLocal.setToolEnabled(toolInstance.toolName);
        } else {
          toolGroupLocal.setToolDisabled(toolInstance.toolName);
        }
      }
    });
  };

  useEffect(() => {
    if (!viewportDimensions.width || !viewportDimensions.height || !captureContext || !renderingEngine) {
      return;
    }
    setTimeout(() => {
      void handleLoadImage(viewportDimensions.width, viewportDimensions.height);
      handleToggleAnnotations(showAnnotations);
      // we need a resize here to make suer annotations world to canvas
      // are properly calculated
      renderingEngine.resize();
      renderingEngine.render();
    }, 100);
  }, [captureContext, renderingEngine, viewportDimensions, showAnnotations]);

  const resolveExportCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (canExportLayout && viewportGridService) {
      const cells = getViewportGridLayoutCells(viewportGridService);
      const layoutCanvas = await captureViewportGridLayout({
        cells,
        hasContent: viewportId => {
          const vp = viewportGridService.getState().viewports.get(viewportId);
          return Boolean(vp?.displaySetInstanceUIDs?.length);
        },
      });
      if (layoutCanvas) {
        return layoutCanvas;
      }
    }

    const div = document.querySelector(
      `div[data-viewport-uid="${VIEWPORT_ID}"]`
    ) as HTMLElement | null;

    if (!div) {
      console.debug('No viewport found for download');
      return null;
    }

    return html2canvas(div);
  }, [canExportLayout, viewportGridService]);

  const buildExportArtifact = useCallback(
    async (baseFilename: string, fileType: string): Promise<ExportArtifact | null> => {
      const canvas = await resolveExportCanvas();
      if (!canvas) {
        return null;
      }

      const base = baseFilename || 'image';

      if (fileType === 'dcm') {
        let source: SourceDisplaySetLike | null = null;
        try {
          const vpInfo = cornerstoneViewportService.getViewportInfo?.(activeViewportIdProp);
          const viewportData = vpInfo?.getViewportData?.();
          const displaySetInstanceUID = viewportData?.data?.[0]?.displaySetInstanceUID;
          if (displaySetInstanceUID && displaySetService?.getDisplaySetByUID) {
            source = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
          }
        } catch (e) {
          console.warn('DICOM export: could not resolve source display set', e);
        }
        const seriesDescription =
          layoutViewportCount > 1
            ? `OHIF layout ${gridLayout.numCols}x${gridLayout.numRows} (${layoutViewportCount} panes)`
            : undefined;
        const blob = buildSecondaryCaptureDicomBlob(canvas, { source, seriesDescription });
        return { blob, filename: `${base}.dcm`, mimeType: 'application/dicom' };
      }

      if (fileType === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const w = canvas.width;
        const h = canvas.height;
        const pdf = new jsPDF({
          orientation: w >= h ? 'landscape' : 'portrait',
          unit: 'px',
          format: [w, h],
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        pdf.addImage(imgData, 'JPEG', 0, 0, w, h);
        const blob = pdf.output('blob');
        return { blob, filename: `${base}.pdf`, mimeType: 'application/pdf' };
      }

      const mimeType = fileType === 'jpg' ? 'image/jpeg' : `image/${fileType}`;
      const dataUrl = canvas.toDataURL(mimeType, 1.0);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      return { blob, filename: `${base}.${fileType}`, mimeType };
    },
    [
      activeViewportIdProp,
      cornerstoneViewportService,
      displaySetService,
      gridLayout.numCols,
      gridLayout.numRows,
      layoutViewportCount,
      resolveExportCanvas,
    ]
  );

  const saveArtifactToDisk = useCallback(async (artifact: ExportArtifact, fileType: string) => {
    if (fileType === 'dcm') {
      const buffer = await artifact.blob.arrayBuffer();
      downloadDicom(buffer, { filename: artifact.filename });
      return;
    }
    if (fileType === 'pdf') {
      downloadBlob(artifact.blob, { filename: artifact.filename });
      return;
    }
    const url = URL.createObjectURL(artifact.blob);
    downloadUrl(url, { filename: artifact.filename });
    URL.revokeObjectURL(url);
  }, []);

  const handleDownload = useCallback(
    async (baseFilename: string, fileType: string) => {
      const artifact = await buildExportArtifact(baseFilename, fileType);
      if (!artifact) {
        return;
      }
      await saveArtifactToDisk(artifact, fileType);
    },
    [buildExportArtifact, saveArtifactToDisk]
  );

  const launchNativeShare = useCallback(
    async (artifact: ExportArtifact, fileType: string): Promise<'file' | 'text' | false> => {
      const nav = navigator as Navigator & {
        share?: (data: ShareData & { files?: File[] }) => Promise<void>;
        canShare?: (data: { files: File[] }) => boolean;
      };

      if (typeof nav.share !== 'function') {
        await saveArtifactToDisk(artifact, fileType);
        uiNotificationService?.show({
          title: i18n.t('CaptureViewportModal:Share fallback title'),
          message: i18n.t('CaptureViewportModal:Share fallback no api'),
          type: 'info',
          duration: 8000,
        });
        return false;
      }

      const file = new File([artifact.blob], artifact.filename, { type: artifact.mimeType });
      const fileTitle = artifact.filename;
      const textOnlyBody = `${i18n.t('CaptureViewportModal:Share text only intro')}: ${fileTitle}\n${i18n.t('CaptureViewportModal:Share text only attach hint')}`;

      const shareTextOnly = async (): Promise<'text' | false> => {
        await saveArtifactToDisk(artifact, fileType);
        try {
          await nav.share({
            title: fileTitle,
            text: textOnlyBody,
          });
          return 'text';
        } catch (err) {
          const name = err && typeof err === 'object' && 'name' in err ? (err as Error).name : '';
          if (name === 'AbortError') {
            return false;
          }
          throw err;
        }
      };

      const filesSupported =
        typeof nav.canShare !== 'function' || nav.canShare({ files: [file] });

      if (filesSupported) {
        try {
          await nav.share({
            files: [file],
            title: fileTitle,
          });
          return 'file';
        } catch (err) {
          const name = err && typeof err === 'object' && 'name' in err ? (err as Error).name : '';
          if (name === 'AbortError') {
            return false;
          }
          return shareTextOnly();
        }
      }

      return shareTextOnly();
    },
    [saveArtifactToDisk, uiNotificationService]
  );

  const handleCopyToClipboard = async () => {
    try {
      const canvas = await resolveExportCanvas();
      if (!canvas) {
        console.debug('No viewport found for copy');
        return;
      }

      // Clipboard API only supports PNG format in most browsers
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          blob => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          'image/png',
          1.0
        );
      });

      // Copy to clipboard using the Clipboard API
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);

      console.log('Image copied to clipboard successfully');
    } catch (error) {
      console.error('Failed to copy image to clipboard:', error);
      throw error;
    }
  };

  const ViewportDownloadFormNew = customizationService.getCustomization(
    'ohif.captureViewportModal'
  );

  const fileTypeOptions = useMemo(() => {
    const allChoices = [...DEFAULT_FILE_TYPE_OPTIONS, ...EXTRA_FILE_TYPE_OPTIONS];
    if (!preferredFileFormats?.length) {
      return DEFAULT_FILE_TYPE_OPTIONS;
    }
    return preferredFileFormats
      .map(v => allChoices.find(o => o.value === v))
      .filter(Boolean) as typeof DEFAULT_FILE_TYPE_OPTIONS;
  }, [preferredFileFormats]);

  if (!captureContext && !canExportLayout) {
    return null;
  }

  return (
    <ViewportDownloadFormNew
      onClose={hide}
      defaultSize={DEFAULT_SIZE}
      fileTypeOptions={fileTypeOptions}
      viewportId={VIEWPORT_ID}
      showAnnotations={showAnnotations}
      onAnnotationsChange={setShowAnnotations}
      dimensions={viewportDimensions}
      onDimensionsChange={setViewportDimensions}
      onEnableViewport={handleEnableViewport}
      onDisableViewport={handleDisableViewport}
      onDownload={handleDownload}
      onSharePrepare={buildExportArtifact}
      onShareLaunch={launchNativeShare}
      onCopyToClipboard={handleCopyToClipboard}
      warningState={warningState}
      layoutViewportCount={layoutViewportCount}
      gridNumRows={gridLayout.numRows}
      gridNumCols={gridLayout.numCols}
    />
  );
};

export default CornerstoneViewportDownloadForm;
