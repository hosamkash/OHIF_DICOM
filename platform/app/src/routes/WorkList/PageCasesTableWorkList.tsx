import React, { useMemo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSystem } from '@ohif/core';
import { Header, Onboarding, InvestigationalUseDialog, useModal } from '@ohif/ui-next';

import { useAppConfig } from '@state';
import CtrDataTableAdvanced, { type AdvancedColumn } from '../../components/CtrDataTableAdvanced';
import CaseStudyExpandedPanel from './CaseStudyExpandedPanel';
import { useOrthancStudyLabelsMap } from './useOrthancStudyLabelsMap';
import { getModuleColor } from '../../lib/module-color';
import { preserveQueryParameters } from '../../utils/preserveQueryParameters';
import {
  APP_MARKETING_LANDING_PATH,
  openAppPathInNewTab,
  viewerModePathname,
} from '../../constants/viewerRoutes';
import { DropdownMenuItem } from '../../components/ui/dropdown-menu';
import { getLucideIcon } from '../../lib/lucide-icons';
import { CtrConfirmAlertDialog } from '../../components/CtrConfirmDialog';
import {
  authorizationHeaderFromUserAuth,
  getOrthancRestRootFromDataSource,
  orthancDeleteStudy,
  orthancFindStudyId,
} from '../../lib/orthanc-study-labels';

const CopyMenuIcon = getLucideIcon('Copy');

type StudyRecord = {
  studyInstanceUid: string;
  accession?: string;
  modalities?: string;
  instances?: number;
  description?: string;
  mrn?: string;
  patientName?: string;
  date?: string;
  time?: string;
};

type CaseRow = StudyRecord & {
  id: string;
  studyDateDisplay: string;
  studyTimeDisplay: string;
  studyLabels: string[];
  status: 'available';
};

type PageCasesTableWorkListProps = {
  data?: StudyRecord[];
  dataTotal?: number;
  isLoadingData?: boolean;
  dataPath?: string;
  dataSource?: unknown;
  onRefresh?: () => void;
};

function formatStudyDate(date: string | undefined, dateFormat: string) {
  if (!date) {
    return '';
  }
  const parsed = moment(date, ['YYYYMMDD', 'YYYY.MM.DD'], true);
  return parsed.isValid() ? parsed.format(dateFormat) : date;
}

