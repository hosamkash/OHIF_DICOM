import * as React from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import type { VariantProps } from "class-variance-authority"
import { getModuleColor } from "@/lib/module-color"
import { getLucideIcon } from "@/lib/lucide-icons"

// أيقونات افتراضية لكل حالة
const Plus = getLucideIcon("Plus", "Check")
const Pencil = getLucideIcon("Pencil", "Code")
const Trash2 = getLucideIcon("Trash2", "Code")
const RefreshCw = getLucideIcon("RefreshCw", "ChevronsUpDown")
const Ban = getLucideIcon("Ban", "X")
const X = getLucideIcon("X", "ChevronDown")
const Printer = getLucideIcon("Printer", "Code")
const SaveIcon = getLucideIcon("Save", "Check")
const Send = getLucideIcon("Send", "ChevronRight")
const Inbox = getLucideIcon("Inbox", "ChevronDown")
const Upload = getLucideIcon("Upload", "ChevronUp")
const Download = getLucideIcon("Download", "ChevronDown")
const Eye = getLucideIcon("Eye", "Check")
const ChevronRight = getLucideIcon("ChevronRight")
const StopIcon = Ban
const VideoIcon = Send
const CreditCard = getLucideIcon("CreditCard", "FileText")
const Bell = getLucideIcon("Bell", "Check")

export type ActionType =
  | "new" // جديد
  | "add" // إضافة
  | "edit" // تعديل
  | "delete" // حذف
  | "save" // حفظ
  | "update" // تحديث
  | "cancel" // إلغاء
  | "close" // إغلاق
  | "print" // طباعة
  | "send" // إرسال
  | "receive" // إستقبال
  | "export" // تصدير
  | "import" // إستيراد
  | "view" // عرض
  | "play" // تشغيل
  | "stop" // إيقاف
  | "video" // فيديو
  | "download" // تحميل
  | "generate" // توليد
  | "upload" // رفع
  | "payment" // دفع
  | "remind" // تذكير
  | "custom" // مخصص - يقبل أي تخصيص وقت التشغيل

export const Action: Record<Uppercase<ActionType>, ActionType> = {
  NEW: "new",
  ADD: "add",
  EDIT: "edit",
  DELETE: "delete",
  SAVE: "save",
  UPDATE: "update",
  CANCEL: "cancel",
  CLOSE: "close",
  PRINT: "print",
  SEND: "send",
  RECEIVE: "receive",
  EXPORT: "export",
  IMPORT: "import",
  VIEW: "view",
  PLAY: "play",
  STOP: "stop",
  VIDEO: "video",
  DOWNLOAD: "download",
  GENERATE: "generate",
  UPLOAD: "upload",
  PAYMENT: "payment",
  REMIND: "remind",
  CUSTOM: "custom",
}

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"]
type ButtonSize = VariantProps<typeof buttonVariants>["size"]

type ActionMeta = {
  defaultLabel: string
  defaultIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  defaultVariant?: ButtonVariant
  defaultClassName?: string
}

const ACTION_META: Record<ActionType, ActionMeta> = {
  new: {
    defaultLabel: "جديد",
    defaultIcon: Plus,
    // سيتم تطبيق لون الموديول ديناميكياً
    defaultClassName: "text-white shadow-sm hover:opacity-90",
  },
  add: {
    defaultLabel: "إضافة",
    defaultIcon: Plus,
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10",
  },
  edit: { 
    defaultLabel: "تعديل", 
    defaultIcon: Pencil,
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10"
  },
  delete: {
    defaultLabel: "حذف",
    defaultIcon: Trash2,
    defaultClassName: "bg-white text-red-600 shadow-sm hover:bg-red-50 border border-red-200"
  },
  save: {
    defaultLabel: "حفظ",
    defaultIcon: SaveIcon,
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10"
  },
  update: { 
    defaultLabel: "تحديث", 
    defaultIcon: RefreshCw,
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10"
  },
  cancel: { 
    defaultLabel: "إلغاء", 
    defaultIcon: Ban, 
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10"
  },
  close: { 
    defaultLabel: "إغلاق", 
    defaultIcon: X, 
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10"
  },
  print: { 
    defaultLabel: "طباعة", 
    defaultIcon: Printer, 
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10"
  },
  send: { 
    defaultLabel: "إرسال", 
    defaultIcon: Send,
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10"
  },
  receive: { 
    defaultLabel: "إستقبال", 
    defaultIcon: Inbox,
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10"
  },
  export: { 
    defaultLabel: "تصدير", 
    defaultIcon: Upload,
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10"
  },
  import: { 
    defaultLabel: "إستيراد", 
    defaultIcon: Download,
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10"
  },
  view: {
    defaultLabel: "عرض",
    defaultIcon: Eye,
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10"
  },
  play: {
    defaultLabel: "تشغيل",
    defaultIcon: ChevronRight,
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10"
  },
  stop: {
    defaultLabel: "إيقاف",
    defaultIcon: StopIcon,
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10"
  },
  video: {
    defaultLabel: "فيديو",
    defaultIcon: VideoIcon,
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10"
  },
  download: {
    defaultLabel: "تحميل",
    defaultIcon: Download,
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10"
  },
  generate: {
    defaultLabel: "توليد",
    defaultIcon: RefreshCw,
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10"
  },
  upload: {
    defaultLabel: "رفع",
    defaultIcon: Upload,
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10"
  },
  payment: {
    defaultLabel: "دفع",
    defaultIcon: CreditCard,
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10"
  },
  remind: {
    defaultLabel: "تذكير",
    defaultIcon: Bell,
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10"
  },
  custom: {
    defaultLabel: "مخصص",
    defaultIcon: Plus, // أيقونة افتراضية يمكن تغييرها
    defaultClassName: "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10"
  },
}

