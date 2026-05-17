import React, { useEffect, useState } from 'react';
import { orthancFetchSeriesPreviewBlob } from '../../lib/orthanc-study-labels';

type SeriesThumbnailCellProps = {
  orthancRestRoot: string;
  studyInstanceUid?: string;
  seriesInstanceUid?: string;
  wadoRoot?: string | null;
  readAuthHeaders: () => Record<string, string>;
  modality?: string;
};

export default function SeriesThumbnailCell({
  orthancRestRoot,
  studyInstanceUid,
  seriesInstanceUid,
  wadoRoot,
  readAuthHeaders,
  modality,
}: SeriesThumbnailCellProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const uid = seriesInstanceUid?.trim();
    if (!uid) {
      setSrc(null);
      setFailed(true);
      return;
    }

    const ac = new AbortController();
    let objectUrl: string | null = null;
    setFailed(false);
    setSrc(null);

    void (async () => {
      try {
        const blob = await orthancFetchSeriesPreviewBlob(
          orthancRestRoot,
          uid,
          readAuthHeaders(),
          ac.signal,
          {
            studyInstanceUid: studyInstanceUid?.trim() || undefined,
            wadoRoot: wadoRoot?.trim() || undefined,
          }
        );
        if (ac.signal.aborted) {
          return;
        }
        if (!blob || blob.size === 0) {
          setFailed(true);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (!ac.signal.aborted) {
          setFailed(true);
        }
      }
    })();

    return () => {
      ac.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setSrc(prev => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
    };
  }, [orthancRestRoot, readAuthHeaders, seriesInstanceUid, studyInstanceUid, wadoRoot]);

  if (src) {
    return (
      <img
        src={src}
        alt={modality ? `معاينة ${modality}` : 'معاينة السلسلة'}
        className="mx-auto h-16 w-16 rounded-md border border-slate-200 bg-white object-contain"
        loading="lazy"
      />
    );
  }

  if (failed) {
    return (
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-500"
        title="تعذر تحميل المعاينة"
      >
        —
      </div>
    );
  }

  return (
    <div
      className="mx-auto h-16 w-16 animate-pulse rounded-md border border-slate-200 bg-slate-100"
      aria-hidden
    />
  );
}
