import React, { useCallback, useState } from 'react';
import Dropzone from 'react-dropzone';
import dicomImageLoader from '@cornerstonejs/dicom-image-loader';
import { Button } from '@ohif/ui-next';
import {
  orthancClearStudyInstances,
  orthancFindStudyId,
  orthancGetStudyMainTags,
  orthancUploadInstanceToStudy,
} from '../../lib/orthanc-study-labels';
import {
  generateDicomUid,
  mergeStudyUploadContext,
  remapDicomBufferToStudy,
  type StudyUploadContext,
} from '../../lib/remap-dicom-to-study';

type StudyInstancesUploadProps = {
  studyContext: StudyUploadContext;
  orthancRestRoot: string;
  readAuthHeaders: () => Record<string, string>;
  onComplete: () => void;
  onStarted?: () => void;
};

type FileUploadState = {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'failed';
  percent: number;
  error?: string;
};

function isDicomPart10(arrayBuffer: ArrayBuffer): boolean {
  if (arrayBuffer.length <= 132) {
    return false;
  }
  const arr = new Uint8Array(arrayBuffer.slice(128, 132));
  return Array.from('DICM').every((char, i) => char.charCodeAt(0) === arr[i]);
}

async function readDicomBuffer(file: File): Promise<ArrayBuffer> {
  const fileId = dicomImageLoader.wadouri.fileManager.add(file);
  return dicomImageLoader.wadouri.loadFileRequest(fileId);
}

