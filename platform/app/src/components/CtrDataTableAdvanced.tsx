'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { getLucideIcon } from '../lib/lucide-icons';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { getModuleColor } from '../lib/module-color';
import { useScreenSettings } from '../lib/hooks/use-screen-settings';
import { useLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import type { TableDensity, DisplayMode } from '../lib/types/screen-settings';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from './ui/context-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import CtrDateDocumentFilter from './00-Public/CtrDateDocumentFilter';
import type { CtrDateDocumentFilterProps } from './00-Public/CtrDateDocumentFilter';

const ArrowUpDown = getLucideIcon('ArrowUpDown', 'ChevronsUpDown');
const Download = getLucideIcon('Download', 'ChevronDown');
const Filter = getLucideIcon('Filter', 'ChevronDown');
const MoreHorizontal = getLucideIcon('MoreHorizontal', 'GripVertical');
const Search = getLucideIcon('Search', 'Code');
const Upload = getLucideIcon('Upload', 'ChevronUp');
const Eye = getLucideIcon('Eye', 'Check');
const ChevronLeft = getLucideIcon('ChevronLeft');
const ChevronRight = getLucideIcon('ChevronRight');
const ChevronsLeft = getLucideIcon('ChevronsLeft', 'ChevronLeft');
const ChevronsRight = getLucideIcon('ChevronsRight', 'ChevronRight');
const Plus = getLucideIcon('Plus', 'Check');
const FileText = getLucideIcon('FileText', 'Code');
const Edit = getLucideIcon('Edit', 'Code');
const Trash2 = getLucideIcon('Trash2', 'Code');
const ViewIcon = Eye;
const Unlock = getLucideIcon('Unlock', 'Check');
const Copy = getLucideIcon('Copy', 'Code');
const Coins = getLucideIcon('Coins', 'Code');
const Package = getLucideIcon('Package', 'Code');
const Type = getLucideIcon('Type', 'Code');
const Minus = getLucideIcon('Minus', 'ChevronDown');
const Maximize2 = getLucideIcon('Maximize2', 'ChevronsUpDown');
const RefreshCw = getLucideIcon('RefreshCw', 'ChevronsUpDown');
const FileDown = getLucideIcon('FileDown', 'Download');
const ImageIcon = getLucideIcon('Image', 'Code');
const LayoutGrid = getLucideIcon('LayoutGrid', 'GripVertical');
const Table2 = getLucideIcon('Table2', 'GripVertical');

/** إعدادات فلتر التاريخ المدمج في شريط أدوات الجدول */
export type CtrDataTableDateDocumentFilterConfig = Pick<
  CtrDateDocumentFilterProps,
  | 'dateFilter'
  | 'fromDate'
  | 'toDate'
  | 'selectedMonth'
  | 'onDateFilterChange'
  | 'onFromDateChange'
  | 'onToDateChange'
  | 'onMonthChange'
> &
  Partial<
    Pick<
      CtrDateDocumentFilterProps,
      | 'storageKey'
      | 'className'
      | 'disabled'
      | 'showToday'
      | 'showMonth'
      | 'showAll'
      | 'showPeriod'
      | 'showDateLable'
      | 'hideCard'
    >
  >;

// تعريف أنواع الجدول المتقدم
export type DataTableAdvancedVariant = 'default' | 'striped' | 'bordered' | 'compact';
export type DataTableAdvancedSize = 'sm' | 'default' | 'lg';
export type ColumnVisibilityMode = 'dropdown' | 'checklist';

// تعريف خصائص العمود المتقدم
export interface AdvancedColumn<T = Record<string, unknown>> {
  key: string;
  title: string | React.ReactNode;
  dataIndex?: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  /** إخفاء/إظهار أيقونة الترتيب لهذا العمود فقط (الافتراضي: true) */
  showSortIcon?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  sorter?: (a: T, b: T) => number;
  filterOptions?: Array<{ label: string; value: unknown }>;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'badge' | 'actions';
  badgeConfig?: {
    active: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' };
    inactive: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' };
  };
}

// تعريف خصائص الجدول المتقدم
export interface CtrDataTableAdvancedProps<T = Record<string, unknown>> {
  // التحكم في المظهر
  rowsColoreOneNotOne?: DataTableAdvancedVariant;
  fontSizeInCell?: DataTableAdvancedSize;
  className?: string;
  /** className مخصص لنص هيدر الأعمدة */
  columnsHeaderClassName?: string;
  tableBackgroundColor?: string;
  tableHeaderBackgroundColor?: string;
  tableRowBackgroundColor?: string;
  tableTextColor?: string;

  // التحكم في البيانات
  dataSource?: T[];
  columns?: AdvancedColumn<T>[];

  // التحكم في الحالة
  loading?: boolean;
  error?: boolean;

  // التحكم في الوظائف
  enableSearch?: boolean;
  enableFiltering?: boolean;
  enableSorting?: boolean;
  enableSelection?: boolean;
  enableColumnVisibility?: boolean;
  enablePagination?: boolean;
  enableExport?: boolean;
  enableImport?: boolean;
  enableAdd?: boolean;

  // التحكم في الأبعاد
  width?: number | string;
  height?: number | string;
  maxHeight?: number | string;
  actionsColumnWidth?: number | string; // عرض عمود الإجراءات
  actionsColumnName?: string; // اسم هيدر عمود الإجراءات
  autoFillColumnWidth?: boolean; // تصغير الأعمدة والفونت بنفس النسبة لتناسب الشاشة
  columnVisibilityMode?: ColumnVisibilityMode;

  // التحكم في النص
  title?: React.ReactNode;
  description?: string;
  lableInSerachText?: string;
  messageWhenNowData?: string;
  loadingText?: string;
  errorText?: string;

  // التحكم في الأحداث
  onRowClick?: (record: T, index: number) => void;
  onRowContextMenu?: (record: T, index: number, event: React.MouseEvent) => void;
  onRowDoubleClick?: (record: T, index: number) => void;
  onRowSelect?: (selectedRows: T[]) => void;
  onSort?: (column: string, direction: 'asc' | 'desc' | 'none') => void;
  onFilter?: (filters: Record<string, unknown>) => void;
  onColumnVisibilityStateChange?: (visibility: Record<string, boolean>) => void;
  onVisibleRowsChange?: (rows: T[]) => void;
  onSearch?: (searchTerm: string) => void;
  onExport?: (data: T[]) => void;
  onImport?: (file: File) => void;
  onAdd?: () => void;
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void;
  onView?: (record: T) => void;
  onOpen?: (record: T) => void; // لفتح المستند (تغيير IsClosed من true إلى false)
  onCopy?: (record: T) => void; // لنسخ المستند (إنشاء مستند جديد بنفس البيانات)
  onReceive?: (record: T) => void; // لإستلام الطلب (يفتح في حالة تعديل)
  onViewCountMoney?: (record: T) => void; // لعرض عد النقدية
  /** عناصر إضافية في قائمة «...» لكل صف (مثلاً فتح شاشة في تبويب جديد) */
  extraDropdownMenuItems?: (record: T) => React.ReactNode;
  /** عناصر تُدرَج قبل بند المعاينة (onView) — مثل نسخ كود المريض */
  prependActionMenuItems?: (record: T) => React.ReactNode;
  /** نص بند القائمة المرتبط بـ onView */
  viewMenuItemLabel?: string;
  /** إظهار عنصر «نسخ المعرف» في قائمة الإجراءات (افتراضي: true) */
  enableCopyRowId?: boolean;
  /** إظهار عنصر «نسخ المستند» عند وجود onCopy (افتراضي: true) */
  enableCopyDocument?: boolean;
  /**
   * عناصر قائمة مشتركة بين ⋯ والكليك الأيمن (نفس المصدر).
   * عند التمرير: لا يُعرض «تعديل» و«حذف» الافتراضيان من الجدول — ضمّنهما داخل هذا الـ render إن رغبت (مثل شاشة الزيارات).
   */
  renderRowInsightMenuItems?: (record: T, variant: 'dropdown' | 'context') => React.ReactNode;
  onRefresh?: () => void | Promise<void>; // إعادة تحميل البيانات من المصدر — عند تمريره يظهر زر «تحديث» إلا لو enableRefresh=false
  enableRefresh?: boolean; // false = إخفاء زر التحديث رغم وجود onRefresh (افتراضي true)

  // التحكم في التخطيط
  showHeader?: boolean;
  showFooter?: boolean;
  showToolbar?: boolean;
  showTitle?: boolean;
  showActions?: boolean;

  // التحكم في النقر المزدوج
  enableDoubleClickEdit?: boolean;

  // التحكم في إظهار أيقونات الترتيب في الهيدر
  showSortIcons?: boolean;

  // التحكم في ألوان الأزرار
  moduleColor?: string;

  // التحكم في التصدير
  exportFormats?: ('csv' | 'excel' | 'pdf' | 'image')[];
  exportFileName?: string;

  // التحكم في الاستيراد
  importFormats?: ('csv' | 'excel')[];
  maxFileSize?: number; // بالبايت

  // أزرار مخصصة في الهيدر
  headerActions?: React.ReactNode;

  // أزرار / عناصر مخصصة في شريط الأدوات (الجزء الأيمن)
  toolbarActions?: React.ReactNode;
  // أزرار / عناصر مخصصة في شريط الأدوات (الجزء الأيسر بجوار البحث/التصفية)
  toolbarLeftActions?: React.ReactNode;
  /** فلتر التاريخ المدمج بجوار البحث (بدون تكرار CtrDateDocumentFilter في كل شاشة) */
  enableDateDocumentFilter?: boolean;
  dateDocumentFilter?: CtrDataTableDateDocumentFilterConfig;

  // قيمة البحث الأولية (لحفظ حالة البحث من URL)
  initialSearchValue?: string;

  // حفظ إعدادات الشاشة (عدد السجلات المعروضة)
  // إذا تم تمرير route، سيتم حفظ عدد السجلات المعروضة تلقائياً في App_ScreenSettings
  route?: string;
  defaultItemsPerPage?: number;
  /** عند true يملأ الجدول الارتفاع المتاح مع scroll داخلي دون تجاوز الإطار */
  fillHeight?: boolean;
  /** دالة لإرجاع className للصف حسب الـ record */
  getRowClassName?: (record: T) => string;
  /**
   * أصناف Tailwind للصف «النشط» (آخر صف نقرة عليه في الجدول أو الكارت).
   * سلسلة فارغة = إخفاء التمييز. الافتراضي: !bg-green-100
   */
  activeRowClassName?: string;
  /**
   * عند false (افتراضي): لا يُطبَّق تمييز الصف النشط أثناء فتح التوسيع (expand) لأن مظهر اللوحة يغلب.
   * عند true: يُطبَّق activeRowClassName حتى مع التوسيع.
   */
  applyActiveRowClassWhenExpanded?: boolean;
  /** عند الإرجاع غير undefined يُعرض كـ title على الصف (tooltip أصلي للمتصفح على كامل السطر) */
  getRowTitle?: (record: T) => string | undefined;
  /** className مخصص لكل خلية - مفيد لتمييز خلايا الـ validation */
  getCellClassName?: (
    record: T,
    columnKey: string,
    value: unknown,
    rowIndex: number
  ) => string | undefined;
  /** title مخصص لكل خلية (رسالة خطأ مثلا) */
  getCellTitle?: (
    record: T,
    columnKey: string,
    value: unknown,
    rowIndex: number
  ) => string | undefined;
  /** قص نص الخلية بعرض العمود مع ... وعرض النص كاملاً في tooltip عند المرور (افتراضي true) */
  trimCellTextWithTooltip?: boolean;
  /** تفعيل عرض الكروت (بديل عن الجدول) مع إمكانية التبديل وحفظ الإعداد */
  enableCardView?: boolean;
  /** عند التفعيل: على الشاشات الضيقة يُعرض الكروت افتراضياً مع بقاء زر التبديل */
  enableCardViewDefault?: boolean;
  /** مفتاح العمود الذي يظهر كعنوان للكارت (افتراضي: أول عمود مرئي) */
  cardTitleColumn?: string;
  /** فلتر صفوف عرض الكروت فقط - الصفوف التي ترجع false تُستبعد من الكروت (مثال: استبعاد صفوف التجميع) */
  cardViewRowFilter?: (record: T) => boolean;
  /** كثافة الجدول الافتراضية عند عدم وجود إعدادات محفوظة (مثل: compact، extra-compact) */
  defaultTableDensity?: TableDensity;
  /** عند الإرجاع غير null يُعرض الصف كخلية واحدة بعرض كامل (colspan) بدل أعمدة عادية */
  renderFullWidthCell?: (record: T) => React.ReactNode | null;
  /**
   * صف تفصيلي تحت الصف الأصلي عند تطابق معرف التوسيع (يُتحكم به من الأب عبر onRowClick + expandedRowId).
   */
  renderExpandedRow?: (record: T) => React.ReactNode;
  /** معرف الصف المفتوح — يُقارَن مع نتيجة getRowExpandId(record) */
  expandedRowId?: string | null;
  /** عند تمرير مصفوفة: السماح بعدة صفوف مفتوحة معاً (يغلب expandedRowId) */
  expandedRowIds?: string[] | null;
  /** استخراج معرف فريد للصف (افتراضي: (record as any).id ثم id من TanStack) */
  getRowExpandId?: (record: T, rowId: string) => string;
  /**
   * panel: تمرير داخلي داخل الجدول (افتراضي مع fillHeight).
   * document: بدون تمرير عمودي داخل الجدول — المحتوى يتمدد والتمرير على الصفحة.
   */
  tableBodyScrollMode?: 'panel' | 'document';
  /**
   * مع tableBodyScrollMode=document: auto = تمرير أفقي عند الحاجة؛ hidden = بدون تمرير أفقي (التفاف النص).
   */
  documentHorizontalOverflow?: 'auto' | 'hidden';
  /** إخفاء قائمة كثافة الجدول (عادي / مدمج …) في شريط الأدوات */
  enableTableDensityControl?: boolean;
}

// المكون الرئيسي للجدول المتقدم
export function CtrDataTableAdvanced<T = Record<string, unknown>>({
  rowsColoreOneNotOne = 'default',
  fontSizeInCell = 'default',
  className,
  columnsHeaderClassName,
  tableBackgroundColor,
  tableHeaderBackgroundColor,
  tableRowBackgroundColor,
  tableTextColor,
  dataSource = [],
  columns = [],
  loading = false,
  error = false,
  enableSearch = true,
  enableFiltering = true,
  enableSorting = true,
  enableSelection = false,
  enableColumnVisibility = true,
  enablePagination = true,
  enableExport = false,
  enableImport = false,
  enableAdd = true,
  width,
  height,
  maxHeight,
  actionsColumnWidth = 50,
  actionsColumnName = '...', // الإجراءات
  autoFillColumnWidth = false,
  columnVisibilityMode = 'dropdown',
  title,
  description,
  lableInSerachText = 'ابحث عن أي معلومة في الجدول...',
  messageWhenNowData = 'لا توجد بيانات للعرض',
  loadingText = 'جاري التحميل...',
  errorText = 'حدث خطأ في تحميل البيانات',
  onRowClick,
  onRowContextMenu,
  onRowDoubleClick,
  onRowSelect,
  onColumnVisibilityStateChange,
  onVisibleRowsChange,
  onSearch,
  onExport,
  onImport,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onOpen,
  onCopy,
  onReceive,
  onViewCountMoney,
  extraDropdownMenuItems,
  prependActionMenuItems,
  viewMenuItemLabel = 'عرض التفاصيل',
  enableCopyRowId = true,
  enableCopyDocument = true,
  renderRowInsightMenuItems,
  onRefresh,
  enableRefresh = true,
  getRowClassName,
  activeRowClassName = '!bg-green-100',
  applyActiveRowClassWhenExpanded = false,
  getRowTitle,
  getCellClassName,
  getCellTitle,
  showHeader = true,
  showFooter = true,
  showToolbar = true,
  showTitle = true,
  showActions = true,
  enableDoubleClickEdit = true,
  showSortIcons = true,
  moduleColor,
  exportFormats = ['csv', 'pdf', 'image'],
  exportFileName,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  headerActions,
  toolbarActions,
  toolbarLeftActions,
  enableDateDocumentFilter = false,
  dateDocumentFilter,
  route,
  initialSearchValue,
  defaultItemsPerPage,
  fillHeight = false,
  trimCellTextWithTooltip = true,
  enableCardView = true,
  enableCardViewDefault = false,
  cardTitleColumn,
  cardViewRowFilter,
  defaultTableDensity,
  renderFullWidthCell,
  renderExpandedRow,
  expandedRowId = null,
  expandedRowIds = null,
  getRowExpandId,
  tableBodyScrollMode = 'panel',
  documentHorizontalOverflow = 'auto',
  enableTableDensityControl = false,
}: CtrDataTableAdvancedProps<T>) {
  const isDocumentTableScroll = tableBodyScrollMode === 'document';
  const isDocumentHorizontalOverflowHidden =
    isDocumentTableScroll && documentHorizontalOverflow === 'hidden';

  const expandedIdSet = React.useMemo(() => {
    if (Array.isArray(expandedRowIds)) {
      return new Set(expandedRowIds.map(String));
    }
    if (expandedRowId != null && String(expandedRowId) !== '') {
      return new Set([String(expandedRowId)]);
    }
    return new Set<string>();
  }, [expandedRowIds, expandedRowId]);

  const { pathname } = useLocation();
  // استخدام route الممرر أو pathname الحالي
  const settingsRoute = route || pathname || '';

  // استخدام useScreenSettings - يجب استخدام hook دائماً (لا يمكن استخدامه بشكل مشروط)
  // إذا لم يكن route موجود، نمرر string فارغ وسيتعامل hook معه
  const enableSettingsPersistence =
    !!settingsRoute && (enablePagination || enableColumnVisibility || enableCardView);
  const {
    settings,
    updateItemsPerPage,
    updateColumnVisibility,
    updateTableDensity,
    updateDisplayMode,
  } = useScreenSettings(enableSettingsPersistence ? settingsRoute : '__disabled__');

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [activeRowId, setActiveRowId] = React.useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = React.useState(initialSearchValue || '');
  const [mobileToolsOpen, setMobileToolsOpen] = React.useState(false);
  const previousColumnIdsRef = React.useRef<Set<string>>(new Set());
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const tableRef = React.useRef<HTMLDivElement>(null);
  const pendingCellFocusRef = React.useRef<{ rowIndex: number; columnId: string } | null>(null);
  const [scaleFactor, setScaleFactor] = React.useState(1);

  const activeRowHighlightClass = React.useCallback(
    (rowTanstackId: string, isExpanded: boolean) => {
      const cls = (activeRowClassName ?? '').trim();
      if (!cls || activeRowId !== rowTanstackId) {
        return '';
      }
      if (isExpanded && !applyActiveRowClassWhenExpanded) {
        return '';
      }
      return cls;
    },
    [activeRowClassName, activeRowId, applyActiveRowClassWhenExpanded]
  );

  // تحديد كثافة الجدول من الإعدادات أو القيمة الافتراضية
  const tableDensity: TableDensity = React.useMemo(() => {
    return settings?.TableDensity ?? defaultTableDensity ?? 'normal';
  }, [settings?.TableDensity, defaultTableDensity]);

  // وضع العرض: جدول أو كروت (من الإعدادات)
  const displayMode: DisplayMode = React.useMemo(() => {
    if (!enableCardView) return 'table';
    return (settings?.DisplayMode === 'card' ? 'card' : 'table') as DisplayMode;
  }, [settings?.DisplayMode, enableCardView]);

  const isNarrowForCardDefault = React.useSyncExternalStore(
    React.useCallback(onStoreChange => {
      if (typeof window === 'undefined') return () => {};
      const mq = window.matchMedia('(max-width: 767px)');
      mq.addEventListener('change', onStoreChange);
      return () => mq.removeEventListener('change', onStoreChange);
    }, []),
    () => (typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false),
    () => false
  );
  const isNarrowToolbar = React.useSyncExternalStore(
    React.useCallback(onStoreChange => {
      if (typeof window === 'undefined') return () => {};
      const mq = window.matchMedia('(max-width: 767px)');
      mq.addEventListener('change', onStoreChange);
      return () => mq.removeEventListener('change', onStoreChange);
    }, []),
    () => (typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false),
    () => false
  );
  const importInputId = React.useId();
  const effectiveTableBackgroundColor = tableBackgroundColor;
  const effectiveTableHeaderBackgroundColor = tableHeaderBackgroundColor ?? tableBackgroundColor;
  const effectiveTableRowBackgroundColor = tableRowBackgroundColor ?? tableBackgroundColor;
  const tableColorStyle: React.CSSProperties = {
    ...(effectiveTableBackgroundColor ? { backgroundColor: effectiveTableBackgroundColor } : {}),
    ...(tableTextColor ? { color: tableTextColor } : {}),
  };
  const tableHeaderColorStyle: React.CSSProperties = {
    ...(effectiveTableHeaderBackgroundColor
      ? { backgroundColor: effectiveTableHeaderBackgroundColor }
      : {}),
    ...(tableTextColor ? { color: tableTextColor } : {}),
  };
  const tableRowColorStyle: React.CSSProperties = {
    ...(effectiveTableRowBackgroundColor ? { backgroundColor: effectiveTableRowBackgroundColor } : {}),
    ...(tableTextColor ? { color: tableTextColor } : {}),
  };

  const effectiveDisplayMode: DisplayMode = React.useMemo(() => {
    // يجب أن يسبق تعطيل العرض كبطاقات: على الشاشات الضيقة نفرض الكروت عند تفعيل الافتراضي
    if (enableCardViewDefault && isNarrowForCardDefault) return 'card';
    if (!enableCardView) return 'table';
    return displayMode;
  }, [enableCardView, enableCardViewDefault, isNarrowForCardDefault, displayMode]);

  // تحديث globalFilter عند تغيير initialSearchValue
  React.useEffect(() => {
    if (initialSearchValue !== undefined) {
      setGlobalFilter(initialSearchValue);
    }
  }, [initialSearchValue]);

  const hasPropDefaultPageSize =
    Number.isFinite(defaultItemsPerPage) && (defaultItemsPerPage ?? 0) > 0;

  // تحديد عدد الصفوف الافتراضي: من prop أولاً، ثم الإعدادات، ثم 10
  const defaultPageSize = React.useMemo(() => {
    if (hasPropDefaultPageSize) {
      return defaultItemsPerPage as number;
    }
    if (settings?.ItemsPerPage && settings.ItemsPerPage > 0) {
      return settings.ItemsPerPage;
    }
    return 10;
  }, [hasPropDefaultPageSize, settings?.ItemsPerPage, defaultItemsPerPage]);

  const [pageSize, setPageSize] = React.useState(defaultPageSize);
  const [pageIndex, setPageIndex] = React.useState(0);
  const paginationRef = React.useRef({ pageIndex: 0, pageSize: defaultPageSize });

  React.useEffect(() => {
    paginationRef.current = { pageIndex, pageSize };
  }, [pageIndex, pageSize]);

  const searchableColumns = React.useMemo(
    () => columns.filter(col => col.searchable !== false && (col.dataIndex || col.key)),
    [columns]
  );

  const normalizeSearchText = React.useCallback((value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toLocaleDateString('en-US');
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }, []);

  const globalSearchFilterFn = React.useCallback(
    (row: any, _columnId: string, filterValue: unknown) => {
      const searchTerm = String(filterValue ?? '')
        .trim()
        .toLowerCase();
      if (!searchTerm) return true;

      return searchableColumns.some(col => {
        const fieldName = col.dataIndex || col.key;
        const rawValue = (row.original as Record<string, unknown>)[fieldName];
        return normalizeSearchText(rawValue).toLowerCase().includes(searchTerm);
      });
    },
    [searchableColumns, normalizeSearchText]
  );

  // تحديث pageSize عند تغيير الإعدادات
  React.useEffect(() => {
    if (hasPropDefaultPageSize) {
      setPageSize(defaultItemsPerPage as number);
      return;
    }
    if (settings?.ItemsPerPage && settings.ItemsPerPage > 0) {
      setPageSize(settings.ItemsPerPage);
    }
  }, [hasPropDefaultPageSize, defaultItemsPerPage, settings?.ItemsPerPage]);

  // تحميل حالة إظهار/إخفاء الأعمدة من الإعدادات المحفوظة
  React.useEffect(() => {
    if (settings?.ColumnVisibility) {
      setColumnVisibility(settings.ColumnVisibility);
    }
  }, [settings?.ColumnVisibility]);

  // دالة للحصول على لون الموديول
  const getCurrentModuleColor = React.useCallback(() => {
    return moduleColor || getModuleColor();
  }, [moduleColor]);

  // استخدام useRef للدوال لتجنب إعادة الإنشاء
  const onRowSelectRef = React.useRef(onRowSelect);
  const onRowClickRef = React.useRef(onRowClick);
  const onRowContextMenuRef = React.useRef(onRowContextMenu);
  const onRowDoubleClickRef = React.useRef(onRowDoubleClick);
  const onExportRef = React.useRef(onExport);
  const onImportRef = React.useRef(onImport);
  const onAddRef = React.useRef(onAdd);
  const onEditRef = React.useRef(onEdit);
  const onDeleteRef = React.useRef(onDelete);
  const onViewRef = React.useRef(onView);
  const onOpenRef = React.useRef(onOpen);
  const onCopyRef = React.useRef(onCopy);
  const onReceiveRef = React.useRef(onReceive);
  const onViewCountMoneyRef = React.useRef(onViewCountMoney);
  const extraDropdownMenuItemsRef = React.useRef(extraDropdownMenuItems);
  const prependActionMenuItemsRef = React.useRef(prependActionMenuItems);
  const renderRowInsightMenuItemsRef = React.useRef(renderRowInsightMenuItems);

  // تحديث الـ refs عند تغيير الدوال
  React.useEffect(() => {
    onRowSelectRef.current = onRowSelect;
    onRowClickRef.current = onRowClick;
    onRowContextMenuRef.current = onRowContextMenu;
    onRowDoubleClickRef.current = onRowDoubleClick;
    onExportRef.current = onExport;
    onImportRef.current = onImport;
    onAddRef.current = onAdd;
    onEditRef.current = onEdit;
    onDeleteRef.current = onDelete;
    onViewRef.current = onView;
    onOpenRef.current = onOpen;
    onCopyRef.current = onCopy;
    onReceiveRef.current = onReceive;
    onViewCountMoneyRef.current = onViewCountMoney;
    extraDropdownMenuItemsRef.current = extraDropdownMenuItems;
    prependActionMenuItemsRef.current = prependActionMenuItems;
    renderRowInsightMenuItemsRef.current = renderRowInsightMenuItems;
  }, [
    onRowSelect,
    onRowClick,
    onRowContextMenu,
    onRowDoubleClick,
    onExport,
    onImport,
    onAdd,
    onEdit,
    onDelete,
    onView,
    onOpen,
    onCopy,
    onReceive,
    onViewCountMoney,
    extraDropdownMenuItems,
    prependActionMenuItems,
    renderRowInsightMenuItems,
  ]);

  // تحديد أشكال الجدول
  const variantClasses = {
    default: 'bg-background',
    striped: 'bg-background [&_tbody_tr:nth-child(even)]:bg-muted/50',
    bordered: 'border border-border',
    compact: 'bg-background [&_td]:py-1 [&_th]:py-1',
  };

  // تحديد أحجام الجدول
  const sizeClasses = {
    sm: 'text-xs [&_td]:py-1 [&_th]:py-1',
    default: 'text-sm [&_td]:py-2 [&_th]:py-2',
    lg: 'text-base [&_td]:py-3 [&_th]:py-3',
  };

  // فئات الكثافة للجدول
  const densityClasses = React.useMemo(() => {
    const baseClasses = {
      'ultra-compact': {
        table: '[&_td]:py-0.5 [&_th]:py-0.5 [&_td]:px-1 [&_th]:px-1',
        text: 'text-[9px]',
        textStyle: { fontSize: '9px', lineHeight: '1.2' },
        row: 'h-6',
      },
      'extra-compact': {
        table: '[&_td]:py-0.5 [&_th]:py-0.5 [&_td]:px-1.5 [&_th]:px-1.5',
        text: 'text-[10px]',
        textStyle: { fontSize: '10px', lineHeight: '1.3' },
        row: 'h-7',
      },
      compact: {
        table: '[&_td]:py-1 [&_th]:py-1 [&_td]:px-2 [&_th]:px-2',
        text: 'text-xs',
        textStyle: { fontSize: '12px', lineHeight: '1.4' },
        row: 'h-8',
      },
      normal: {
        table: '[&_td]:py-2 [&_th]:py-2 [&_td]:px-3 [&_th]:px-3',
        text: 'text-sm',
        textStyle: { fontSize: '14px', lineHeight: '1.5' },
        row: 'h-10',
      },
      comfortable: {
        table: '[&_td]:py-3 [&_th]:py-3 [&_td]:px-4 [&_th]:px-4',
        text: 'text-base',
        textStyle: { fontSize: '16px', lineHeight: '1.6' },
        row: 'h-12',
      },
    };
    return baseClasses[tableDensity];
  }, [tableDensity]);

  // تحويل الأعمدة إلى TanStack Table format
  const tanstackColumns: ColumnDef<T>[] = React.useMemo(() => {
    const cols: ColumnDef<T>[] = [];

    // عمود الاختيار
    if (enableSelection) {
      cols.push({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
            aria-label="اختيار الكل"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={value => row.toggleSelected(!!value)}
            aria-label="اختيار الصف"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      });
    }

    // عمود الإجراءات (يأتي بعد عمود الاختيار مباشرة)
    if (showActions) {
      cols.push({
        id: 'actions',
        header: actionsColumnName,
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => {
          const record = row.original;

          return (
            <div
              className="flex justify-center"
              onClick={e => e.stopPropagation()}
              onKeyDown={e => e.stopPropagation()}
            >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                >
                  <span className="sr-only">فتح القائمة</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-[17rem]"
              >
                <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {renderRowInsightMenuItemsRef.current && (
                  <>
                    {renderRowInsightMenuItemsRef.current(record, 'dropdown')}
                    <DropdownMenuSeparator />
                  </>
                )}
                {enableCopyRowId && (
                  <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(String((record as any).id || ''))}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    نسخ المعرف
                  </DropdownMenuItem>
                )}
                {prependActionMenuItemsRef.current?.(record)}
                {onViewRef.current && (
                  <DropdownMenuItem onClick={() => onViewRef.current?.(record)}>
                    <ViewIcon className="mr-2 h-4 w-4" />
                    {viewMenuItemLabel}
                  </DropdownMenuItem>
                )}
                {onEditRef.current && !renderRowInsightMenuItemsRef.current && (
                  <DropdownMenuItem onClick={() => onEditRef.current?.(record)}>
                    <Edit className="mr-2 h-4 w-4" />
                    تعديل
                  </DropdownMenuItem>
                )}
                {onOpenRef.current && (record as any).IsClosed && (
                  <DropdownMenuItem onClick={() => onOpenRef.current?.(record)}>
                    <Unlock className="mr-2 h-4 w-4" />
                    فتح الفاتورة
                  </DropdownMenuItem>
                )}
                {enableCopyDocument && onCopyRef.current && (
                  <DropdownMenuItem onClick={() => onCopyRef.current?.(record)}>
                    <Copy className="mr-2 h-4 w-4" />
                    نسخ المستند
                  </DropdownMenuItem>
                )}
                {extraDropdownMenuItemsRef.current?.(record)}
                {onReceiveRef.current && (record as any).IsClosed && (
                  <DropdownMenuItem onClick={() => onReceiveRef.current?.(record)}>
                    <Package className="mr-2 h-4 w-4" />
                    إستلام الطلب
                  </DropdownMenuItem>
                )}
                {onViewCountMoneyRef.current && (
                  <DropdownMenuItem onClick={() => onViewCountMoneyRef.current?.(record)}>
                    <Coins className="mr-2 h-4 w-4" />
                    عرض عد النقدية
                  </DropdownMenuItem>
                )}
                {onDeleteRef.current && !renderRowInsightMenuItemsRef.current && (
                  <DropdownMenuItem
                    onClick={() => {
                      if ((record as any)?.IsClosed) return;
                      onDeleteRef.current?.(record);
                    }}
                    disabled={Boolean((record as any)?.IsClosed)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    حذف
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          );
        },
      });
    }

    // الأعمدة المخصصة
    columns.forEach(column => {
      cols.push({
        id: column.key, // استخدام key كـ id فريد للعمود
        accessorKey: column.dataIndex || column.key,
        header: ({ column: col }) => {
          const densityHeaderStyle = densityClasses.textStyle;
          const headerStyle = columnsHeaderClassName
            ? { lineHeight: densityHeaderStyle.lineHeight }
            : densityHeaderStyle;
          const headerIconSize = densityHeaderStyle.fontSize;
          const shouldShowSortIcon = showSortIcons && column.showSortIcon !== false;

          // إذا كان title هو ReactNode، استخدمه مباشرة
          if (React.isValidElement(column.title) || typeof column.title !== 'string') {
            if (!shouldShowSortIcon) {
              return (
                <div
                  className={cn(columnsHeaderClassName)}
                  style={headerStyle}
                >
                  {column.title}
                </div>
              );
            }
            if (column.sortable !== false && enableSorting) {
              return (
                <Button
                  variant="ghost"
                  onClick={() => col.toggleSorting(col.getIsSorted() === 'asc')}
                  className={cn(
                    'h-auto justify-center p-0 hover:bg-transparent',
                    columnsHeaderClassName
                  )}
                  style={headerStyle}
                >
                  {column.title}
                  <ArrowUpDown
                    className="ml-2 h-4 w-4"
                    style={{ width: headerIconSize, height: headerIconSize }}
                  />
                </Button>
              );
            }
            return (
              <div
                className={cn('flex items-center justify-center gap-2', columnsHeaderClassName)}
                style={headerStyle}
              >
                {column.title}
                <ArrowUpDown
                  className="text-muted-foreground"
                  style={{ width: headerIconSize, height: headerIconSize }}
                />
              </div>
            );
          }

          // إذا كان title هو string، معالجته كالمعتاد
          const titleStr =
            typeof column.title === 'string' ? column.title : String(column.title || '');
          const titleWithBreaks = titleStr.split('\n').map((line: string, idx: number) => (
            <React.Fragment key={idx}>
              {line}
              {idx < titleStr.split('\n').length - 1 && <br />}
            </React.Fragment>
          ));

          // إذا كان showSortIcons = false، لا نعرض أيقونات الترتيب
          if (!shouldShowSortIcon) {
            return (
              <div
                className={cn(columnsHeaderClassName)}
                style={headerStyle}
              >
                {titleWithBreaks}
              </div>
            );
          }

          if (column.sortable !== false && enableSorting) {
            return (
              <Button
                variant="ghost"
                onClick={() => col.toggleSorting(col.getIsSorted() === 'asc')}
                className={cn(
                  'h-auto justify-center p-0 hover:bg-transparent',
                  columnsHeaderClassName
                )}
                style={headerStyle}
              >
                {titleWithBreaks}
                <ArrowUpDown
                  className="ml-2 h-4 w-4"
                  style={{ width: headerIconSize, height: headerIconSize }}
                />
              </Button>
            );
          }
          // إضافة أيقونة الترتيب حتى لو كان العمود غير قابل للترتيب
          const titleStr2 =
            typeof column.title === 'string' ? column.title : String(column.title || '');
          const titleWithBreaks2 = titleStr2.split('\n').map((line: string, idx: number) => (
            <React.Fragment key={idx}>
              {line}
              {idx < titleStr2.split('\n').length - 1 && <br />}
            </React.Fragment>
          ));
          return (
            <div
              className={cn('flex items-center justify-center gap-2', columnsHeaderClassName)}
              style={headerStyle}
            >
              {titleWithBreaks2}
              <ArrowUpDown
                className="text-muted-foreground"
                style={{ width: headerIconSize, height: headerIconSize }}
              />
            </div>
          );
        },
        cell: ({ row, getValue }) => {
          const value = getValue();
          const record = row.original;
          const index = row.index;
          const cellStyle = densityClasses.textStyle;

          if (column.render) {
            return column.render(value, record, index);
          }

          // عرض افتراضي حسب نوع العمود
          switch (column.type) {
            case 'badge':
              if (column.badgeConfig) {
                const isActive = value === 'active' || value === true;
                const config = isActive ? column.badgeConfig.active : column.badgeConfig.inactive;
                return (
                  <Badge
                    variant={config.variant}
                    style={cellStyle}
                  >
                    {config.label}
                  </Badge>
                );
              }
              return (
                <Badge
                  variant="secondary"
                  style={cellStyle}
                >
                  {String(value)}
                </Badge>
              );

            case 'number':
              return (
                <div
                  className="text-center font-mono"
                  style={cellStyle}
                >
                  {Number(value).toLocaleString('en-US')}
                </div>
              );

            case 'date':
              return (
                <div
                  className="text-center"
                  style={cellStyle}
                >
                  {new Date(value as string | number | Date).toLocaleDateString('en-US')}
                </div>
              );

            case 'boolean':
              return (
                <div
                  className="text-center"
                  style={cellStyle}
                >
                  <Badge
                    variant={value ? 'default' : 'secondary'}
                    style={cellStyle}
                  >
                    {value ? 'نعم' : 'لا'}
                  </Badge>
                </div>
              );

            default:
              return (
                <div
                  className="text-center"
                  style={cellStyle}
                >
                  {String(value)}
                </div>
              );
          }
        },
        filterFn: 'includesString' as const,
        enableSorting: column.sortable !== false && enableSorting,
        enableHiding: true,
      });
    });

    return cols;
  }, [
    columns,
    enableSelection,
    enableSorting,
    showActions,
    showSortIcons,
    actionsColumnName,
    viewMenuItemLabel,
    onEdit,
    onDelete,
    onView,
    densityClasses.textStyle,
    enableCopyRowId,
    enableCopyDocument,
  ]);

  const escapeHtml = (s: string) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  // بناء HTML تقرير نظيف للتصدير (PDF/صورة) — بدون oklch وأيقونات، شكل احترافي
  const buildReportTableHtml = React.useCallback(
    (data: T[], reportTitle?: string) => {
      const dataCols = columns.filter(c => c.key !== 'select' && c.key !== 'actions');
      const getTitle = (col: AdvancedColumn<T>) =>
        typeof col.title === 'string' ? col.title : col.key;
      const formatCell = (value: unknown, col: AdvancedColumn<T>): string => {
        if (value === null || value === undefined) return '—';
        if (col.type === 'boolean') return value ? 'نعم' : 'لا';
        if (col.type === 'number') return Number(value).toLocaleString('ar-EG');
        if (col.type === 'date')
          return new Date(value as string | number | Date).toLocaleDateString('ar-EG');
        if (col.type === 'badge' && col.badgeConfig) {
          const active = value === 'active' || value === true;
          return active ? col.badgeConfig.active.label : col.badgeConfig.inactive.label;
        }
        return String(value);
      };
      const thStyle =
        'padding:10px 12px;text-align:center;background:#f1f5f9;color:#0f172a;border:1px solid #e2e8f0;font-weight:600;font-size:14px;';
      const tdStyle =
        'padding:10px 12px;text-align:center;color:#0f172a;border:1px solid #e2e8f0;font-size:14px;background:#ffffff;';
      const trOdd = 'background:#f8fafc;';
      let rows = '';
      data.forEach((record, i) => {
        const rowBg = i % 2 === 1 ? trOdd : '';
        const cells = dataCols
          .map(col => {
            const raw = (record as Record<string, unknown>)[col.dataIndex || col.key];
            const text = formatCell(raw, col);
            return `<td style="${tdStyle}${rowBg}">${escapeHtml(text)}</td>`;
          })
          .join('');
        rows += `<tr style="${rowBg}">${cells}</tr>`;
      });
      const headers = dataCols
        .map(c => `<th style="${thStyle}">${escapeHtml(getTitle(c))}</th>`)
        .join('');
      const titleBlock = reportTitle
        ? `<div style="margin-bottom:16px;font-size:18px;font-weight:700;color:#0f172a;text-align:center;">${escapeHtml(reportTitle)}</div>`
        : '';
      return `
      <div dir="rtl" style="font-family:system-ui,'Segoe UI',Tahoma,sans-serif;padding:24px;background:#ffffff;color:#0f172a;min-width:400px;">
        ${titleBlock}
        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;">
          <thead><tr>${headers}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
    },
    [columns]
  );

  // دالة تحويل البيانات إلى CSV
  const convertToCSV = React.useCallback((data: T[], columns: AdvancedColumn<T>[]) => {
    const headers = columns
      .filter(col => col.key !== 'select' && col.key !== 'actions')
      .map(col => col.title)
      .join(',');

    const rows = data.map(row =>
      columns
        .filter(col => col.key !== 'select' && col.key !== 'actions')
        .map(col => {
          const value = (row as Record<string, unknown>)[col.dataIndex || col.key];
          // معالجة القيم المختلفة
          let processedValue = value;
          if (typeof value === 'boolean') {
            processedValue = value ? 'نعم' : 'لا';
          } else if (value instanceof Date) {
            processedValue = value.toLocaleDateString('en-US');
          } else if (typeof value === 'number') {
            processedValue = value.toLocaleString('en-US');
          }
          return typeof processedValue === 'string' ? `"${processedValue}"` : processedValue;
        })
        .join(',')
    );

    // إضافة BOM للدعم الكامل للعربية
    const BOM = '\uFEFF';
    return BOM + [headers, ...rows].join('\n');
  }, []);

  // دالة للحصول على معرف فريد لكل صف
  // مهم: يجب أن يكون المعرف ثابتاً أثناء تعديل الصف، وإلا ستفقد الحقول التركيز أثناء الكتابة
  const getRowId = React.useCallback((row: T, index: number) => {
    // محاولة استخدام id أو ID أو key أو ModuleID أو أي معرف فريد (معرف ثابت يمنع insertBefore عند تغيير الفلتر)
    const record = row as any;
    if (record?.id) return String(record.id);
    if (record?.ID) return String(record.ID);
    if (record?.key != null && record.key !== '') return `opt_${String(record.key)}`;
    if (record?.ModuleID !== undefined) return `module_${record.ModuleID}`;
    if (record?.employeeId !== undefined) return `admin_${record.employeeId}`;
    // fallback ثابت بالـ index لمنع إعادة تركيب الصف مع كل حرف أثناء التحرير
    return `row_${index}`;
  }, []);

  // معالج تغيير الصفحة
  const handlePaginationChange = React.useCallback((updater: any) => {
    const currentPagination = paginationRef.current;
    const nextPagination = typeof updater === 'function' ? updater(currentPagination) : updater;
    if (!nextPagination) return;

    const nextPageIndex =
      nextPagination.pageIndex !== undefined
        ? Number(nextPagination.pageIndex)
        : currentPagination.pageIndex;
    const nextPageSize =
      nextPagination.pageSize !== undefined
        ? Number(nextPagination.pageSize)
        : currentPagination.pageSize;

    if (!Number.isFinite(nextPageIndex) || !Number.isFinite(nextPageSize)) return;
    if (
      nextPageIndex === currentPagination.pageIndex &&
      nextPageSize === currentPagination.pageSize
    ) {
      return;
    }

    paginationRef.current = { pageIndex: nextPageIndex, pageSize: nextPageSize };
    if (nextPageIndex !== currentPagination.pageIndex) {
      setPageIndex(nextPageIndex);
    }
    if (nextPageSize !== currentPagination.pageSize) {
      setPageSize(nextPageSize);
    }
  }, []);

  // إعداد الجدول
  const table = useReactTable({
    data: dataSource,
    columns: tanstackColumns,
    getRowId: getRowId,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: updater => {
      setColumnVisibility(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        onColumnVisibilityStateChange?.(next as Record<string, boolean>);
        if (enableSettingsPersistence && updateColumnVisibility) {
          updateColumnVisibility(next as Record<string, boolean>);
        }
        return next;
      });
    },
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: handlePaginationChange,
    globalFilterFn: globalSearchFilterFn,
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
        pageIndex: 0,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination: {
        pageIndex: pageIndex,
        pageSize: pageSize,
      },
    },
  });

  const prevDataSourceLengthRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    const len = Array.isArray(dataSource) ? dataSource.length : 0;
    if (prevDataSourceLengthRef.current !== null && prevDataSourceLengthRef.current !== len) {
      setPageIndex(0);
      paginationRef.current = {
        ...paginationRef.current,
        pageIndex: 0,
      };
      table.setPageIndex(0);
    }
    prevDataSourceLengthRef.current = len;
  }, [dataSource?.length, table]);

  // تحديث pageSize في الجدول عند تغييره من الإعدادات
  React.useEffect(() => {
    if (hasPropDefaultPageSize) {
      if (defaultItemsPerPage !== pageSize) {
        table.setPageSize(defaultItemsPerPage as number);
        setPageSize(defaultItemsPerPage as number);
      }
      return;
    }
    if (settings?.ItemsPerPage && settings.ItemsPerPage > 0 && settings.ItemsPerPage !== pageSize) {
      table.setPageSize(settings.ItemsPerPage);
      setPageSize(settings.ItemsPerPage);
    }
  }, [hasPropDefaultPageSize, defaultItemsPerPage, settings?.ItemsPerPage, table, pageSize]);

  // تنظيف حالة sorting من الأعمدة غير الموجودة
  React.useEffect(() => {
    if (tanstackColumns.length > 0) {
      const currentColumnIds = new Set(
        tanstackColumns.map(col => col.id).filter((id): id is string => id !== undefined)
      );

      // تنظيف sorting من الأعمدة غير الموجودة
      // استخدام setSorting مع callback لتجنب dependency على sorting
      setSorting(prevSorting => {
        if (prevSorting.length === 0) return prevSorting;
        const filteredSorting = prevSorting.filter(sort => currentColumnIds.has(sort.id));
        return filteredSorting.length !== prevSorting.length ? filteredSorting : prevSorting;
      });

      // تحديث المرجع للأعمدة الحالية
      previousColumnIdsRef.current = currentColumnIds;
    }
  }, [tanstackColumns]); // يعمل عند تغيير الأعمدة أو تحميل المكون لأول مرة

  // حساب نسبة التصغير لـ autoFillColumnWidth
  React.useEffect(() => {
    if (!autoFillColumnWidth || !tableContainerRef.current) {
      setScaleFactor(1);
      return;
    }

    const calculateScale = () => {
      // إضافة timeout صغير للتأكد من أن الجدول تم عرضه
      setTimeout(() => {
        const container = tableContainerRef.current;
        if (!container) return;

        // البحث عن table element داخل الحاوية
        const table = container.querySelector('table[data-slot="table"]') as HTMLTableElement;
        if (!table) return;

        const containerWidth = container.clientWidth;
        const tableScrollWidth = table.scrollWidth;

        if (tableScrollWidth > containerWidth && containerWidth > 0) {
          // حساب نسبة التصغير مع هامش صغير (95%) لتجنب المشاكل
          const scale = (containerWidth / tableScrollWidth) * 0.95;
          setScaleFactor(Math.max(0.5, scale)); // الحد الأدنى 50%
        } else {
          setScaleFactor(1);
        }
      }, 10);
    };

    calculateScale();

    // إعادة الحساب عند تغيير حجم النافذة
    const resizeObserver = new ResizeObserver(() => {
      calculateScale();
    });
    if (tableContainerRef.current) {
      resizeObserver.observe(tableContainerRef.current);
    }

    // إعادة الحساب عند تغيير حجم النافذة
    window.addEventListener('resize', calculateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateScale);
    };
  }, [autoFillColumnWidth, dataSource, columns, tanstackColumns]);

  // دالة التصدير (PDF و صورة يعتمدان على لقطة من عنصر الجدول في الـ DOM)
  const handleExport = React.useCallback(
    async (format: 'csv' | 'excel' | 'pdf' | 'image' = 'csv') => {
      const selectedRows = table.getFilteredSelectedRowModel().rows;
      const dataToExport =
        selectedRows.length > 0
          ? selectedRows.map(row => row.original)
          : table.getFilteredRowModel().rows.map(row => row.original);

      if (onExportRef.current && format !== 'pdf' && format !== 'image') {
        onExportRef.current(dataToExport);
        return;
      }

      const baseName = exportFileName || 'export';
      const dateStr = new Date().toISOString().split('T')[0];

      // تصدير PDF أو صورة: تقرير مخصّص بتنسيق نظيف (بدون لقطة الشاشة — يحل مشكلة oklch والمظهر)
      if (format === 'pdf' || format === 'image') {
        if (dataToExport.length === 0) return;
        try {
          const reportTitle = typeof title === 'string' ? title : undefined;
          const reportHtml = buildReportTableHtml(dataToExport, reportTitle);
          const wrap = document.createElement('div');
          wrap.style.cssText =
            'position:fixed;left:-9999px;top:0;width:max-content;max-width:1200px;background:#ffffff;';
          wrap.innerHTML = reportHtml;
          document.body.appendChild(wrap);
          const html2canvas = (await import('html2canvas')).default;
          const canvas = await html2canvas(wrap, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: wrap.scrollWidth,
            height: wrap.scrollHeight,
          });
          if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
          if (format === 'image') {
            canvas.toBlob(blob => {
              if (!blob) return;
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${baseName}-${dateStr}.png`;
              a.click();
              URL.revokeObjectURL(url);
            }, 'image/png');
            return;
          }
          const jsPDFModule = await import('jspdf');
          const JsPDF = jsPDFModule.default || jsPDFModule;
          const pdf = new (JsPDF as new (
            a?: string,
            b?: string,
            c?: string
          ) => {
            addImage: (
              img: string,
              fmt: string,
              x: number,
              y: number,
              w: number,
              h: number
            ) => void;
            addPage: () => void;
            save: (name: string) => void;
            internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
          })('l', 'mm', 'a4');
          const imgData = canvas.toDataURL('image/png');
          const pw = pdf.internal.pageSize.getWidth();
          const ph = pdf.internal.pageSize.getHeight();
          const imgH = (canvas.height * pw) / canvas.width;
          let heightLeft = imgH;
          let position = 0;
          pdf.addImage(imgData, 'PNG', 0, position, pw, imgH);
          heightLeft -= ph;
          while (heightLeft > 0) {
            position = heightLeft - imgH;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pw, imgH);
            heightLeft -= ph;
          }
          pdf.save(`${baseName}-${dateStr}.pdf`);
        } catch (e) {
          console.error('Export failed:', e);
        }
        return;
      }

      // تصدير افتراضي CSV / Excel
      if (!onExportRef.current) {
        if (format === 'csv') {
          const csvContent = convertToCSV(dataToExport, columns);
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${baseName}-${dateStr}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } else {
        onExportRef.current(dataToExport);
      }
    },
    [table, columns, exportFileName, convertToCSV, buildReportTableHtml, title]
  );

  // دالة الاستيراد
  const handleImport = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (file.size > maxFileSize) {
          alert(`حجم الملف كبير جداً. الحد الأقصى ${maxFileSize / 1024 / 1024}MB`);
          return;
        }
        onImportRef.current?.(file);
      }
    },
    [maxFileSize]
  );

  const isTouchDevice = React.useMemo(
    () =>
      typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0),
    []
  );

  const handleRowClick = React.useCallback(
    (record: T, index: number) => {
      if (onRowClickRef.current) {
        onRowClickRef.current(record, index);
        return;
      }
      if (isTouchDevice && enableDoubleClickEdit && onEditRef.current) {
        onEditRef.current(record);
      }
    },
    [isTouchDevice, enableDoubleClickEdit]
  );

  // دالة التعامل مع النقر المزدوج على الصف
  const handleRowDoubleClick = React.useCallback(
    (record: T, index: number) => {
      if (onRowDoubleClickRef.current) {
        onRowDoubleClickRef.current(record, index);
        return;
      }

      // إذا كان النقر المزدوج للتعديل مفعل وكان هناك دالة تعديل، قم بتشغيلها
      if (enableDoubleClickEdit && onEditRef.current) {
        onEditRef.current(record);
      } else {
        // إذا لم تكن هناك دالة تعديل أو كان النقر المزدوج معطل، قم بتشغيل دالة النقر العادي
        onRowClickRef.current?.(record, index);
      }
    },
    [enableDoubleClickEdit]
  );

  const handleRefreshClick = React.useCallback(() => {
    if (onRefresh) {
      return Promise.resolve(onRefresh()).catch(() => {});
    }
    window.location.reload();
  }, [onRefresh]);

  // تحديث الصفوف المحددة
  React.useEffect(() => {
    const selected = table.getFilteredSelectedRowModel().rows.map(row => row.original);
    onRowSelectRef.current?.(selected);
  }, [rowSelection, table]);

  React.useEffect(() => {
    const visibleRows = table.getFilteredRowModel().rows.map(row => row.original as T);
    onVisibleRowsChange?.(visibleRows);
  }, [table, dataSource, sorting, columnFilters, globalFilter, onVisibleRowsChange]);

  // أعمدة العرض في الكارت (بدون select و actions، مع مراعاة columnVisibility)
  const cardColumns = React.useMemo(() => {
    const dataCols = columns.filter(c => c.key !== 'select' && c.key !== 'actions');
    return dataCols.filter(c => {
      const vis = columnVisibility[c.key];
      return vis !== false;
    });
  }, [columns, columnVisibility]);

  const renderCardCellValue = React.useCallback(
    (col: AdvancedColumn<T>, record: T, index: number) => {
      const fieldName = col.dataIndex || col.key;
      const value = (record as Record<string, unknown>)[fieldName];
      if (col.render) return col.render(value, record, index);
      if (value === null || value === undefined) return '—';
      switch (col.type) {
        case 'badge':
          if (col.badgeConfig) {
            const isActive = value === 'active' || value === true;
            const config = isActive ? col.badgeConfig.active : col.badgeConfig.inactive;
            return <Badge variant={config.variant}>{config.label}</Badge>;
          }
          return <Badge variant="secondary">{String(value)}</Badge>;
        case 'number':
          return Number(value).toLocaleString('ar-EG');
        case 'date':
          return new Date(value as string | number | Date).toLocaleDateString('ar-EG');
        case 'boolean':
          return value ? 'نعم' : 'لا';
        default:
          return String(value);
      }
    },
    [columns]
  );

  const cardTitleKey = React.useMemo(() => {
    if (cardTitleColumn && columns.some(c => (c.dataIndex || c.key) === cardTitleColumn))
      return cardTitleColumn;
    return cardColumns[0]?.dataIndex || cardColumns[0]?.key;
  }, [cardTitleColumn, cardColumns, columns]);

  const cardTitleColumnDef = React.useMemo(
    () => columns.find(c => (c.dataIndex || c.key) === cardTitleKey),
    [columns, cardTitleKey]
  );

  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLElement>,
    rowIndex: number,
    columnId: string
  ) => {
    if (e.key !== 'Enter') return;
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const tagName = target.tagName;
    if (tagName !== 'INPUT' && tagName !== 'TEXTAREA' && tagName !== 'SELECT') return;
    e.preventDefault();
    e.stopPropagation();
    const nextRowIndex = rowIndex + 1;
    pendingCellFocusRef.current = { rowIndex: nextRowIndex, columnId };
    const selector = `[data-row-index="${nextRowIndex}"][data-col-index="${columnId}"] input, [data-row-index="${nextRowIndex}"][data-col-index="${columnId}"] textarea, [data-row-index="${nextRowIndex}"][data-col-index="${columnId}"] select`;

    const focusNextCell = () => {
      const nextCell = tableRef.current?.querySelector(selector) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
        | null;
      if (!nextCell) return;
      nextCell.focus();
      if (typeof (nextCell as HTMLInputElement).select === 'function') {
        (nextCell as HTMLInputElement).select();
      }
    };
    // محاولة فورية + بعد الرندر لضمان الثبات في الشاشات ذات rerender أعلى
    focusNextCell();
    requestAnimationFrame(focusNextCell);
    setTimeout(focusNextCell, 0);
  };

  React.useEffect(() => {
    const pending = pendingCellFocusRef.current;
    if (!pending) return;

    const selector = `[data-row-index="${pending.rowIndex}"][data-col-index="${pending.columnId}"] input, [data-row-index="${pending.rowIndex}"][data-col-index="${pending.columnId}"] textarea, [data-row-index="${pending.rowIndex}"][data-col-index="${pending.columnId}"] select`;

    const focusPendingCell = () => {
      const nextCell = tableRef.current?.querySelector(selector) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
        | null;
      if (!nextCell) return;
      nextCell.focus();
      if (typeof (nextCell as HTMLInputElement).select === 'function') {
        (nextCell as HTMLInputElement).select();
      }
      pendingCellFocusRef.current = null;
      return true;
    };

    requestAnimationFrame(() => {
      focusPendingCell();
    });
    const timer = setTimeout(() => {
      focusPendingCell();
    }, 0);

    let attempts = 0;
    const retryTimer = setInterval(() => {
      if (!pendingCellFocusRef.current) {
        clearInterval(retryTimer);
        return;
      }
      attempts += 1;
      const success = focusPendingCell();
      if (success || attempts >= 8) {
        clearInterval(retryTimer);
      }
    }, 30);

    return () => {
      clearTimeout(timer);
      clearInterval(retryTimer);
    };
  }, [dataSource, pageIndex, pageSize, sorting, columnFilters, globalFilter]);

  return (
    <div
      className={cn(
        'w-full',
        fillHeight ? 'flex min-h-0 flex-1 flex-col gap-4' : 'space-y-4',
        className
      )}
      style={{
        width,
        ...(fillHeight ? { minHeight: 0 } : height != null ? { height } : {}),
      }}
    >
      {/* العنوان والوصف */}
      {showTitle && (title || description) && (
        <div className="flex min-w-0 flex-row items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
            )}
            {description && (
              <p className="text-muted-foreground mt-1 truncate text-sm sm:text-base">
                {description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-nowrap items-center gap-2">
            {headerActions}
            {enableAdd && onAddRef.current && (
              <Button
                onClick={onAddRef.current}
                style={{
                  backgroundColor: getCurrentModuleColor(),
                  borderColor: getCurrentModuleColor(),
                  color: 'white',
                }}
                className="shrink-0 hover:opacity-90"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                إضافة جديد
              </Button>
            )}
          </div>
        </div>
      )}

      {/* شريط الأدوات */}
      {showToolbar && (
        <div
          className={cn(
            'flex min-w-0 items-center justify-between gap-2',
            fillHeight && 'flex-shrink-0'
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto whitespace-nowrap">
            {/* البحث العام */}
            {enableSearch && (
              <div className="relative w-full min-w-[100px] max-w-[200px] shrink-0">
                <Search className="text-muted-foreground absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                <Input
                  placeholder={lableInSerachText}
                  value={globalFilter ?? ''}
                  onChange={event => {
                    setGlobalFilter(String(event.target.value));
                    onSearch?.(String(event.target.value));
                  }}
                  className="w-full pr-10"
                />
              </div>
            )}

            {!isNarrowToolbar && enableDateDocumentFilter && dateDocumentFilter && (
              <div className="w-[min(12rem,42vw)] shrink-0">
                <CtrDateDocumentFilter
                  {...dateDocumentFilter}
                  showDateLable={dateDocumentFilter.showDateLable ?? false}
                  className={cn('w-full', dateDocumentFilter.className)}
                />
              </div>
            )}

            {/* عناصر مخصصة بجوار البحث */}
            {!isNarrowToolbar && toolbarLeftActions}
          </div>

          {/*  الأدوات */}
          <div className="flex shrink-0 items-center gap-2">
            {isNarrowToolbar ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMobileToolsOpen(true)}
                >
                  <MoreHorizontal className="mr-2 h-4 w-4" />
                  الأدوات
                </Button>
                <Dialog
                  open={mobileToolsOpen}
                  onOpenChange={setMobileToolsOpen}
                >
                  <DialogContent
                    className="h-[85vh] w-[95vw] max-w-[95vw] overflow-hidden p-0"
                    dir="rtl"
                  >
                    <DialogHeader className="border-b px-4 py-3">
                      <DialogTitle>أدوات الجدول</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 overflow-y-auto p-4">
                      {toolbarLeftActions ? (
                        <div className="rounded-md border p-3">{toolbarLeftActions}</div>
                      ) : null}

                      {enableDateDocumentFilter && dateDocumentFilter ? (
                        <div className="rounded-md border p-3">
                          <CtrDateDocumentFilter
                            {...dateDocumentFilter}
                            showDateLable={dateDocumentFilter.showDateLable ?? false}
                            className={cn('w-full', dateDocumentFilter.className)}
                          />
                        </div>
                      ) : null}

                      {enableRefresh && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRefreshClick}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          تحديث
                        </Button>
                      )}

                      {enableFiltering && (
                        <div className="space-y-2 rounded-md border p-3">
                          <div className="text-sm font-medium">تصفية</div>
                          {columns
                            .filter(col => col.filterable !== false)
                            .map(column => (
                              <div
                                key={column.key}
                                className="space-y-1"
                              >
                                <label className="text-sm font-medium">{column.title}</label>
                                <Input
                                  placeholder={`تصفية ${column.title}...`}
                                  value={
                                    (table.getColumn(column.key)?.getFilterValue() as string) ?? ''
                                  }
                                  onChange={event =>
                                    table.getColumn(column.key)?.setFilterValue(event.target.value)
                                  }
                                />
                              </div>
                            ))}
                        </div>
                      )}

                      {enableColumnVisibility && (
                        <div className="space-y-2 rounded-md border p-3">
                          <div className="text-sm font-medium">الأعمدة</div>
                          {table
                            .getAllColumns()
                            .filter(column => column.getCanHide())
                            .map(column => {
                              const matchingColumn = columns.find(
                                col => col.key === column.id || col.dataIndex === column.id
                              );
                              const displayName = matchingColumn?.title || column.id;
                              return (
                                <label
                                  key={column.id}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="truncate">{displayName}</span>
                                  <Checkbox
                                    checked={column.getIsVisible()}
                                    onCheckedChange={value => column.toggleVisibility(!!value)}
                                  />
                                </label>
                              );
                            })}
                        </div>
                      )}

                      {enableExport && (
                        <div className="space-y-2 rounded-md border p-3">
                          <div className="text-sm font-medium">تصدير</div>
                          <div className="flex flex-wrap gap-2">
                            {exportFormats.includes('csv') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport('csv')}
                              >
                                CSV
                              </Button>
                            )}
                            {exportFormats.includes('excel') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport('excel')}
                              >
                                Excel
                              </Button>
                            )}
                            {exportFormats.includes('pdf') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport('pdf')}
                              >
                                PDF
                              </Button>
                            )}
                            {exportFormats.includes('image') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport('image')}
                              >
                                صورة
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {enableImport && (
                        <div>
                          <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleImport}
                            className="hidden"
                            id={importInputId}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <label
                              htmlFor={importInputId}
                              className="cursor-pointer"
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              استيراد
                            </label>
                          </Button>
                        </div>
                      )}

                      {enableCardView && enableSettingsPersistence && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateDisplayMode(displayMode === 'table' ? 'card' : 'table')
                          }
                        >
                          {displayMode === 'table' ? 'عرض كروت' : 'عرض جدول'}
                        </Button>
                      )}

                      {enableSettingsPersistence && enableTableDensityControl && (
                        <div className="space-y-2 rounded-md border p-3">
                          <div className="text-sm font-medium">كثافة الجدول</div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateTableDensity('ultra-compact')}
                            >
                              فائق الصغر
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateTableDensity('extra-compact')}
                            >
                              مضغوط جداً
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateTableDensity('compact')}
                            >
                              مدمج
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateTableDensity('normal')}
                            >
                              عادي
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateTableDensity('comfortable')}
                            >
                              مريح
                            </Button>
                          </div>
                        </div>
                      )}

                      {toolbarActions ? (
                        <div className="rounded-md border p-3">{toolbarActions}</div>
                      ) : null}
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <>
                <div className="flex shrink-0 items-center gap-1">
                  {!isNarrowToolbar && enableFiltering && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          title="تصفية الأعمدة"
                          aria-label="تصفية الأعمدة"
                        >
                          <Filter className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {columns
                          .filter(col => col.filterable !== false)
                          .map(column => (
                            <div
                              key={column.key}
                              className="p-2"
                            >
                              <label className="text-sm font-medium">{column.title}</label>
                              <Input
                                placeholder={
                                  typeof column.title === 'string' ? `${column.title}...` : '...'
                                }
                                value={
                                  (table.getColumn(column.key)?.getFilterValue() as string) ?? ''
                                }
                                onChange={event =>
                                  table.getColumn(column.key)?.setFilterValue(event.target.value)
                                }
                                className="mt-1"
                              />
                            </div>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {/* إظهار/إخفاء الأعمدة */}
                  {enableColumnVisibility &&
                    (columnVisibilityMode === 'checklist' ? (
                      <div className="bg-background min-w-[180px] rounded-md border p-2">
                        <div
                          className="text-muted-foreground mb-2 flex items-center justify-center"
                          title="الأعمدة"
                          aria-label="الأعمدة"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </div>
                        <div className="max-h-40 space-y-1 overflow-y-auto">
                          {table
                            .getAllColumns()
                            .filter(column => column.getCanHide())
                            .map(column => {
                              const matchingColumn = columns.find(
                                col => col.key === column.id || col.dataIndex === column.id
                              );
                              const displayName = matchingColumn?.title || column.id;

                              return (
                                <label
                                  key={column.id}
                                  className="hover:bg-muted/40 flex cursor-pointer items-center justify-between gap-2 rounded px-1 py-1 text-xs"
                                >
                                  <span className="truncate">{displayName}</span>
                                  <Checkbox
                                    checked={column.getIsVisible()}
                                    onCheckedChange={value => column.toggleVisibility(!!value)}
                                  />
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            title="الأعمدة"
                            aria-label="الأعمدة"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-56 p-2"
                        >
                          <div className="text-muted-foreground mb-2 text-xs font-medium">
                            اختر الأعمدة
                          </div>
                          <div className="max-h-56 space-y-1 overflow-y-auto">
                            {table
                              .getAllColumns()
                              .filter(column => column.getCanHide())
                              .map(column => {
                                const matchingColumn = columns.find(
                                  col => col.key === column.id || col.dataIndex === column.id
                                );
                                const displayName = matchingColumn?.title || column.id;

                                return (
                                  <label
                                    key={column.id}
                                    className="hover:bg-muted/40 flex cursor-pointer items-center justify-between gap-2 rounded px-1 py-1 text-xs"
                                  >
                                    <span className="truncate">{displayName}</span>
                                    <Checkbox
                                      checked={column.getIsVisible()}
                                      onCheckedChange={value => column.toggleVisibility(!!value)}
                                    />
                                  </label>
                                );
                              })}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ))}

                  {/* عرض كروت" : "عرض جدول */}
                  {enableCardView && enableSettingsPersistence && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      title={displayMode === 'table' ? 'عرض كروت' : 'عرض جدول'}
                      aria-label={displayMode === 'table' ? 'عرض كروت' : 'عرض جدول'}
                      onClick={() => updateDisplayMode(displayMode === 'table' ? 'card' : 'table')}
                    >
                      <LayoutGrid className={cn('h-4 w-4', displayMode === 'card' && 'hidden')} />
                      <Table2 className={cn('h-4 w-4', displayMode === 'table' && 'hidden')} />
                    </Button>
                  )}
                </div>

                {/* التصدير */}
                {enableExport && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        تصدير
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {exportFormats.includes('csv') && (
                        <DropdownMenuItem onClick={() => handleExport('csv')}>
                          <FileText className="mr-2 h-4 w-4" />
                          تصدير CSV
                        </DropdownMenuItem>
                      )}
                      {exportFormats.includes('excel') && (
                        <DropdownMenuItem onClick={() => handleExport('excel')}>
                          <FileText className="mr-2 h-4 w-4" />
                          تصدير Excel
                        </DropdownMenuItem>
                      )}
                      {exportFormats.includes('pdf') && (
                        <DropdownMenuItem onClick={() => handleExport('pdf')}>
                          <FileDown className="mr-2 h-4 w-4" />
                          تصدير PDF
                        </DropdownMenuItem>
                      )}
                      {exportFormats.includes('image') && (
                        <DropdownMenuItem onClick={() => handleExport('image')}>
                          <ImageIcon className="mr-2 h-4 w-4" />
                          صورة
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* الاستيراد */}
                {enableImport && (
                  <div>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleImport}
                      className="hidden"
                      id={importInputId}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <label
                        htmlFor={importInputId}
                        className="cursor-pointer"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        استيراد
                      </label>
                    </Button>
                  </div>
                )}

                {/* ضبط كثافة الجدول */}
                {enableSettingsPersistence && enableTableDensityControl && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        title="ضبط كثافة الجدول"
                      >
                        <Type className="mr-2 h-4 w-4" />
                        {tableDensity === 'ultra-compact' && 'فائق'}
                        {tableDensity === 'extra-compact' && 'مضغوط'}
                        {tableDensity === 'compact' && 'مدمج'}
                        {tableDensity === 'normal' && 'عادي'}
                        {tableDensity === 'comfortable' && 'مريح'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56"
                    >
                      <DropdownMenuLabel>كثافة الجدول</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => updateTableDensity('ultra-compact')}
                        className={cn(
                          'cursor-pointer',
                          tableDensity === 'ultra-compact' && 'bg-muted'
                        )}
                      >
                        <Minus className="mr-2 h-3.5 w-3.5" />
                        <div className="flex flex-col">
                          <span className="font-medium">فائق الصغر</span>
                          <span className="text-muted-foreground text-xs">
                            أصغر حجم ممكن - 10px
                          </span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateTableDensity('extra-compact')}
                        className={cn(
                          'cursor-pointer',
                          tableDensity === 'extra-compact' && 'bg-muted'
                        )}
                      >
                        <Minus className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">مضغوط جداً</span>
                          <span className="text-muted-foreground text-xs">
                            حجم صغير جداً - 11px
                          </span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateTableDensity('compact')}
                        className={cn('cursor-pointer', tableDensity === 'compact' && 'bg-muted')}
                      >
                        <Minus className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">مدمج</span>
                          <span className="text-muted-foreground text-xs">حجم صغير - 12px</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateTableDensity('normal')}
                        className={cn('cursor-pointer', tableDensity === 'normal' && 'bg-muted')}
                      >
                        <Type className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">عادي</span>
                          <span className="text-muted-foreground text-xs">
                            الحجم الافتراضي - 14px
                          </span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateTableDensity('comfortable')}
                        className={cn(
                          'cursor-pointer',
                          tableDensity === 'comfortable' && 'bg-muted'
                        )}
                      >
                        <Maximize2 className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">مريح</span>
                          <span className="text-muted-foreground text-xs">
                            خط أكبر ومسافات أوسع - 16px
                          </span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* عناصر مخصصة في شريط الأدوات (مثل أزرار خاصة بالشاشة) */}
                {toolbarActions}

                {/* تحديث البيانات - في أقصى اليمين بعد آخر أداة */}
                {enableRefresh && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshClick}
                    title="تحديث البيانات من المصدر"
                    className="shrink-0"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    تحديث
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* الجدول أو الكروت */}
      <div
        className={cn(
          'w-full rounded-md border',
          fillHeight && !isDocumentTableScroll && 'flex min-h-0 flex-1 flex-col overflow-hidden'
        )}
      >
        <div
          ref={node => {
            tableContainerRef.current = node;
            tableRef.current = node;
          }}
          key={effectiveDisplayMode}
          className={cn(
            'relative w-full',
            isDocumentTableScroll &&
              (isDocumentHorizontalOverflowHidden
                ? 'overflow-x-hidden overflow-y-visible'
                : 'overflow-x-auto overflow-y-visible'),
            !isDocumentTableScroll && fillHeight && 'min-h-0 flex-1 overflow-y-auto',
            !isDocumentTableScroll && !fillHeight && effectiveDisplayMode === 'card' && 'overflow-y-auto',
            !isDocumentTableScroll &&
              !fillHeight &&
              effectiveDisplayMode !== 'card' &&
              (autoFillColumnWidth ? 'overflow-x-hidden overflow-y-auto' : 'overflow-x-auto overflow-y-auto')
          )}
          style={
            isDocumentTableScroll
              ? {}
              : fillHeight
                ? {
                    flex: '1 1 0%',
                    minHeight: 0,
                    overflow: 'auto',
                    ...(maxHeight !== undefined && maxHeight !== null && maxHeight !== ''
                      ? {
                          maxHeight:
                            typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
                        }
                      : {}),
                  }
                : { maxHeight: maxHeight || 'calc(100vh - 300px)' }
          }
        >
          {effectiveDisplayMode === 'card' ? (
            <div className="p-3">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-12">
                  <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2" />
                  {loadingText}
                </div>
              ) : error ? (
                <div className="text-destructive py-12 text-center">{errorText}</div>
              ) : (
                (() => {
                  const rows = cardViewRowFilter
                    ? table.getRowModel().rows.filter(row => cardViewRowFilter(row.original))
                    : table.getRowModel().rows;
                  return rows?.length ? (
                    <>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {rows.map(row => {
                        const record = row.original;
                        const titleVal = (record as Record<string, unknown>)[cardTitleKey];
                        const titleStr = titleVal != null ? String(titleVal) : '—';
                        const colLabel =
                          typeof cardTitleColumnDef?.title === 'string'
                            ? cardTitleColumnDef.title
                            : (cardTitleColumnDef?.title ?? cardTitleKey);
                        const cardTitle = `${colLabel}: ${titleStr}`;
                        const otherCols = cardColumns.filter(
                          c => (c.dataIndex || c.key) !== cardTitleKey
                        );
                        const insightFn = renderRowInsightMenuItemsRef.current;
                        const rowExpandIdCard = getRowExpandId
                          ? getRowExpandId(record, row.id)
                          : (record as { id?: unknown }).id != null &&
                              String((record as { id?: unknown }).id) !== ''
                            ? String((record as { id?: unknown }).id)
                            : row.id;
                        const isCardExpanded =
                          Boolean(renderExpandedRow) &&
                          expandedIdSet.has(String(rowExpandIdCard));
                        const cardSurfaceProps = {
                          title: getRowTitle?.(record),
                          className: cn(
                            'rounded-lg border bg-card p-2.5 text-sm shadow-sm transition-colors',
                            (onRowClick || onRowDoubleClick || (enableDoubleClickEdit && onEdit)) &&
                              'hover:bg-muted/50 cursor-pointer',
                            isCardExpanded &&
                              'border-2 border-indigo-300/70 bg-indigo-50/40 ring-1 ring-indigo-100/60',
                            activeRowHighlightClass(row.id, isCardExpanded),
                            getRowClassName?.(record)
                          ),
                          onClick: (e: React.MouseEvent) => {
                            setActiveRowId(row.id);
                            if (onRowClickRef.current && e.detail >= 2) {
                              return;
                            }
                            handleRowClick(record, row.index);
                          },
                          onContextMenu: (event: React.MouseEvent) =>
                            onRowContextMenuRef.current?.(record, row.index, event),
                          onDoubleClick: (e: React.MouseEvent) => {
                            e.preventDefault();
                            setActiveRowId(row.id);
                            handleRowDoubleClick(record, row.index);
                          },
                        };
                        const cardInner = (
                          <>
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0 flex-1 truncate font-medium">{cardTitle}</div>
                              {showActions && (
                                <div onClick={e => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 shrink-0"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="min-w-[17rem]"
                                    >
                                      <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      {renderRowInsightMenuItemsRef.current && (
                                        <>
                                          {renderRowInsightMenuItemsRef.current(record, 'dropdown')}
                                          <DropdownMenuSeparator />
                                        </>
                                      )}
                                      {enableCopyRowId && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            navigator.clipboard.writeText(
                                              String((record as any).id || '')
                                            )
                                          }
                                        >
                                          <FileText className="mr-2 h-4 w-4" />
                                          نسخ المعرف
                                        </DropdownMenuItem>
                                      )}
                                      {prependActionMenuItemsRef.current?.(record)}
                                      {onViewRef.current && (
                                        <DropdownMenuItem
                                          onClick={() => onViewRef.current?.(record)}
                                        >
                                          <ViewIcon className="mr-2 h-4 w-4" />
                                          {viewMenuItemLabel}
                                        </DropdownMenuItem>
                                      )}
                                      {onEditRef.current &&
                                        !renderRowInsightMenuItemsRef.current && (
                                          <DropdownMenuItem
                                            onClick={() => onEditRef.current?.(record)}
                                          >
                                            <Edit className="mr-2 h-4 w-4" />
                                            تعديل
                                          </DropdownMenuItem>
                                        )}
                                      {onOpenRef.current && (record as any).IsClosed && (
                                        <DropdownMenuItem
                                          onClick={() => onOpenRef.current?.(record)}
                                        >
                                          <Unlock className="mr-2 h-4 w-4" />
                                          فتح الفاتورة
                                        </DropdownMenuItem>
                                      )}
                                      {enableCopyDocument && onCopyRef.current && (
                                        <DropdownMenuItem
                                          onClick={() => onCopyRef.current?.(record)}
                                        >
                                          <Copy className="mr-2 h-4 w-4" />
                                          نسخ المستند
                                        </DropdownMenuItem>
                                      )}
                                      {extraDropdownMenuItemsRef.current?.(record)}
                                      {onReceiveRef.current && (record as any).IsClosed && (
                                        <DropdownMenuItem
                                          onClick={() => onReceiveRef.current?.(record)}
                                        >
                                          <Package className="mr-2 h-4 w-4" />
                                          إستلام الطلب
                                        </DropdownMenuItem>
                                      )}
                                      {onViewCountMoneyRef.current && (
                                        <DropdownMenuItem
                                          onClick={() => onViewCountMoneyRef.current?.(record)}
                                        >
                                          <Coins className="mr-2 h-4 w-4" />
                                          عرض عد النقدية
                                        </DropdownMenuItem>
                                      )}
                                      {onDeleteRef.current &&
                                        !renderRowInsightMenuItemsRef.current && (
                                          <DropdownMenuItem
                                            onClick={() => {
                                              if ((record as any)?.IsClosed) return;
                                              onDeleteRef.current?.(record);
                                            }}
                                            disabled={Boolean((record as any)?.IsClosed)}
                                            className="text-red-600"
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            حذف
                                          </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </div>
                            <div className="mt-1.5 space-y-1">
                              {otherCols.map(col => {
                                const label = typeof col.title === 'string' ? col.title : col.key;
                                return (
                                  <div
                                    key={col.key}
                                    className="flex justify-between gap-2 text-xs"
                                  >
                                    <span className="text-muted-foreground shrink-0">{label}:</span>
                                    <span className="truncate text-left">
                                      {renderCardCellValue(col, record, row.index)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        );
                        return insightFn ? (
                          <ContextMenu key={row.id}>
                            <ContextMenuTrigger asChild>
                              <div {...cardSurfaceProps}>{cardInner}</div>
                            </ContextMenuTrigger>
                            <ContextMenuContent
                              className="z-[200] min-w-[17rem] rounded-xl border p-2 shadow-xl"
                              dir="rtl"
                            >
                              {insightFn(record, 'context')}
                            </ContextMenuContent>
                          </ContextMenu>
                        ) : (
                          <div
                            key={row.id}
                            {...cardSurfaceProps}
                          >
                            {cardInner}
                          </div>
                        );
                      })}
                    </div>
                    {renderExpandedRow &&
                      expandedIdSet.size > 0 &&
                      Array.from(expandedIdSet).map(expandedKey => {
                        const expandedRow = rows.find(r => {
                          const rec = r.original;
                          const rid = getRowExpandId
                            ? getRowExpandId(rec, r.id)
                            : (rec as { id?: unknown }).id != null &&
                                String((rec as { id?: unknown }).id) !== ''
                              ? String((rec as { id?: unknown }).id)
                              : r.id;
                          return String(rid) === String(expandedKey);
                        });
                        const expandedRecord = expandedRow?.original;
                        return expandedRecord ? (
                          <div
                            key={expandedKey}
                            className="ctr-expanded-panel mb-8 mt-3 rounded-xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/90 via-white to-slate-50 p-2 shadow-[0_10px_40px_-12px_rgba(30,27,75,0.18)] ring-1 ring-slate-200/60"
                            dir="rtl"
                            onClick={e => e.stopPropagation()}
                          >
                            {renderExpandedRow(expandedRecord)}
                          </div>
                        ) : null;
                      })}
                    </>
                  ) : (
                    <div className="text-muted-foreground py-12 text-center">
                      {messageWhenNowData}
                    </div>
                  );
                })()
              )}
            </div>
          ) : (
            <Table
              className={cn(
                variantClasses[rowsColoreOneNotOne],
                sizeClasses[fontSizeInCell],
                densityClasses.table,
                densityClasses.text,
                'w-full',
                isDocumentHorizontalOverflowHidden ? 'min-w-0 max-w-full' : 'min-w-full',
                '[&_tbody_tr]:bg-background [&_tbody_tr:nth-child(even)]:bg-background',
                // إزالة القيم الافتراضية من table.tsx وإجبار تطبيق الكثافة
                '[&_thead_th]:!h-auto [&_thead_th]:!p-0 [&_thead_th]:!font-semibold [&_thead_th]:!text-inherit',
                '[&_tbody_td]:!p-0 [&_tbody_td]:!text-inherit',
                // إجبار تطبيق الحجم على جميع العناصر الداخلية
                '[&_thead_th_*]:!text-inherit [&_thead_th_div]:!text-inherit [&_thead_th_button]:!text-inherit',
                '[&_tbody_td_*]:!text-inherit [&_tbody_td_div]:!text-inherit'
              )}
              style={{
                ...tableColorStyle,
                tableLayout: trimCellTextWithTooltip || autoFillColumnWidth ? 'fixed' : 'auto',
                fontSize:
                  autoFillColumnWidth && scaleFactor < 1 ? `${scaleFactor * 100}%` : undefined,
              }}
            >
              {showHeader && (
                <TableHeader
                  className="bg-muted/30 border-border border-b"
                  style={tableHeaderColorStyle}
                >
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow
                      key={headerGroup.id}
                      className={densityClasses.row}
                      style={tableHeaderColorStyle}
                    >
                      {headerGroup.headers.map(header => {
                        // التحقق من عمود الإجراءات وعمود الاختيار
                        let columnWidth: number | string | undefined;
                        if (header.column.id === 'actions') {
                          columnWidth = actionsColumnWidth;
                        } else if (header.column.id === 'select') {
                          columnWidth = 50;
                        } else {
                          // البحث عن العمود المطابق للحصول على width
                          const matchingColumn = columns.find(
                            col =>
                              col.key === header.column.id || col.dataIndex === header.column.id
                          );
                          columnWidth = matchingColumn?.width;
                        }
                        // تحويل width إلى string مع px إذا كان number وتطبيق scaleFactor
                        let finalWidth = columnWidth;
                        if (
                          autoFillColumnWidth &&
                          scaleFactor < 1 &&
                          columnWidth &&
                          header.column.id !== 'select'
                        ) {
                          if (typeof columnWidth === 'number') {
                            finalWidth = columnWidth * scaleFactor;
                          } else if (
                            typeof columnWidth === 'string' &&
                            columnWidth.endsWith('px')
                          ) {
                            const numValue = parseFloat(columnWidth);
                            if (!isNaN(numValue)) {
                              finalWidth = numValue * scaleFactor;
                            }
                          }
                        }
                        const widthStyle = finalWidth
                          ? typeof finalWidth === 'number'
                            ? {
                                width: `${finalWidth}px`,
                                minWidth: `${finalWidth}px`,
                                maxWidth: `${finalWidth}px`,
                              }
                            : { width: finalWidth, minWidth: finalWidth, maxWidth: finalWidth }
                          : { minWidth: '80px' };
                        const isSelectCol = header.column.id === 'select';
                        return (
                          <TableHead
                            key={header.id}
                            className={cn(
                              'text-foreground bg-muted/30 text-center font-semibold',
                              isDocumentHorizontalOverflowHidden
                                ? 'whitespace-normal break-words'
                                : 'whitespace-nowrap',
                              densityClasses.text,
                              // إزالة القيم الافتراضية
                              '!h-auto !p-0',
                              isSelectCol &&
                                'bg-muted/30 border-border sticky z-[1] border-l shadow-[2px_0_4px_rgba(0,0,0,0.06)]'
                            )}
                            style={{
                              ...tableHeaderColorStyle,
                              ...widthStyle,
                              ...(columnsHeaderClassName
                                ? { lineHeight: densityClasses.textStyle.lineHeight }
                                : densityClasses.textStyle),
                              ...(isSelectCol ? { right: 0 } : {}),
                            }}
                          >
                            <div
                              className={cn('text-center', columnsHeaderClassName)}
                              style={
                                columnsHeaderClassName
                                  ? {
                                      ...tableHeaderColorStyle,
                                      lineHeight: densityClasses.textStyle.lineHeight,
                                    }
                                  : {
                                      ...tableHeaderColorStyle,
                                      ...densityClasses.textStyle,
                                      fontSize: densityClasses.textStyle.fontSize,
                                      lineHeight: densityClasses.textStyle.lineHeight,
                                    }
                              }
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </div>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
              )}
              <TableBody>
                {loading ? (
                  <TableRow style={tableRowColorStyle}>
                    <TableCell
                      colSpan={tanstackColumns.length}
                      className="h-24 text-center"
                      style={tableRowColorStyle}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2"></div>
                        {loadingText}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow style={tableRowColorStyle}>
                    <TableCell
                      colSpan={tanstackColumns.length}
                      className="text-destructive h-24 text-center"
                      style={tableRowColorStyle}
                    >
                      {errorText}
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => {
                    const record = row.original;
                    const insightFn = renderRowInsightMenuItemsRef.current;
                    const fullWidthContent = renderFullWidthCell?.(record);
                    if (fullWidthContent != null) {
                      const fullWidthRow = (
                        <TableRow
                          title={getRowTitle?.(record)}
                          className={cn(
                            densityClasses.row,
                            activeRowHighlightClass(row.id, false),
                            getRowClassName?.(record)
                          )}
                          style={tableRowColorStyle}
                          onClick={e => {
                            setActiveRowId(row.id);
                            if (onRowClickRef.current && e.detail >= 2) {
                              return;
                            }
                            handleRowClick(record, row.index);
                          }}
                          onContextMenu={event => {
                            setActiveRowId(row.id);
                            onRowContextMenuRef.current?.(record, row.index, event);
                          }}
                        >
                          <TableCell
                            colSpan={tanstackColumns.length}
                            className={cn(
                              'px-3 py-1.5 text-start',
                              densityClasses.text,
                              getRowClassName?.(record)
                            )}
                            style={{
                              ...tableRowColorStyle,
                              ...densityClasses.textStyle,
                            }}
                          >
                            {fullWidthContent}
                          </TableCell>
                        </TableRow>
                      );
                      return insightFn ? (
                        <ContextMenu key={row.id}>
                          <ContextMenuTrigger asChild>{fullWidthRow}</ContextMenuTrigger>
                          <ContextMenuContent
                            className="z-[200] min-w-[17rem] rounded-xl border p-2 shadow-xl"
                            dir="rtl"
                          >
                            {insightFn(record, 'context')}
                          </ContextMenuContent>
                        </ContextMenu>
                      ) : (
                        <React.Fragment key={row.id}>{fullWidthRow}</React.Fragment>
                      );
                    }
                    const rowExpandId = getRowExpandId
                      ? getRowExpandId(record, row.id)
                      : (record as { id?: unknown }).id != null && String((record as { id?: unknown }).id) !== ''
                        ? String((record as { id?: unknown }).id)
                        : row.id;
                    const isExpanded =
                      Boolean(renderExpandedRow) && expandedIdSet.has(String(rowExpandId));

                    const standardRow = (
                      <TableRow
                        data-state={row.getIsSelected() && 'selected'}
                        title={getRowTitle?.(record)}
                        className={cn(
                          densityClasses.row,
                          activeRowHighlightClass(row.id, isExpanded),
                          isExpanded &&
                            'border-b-0 border-l-2 border-r-2 border-t-2 border-indigo-300/70 bg-gradient-to-b from-indigo-50 via-slate-50 to-slate-50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.75)]',
                          'cursor-pointer transition-colors duration-200',
                          (onRowClick || onRowDoubleClick || (enableDoubleClickEdit && onEdit)) &&
                            !isExpanded &&
                            'hover:bg-muted/50 cursor-pointer',
                          isExpanded && 'hover:!bg-indigo-100/40',
                          getRowClassName?.(record)
                        )}
                        onClick={e => {
                          setActiveRowId(row.id);
                          if (onRowClickRef.current && e.detail >= 2) {
                            return;
                          }
                          handleRowClick(record, row.index);
                        }}
                        onContextMenu={event => {
                          setActiveRowId(row.id);
                          onRowContextMenuRef.current?.(record, row.index, event);
                        }}
                        onDoubleClick={e => {
                          e.preventDefault();
                          setActiveRowId(row.id);
                          handleRowDoubleClick(record, row.index);
                        }}
                        style={tableRowColorStyle}
                      >
                        {row.getVisibleCells().map(cell => {
                          // التحقق من عمود الإجراءات وعمود الاختيار
                          let columnWidth: number | string | undefined;
                          if (cell.column.id === 'actions') {
                            columnWidth = actionsColumnWidth;
                          } else if (cell.column.id === 'select') {
                            columnWidth = 50;
                          } else {
                            // البحث عن العمود المطابق للحصول على width
                            const matchingColumn = columns.find(
                              col => col.key === cell.column.id || col.dataIndex === cell.column.id
                            );
                            columnWidth = matchingColumn?.width;
                          }
                          // تحويل width إلى string مع px إذا كان number وتطبيق scaleFactor
                          let finalWidth = columnWidth;
                          if (
                            autoFillColumnWidth &&
                            scaleFactor < 1 &&
                            columnWidth &&
                            cell.column.id !== 'select'
                          ) {
                            if (typeof columnWidth === 'number') {
                              finalWidth = columnWidth * scaleFactor;
                            } else if (
                              typeof columnWidth === 'string' &&
                              columnWidth.endsWith('px')
                            ) {
                              const numValue = parseFloat(columnWidth);
                              if (!isNaN(numValue)) {
                                finalWidth = numValue * scaleFactor;
                              }
                            }
                          }
                          const widthStyle = finalWidth
                            ? typeof finalWidth === 'number'
                              ? {
                                  width: `${finalWidth}px`,
                                  minWidth: `${finalWidth}px`,
                                  maxWidth: `${finalWidth}px`,
                                }
                              : { width: finalWidth, minWidth: finalWidth, maxWidth: finalWidth }
                            : { minWidth: '80px' };
                          const isSelectCol = cell.column.id === 'select';
                          const rowClassName = getRowClassName?.(record);
                          const rowTitle = getRowTitle?.(record);
                          const cellValue = cell.getValue();
                          const rowIndex = row.index;
                          const customCellClassName = getCellClassName?.(
                            record,
                            cell.column.id,
                            cellValue,
                            rowIndex
                          );
                          const customCellTitle = getCellTitle?.(
                            record,
                            cell.column.id,
                            cellValue,
                            rowIndex
                          );
                          return (
                            <TableCell
                              key={cell.id}
                              data-row-index={rowIndex}
                              data-col-index={cell.column.id}
                              onKeyDownCapture={e => handleCellKeyDown(e, rowIndex, cell.column.id)}
                              title={customCellTitle || rowTitle}
                              className={cn(
                                'overflow-hidden text-center',
                                densityClasses.text,
                                '!p-0',
                                rowClassName,
                                customCellClassName,
                                isSelectCol &&
                                  'bg-background border-border sticky z-[1] border-l shadow-[2px_0_4px_rgba(0,0,0,0.06)]'
                              )}
                              style={{
                                ...tableRowColorStyle,
                                ...widthStyle,
                                ...densityClasses.textStyle,
                                ...(isSelectCol ? { right: 0 } : {}),
                              }}
                            >
                              <div
                                className={cn(
                                  'text-center',
                                  !trimCellTextWithTooltip && 'min-w-0 whitespace-normal break-words',
                                  trimCellTextWithTooltip &&
                                    'block w-full min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap'
                                )}
                                style={{
                                  ...(tableTextColor ? { color: tableTextColor } : {}),
                                  ...densityClasses.textStyle,
                                  fontSize: densityClasses.textStyle.fontSize,
                                  lineHeight: densityClasses.textStyle.lineHeight,
                                  ...(trimCellTextWithTooltip ? { maxWidth: '100%' } : {}),
                                }}
                                title={
                                  trimCellTextWithTooltip
                                    ? (() => {
                                        const v = cell.getValue();
                                        if (v == null) return undefined;
                                        return String(v);
                                      })()
                                    : undefined
                                }
                              >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                    const expandedRowNode =
                      isExpanded && renderExpandedRow ? (
                        <TableRow
                          key={`${row.id}__expanded`}
                          className="border-0 bg-transparent hover:bg-transparent"
                          style={tableRowColorStyle}
                        >
                          <TableCell
                            colSpan={tanstackColumns.length}
                            className="border-0 bg-transparent p-0 align-top"
                            style={tableRowColorStyle}
                            onClick={e => e.stopPropagation()}
                          >
                            <div
                              className="ctr-expanded-panel mx-2 mb-8 rounded-b-xl border border-t-0 border-indigo-200/80 bg-white px-2 pb-2 pt-1 shadow-[0_10px_40px_-12px_rgba(30,27,75,0.18)] ring-1 ring-slate-200/60"
                              dir="rtl"
                            >
                              {renderExpandedRow(record)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null;

                    return insightFn ? (
                      <React.Fragment key={row.id}>
                        <ContextMenu>
                          <ContextMenuTrigger asChild>{standardRow}</ContextMenuTrigger>
                          <ContextMenuContent
                            className="z-[200] min-w-[17rem] rounded-xl border p-2 shadow-xl"
                            dir="rtl"
                          >
                            {insightFn(record, 'context')}
                          </ContextMenuContent>
                        </ContextMenu>
                        {expandedRowNode}
                      </React.Fragment>
                    ) : (
                      <React.Fragment key={row.id}>
                        {standardRow}
                        {expandedRowNode}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <TableRow style={tableRowColorStyle}>
                    <TableCell
                      colSpan={tanstackColumns.length}
                      className="text-muted-foreground h-24 text-center"
                      style={tableRowColorStyle}
                    >
                      {messageWhenNowData}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* التذييل مع التصفح */}
      {showFooter && enablePagination && (
        <div className="flex flex-col items-stretch justify-between gap-3 py-3 sm:flex-row sm:items-center sm:py-4">
          <div className="text-muted-foreground hidden flex-1 text-sm sm:block">
            {table.getFilteredSelectedRowModel().rows.length} من{' '}
            {table.getFilteredRowModel().rows.length} صف محدد.
          </div>
          <div className="flex flex-1 flex-row items-center justify-center gap-2 sm:flex-initial sm:justify-end">
            <select
              value={table.getState().pagination.pageSize}
              onChange={e => {
                const newPageSize = Number(e.target.value);
                table.setPageSize(newPageSize);
                setPageSize(newPageSize);
                if (
                  enablePagination &&
                  settingsRoute &&
                  settingsRoute !== '__disabled__' &&
                  updateItemsPerPage
                ) {
                  updateItemsPerPage(newPageSize);
                }
              }}
              className="border-input bg-background h-9 w-14 rounded border px-2 py-1 text-sm sm:w-16"
            >
              {[10, 20, 30, 40, 50, 100, 200, 300, 500].map(pageSizeOption => (
                <option
                  key={pageSizeOption}
                  value={pageSizeOption}
                >
                  {pageSizeOption}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-0.5">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => {
                  setPageIndex(0);
                  table.setPageIndex(0);
                }}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">الصفحة الأولى</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => {
                  setPageIndex(Math.max(0, pageIndex - 1));
                  table.previousPage();
                }}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">الصفحة السابقة</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => {
                  setPageIndex(pageIndex + 1);
                  table.nextPage();
                }}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">الصفحة التالية</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => {
                  const lastPageIndex = Math.max(0, table.getPageCount() - 1);
                  setPageIndex(lastPageIndex);
                  table.setPageIndex(lastPageIndex);
                }}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">الصفحة الأخيرة</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// مكونات مساعدة للجداول الشائعة
export function CtrUsersTableAdvanced<T = Record<string, unknown>>({
  title = 'إدارة المستخدمين',
  description = 'عرض وإدارة جميع المستخدمين في النظام',
  ...props
}: CtrDataTableAdvancedProps<T>) {
  return (
    <CtrDataTableAdvanced
      title={title}
      description={description}
      enableSearch={true}
      enableFiltering={true}
      enableSorting={true}
      enableSelection={true}
      enableColumnVisibility={true}
      enablePagination={true}
      enableExport={true}
      enableImport={true}
      enableAdd={true}
      enableDoubleClickEdit={true}
      rowsColoreOneNotOne="striped"
      fontSizeInCell="default"
      {...props}
    />
  );
}

export function CtrProductsTableAdvanced<T = Record<string, unknown>>({
  title = 'إدارة المنتجات',
  description = 'عرض وإدارة جميع المنتجات في النظام',
  ...props
}: CtrDataTableAdvancedProps<T>) {
  return (
    <CtrDataTableAdvanced
      title={title}
      description={description}
      enableSearch={true}
      enableFiltering={true}
      enableSorting={true}
      enableSelection={true}
      enableColumnVisibility={true}
      enablePagination={true}
      enableExport={true}
      enableImport={true}
      enableAdd={true}
      enableDoubleClickEdit={true}
      rowsColoreOneNotOne="striped"
      fontSizeInCell="default"
      {...props}
    />
  );
}

// تصدير المكونات
export { CtrDataTableAdvanced as DataTableAdvanced };

export default CtrDataTableAdvanced;
