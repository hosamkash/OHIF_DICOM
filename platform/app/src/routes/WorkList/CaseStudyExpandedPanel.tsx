import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSystem } from '@ohif/core';
import { useModal } from '@ohif/ui-next';
import { getLucideIcon } from '../../lib/lucide-icons';
import { CtrConfirmAlertDialog } from '../../components/CtrConfirmDialog';
import {
  authorizationHeaderFromUserAuth,
  buildOrthancExplorerFilteredStudiesUrl,
  getOrthancRestRootFromDataSource,
  orthancDeleteStudy,
  orthancDeleteStudyLabel,
  orthancFindStudyId,
  orthancGetStudyLabels,
  orthancPutStudyLabel,
} from '../../lib/orthanc-study-labels';
import StudyInstancesUpload from './StudyInstancesUpload';

const IconEye = getLucideIcon('Eye');
const IconLayoutGrid = getLucideIcon('LayoutGrid');
const IconLayers = getLucideIcon('Layers');
const IconBox = getLucideIcon('Box');
const IconActivity = getLucideIcon('Activity');
const IconWaves = getLucideIcon('Waves');
const IconTrash2 = getLucideIcon('Trash2');
const IconFilePlus = getLucideIcon('FilePlus');
const IconExternalLink = getLucideIcon('ExternalLink');
const IconCopy = getLucideIcon('Copy');

/** مطابقة `@ohif/mode-basic` — مسار `/ohif/basic` (تجنّب كلمة basic وحدها لأنها تظهر في اسم المشاهد الطولي). */
const PREFER_MODE_KEYWORDS_BASIC = ['@ohif/mode-basic', 'mode-basic', 'non-longitudinal'];

/** مطابقة `@ohif/mode-segmentation` — مسار `/ohif/segmentation`. */
const PREFER_MODE_KEYWORDS_SEGMENTATION = ['segmentation', 'mode-segmentation'];

/** مطابقة `@ohif/mode-preclinical-4d` — مسار `/ohif/dynamic-volume`. */
const PREFER_MODE_KEYWORDS_DYNAMIC_VOLUME = ['dynamic-volume', 'preclinical', 'mode-preclinical'];

/** مطابقة `@ohif/mode-tmtv` — مسار `/ohif/tmtv`. */
const PREFER_MODE_KEYWORDS_TMTV = ['@ohif/mode-tmtv', 'mode-tmtv', 'tmtv'];

const PREFER_MODE_KEYWORDS_US_PLEURA = [
  'ultrasound-pleura-bline',
  'pleura-bline',
  'pleura',
  'bline',
  'ultrasound pleura',
];

export type ExpandedStudyShape = {
  studyInstanceUid: string;
  accession?: string;
  modalities?: string;
  instances?: number;
  description?: string;
  mrn?: string;
  patientName?: string;
  date?: string;
  time?: string;
  studyDateDisplay: string;
  studyTimeDisplay: string;
};

export type SeriesListItem = {
  seriesNumber?: string;
  description?: string;
  modality?: string;
  numSeriesInstances?: number;
};

type CaseStudyExpandedPanelProps = {
  study: ExpandedStudyShape;
  dataSource: unknown;
  /** فتح المشاهد الافتراضي (OHIF) */
  onOpenDefaultViewer: () => void;
  /** محاولة اختيار وضع يطابق أحد الكلمات ثم فتح الدراسة */
  onOpenPreferMode: (keywords: string[]) => void;
  /** بعد حذف / إخفاء هوية / رفع ناجح — لتحديث الجدول */
  onAfterStudyMutation?: () => void;
  /** عنوان واجهة Orthanc في المتصفح (مثل الصورة المرجعية) */
  orthancUiBaseUrl?: string;
};

function displayOrDash(value: unknown) {
  if (value === undefined || value === null) {
    return '—';
  }
  const s = String(value).trim();
  return s.length ? s : '—';
}