export default function StudyInstancesUpload({
  studyContext,
  orthancRestRoot,
  readAuthHeaders,
  onComplete,
  onStarted,
}: StudyInstancesUploadProps) {
  const { studyInstanceUid } = studyContext;
  const [items, setItems] = useState<FileUploadState[]>([]);
  const [running, setRunning] = useState(false);

  const updateItem = useCallback((index: number, patch: Partial<FileUploadState>) => {
    setItems(prev => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }, []);

  const runUpload = useCallback(
    async (files: File[]) => {
      if (!files.length || running) {
        return;
      }
      onStarted?.();
      setRunning(true);
      const ac = new AbortController();

      const rows: FileUploadState[] = files.map(file => ({
        file,
        status: 'pending',
        percent: 0,
      }));
      setItems(rows);

      try {
        const auth = readAuthHeaders();
        const orthancStudyId = await orthancFindStudyId(
          orthancRestRoot,
          studyInstanceUid,
          auth,
          ac.signal
        );
        if (!orthancStudyId) {
          throw new Error('لا يوجد سجل Orthanc لهذه الدراسة. استخدم «إضافة جديد» لإنشاء دراسة.');
        }

        const orthancMain = await orthancGetStudyMainTags(
          orthancRestRoot,
          orthancStudyId,
          auth,
          ac.signal
        );
        const resolvedContext = mergeStudyUploadContext(orthancMain, studyContext);

        await orthancClearStudyInstances(orthancRestRoot, orthancStudyId, auth, ac.signal);

        const batchSeriesUid = generateDicomUid();
        const uploadContext: StudyUploadContext = {
          ...resolvedContext,
          seriesInstanceUid: batchSeriesUid,
        };

        let allOk = true;
        for (let i = 0; i < files.length; i++) {
          if (ac.signal.aborted) {
            allOk = false;
            break;
          }
          const file = files[i];
          updateItem(i, { status: 'uploading', percent: 0, error: undefined });
          try {
            const raw = await readDicomBuffer(file);
            if (!isDicomPart10(raw)) {
              throw new Error('ليس ملف DICOM صالحاً.');
            }
            const buffer = remapDicomBufferToStudy(raw, uploadContext);
            await orthancUploadInstanceToStudy(orthancRestRoot, orthancStudyId, buffer, auth, {
              expectedStudyInstanceUid: uploadContext.studyInstanceUid,
              signal: ac.signal,
              onProgress: percent => updateItem(i, { percent }),
            });
            updateItem(i, { status: 'success', percent: 100 });
          } catch (e) {
            allOk = false;
            if ((e as Error)?.name === 'AbortError') {
              updateItem(i, { status: 'failed', error: 'أُلغي' });
            } else {
              updateItem(i, {
                status: 'failed',
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }
        }

        if (allOk) {
          onComplete();
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setItems(prev =>
          prev.map(row => ({ ...row, status: 'failed' as const, error: msg }))
        );
      } finally {
        setRunning(false);
      }
    },
    [
      onComplete,
      onStarted,
      orthancRestRoot,
      readAuthHeaders,
      running,
      studyContext,
      studyInstanceUid,
      updateItem,
    ]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) {
        return;
      }
      void runUpload(acceptedFiles);
    },
    [runUpload]
  );

  if (items.length > 0) {
    const done = items.filter(r => r.status === 'success' || r.status === 'failed').length;
    const allDone = done === items.length && !running;

    return (
      <div
        className="flex max-h-[min(70vh,520px)] flex-col gap-3 p-4"
        dir="rtl"
      >
        <p className="text-sm text-slate-600">
          استبدال صور الدراسة بملفات DICOM المرفوعة ({studyInstanceUid.slice(0, 24)}…)
        </p>
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {items.map((row, idx) => (
            <li
              key={`${row.file.name}-${idx}`}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-slate-800">{row.file.name}</span>
                <span className="shrink-0 text-xs text-slate-500">
                  {row.status === 'uploading'
                    ? `${row.percent}%`
                    : row.status === 'success'
                      ? 'تم'
                      : row.status === 'failed'
                        ? 'فشل'
                        : 'انتظار'}
                </span>
              </div>
              {row.status === 'uploading' ? (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-teal-600 transition-all"
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
              ) : null}
              {row.error ? <p className="mt-1 text-xs text-red-600">{row.error}</p> : null}
            </li>
          ))}
        </ul>
        {allDone ? (
          <Button
            type="button"
            className="self-end"
            onClick={() => {
              if (items.every(r => r.status === 'success')) {
                onComplete();
              } else {
                setItems([]);
              }
            }}
          >
            {items.every(r => r.status === 'success') ? 'إغلاق' : 'محاولة أخرى'}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="m-4 flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-300 bg-slate-50"
      dir="rtl"
    >
      <Dropzone
        onDrop={onDrop}
        disabled={running}
        noClick
      >
        {({ getRootProps }) => (
          <div
            {...getRootProps()}
            className="flex w-full flex-col items-center justify-center gap-3 p-6"
          >
            <p className="text-center text-sm text-slate-600">
              استبدال صور الدراسة بملفات DICOM المرفوعة (تُحذف الصور السابقة على الخادم)
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Dropzone
                onDrop={onDrop}
                disabled={running}
                noDrag
              >
                {({ getRootProps: fileRoot, getInputProps }) => (
                  <div {...fileRoot()}>
                    <Button
                      type="button"
                      variant="default"
                      size="lg"
                      disabled={running}
                    >
                      إضافة ملفات
                      <input
                        {...getInputProps()}
                        className="hidden"
                      />
                    </Button>
                  </div>
                )}
              </Dropzone>
              <Dropzone
                onDrop={onDrop}
                disabled={running}
                noDrag
              >
                {({ getRootProps: folderRoot, getInputProps }) => (
                  <div {...folderRoot()}>
                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      disabled={running}
                    >
                      إضافة مجلد
                      <input
                        {...getInputProps()}
                        className="hidden"
                        // @ts-expect-error vendor directory attrs
                        webkitdirectory=""
                        mozdirectory=""
                      />
                    </Button>
                  </div>
                )}
              </Dropzone>
            </div>
            <p className="text-xs text-slate-500">أو اسحب ملفات / مجلد DICOM هنا</p>
          </div>
        )}
      </Dropzone>
    </div>
  );
}
