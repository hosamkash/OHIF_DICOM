import React, { useState, useEffect } from 'react';
import { ImageModal, FooterAction, toast } from '@ohif/ui-next';
import { useTranslation } from 'react-i18next';

const MAX_TEXTURE_SIZE = 10000;
const DEFAULT_FILENAME = 'image';

/** Same shape as `ExportArtifact` in CornerstoneViewportDownloadForm (kept local to avoid import cycles). */
type ShareArtifactPayload = {
  blob: Blob;
  filename: string;
  mimeType: string;
};

function ShareGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle
        cx="18"
        cy="5"
        r="3"
      />
      <circle
        cx="6"
        cy="12"
        r="3"
      />
      <circle
        cx="18"
        cy="19"
        r="3"
      />
      <line
        x1="8.59"
        y1="13.51"
        x2="15.42"
        y2="17.49"
      />
      <line
        x1="15.41"
        y1="6.51"
        x2="8.59"
        y2="10.49"
      />
    </svg>
  );
}

interface ViewportDownloadFormNewProps {
  onClose: () => void;
  defaultSize: number;
  fileTypeOptions: Array<{ value: string; label: string }>;
  viewportId: string;
  showAnnotations: boolean;
  onAnnotationsChange: (show: boolean) => void;
  dimensions: { width: number; height: number };
  onDimensionsChange: (dimensions: { width: number; height: number }) => void;
  onEnableViewport: (element: HTMLElement) => void;
  onDisableViewport: () => void;
  onDownload: (filename: string, fileType: string) => void | Promise<void>;
  layoutViewportCount?: number;
  gridNumRows?: number;
  gridNumCols?: number;
  onSharePrepare?: (
    filename: string,
    fileType: string
  ) => Promise<ShareArtifactPayload | null>;
  onShareLaunch?: (artifact: ShareArtifactPayload, fileType: string) => Promise<'file' | 'text' | false>;
  onCopyToClipboard: () => void;
  warningState: { enabled: boolean; value: string };
}