function CopyValueButton({
  value,
  buttonClassName = '',
  iconClassName = '',
}: {
  value: string;
  buttonClassName?: string;
  iconClassName?: string;
}) {
  const [done, setDone] = useState(false);
  const onCopy = useCallback(() => {
    const t = value === '—' ? '' : value;
    if (!t) {
      return;
    }
    navigator.clipboard.writeText(t).then(
      () => {
        setDone(true);
        window.setTimeout(() => setDone(false), 1200);
      },
      () => {}
    );
  }, [value]);

  return (
    <button
      type="button"
      title={done ? 'تم النسخ' : 'نسخ'}
      aria-label="نسخ القيمة"
      onClick={e => {
        e.stopPropagation();
        onCopy();
      }}
      className={`inline-flex shrink-0 rounded-md border border-slate-200 bg-white p-1.5 align-middle text-slate-600 shadow-sm transition hover:border-slate-400 hover:text-slate-900 ${buttonClassName}`}
    >
      <IconCopy className={`h-3.5 w-3.5 ${iconClassName}`} />
    </button>
  );
}

function CompactMetaRow({ label, value }: { label: string; value: unknown }) {
  const text = displayOrDash(value);
  return (
    <div className="grid w-full min-w-0 max-w-full grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-2 py-1 sm:py-0.5">
      <div className="flex shrink-0 justify-center self-start justify-self-center pt-0.5">
        <CopyValueButton
          value={text}
          buttonClassName="p-1"
          iconClassName="h-4 w-4"
        />
      </div>
      <div
        className="min-w-0 text-right text-base leading-relaxed text-slate-900"
        title={text}
      >
        <span className="font-bold text-slate-800">{label}</span>
        <span className="font-normal text-slate-500"> : </span>
        <span className="break-words font-normal text-slate-800">{text}</span>
      </div>
    </div>
  );
}