export interface CtrButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "children"> {
  action: ActionType
  label?: string // نص الزر إن أردت تغييره عن الافتراضي
  icon?: React.ReactNode // أيقونة مخصّصة بدل الافتراضي
  variant?: ButtonVariant // لفرض نوع مختلف عن الافتراضي
  size?: ButtonSize
  width?: number | string // عرض مخصص
  height?: number | string // ارتفاع مخصص
  bgColorClass?: string // لون خلفية مخصص عبر class
  textColorClass?: string // لون خط مخصص عبر class
  // خصائص إضافية للزر المخصص
  customIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>> // أيقونة مخصصة للزر المخصص
  customLabel?: string // نص مخصص للزر المخصص
  customClassName?: string // كلاسات مخصصة للزر المخصص
  customStyle?: React.CSSProperties // ستايل مخصص للزر المخصص
}

export function CtrButton({
  action,
  label,
  icon,
  variant,
  size,
  width,
  height,
  bgColorClass,
  textColorClass,
  className,
  style,
  onClick,
  type = "button",
  customIcon,
  customLabel,
  customClassName,
  customStyle,
  ...rest
}: CtrButtonProps) {
  const meta = ACTION_META[action]
  
  // إذا لم يكن action موجوداً في ACTION_META، استخدم القيم الافتراضية
  if (!meta) {
    console.warn(`Action "${action}" not found in ACTION_META. Using default values.`)
  }
  
  // تحديد الأيقونة المناسبة
  const CompIcon = action === "custom" && customIcon ? customIcon : (meta?.defaultIcon ?? Plus)

  const effectiveVariant: ButtonVariant = variant ?? meta?.defaultVariant ?? "default"

  // تطبيق لون الموديول للزر الجديد
  const buttonStyle: React.CSSProperties = {
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    ...style,
    // تطبيق الستايل المخصص للزر المخصص
    ...(action === "custom" && customStyle ? customStyle : {}),
  }

  // إذا كان الزر جديد، نطبق لون الموديول
  if (action === "new") {
    const moduleColor = getModuleColor()
    buttonStyle.backgroundColor = moduleColor
    buttonStyle.borderColor = moduleColor
  }

  // تحديد النص المناسب
  const effectiveLabel = action === "custom" && customLabel ? customLabel : (label ?? meta?.defaultLabel ?? "زر")

  // تحديد الكلاسات المناسبة
  const baseClassName = action === "custom" && customClassName ? customClassName : (meta?.defaultClassName ?? "bg-white text-black shadow-sm hover:bg-gray-100 border border-black/10")
  const mergedClassName = [baseClassName, bgColorClass, textColorClass, className]
    .filter(Boolean)
    .join(" ")

  return (
    <Button
      variant={effectiveVariant}
      size={size}
      onClick={onClick}
      className={mergedClassName}
      style={buttonStyle}
      {...rest}
      type={type}
    >
      {icon ?? <CompIcon aria-hidden className="shrink-0" />}
      <span>{effectiveLabel}</span>
    </Button>
  )
}

export default CtrButton

/*
مثال على استخدام الزر المخصص:

// زر مخصص بسيط
<CtrButton 
  action="custom" 
  customLabel="عرض التفاصيل" 
  customIcon={Eye}
  onClick={() => console.log('عرض التفاصيل')}
/>

// زر مخصص مع تخصيص كامل
<CtrButton 
  action="custom" 
  customLabel="زر مخصص" 
  customIcon={Star}
  customClassName="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
  customStyle={{ 
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
  }}
  onClick={() => console.log('زر مخصص')}
/>

// زر مخصص مع أيقونة مخصصة
<CtrButton 
  action="custom" 
  customLabel="إعدادات متقدمة" 
  customIcon={Settings}
  customClassName="bg-blue-500 text-white hover:bg-blue-600"
  onClick={() => console.log('إعدادات متقدمة')}
/>
*/
