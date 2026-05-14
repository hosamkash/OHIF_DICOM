import React, { useCallback, useMemo, useState } from 'react';
import { useSystem } from '@ohif/core';
import i18n from '@ohif/i18n';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@ohif/ui-next';
import { CornerstoneViewportDownloadForm, getEnabledElement as ohifViewportDom } from '@ohif/extension-cornerstone';
import CtrRichTextEditor from '../CtrRichTextEditor';

type ExportScope = 'active-image' | 'active-series' | 'active-study';

const SCOPE_OPTIONS: { value: ExportScope; label: string; hint: string }[] = [
  { value: 'active-image', label: 'Active image / video', hint: 'الصورة أو الفيديو المعروض حالياً' },
  { value: 'active-series', label: 'Active series', hint: 'سلسلة الصور الحالية' },
  { value: 'active-study', label: 'Active study / studies', hint: 'الدراسة أو الدراسات المفتوحة' },
];

function resolveActiveStudySeries(servicesManager: AppTypes.ServicesManager): {
  studyUID: string | null;
  seriesUID: string | null;
} {
  const { viewportGridService, displaySetService } = servicesManager.services;
  const { activeViewportId, viewports } = viewportGridService.getState();
  if (!activeViewportId) {
    return { studyUID: null, seriesUID: null };
  }
  const vp = viewports.get(activeViewportId);
  const dsUid = vp?.displaySetInstanceUIDs?.[0];
  if (!dsUid) {
    return { studyUID: null, seriesUID: null };
  }
  const displaySet = displaySetService.getDisplaySetByUID(dsUid);
  const inst0 = displaySet?.instances?.[0];
  const studyUID =
    displaySet?.StudyInstanceUID ??
    inst0?.StudyInstanceUID ??
    (displaySet as { studyInstanceUid?: string })?.studyInstanceUid ??
    null;
  const seriesUID =
    displaySet?.SeriesInstanceUID ??
    inst0?.SeriesInstanceUID ??
    (displaySet as { seriesInstanceUid?: string })?.seriesInstanceUid ??
    null;
  return { studyUID: studyUID || null, seriesUID: seriesUID || null };
}

/** Active grid cell may not be a Cornerstone viewport (e.g. empty slot); pick first grid cell that has a live CS viewport. */
function pickCornerstoneViewportIdForExport(
  viewportGridService: { getState: () => AppTypes.ViewportGrid.State },
  cornerstoneViewportService:
    | { getCornerstoneViewport?: (id: string) => unknown | null }
    | undefined
): string | null {
  const getCs = cornerstoneViewportService?.getCornerstoneViewport;
  if (typeof getCs !== 'function') {
    return null;
  }

  const { activeViewportId, viewports } = viewportGridService.getState();

  const hasCornerstoneViewport = (viewportId: string | null | undefined): viewportId is string => {
    if (viewportId == null || viewportId === '') {
      return false;
    }
    if (getCs(viewportId) == null) {
      return false;
    }
    return Boolean(ohifViewportDom(viewportId)?.element);
  };

  if (hasCornerstoneViewport(activeViewportId)) {
    return activeViewportId;
  }

  if (!viewports?.size) {
    return null;
  }

  const withDisplaySet: string[] = [];
  const withoutDisplaySet: string[] = [];
  for (const [viewportId, vp] of viewports) {
    if ((vp?.displaySetInstanceUIDs?.length ?? 0) > 0) {
      withDisplaySet.push(viewportId);
    } else {
      withoutDisplaySet.push(viewportId);
    }
  }

  for (const viewportId of [...withDisplaySet, ...withoutDisplaySet]) {
    if (hasCornerstoneViewport(viewportId)) {
      return viewportId;
    }
  }

  return null;
}

export type ViewerExportHubModalProps = {
  hide: () => void;
};