function formatStudyTime(time: string | undefined, timeFormat: string) {
  if (!time) {
    return '';
  }
  const parsed = moment(time, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS'], true);
  return parsed.isValid() ? parsed.format(timeFormat) : time;
}

function PageCasesTableWorkList({
  data: studies = [],
  dataTotal: studiesTotal = 0,
  isLoadingData = false,
  dataPath,
  dataSource,
  onRefresh,
}: PageCasesTableWorkListProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [appConfig] = useAppConfig();
  const { show, hide } = useModal();
  const { servicesManager } = useSystem();
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CaseRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const moduleColor = getModuleColor();

  const studyUidsForLabels = useMemo(
    () => studies.map(s => s.studyInstanceUid).filter(Boolean),
    [studies]
  );
  const { labelsByStudyUid } = useOrthancStudyLabelsMap(studyUidsForLabels, dataSource ?? null);

  React.useEffect(() => {
    document.body.classList.add('bg-black');
    return () => {
      document.body.classList.remove('bg-black');
    };
  }, []);

  const rows: CaseRow[] = useMemo(() => {
    const dateFormat = t('Common:localDateFormat', 'MMM-DD-YYYY');
    const timeFormat = t('Common:localTimeFormat', 'hh:mm A');
    return studies.map(study => ({
      ...study,
      id: study.studyInstanceUid,
      studyDateDisplay: formatStudyDate(study.date, dateFormat),
      studyTimeDisplay: formatStudyTime(study.time, timeFormat),
      studyLabels: labelsByStudyUid[study.studyInstanceUid] ?? [],
      status: 'available' as const,
    }));
  }, [studies, t, labelsByStudyUid]);

  const openStudy = useCallback(
    (study: StudyRecord) => {
      if (!study?.studyInstanceUid) {
        return;
      }
      const modalitiesToCheck = (study.modalities || '').replaceAll('/', '\\');
      const visibleModes = ((appConfig.loadedModes || []) as any[]).filter(
        mode => !mode.hide && mode.displayName
      );
      const validMode =
        visibleModes.find(mode => {
          const validation = mode.isValidMode?.({
            modalities: modalitiesToCheck,
            study,
          });
          return validation?.valid;
        }) || visibleModes[0];
      if (!validMode) {
        return;
      }
      const query = new URLSearchParams(location.search);
      query.set('StudyInstanceUIDs', study.studyInstanceUid);
      preserveQueryParameters(query);
      openAppPathInNewTab(viewerModePathname(String(validMode.routeName), dataPath || ''), query);
    },
    [appConfig.loadedModes, dataPath, location.search]
  );

  const openStudyPreferMode = useCallback(
    (study: StudyRecord, keywords: string[]) => {
      if (!study?.studyInstanceUid) {
        return;
      }
      const modalitiesToCheck = (study.modalities || '').replaceAll('/', '\\');
      const visibleModes = ((appConfig.loadedModes || []) as any[]).filter(
        mode => !mode.hide && mode.displayName
      );
      const byKeyword =
        visibleModes.find(mode => {
          const hay = `${mode.id} ${mode.routeName} ${mode.displayName}`.toLowerCase();
          return keywords.some(kw => hay.includes(kw.toLowerCase()));
        }) ||
        visibleModes.find(mode => {
          const validation = mode.isValidMode?.({
            modalities: modalitiesToCheck,
            study,
          });
          return validation?.valid;
        }) ||
        visibleModes[0];
      if (!byKeyword) {
        return;
      }
      const query = new URLSearchParams(location.search);
      query.set('StudyInstanceUIDs', study.studyInstanceUid);
      preserveQueryParameters(query);
      openAppPathInNewTab(viewerModePathname(String(byKeyword.routeName), dataPath || ''), query);
    },
    [appConfig.loadedModes, dataPath, location.search]
  );

  const onRowClickToggleExpand = useCallback((record: CaseRow) => {
    setExpandedRowIds(prev =>
      prev.includes(record.id) ? prev.filter(id => id !== record.id) : [...prev, record.id]
    );
  }, []);

  const onAddCase = useCallback(() => {
    const { customizationService } = servicesManager.services;
    const DicomUploadComponent = customizationService.getCustomization(
      'dicomUploadComponent'
    ) as React.ComponentType<{
      dataSource?: unknown;
      onComplete?: () => void;
      onStarted?: () => void;
    }> | null;
    const ds = dataSource as { getConfig?: () => { dicomUploadEnabled?: boolean } };
    if (!DicomUploadComponent || !ds?.getConfig?.()?.dicomUploadEnabled) {
      show({
        title: 'إضافة حالة',
        containerClassName: 'max-w-md',
        content: () => (
          <div
            className="p-4 text-sm text-slate-700"
            dir="rtl"
          >
            تفعيل رفع DICOM من إعداد مصدر البيانات (
            <code className="rounded bg-slate-100 px-1">dicomUploadEnabled</code>) وتأكد من تسجيل
            مكوّن الرفع في المنصة.
          </div>
        ),
      });
      return;
    }
    const containerClassName = (DicomUploadComponent as { containerClassName?: string })
      ?.containerClassName;
    const uploadProps = {
      title: 'إضافة حالة (رفع DICOM)',
      containerClassName,
      closeButton: true,
      shouldCloseOnEsc: false,
      shouldCloseOnOverlayClick: false,
      content: () => (
        <DicomUploadComponent
          dataSource={dataSource}
          onComplete={() => {
            hide();
            onRefresh?.();
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
  }, [dataSource, hide, onRefresh, servicesManager, show]);

  const requestDeleteCase = useCallback((record: CaseRow) => {
    setDeleteTarget(record);
    setDeleteOpen(true);
  }, []);

  const prependCaseRowActions = useCallback((record: CaseRow) => {
    const mrn = String(record.mrn ?? '').trim();
    const pname = String(record.patientName ?? '').trim();
    return (
      <>
        <DropdownMenuItem
          onClick={() => {
            if (mrn) {
              void navigator.clipboard.writeText(mrn);
            }
          }}
          disabled={!mrn}
        >
          <CopyMenuIcon className="mr-2 h-4 w-4" />
          نسخ كود المريض
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            if (pname) {
              void navigator.clipboard.writeText(pname);
            }
          }}
          disabled={!pname}
        >
          <CopyMenuIcon className="mr-2 h-4 w-4" />
          نسخ اسم المريض
        </DropdownMenuItem>
      </>
    );
  }, []);

  const columns: AdvancedColumn<CaseRow>[] = useMemo(
    () => [
      {
        key: 'patientName',
        title: 'اسم المريض',
        dataIndex: 'patientName',
        type: 'text',
        width: 160,
        render: (value, record) => {
          const name = value ? String(value) : '-';
          const uid = record.studyInstanceUid || '';
          return (
            <div
              className="break-words text-start font-medium text-[#0b1120]"
              title={uid ? `Study UID / كود الحالة:\n${uid}` : 'Study UID / كود الحالة: غير متوفر'}
            >
              {name}
            </div>
          );
        },
      },
      {
        key: 'mrn',
        title: 'رقم المريض',
        dataIndex: 'mrn',
        type: 'text',
        width: 120,
      },
      {
        key: 'studyDateDisplay',
        title: 'تاريخ الدراسة',
        dataIndex: 'studyDateDisplay',
        type: 'text',
        width: 120,
      },
      {
        key: 'studyTimeDisplay',
        title: 'الوقت',
        dataIndex: 'studyTimeDisplay',
        type: 'text',
        width: 90,
      },
      {
        key: 'description',
        title: 'الوصف',
        dataIndex: 'description',
        type: 'text',
        width: 200,
        render: value => (
          <div className="break-words text-start">{value ? String(value) : '-'}</div>
        ),
      },
      {
        key: 'modalities',
        title: 'Modality',
        dataIndex: 'modalities',
        type: 'text',
        width: 100,
        render: value => (
          <span className="inline-block max-w-full break-words rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-[#0b1120]">
            {value ? String(value) : '-'}
          </span>
        ),
      },
      {
        key: 'studyLabels',
        title: 'تسميات الدراسة',
        dataIndex: 'studyLabels',
        type: 'text',
        width: 220,
        render: value => {
          const tags = Array.isArray(value) ? (value as string[]) : [];
          if (!tags.length) {
            return <span className="text-slate-400">—</span>;
          }
          return (
            <div className="flex flex-wrap justify-center gap-1 break-words text-start">
              {tags.map((tag, i) => (
                <span
                  key={`${tag}__${i}`}
                  className="inline-block max-w-full break-all rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-900"
                >
                  {tag}
                </span>
              ))}
            </div>
          );
        },
      },
    ],
    []
  );

  const summary = useMemo(() => {
    const modalities = new Set(
      rows.flatMap(row => (row.modalities || '').split('/').filter(Boolean))
    );
    const patients = new Set(rows.map(row => row.mrn || row.patientName).filter(Boolean));
    const todayStudies = rows.filter(row => {
      const parsed = moment(row.date, ['YYYYMMDD', 'YYYY.MM.DD'], true);
      return parsed.isValid() && parsed.isSame(moment(), 'day');
    }).length;
    const withDescription = rows.filter(row => Boolean(row.description)).length;
    return {
      studies: studiesTotal || rows.length,
      modalities: modalities.size,
      patients: patients.size,
      todayStudies,
      withDescription,
    };
  }, [rows, studiesTotal]);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-y-auto overflow-x-hidden bg-white text-[#0b1120]">
      <div className="vigil-ohif-topbar-lighten">
        <style>
          {`
            .vigil-ohif-topbar-lighten {
              --popover: 222 42% 23%;
              --muted: 222 35% 26%;
              --card: 222 42% 23%;
              --border: 214 18% 32%;
            }
          `}
        </style>
        <Header
          isSticky
          menuOptions={[]}
          isReturnEnabled={false}
          onClickBrand={() => navigate({ pathname: APP_MARKETING_LANDING_PATH })}
          WhiteLabeling={appConfig.whiteLabeling}
        />
      </div>
      <Onboarding />

      {/* الديالوج التأكيدي للاستخدام البحثي */}
      <InvestigationalUseDialog dialogConfiguration={appConfig?.investigationalUseDialog} />

      {/* الديالوج التأكيدي لحذف الدراسة */}
      <CtrConfirmAlertDialog
        open={deleteOpen}
        onOpenChange={open => {
          if (deleteLoading) {
            return;
          }
          setDeleteOpen(open);
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="حذف الدراسة من الخادم"
        description={
          deleteTarget ? (
            <span dir="rtl">
              سيتم حذف الدراسة نهائياً من قاعدة بيانات الخادم (Orthanc) بما في ذلك السلاسل والصور.
              <br />
              <span className="mt-1 block font-medium text-slate-800">
                المريض: {deleteTarget.patientName || '—'} — UID: {deleteTarget.studyInstanceUid}
              </span>
            </span>
          ) : null
        }
        variant="danger"
        confirmLabel="حذف نهائي"
        cancelLabel="تراجع"
        loading={deleteLoading}
        onConfirm={async () => {
          if (!deleteTarget?.studyInstanceUid) {
            setDeleteOpen(false);
            return;
          }
          const orthancRest = getOrthancRestRootFromDataSource(dataSource);
          if (!orthancRest) {
            servicesManager.services.uiNotificationService?.show({
              title: 'تعذر الحذف',
              message:
                'مصدر البيانات لا يعرّف مسار REST لـ Orthanc (orthancRestRoot أو جذر DICOMweb).',
              type: 'error',
              duration: 6000,
            });
            return;
          }
          setDeleteLoading(true);
          try {
            const auth = authorizationHeaderFromUserAuth(
              servicesManager.services.userAuthenticationService
            );
            const oid = await orthancFindStudyId(orthancRest, deleteTarget.studyInstanceUid, auth);
            if (!oid) {
              servicesManager.services.uiNotificationService?.show({
                title: 'تعذر الحذف',
                message: 'لم يُعثر على الدراسة على الخادم (StudyInstanceUID).',
                type: 'error',
                duration: 6000,
              });
              return;
            }
            await orthancDeleteStudy(orthancRest, oid, auth);
            servicesManager.services.uiNotificationService?.show({
              title: 'تم الحذف',
              message: 'تمت إزالة الدراسة من الخادم.',
              type: 'success',
              duration: 4000,
            });
            setDeleteOpen(false);
            setDeleteTarget(null);
            onRefresh?.();
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

      {/* الجدول */}
      <main
        className="cases-page-scope flex min-h-0 flex-1 flex-col overflow-visible bg-white p-4"
        dir="rtl"
      >
        <style>
          {`
            .cases-page-scope button,
            .cases-page-scope [role="button"] {
              background-color: #f8fafc !important;
              border: 1px solid #cbd5e1 !important;
              color: #0b1120 !important;
            }
            .cases-page-scope button:hover,
            .cases-page-scope [role="button"]:hover {
              background-color: #eef2f7 !important;
              border-color: #0b1120 !important;
              color: #0b1120 !important;
            }
            .cases-page-scope button svg,
            .cases-page-scope [role="button"] svg {
              color: #0b1120 !important;
              stroke: #0b1120 !important;
            }
            .cases-page-scope h1, .cases-page-scope h2, .cases-page-scope h3,
            .cases-page-scope p, .cases-page-scope label,
            .cases-page-scope thead, .cases-page-scope th, .cases-page-scope th *,
            .cases-page-scope .text-muted-foreground {
              color: #0b1120 !important;
            }
            .cases-page-scope input, .cases-page-scope select {
              background-color: #ffffff !important;
              border-color: #cbd5e1 !important;
              color: #0b1120 !important;
            }
            .cases-page-scope thead, .cases-page-scope thead tr, .cases-page-scope thead th {
              border: 0 !important;
              box-shadow: none !important;
              background-color: #f8fafc !important;
            }
            .cases-page-scope th {
              border: 0 !important;
              background-color: #f8fafc !important;
            }
            .cases-page-scope thead button,
            .cases-page-scope thead [role="button"] {
              width: 100% !important;
              background-color: transparent !important;
              border-color: transparent !important;
              box-shadow: none !important;
            }
          `}
        </style>

        {/* قائمة الحالات */}
        <div className="flex w-full flex-col p-0">
          <div className="flex w-full flex-col">
            <CtrDataTableAdvanced<CaseRow>
              className="w-full"
              title="بيانات الحالات"
              dataSource={rows}
              columns={columns}
              loading={isLoadingData}
              enableSearch
              enablePagination
              enableSorting
              enableFiltering
              enableColumnVisibility
              enableAdd={true}
              onAdd={onAddCase}
              enableExport
              showActions
              onDelete={requestDeleteCase}
              enableCopyRowId={false}
              enableCopyDocument={false}
              enableDoubleClickEdit
              fillHeight={false}
              tableBodyScrollMode="document"
              documentHorizontalOverflow="hidden"
              trimCellTextWithTooltip={false}
              autoFillColumnWidth
              width="100%"
              defaultItemsPerPage={100}
              route="/ohif/cases"
              moduleColor={moduleColor}
              lableInSerachText="ابحث باسم المريض، الرقم الطبي، الوصف، أو نوع الفحص..."
              messageWhenNowData="لا توجد حالات للعرض"
              loadingText="جاري تحميل الحالات..."
              errorText="حدث خطأ في تحميل البيانات"
              actionsColumnName="فتح"
              actionsColumnWidth={70}
              onView={openStudy}
              prependActionMenuItems={prependCaseRowActions}
              viewMenuItemLabel="معاينة سريعة DICOM"
              onRowClick={onRowClickToggleExpand}
              onRowDoubleClick={openStudy}
              expandedRowIds={expandedRowIds}
              getRowExpandId={row => row.id}
              renderExpandedRow={record => (
                <CaseStudyExpandedPanel
                  study={record}
                  dataSource={dataSource}
                  onOpenDefaultViewer={() => openStudy(record)}
                  onOpenPreferMode={keywords => openStudyPreferMode(record, keywords)}
                  onAfterStudyMutation={onRefresh}
                />
              )}
              onRefresh={onRefresh ?? (() => {})}
              exportFileName="ohif-cases"
              rowsColoreOneNotOne="striped"
              fontSizeInCell="default"
              tableBackgroundColor="#ffffff"
              tableRowBackgroundColor="#ffffff"
              tableTextColor="#0b1120"
              enableCardView
              enableCardViewDefault
              cardTitleColumn="patientName"
              activeRowClassName="bg-red-500 ring-2 ring-inset ring-red-300"
              applyActiveRowClassWhenExpanded={false}
            />

            <div className="mt-2 shrink-0 rounded-md border bg-gradient-to-r from-slate-50 to-slate-100 px-3 py-2">
              <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                <div className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1.5">
                  <span className="text-blue-700">عدد الحالات: </span>
                  <span className="font-bold text-blue-900">
                    {summary.studies.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="rounded-md border border-violet-200 bg-violet-50 px-2 py-1.5">
                  <span className="text-violet-700">أنواع الفحوصات: </span>
                  <span className="font-bold text-violet-900">
                    {summary.modalities.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5">
                  <span className="text-rose-700">حالات اليوم: </span>
                  <span className="font-bold text-rose-900">
                    {summary.todayStudies.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5">
                  <span className="text-emerald-700">لها وصف: </span>
                  <span className="font-bold text-emerald-900">
                    {summary.withDescription.toLocaleString('en-US')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

PageCasesTableWorkList.propTypes = {
  data: PropTypes.array.isRequired,
  dataTotal: PropTypes.number,
  isLoadingData: PropTypes.bool.isRequired,
  dataPath: PropTypes.string,
  dataSource: PropTypes.object,
  onRefresh: PropTypes.func,
};

export default PageCasesTableWorkList;
