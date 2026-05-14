"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getLucideIcon } from "@/lib/lucide-icons"

const X = getLucideIcon("X", "ChevronDown")
const AlertTriangle = getLucideIcon("AlertTriangle", "Code")
const Info = getLucideIcon("Info", "Code")
const CheckCircle = getLucideIcon("CheckCircle", "Check")
const AlertCircle = getLucideIcon("AlertCircle", "Code")

// تعريف أنواع النوافذ المنبثقة
export type DialogVariant = "default" | "alert" | "confirm" | "info" | "warning" | "error"
export type DialogSize = "sm" | "default" | "lg" | "xl" | "full"
export type DialogPosition = "center" | "top" | "bottom"

// تعريف خصائص النافذة المنبثقة
export interface CtrDialogProps extends React.ComponentProps<typeof DialogPrimitive.Root> {
  // التحكم في المظهر
  variant?: DialogVariant
  size?: DialogSize
  position?: DialogPosition
  className?: string
  
  // التحكم في المحتوى
  title?: string
  description?: string
  children?: React.ReactNode
  
  // التحكم في الحالة
  open?: boolean
  onOpenChange?: (open: boolean) => void
  
  // التحكم في الأبعاد
  width?: number | string
  height?: number | string
  
  // التحكم في الوظائف
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  
  // التحكم في الأحداث
  onClose?: () => void
  onOpen?: () => void
}

// تعريف خصائص محتوى النافذة
export interface CtrDialogContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
  className?: string
  children?: React.ReactNode
}

// تعريف خصائص رأس النافذة
export interface CtrDialogHeaderProps extends React.ComponentProps<"div"> {
  className?: string
  children?: React.ReactNode
}

// تعريف خصائص تذييل النافذة
export interface CtrDialogFooterProps extends React.ComponentProps<"div"> {
  className?: string
  children?: React.ReactNode
}

// تعريف خصائص عنوان النافذة
export interface CtrDialogTitleProps extends React.ComponentProps<typeof DialogPrimitive.Title> {
  className?: string
  children?: React.ReactNode
}

// تعريف خصائص وصف النافذة
export interface CtrDialogDescriptionProps extends React.ComponentProps<typeof DialogPrimitive.Description> {
  className?: string
  children?: React.ReactNode
}

// المكون الرئيسي للنافذة المنبثقة
export function CtrDialog({
  variant = "default",
  size = "default",
  position = "center",
  className,
  title,
  description,
  children,
  open,
  onOpenChange,
  width,
  height,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  onClose,
  onOpen,
  ...props
}: CtrDialogProps) {
  const [isOpen, setIsOpen] = React.useState(open || false)

  // تحديث الحالة عند تغيير البروبس
  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  // دالة التعامل مع فتح/إغلاق النافذة
  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
    
    if (newOpen) {
      onOpen?.()
    } else {
      onClose?.()
    }
  }

  // تحديد أحجام النافذة
  const sizeClasses = {
    sm: "max-w-sm",
    default: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw] max-h-[95vh]"
  }

  // تحديد مواضع النافذة
  const positionClasses = {
    center: "top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]",
    top: "top-4 left-[50%] translate-x-[-50%]",
    bottom: "bottom-4 left-[50%] translate-x-[-50%]"
  }

  // تحديد أشكال النافذة
  const variantClasses = {
    default: "bg-background border-border",
    alert: "bg-yellow-50 border-yellow-200",
    confirm: "bg-blue-50 border-blue-200",
    info: "bg-blue-50 border-blue-200",
    warning: "bg-yellow-50 border-yellow-200",
    error: "bg-red-50 border-red-200"
  }

  // تحديد الأيقونات
  const icons = {
    alert: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    confirm: <CheckCircle className="h-5 w-5 text-blue-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-600" />,
    error: <AlertCircle className="h-5 w-5 text-red-600" />,
    default: null
  }

  const _dialogIcon = icons[variant]

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      {...props}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/50",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed z-50 grid w-full gap-4 rounded-lg border p-6 shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "duration-200",
            sizeClasses[size],
            positionClasses[position],
            variantClasses[variant],
            className
          )}
          style={{ width, height }}
          onPointerDownOutside={(e) => {
            if (!closeOnOverlayClick) {
              e.preventDefault()
            }
          }}
          onEscapeKeyDown={(e) => {
            if (!closeOnEscape) {
              e.preventDefault()
            }
          }}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-4 w-4" />
              <span className="sr-only">إغلاق</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// محتوى النافذة
export function CtrDialogContent({
  className,
  children,
  ...props
}: CtrDialogContentProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {children}
    </div>
  )
}

// رأس النافذة
export function CtrDialogHeader({
  className,
  children,
  ...props
}: CtrDialogHeaderProps) {
  return (
    <div
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    >
      {children}
    </div>
  )
}

// عنوان النافذة
export function CtrDialogTitle({
  className,
  children,
  ...props
}: CtrDialogTitleProps) {
  return (
    <DialogPrimitive.Title
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </DialogPrimitive.Title>
  )
}

// وصف النافذة
export function CtrDialogDescription({
  className,
  children,
  ...props
}: CtrDialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </DialogPrimitive.Description>
  )
}

// تذييل النافذة
export function CtrDialogFooter({
  className,
  children,
  ...props
}: CtrDialogFooterProps) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// مكونات مساعدة للنوافذ المنبثقة الشائعة
export function CtrAlertDialog({
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  variant = "alert",
  ...props
}: CtrDialogProps & {
  onConfirm?: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
}) {
  return (
    <CtrDialog variant={variant} {...props}>
      <CtrDialogContent>
        <CtrDialogHeader>
          <CtrDialogTitle>{title}</CtrDialogTitle>
          <CtrDialogDescription>{description}</CtrDialogDescription>
        </CtrDialogHeader>
        <CtrDialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button onClick={onConfirm}>
            {confirmText}
          </Button>
        </CtrDialogFooter>
      </CtrDialogContent>
    </CtrDialog>
  )
}

export function CtrConfirmDialog({
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  ...props
}: CtrDialogProps & {
  onConfirm?: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
}) {
  return (
    <CtrAlertDialog
      title={title}
      description={description}
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirmText={confirmText}
      cancelText={cancelText}
      variant="confirm"
      {...props}
    />
  )
}

export function CtrInfoDialog({
  title,
  description,
  onClose,
  closeText = "موافق",
  ...props
}: CtrDialogProps & {
  onClose?: () => void
  closeText?: string
}) {
  return (
    <CtrDialog variant="info" {...props}>
      <CtrDialogContent>
        <CtrDialogHeader>
          <CtrDialogTitle>{title}</CtrDialogTitle>
          <CtrDialogDescription>{description}</CtrDialogDescription>
        </CtrDialogHeader>
        <CtrDialogFooter>
          <Button onClick={onClose}>
            {closeText}
          </Button>
        </CtrDialogFooter>
      </CtrDialogContent>
    </CtrDialog>
  )
}

// تصدير المكونات
export {
  CtrDialog as Dialog,
  CtrDialogContent as DialogContent,
  CtrDialogHeader as DialogHeader,
  CtrDialogTitle as DialogTitle,
  CtrDialogDescription as DialogDescription,
  CtrDialogFooter as DialogFooter,
}

export default CtrDialog