function ActionTile({
  icon: Icon,
  title,
  subtitle,
  onClick,
  disabled,
  variant = 'default',
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger' | 'muted';
}) {
  const palette =
    variant === 'danger'
      ? 'border-red-200 bg-red-50/80 text-red-900 hover:border-red-400'
      : variant === 'muted'
        ? 'border-slate-200 bg-slate-100/80 text-slate-500'
        : 'border-slate-300 bg-gradient-to-b from-slate-700 to-slate-900 text-white shadow-md hover:from-slate-600 hover:to-slate-800';

  return (
    <button
      type="button"
      title={subtitle ? `${title} — ${subtitle}` : title}
      disabled={disabled}
      onClick={e => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-lg border px-1.5 py-1.5 text-center transition ${palette} ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
    >
      <Icon
        className="h-4 w-4 shrink-0"
        strokeWidth={1.75}
      />
      <span className="text-[10px] font-semibold leading-tight">{title}</span>
      {subtitle ? (
        <span className="text-[9px] font-normal leading-tight opacity-80">{subtitle}</span>
      ) : null}
    </button>
  );
}

const DEFAULT_ORTHANC_UI = 'http://localhost:8042/ui/app/#/';

function filteredStudiesExplorerHref(
  studyInstanceUid: string,
  orthancRestRoot: string | null,
  orthancUiBaseUrl: string,
  expandStudy?: boolean
): string {
  if (orthancRestRoot) {
    return buildOrthancExplorerFilteredStudiesUrl(orthancRestRoot, studyInstanceUid, {
      expandStudy,
    });
  }
  const baseNoHash = orthancUiBaseUrl.split('#')[0].replace(/\/?$/, '');
  const params = new URLSearchParams();
  params.set('StudyInstanceUID', `"${studyInstanceUid}"`);
  if (expandStudy) {
    params.set('expand', 'study');
  }
  return `${baseNoHash}#/filtered-studies?${params.toString()}`;
}

export default function CaseStudyExpandedPanel({
  study,
  dataSource,
  onOpenDefaultViewer,
  onOpenPreferMode,
  onAfterStudyMutation,
  orthancUiBaseUrl = DEFAULT_ORTHANC_UI,
}: CaseStudyExpandedPanelProps) {
  const { servicesManager } = useSystem();
  const { show, hide } = useModal();
  const [labels, setLabels] = useState<string[]>([]);
  const [labelInput, setLabelInput] = useState('');
  const [labelsLoading, setLabelsLoading] = useState(false);
  const [labelsBusy, setLabelsBusy] = useState(false);
  const [labelsError, setLabelsError] = useState<string | null>(null);
  const orthancStudyIdRef = useRef<string | null>(null);
  const [series, setSeries] = useState<SeriesListItem[]>([]);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [otherStudiesCount, setOtherStudiesCount] = useState<number | null>(null);
  const [otherLoading, setOtherLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const ds = dataSource as {
      query?: { series?: { search?: (uid: string) => Promise<SeriesListItem[]> } };
    };
    if (!ds?.query?.series?.search || !study.studyInstanceUid) {
      setSeries([]);
      return;
    }
    let cancelled = false;
    setSeriesLoading(true);
    ds.query.series
      .search(study.studyInstanceUid)
      .then(rows => {
        if (!cancelled) {
          setSeries(Array.isArray(rows) ? rows : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSeries([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSeriesLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dataSource, study.studyInstanceUid]);

  useEffect(() => {
    const ds = dataSource as {
      query?: {
        studies?: {
          search?: (p: Record<string, unknown>) => Promise<{ studyInstanceUid?: string }[]>;
        };
      };
    };
    if (!ds?.query?.studies?.search || !study.mrn) {
      setOtherStudiesCount(0);
      setOtherLoading(false);
      return;
    }
    let cancelled = false;
    setOtherLoading(true);
    ds.query.studies
      .search({ patientId: study.mrn, limit: 50 })
      .then(list => {
        if (cancelled) {
          return;
        }
        const rows = Array.isArray(list) ? list : [];
        const others = rows.filter(
          r => r.studyInstanceUid && r.studyInstanceUid !== study.studyInstanceUid
        );
        setOtherStudiesCount(others.length);
      })
      .catch(() => {
        if (!cancelled) {
          setOtherStudiesCount(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setOtherLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dataSource, study.mrn, study.studyInstanceUid]);

  const orthancRestRoot = useMemo(() => getOrthancRestRootFromDataSource(dataSource), [dataSource]);

  useEffect(() => {
    orthancStudyIdRef.current = null;
    setLabels([]);
    setLabelsError(null);
    if (!study.studyInstanceUid || !orthancRestRoot) {
      setLabelsLoading(false);
      return;
    }
    const ac = new AbortController();
    let cancelled = false;
    setLabelsLoading(true);
    const auth = authorizationHeaderFromUserAuth(
      servicesManager.services.userAuthenticationService
    );
    (async () => {
      try {
        const oid = await orthancFindStudyId(
          orthancRestRoot,
          study.studyInstanceUid,
          auth,
          ac.signal
        );
        if (cancelled) {
          return;
        }
        if (!oid) {
          setLabels([]);
          setLabelsError('لا يوجد سجل Orthanc لهذه الدراسة');
          return;
        }
        orthancStudyIdRef.current = oid;
        const list = await orthancGetStudyLabels(orthancRestRoot, oid, auth, ac.signal);
        if (!cancelled) {
          setLabels(list);
          setLabelsError(null);
        }
      } catch (e) {
        if (!cancelled && (e as Error)?.name !== 'AbortError') {
          setLabelsError((e as Error)?.message || 'فشل تحميل التسميات');
          setLabels([]);
        }
      } finally {
        if (!cancelled) {
          setLabelsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [study.studyInstanceUid, orthancRestRoot, servicesManager]);

  const readAuthHeaders = useCallback((): Record<string, string> => {
    return authorizationHeaderFromUserAuth(servicesManager.services.userAuthenticationService);
  }, [servicesManager]);

  const addLabel = useCallback(async () => {
    const t = labelInput.trim();
    if (!t || labelsBusy) {
      return;
    }
    if (!orthancRestRoot) {
      setLabelsError('مصدر البيانات لا يشير إلى Orthanc (مسار dicom-web).');
      return;
    }
    if (labels.includes(t)) {
      setLabelInput('');
      return;
    }
    setLabelsBusy(true);
    setLabelsError(null);
    const auth = readAuthHeaders();
    try {
      let oid = orthancStudyIdRef.current;
      if (!oid) {
        oid = await orthancFindStudyId(orthancRestRoot, study.studyInstanceUid, auth);
        orthancStudyIdRef.current = oid;
      }
      if (!oid) {
        setLabelsError('لا يوجد سجل Orthanc لهذه الدراسة');
        return;
      }
      await orthancPutStudyLabel(orthancRestRoot, oid, t, auth);
      const list = await orthancGetStudyLabels(orthancRestRoot, oid, auth);
      setLabels(list);
      setLabelInput('');
    } catch (e) {
      setLabelsError((e as Error)?.message || 'فشل حفظ التسمية');
    } finally {
      setLabelsBusy(false);
    }
  }, [labelInput, labelsBusy, orthancRestRoot, study.studyInstanceUid, labels, readAuthHeaders]);

  const removeLabel = useCallback(
    async (tag: string) => {
      if (labelsBusy || !orthancRestRoot) {
        return;
      }
      const oid = orthancStudyIdRef.current;
      if (!oid) {
        return;
      }
      setLabelsBusy(true);
      setLabelsError(null);
      const auth = readAuthHeaders();
      try {
        await orthancDeleteStudyLabel(orthancRestRoot, oid, tag, auth);
        const list = await orthancGetStudyLabels(orthancRestRoot, oid, auth);
        setLabels(list);
      } catch (e) {
        setLabelsError((e as Error)?.message || 'فشل حذف التسمية');
      } finally {
        setLabelsBusy(false);
      }
    },
    [labelsBusy, orthancRestRoot, readAuthHeaders]
  );

  const openOrthancUi = useCallback(() => {
    const url = orthancUiBaseUrl.replace(/\/?$/, '/');
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [orthancUiBaseUrl]);

  const openOrthancForThisStudy = useCallback(() => {
    if (!study.studyInstanceUid) {
      openOrthancUi();
      return;
    }
    window.open(
      filteredStudiesExplorerHref(study.studyInstanceUid, orthancRestRoot, orthancUiBaseUrl, false),
      '_blank',
      'noopener,noreferrer'
    );
  }, [openOrthancUi, orthancRestRoot, orthancUiBaseUrl, study.studyInstanceUid]);

  const openUploadToCurrentStudy = useCallback(() => {
    if (!orthancRestRoot || !study.studyInstanceUid) {
      show({
        title: 'رفع إلى الدراسة',
        containerClassName: 'max-w-md',
        content: () => (
          <div
            className="p-4 text-sm text-slate-700"
            dir="rtl"
          >
            لا يوجد مسار Orthanc REST لهذه الدراسة. تأكد من إعداد مصدر البيانات.
          </div>
        ),
      });
      return;
    }
    const uploadProps = {
      title: 'رفع DICOM إلى الدراسة الحالية',
      containerClassName: 'max-w-3xl',
      closeButton: true,
      shouldCloseOnEsc: false,
      shouldCloseOnOverlayClick: false,
      content: () => (
        <StudyInstancesUpload
          studyContext={{
            studyInstanceUid: study.studyInstanceUid,
            patientId: study.mrn,
            patientName: study.patientName,
            accessionNumber: study.accession,
            studyDescription: study.description,
            studyDate: study.date,
            studyTime: study.time,
          }}
          orthancRestRoot={orthancRestRoot}
          readAuthHeaders={readAuthHeaders}
          onComplete={() => {
            hide();
            onAfterStudyMutation?.();
          }}
          onStarted={() => {
            show({
              ...uploadProps,
              closeButton: false,
            } as never);
          }}
        />
      ),
    };
    show(uploadProps as never);
  }, [
    hide,
    onAfterStudyMutation,
    orthancRestRoot,
    readAuthHeaders,
    show,
    study.accession,
    study.date,
    study.description,
    study.mrn,
    study.patientName,
    study.studyInstanceUid,
    study.time,
  ]);

  const orthancServerActionsEnabled = Boolean(orthancRestRoot && study.studyInstanceUid);

  return (
    <div
      className="case-study-expanded text-slate-900"
      dir="rtl"
    >
      <div className="rounded-2xl border border-red-400/80 bg-gradient-to-br from-slate-50 via-white to-slate-100/90 p-4 shadow-sm">
        {/* تسميات الدراسة */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-semibold text-slate-600">
            تسميات الدراسة
            <span className="mr-1 font-normal text-slate-400">(Labels)</span>
          </label>
          <input
            type="text"
            value={labelInput}
            disabled={labelsLoading || labelsBusy}
            onChange={e => setLabelInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void addLabel();
              }
            }}
            placeholder="أضف تسميات، اضغط Enter للإنشاء أو إضافة واحدة جديدة"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-inner outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:opacity-60"
          />
          {labelsLoading ? (
            <p className="mt-1 text-[11px] text-slate-500">جاري تحميل التسميات من Orthanc…</p>
          ) : null}
          {labelsError ? (
            <p
              className="mt-1 text-[11px] text-red-600"
              dir="auto"
            >
              {labelsError}
            </p>
          ) : null}
          {!orthancRestRoot && !labelsLoading ? (
            <p className="mt-1 text-[11px] text-amber-700">
              لا يوجد مسار Orthanc REST مشتق من الإعدادات (مثال: qidoRoot ينتهي بـ /dicom-web).
            </p>
          ) : null}
          {labels.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {labels.map(tag => (
                <button
                  key={tag}
                  type="button"
                  title="إزالة"
                  disabled={labelsBusy}
                  onClick={e => {
                    e.stopPropagation();
                    void removeLabel(tag);
                  }}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-900 hover:bg-indigo-100 disabled:opacity-50"
                >
                  {tag} ×
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* معاينة وفتح */}
        <div className="grid gap-4 lg:grid-cols-[minmax(260px,300px)_1fr]">
          <div className="flex flex-col gap-2">
            <div className="rounded-xl border border-slate-200 bg-white/80 p-2 shadow-sm backdrop-blur">
              <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                <h3 className="text-lg font-bold text-slate-800">معاينة وفتح</h3>
                <span className="text-[10px] text-slate-400">OHIF / خادم PACS</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                <ActionTile
                  icon={IconEye}
                  title="عرض في OHIF"
                  subtitle="المشاهد الافتراضي"
                  onClick={onOpenDefaultViewer}
                />
                <ActionTile
                  icon={IconLayoutGrid}
                  title="عرض في OHIF"
                  subtitle="تخطيط أساسي"
                  onClick={() => onOpenPreferMode(PREFER_MODE_KEYWORDS_BASIC)}
                />
                <ActionTile
                  icon={IconLayers}
                  title="عرض في OHIF"
                  subtitle="تجزئة"
                  onClick={() => onOpenPreferMode(PREFER_MODE_KEYWORDS_SEGMENTATION)}
                />
                <ActionTile
                  icon={IconBox}
                  title="عرض في OHIF"
                  subtitle="حجم ديناميكي 4D"
                  onClick={() => onOpenPreferMode(PREFER_MODE_KEYWORDS_DYNAMIC_VOLUME)}
                />
                <ActionTile
                  icon={IconActivity}
                  title="عرض في OHIF"
                  subtitle="PET · TMTV"
                  onClick={() => onOpenPreferMode(PREFER_MODE_KEYWORDS_TMTV)}
                />
                <ActionTile
                  icon={IconWaves}
                  title="عرض في OHIF"
                  subtitle="سونار B-line"
                  onClick={() => onOpenPreferMode(PREFER_MODE_KEYWORDS_US_PLEURA)}
                />
                <ActionTile
                  icon={IconExternalLink}
                  title="Orthanc UI"
                  subtitle="8042"
                  onClick={openOrthancForThisStudy}
                />
                <ActionTile
                  icon={IconTrash2}
                  title="حذف"
                  variant="danger"
                  subtitle="Orthanc"
                  onClick={() => setDeleteOpen(true)}
                  disabled={!orthancServerActionsEnabled}
                />
                <ActionTile
                  icon={IconFilePlus}
                  title="رفع"
                  subtitle="إلى هذه الدراسة"
                  onClick={openUploadToCurrentStudy}
                  disabled={!orthancServerActionsEnabled}
                />
              </div>
            </div>
          </div>

          {/* بيانات الدراسة والمريض — كارد واحد مدمج */}
          <div className="rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 shadow-sm">
            <h3 className="mb-1.5 border-b border-slate-100 pb-2 text-base font-bold text-slate-800">
              بيانات الدراسة والمريض
            </h3>
            <div className="grid grid-cols-1 gap-x-5 gap-y-1.5 sm:grid-cols-2">
              <CompactMetaRow
                label="تاريخ الدراسة"
                value={study.date || study.studyDateDisplay}
              />
              <CompactMetaRow
                label="وقت الدراسة"
                value={study.time || study.studyTimeDisplay}
              />
              <CompactMetaRow
                label="وصف الدراسة"
                value={study.description}
              />
              <CompactMetaRow
                label="رقم الدخول"
                value={study.accession}
              />
              <CompactMetaRow
                label="معرف نسخة الدراسة"
                value={study.studyInstanceUid}
              />
              <CompactMetaRow
                label="الأجهزة / الفحوصات"
                value={study.modalities}
              />
              <CompactMetaRow
                label="عدد الصور"
                value={study.instances}
              />
              <CompactMetaRow
                label="معرف المريض"
                value={study.mrn}
              />
              <CompactMetaRow
                label="اسم المريض"
                value={study.patientName}
              />
            </div>
            <p className="mt-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50/90 px-2 py-2 text-sm leading-relaxed text-slate-600">
              {otherLoading
                ? 'جاري البحث عن دراسات أخرى لنفس المريض…'
                : otherStudiesCount === null
                  ? 'تعذر جلب دراسات أخرى (تحقق من مصدر البيانات).'
                  : otherStudiesCount === 0
                    ? 'لا توجد دراسات أخرى لهذا المريض ضمن النتائج الحالية.'
                    : `يوجد ${otherStudiesCount} دراسة أخرى لنفس معرف المريض في النتائج المعروضة.`}
            </p>
          </div>
        </div>

        {/* السلاسل (Series) */}
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-bold text-slate-800">السلاسل (Series)</h3>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-100/90 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-3 py-2">رقم السلسلة</th>
                  <th className="px-3 py-2">وصف السلسلة</th>
                  <th className="px-3 py-2">الجهاز</th>
                  <th className="px-3 py-2">عدد الصور</th>
                </tr>
              </thead>
              <tbody>
                {seriesLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-slate-500"
                    >
                      جاري تحميل السلاسل…
                    </td>
                  </tr>
                ) : series.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-slate-500"
                    >
                      لا توجد سلاسل أو تعذر تحميلها. يُعرض ملخص الدراسة فقط.
                    </td>
                  </tr>
                ) : (
                  series.map((s, idx) => (
                    <tr
                      key={`${s.seriesNumber}-${idx}`}
                      className="border-t border-slate-100 odd:bg-slate-50/40"
                    >
                      <td className="px-3 py-2 font-mono text-xs">
                        {displayOrDash(s.seriesNumber)}
                      </td>
                      <td className="px-3 py-2">{displayOrDash(s.description)}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-semibold text-white">
                          {displayOrDash(s.modality)}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {displayOrDash(s.numSeriesInstances)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* الديالوج التأكيدي لحذف الدراسة */}
      <CtrConfirmAlertDialog
        open={deleteOpen}
        onOpenChange={open => {
          if (deleteLoading) {
            return;
          }
          setDeleteOpen(open);
        }}
        title="حذف الدراسة من الخادم"
        description={
          <span dir="rtl">
            سيتم حذف الدراسة نهائياً من Orthanc بما في ذلك السلاسل والصور.
            <br />
            <span className="mt-1 block font-medium text-slate-800">
              المريض: {study.patientName || '—'} — UID: {study.studyInstanceUid}
            </span>
          </span>
        }
        variant="danger"
        confirmLabel="حذف نهائي"
        cancelLabel="تراجع"
        loading={deleteLoading}
        onConfirm={async () => {
          if (!study.studyInstanceUid || !orthancRestRoot) {
            setDeleteOpen(false);
            return;
          }
          setDeleteLoading(true);
          try {
            const auth = readAuthHeaders();
            const oid =
              orthancStudyIdRef.current ||
              (await orthancFindStudyId(orthancRestRoot, study.studyInstanceUid, auth));
            if (!oid) {
              servicesManager.services.uiNotificationService?.show({
                title: 'تعذر الحذف',
                message: 'لم يُعثر على الدراسة على الخادم.',
                type: 'error',
                duration: 6000,
              });
              return;
            }
            await orthancDeleteStudy(orthancRestRoot, oid, auth);
            servicesManager.services.uiNotificationService?.show({
              title: 'تم الحذف',
              message: 'تمت إزالة الدراسة من الخادم.',
              type: 'success',
              duration: 4000,
            });
            setDeleteOpen(false);
            onAfterStudyMutation?.();
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            servicesManager.services.uiNotificationService?.show({
              title: 'فشل الحذف',
              message: msg,
              type: 'error',
              duration: 8000,
            });
          } finally {
            setDeleteLoading(false);
          }
        }}
      />
    </div>
  );
}