export default function ViewerExportHubModal({ hide }: ViewerExportHubModalProps) {
  const { servicesManager } = useSystem();
  const { viewportGridService, uiModalService, uiNotificationService } = servicesManager.services;
  const cornerstoneViewportService = servicesManager.services.cornerstoneViewportService;

  const { studyUID, seriesUID } = useMemo(() => resolveActiveStudySeries(servicesManager), [servicesManager]);

  const [tab, setTab] = useState('export');
  const [scope, setScope] = useState<ExportScope>('active-study');
  const [reportHtml, setReportHtml] = useState('');
  const [cloudNote, setCloudNote] = useState('');

  const sharePageUrl = typeof window !== 'undefined' ? window.location.href : '';

  const notify = useCallback(
    (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning' = 'info') => {
      uiNotificationService.show({ title, message, type });
    },
    [uiNotificationService]
  );

  const openViewportDownloadForm = useCallback(
    (preferredFileFormats?: ('jpg' | 'png' | 'pdf')[]) => {
      const exportViewportId = pickCornerstoneViewportIdForExport(
        viewportGridService,
        cornerstoneViewportService
      );
      if (!exportViewportId) {
        uiNotificationService.show({
          title: 'تصدير من العرض',
          message:
            'لم يُعثر على نافذة عرض صور (Cornerstone) جاهزة. انقر داخل إطار الصورة الذي تريد تصديره ثم أعد المحاولة، أو تأكد أن الخلية النشطة ليست فارغة.',
          type: 'warning',
        });
        return;
      }
      const isPdfOnly =
        preferredFileFormats?.length === 1 && preferredFileFormats[0] === 'pdf';
      const title = isPdfOnly
        ? i18n.t('Tools:Export PDF')
        : i18n.t('Tools:Download High Quality Image');

      hide();
      window.setTimeout(() => {
        uiModalService.show({
          content: CornerstoneViewportDownloadForm,
          title,
          contentProps: {
            activeViewportId: exportViewportId,
            cornerstoneViewportService,
            preferredFileFormats,
          },
          containerClassName: 'max-w-4xl p-4',
        });
      }, 0);
    },
    [
      cornerstoneViewportService,
      hide,
      uiModalService,
      uiNotificationService,
      viewportGridService,
    ]
  );

  const openPdfServer = () => {
    if (!studyUID) {
      notify('تصدير PDF', 'لا تتوفر معلومات الدراسة من العرض النشط.', 'warning');
      return;
    }
    hide();
    window.open(`/pacs/reports/pdf/${studyUID}`, '_blank', 'noopener,noreferrer');
  };

  const openDicomArchive = () => {
    if (!studyUID) {
      notify('DICOM', 'لا تتوفر معلومات الدراسة من العرض النشط.', 'warning');
      return;
    }
    const url =
      scope === 'active-series' && seriesUID
        ? `/pacs/series/${seriesUID}/archive`
        : `/pacs/studies/${studyUID}/archive`;
    hide();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyPageLink = async () => {
    try {
      await navigator.clipboard.writeText(sharePageUrl);
      notify('نسخ', 'تم نسخ رابط صفحة العرض الحالية.', 'success');
    } catch {
      notify('نسخ', 'تعذر النسخ تلقائياً.', 'error');
    }
  };

  const shareNative = async () => {
    const title = 'مركز التصدير والمشاركة';
    const text = studyUID ? `دراسة DICOM (${studyUID})` : title;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: sharePageUrl });
      } else {
        await copyPageLink();
      }
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') {
        await copyPageLink();
      }
    }
  };

  return (
    <div
      className="flex h-full max-h-[85vh] min-h-0 w-full flex-col overflow-hidden bg-slate-100 text-[#0b1120] antialiased"
      dir="rtl"
    >
      <div className="shrink-0 border-b border-slate-200 bg-slate-50/95 px-3 py-2">
        <p className="text-xs leading-relaxed text-slate-700">
          {studyUID ? (
            <>
              <span className="font-mono">StudyInstanceUID:</span> {studyUID}
              {seriesUID ? (
                <>
                  {' '}
                  · <span className="font-mono">Series:</span> {seriesUID}
                </>
              ) : null}
            </>
          ) : (
            '—'
          )}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-3 py-3">
        <Tabs
          value={tab}
          onValueChange={setTab}
          className="flex min-h-0 flex-1 flex-col gap-3"
        >
          <div className="flex shrink-0 justify-center">
            <TabsList className="grid h-auto w-full max-w-2xl grid-cols-3 gap-1 rounded-xl bg-slate-200/90 p-1.5">
              <TabsTrigger
                value="export"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                التصدير والمشاركة
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                تحليل AI
              </TabsTrigger>
              <TabsTrigger
                value="report"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                التقرير
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="export"
            className="mt-0 flex min-h-0 flex-1 flex-col gap-4 outline-none"
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-base font-semibold text-[#0b1120]">Scope</h2>
                <div className="space-y-2">
                  {SCOPE_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3 hover:bg-slate-100"
                    >
                      <input
                        type="radio"
                        name="export-scope-hub"
                        className="mt-1 border-slate-400 text-emerald-600"
                        checked={scope === opt.value}
                        onChange={() => setScope(opt.value)}
                      />
                      <span>
                        <span className="block font-medium text-[#0b1120]">{opt.label}</span>
                        <span className="text-sm text-slate-600">{opt.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-base font-semibold text-[#0b1120]">تصدير</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    variant="secondary"
                    onClick={() => openViewportDownloadForm(['jpg', 'png'])}
                  >
                    تصدير PNG / JPEG
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => openViewportDownloadForm(['pdf'])}
                  >
                    تصدير PDF (من العرض)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openViewportDownloadForm(['jpg', 'png', 'pdf'])}
                  >
                    صورة + PDF (كل الخيارات)
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={openPdfServer}
                  >
                    تقرير PDF (خادم)
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={openDicomArchive}
                  >
                    تصدير DICOM (أرشيف)
                  </Button>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-600">
                  مسار DICOM يعتمد على إعدادات الخادم (مثل <span className="font-mono text-slate-800">/pacs/studies/…/archive</span>
                  ).
                </p>
              </section>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-[#0b1120]">رفع على كلاود</h2>
              <textarea
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-[#0b1120] placeholder:text-slate-400"
                rows={2}
                placeholder="ملاحظات الرفع (مسار التكامل يُضبط لاحقاً)"
                value={cloudNote}
                onChange={e => setCloudNote(e.target.value)}
              />
              <Button
                className="mt-2"
                variant="outline"
                onClick={() => notify('كلاود', 'واجهة الرفع ستُربط بمزوّد التخزين المعتمد لديكم.', 'info')}
              >
                بدء الرفع (قريباً)
              </Button>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-[#0b1120]">مشاركة</h2>
              <div className="flex flex-wrap gap-2">
                <Button onClick={shareNative}>مشاركة سريعة</Button>
                <Button
                  variant="outline"
                  onClick={copyPageLink}
                >
                  نسخ الرابط
                </Button>
              </div>
            </section>
          </TabsContent>

          <TabsContent
            value="ai"
            className="mt-0 space-y-4 outline-none"
          >
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              يجب أن يعتمد «تحليل AI» على مساعد طبي معتمد ومُقيَّم سريرياً؛ لا تُستخدم المخرجات كتشخيص نهائي
              ولا تغني عن الفحص السريري.
            </div>
            <Button
              variant="default"
              className="w-full sm:w-auto"
              onClick={() =>
                notify('تحليل AI', 'سيتم ربط هذه الخطوة بمساعد طبي معتمد عند توفر واجهة البرمجة.', 'info')
              }
            >
              تحليل AI (مساعد طبي معتمد)
            </Button>
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => setTab('report')}
            >
              كتابة التقرير
            </Button>
          </TabsContent>

          <TabsContent
            value="report"
            className="mt-0 min-h-0 flex-1 outline-none"
          >
            <div className="rounded-lg border border-slate-200 bg-white p-2">
              <CtrRichTextEditor
                value={reportHtml}
                onChange={setReportHtml}
                placeholder="اكتب تقريرك الطبي هنا…"
                minHeight="min(50vh, 400px)"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