function ViewportDownloadFormNew({
  onClose,
  defaultSize,
  fileTypeOptions,
  viewportId,
  showAnnotations,
  onAnnotationsChange,
  dimensions,
  warningState,
  onDimensionsChange,
  onEnableViewport,
  onDisableViewport,
  onDownload,
  onSharePrepare,
  onShareLaunch,
  onCopyToClipboard,
  layoutViewportCount = 0,
  gridNumRows = 1,
  gridNumCols = 1,
}: ViewportDownloadFormNewProps) {
  const [viewportElement, setViewportElement] = useState<HTMLElement | null>(null);
  const [showWarningMessage, setShowWarningMessage] = useState(true);
  const [filename, setFilename] = useState(DEFAULT_FILENAME);
  const [fileType, setFileType] = useState(() => fileTypeOptions[0]?.value ?? 'jpg');
  const [sharePrepareBusy, setSharePrepareBusy] = useState(false);
  const [shareLaunchBusy, setShareLaunchBusy] = useState(false);
  const [shareArtifact, setShareArtifact] = useState<ShareArtifactPayload | null>(null);
  const { t } = useTranslation('CaptureViewportModal');

  const primaryActionLabel =
    fileType === 'pdf' || fileType === 'dcm'
      ? t('Export', { defaultValue: 'Export' })
      : t('Save Image');

  const shareEnabled = Boolean(onSharePrepare && onShareLaunch);

  useEffect(() => {
    const allowed = fileTypeOptions.map(o => o.value);
    if (!allowed.length) {
      return;
    }
    setFileType(current => (allowed.includes(current) ? current : allowed[0]));
  }, [fileTypeOptions]);

  useEffect(() => {
    if (!viewportElement) {
      return;
    }

    onEnableViewport(viewportElement);

    return () => {
      onDisableViewport();
    };
  }, [onDisableViewport, onEnableViewport, viewportElement]);

  useEffect(() => {
    setShareArtifact(null);
  }, [filename, fileType]);

  const handlePrepareShare = async () => {
    if (!onSharePrepare || sharePrepareBusy) {
      return;
    }
    setSharePrepareBusy(true);
    try {
      const art = await onSharePrepare(filename || DEFAULT_FILENAME, fileType);
      if (!art) {
        toast.error(t('Share failed', { defaultValue: 'Share failed' }));
        return;
      }
      setShareArtifact(art);
      toast(t('Share file ready'), { duration: 4000 });
    } catch (error) {
      toast.error(t('Share failed', { defaultValue: 'Share failed' }));
      console.error('Share prepare error:', error);
    } finally {
      setSharePrepareBusy(false);
    }
  };

  const handleLaunchShare = async () => {
    if (!onShareLaunch || !shareArtifact || shareLaunchBusy) {
      return;
    }
    setShareLaunchBusy(true);
    try {
      const result = await onShareLaunch(shareArtifact, fileType);
      if (result) {
        toast.success(t('Share completed', { defaultValue: 'Share opened' }));
        onClose();
      }
    } catch (error) {
      toast.error(t('Share failed', { defaultValue: 'Share failed' }));
      console.error('Share launch error:', error);
    } finally {
      setShareLaunchBusy(false);
    }
  };

  return (
    <ImageModal>
      <ImageModal.Body>
        <ImageModal.ImageVisual>
          <div
            style={{
              height: dimensions.height,
              width: dimensions.width,
              position: 'relative',
            }}
            data-viewport-uid={viewportId}
            ref={setViewportElement}
          >
            {warningState.enabled && showWarningMessage && (
              <div
                className="text-foreground absolute left-1/2 bottom-[5px] z-[1000] -translate-x-1/2 whitespace-nowrap rounded bg-background p-3 text-xs font-bold"
                style={{
                  fontSize: '12px',
                }}
              >
                {warningState.value}
              </div>
            )}
          </div>
        </ImageModal.ImageVisual>

        <ImageModal.ImageOptions>
          <p className="text-primary bg-primary/10 rounded-md px-2 py-1.5 text-xs font-medium">
            {layoutViewportCount <= 1
              ? t('Layout export single', {
                  defaultValue: 'Exports the image currently shown in the viewer layout.',
                })
              : t('Layout export multi', {
                  defaultValue:
                    'Exports all {{count}} images in the current layout ({{cols}}×{{rows}} grid), exactly as on screen.',
                  count: layoutViewportCount,
                  cols: gridNumCols,
                  rows: gridNumRows,
                })}
          </p>

          <div className="flex items-end space-x-2">
            <ImageModal.Filename
              value={filename}
              onChange={e => setFilename(e.target.value)}
            >
              {t('File name')}
            </ImageModal.Filename>
            <ImageModal.Filetype
              selected={fileType}
              onSelect={setFileType}
              options={fileTypeOptions}
              disabled={fileTypeOptions.length === 1}
            />
          </div>

          <ImageModal.ImageSize
            width={dimensions.width.toString()}
            height={dimensions.height.toString()}
            widthLabel={t('Width')}
            heightLabel={t('Height')}
            widthPlaceholder={t('Width')}
            heightPlaceholder={t('Height')}
            onWidthChange={e => {
              onDimensionsChange({
                ...dimensions,
                width: parseInt(e.target.value) || defaultSize,
              });
            }}
            onHeightChange={e => {
              onDimensionsChange({
                ...dimensions,
                height: parseInt(e.target.value) || defaultSize,
              });
            }}
            maxWidth={MAX_TEXTURE_SIZE.toString()}
            maxHeight={MAX_TEXTURE_SIZE.toString()}
          >
            {t('Image size in pixels')}
          </ImageModal.ImageSize>

          <ImageModal.SwitchOption
            defaultChecked={showAnnotations}
            checked={showAnnotations}
            onCheckedChange={onAnnotationsChange}
          >
            {t('Include annotations')}
          </ImageModal.SwitchOption>

          {warningState.enabled && (
            <ImageModal.SwitchOption
              defaultChecked={showWarningMessage}
              checked={showWarningMessage}
              onCheckedChange={setShowWarningMessage}
            >
              {t('Include warning message')}
            </ImageModal.SwitchOption>
          )}
          <FooterAction className="mt-2">
            <FooterAction.Right>
              <FooterAction.Secondary onClick={onClose}>
                {t('Common:Cancel')}
              </FooterAction.Secondary>
              <FooterAction.Secondary
                onClick={async () => {
                  try {
                    await onCopyToClipboard();
                    toast.success(t('Image copied to clipboard'));
                    onClose();
                  } catch (error) {
                    toast.error(t('Failed to copy image to clipboard'));
                    console.error('Failed to copy to clipboard:', error);
                  }
                }}
              >
                {t('Copy to Clipboard')}
              </FooterAction.Secondary>
              <FooterAction.Primary
                onClick={async () => {
                  await onDownload(filename || DEFAULT_FILENAME, fileType);
                  onClose();
                }}
                className="min-w-[160px] px-6 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {primaryActionLabel}
              </FooterAction.Primary>
            </FooterAction.Right>
          </FooterAction>

          {shareEnabled ? (
            <div className="border-input bg-muted/40 text-foreground mt-3 flex w-full flex-col gap-2 rounded-xl border p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-primary/15 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-lg">
                  <ShareGlyph className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{t('Share', { defaultValue: 'Share' })}</div>
                  <div className="text-muted-foreground text-xs leading-snug">
                    {t('Share two step hint')}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={sharePrepareBusy}
                  onClick={() => void handlePrepareShare()}
                  className="bg-muted text-foreground hover:bg-muted/80 inline-flex flex-1 items-center justify-center rounded-lg border border-input px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sharePrepareBusy
                    ? t('Share preparing', { defaultValue: 'Preparing file…' })
                    : t('Share step prepare', { defaultValue: '1 — Prepare file' })}
                </button>
                <button
                  type="button"
                  disabled={!shareArtifact || shareLaunchBusy}
                  onClick={() => void handleLaunchShare()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex flex-1 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {shareLaunchBusy
                    ? t('Share opening', { defaultValue: 'Opening…' })
                    : t('Share step open', { defaultValue: '2 — Open share sheet' })}
                </button>
              </div>
            </div>
          ) : null}
        </ImageModal.ImageOptions>
      </ImageModal.Body>
    </ImageModal>
  );
}

export default {
  'ohif.captureViewportModal': ViewportDownloadFormNew,
};

