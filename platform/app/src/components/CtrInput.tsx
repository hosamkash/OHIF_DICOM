"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { getLucideIcon } from "@/lib/lucide-icons"

const Eye = getLucideIcon("Eye", "Check")
const EyeOff = getLucideIcon("EyeOff", "Eye")
const Search = getLucideIcon("Search", "Code")
const X = getLucideIcon("X", "ChevronDown")

// تعريف أنواع الحقول المختلفة
export type InputType = "text" | "email" | "password" | "number" | "tel" | "url" | "search" | "date"
export type InputSize = "sm" | "default" | "lg"
export type InputVariant = "default" | "outline" | "filled" | "underline"

const DATE_FORMAT_DMY = "يوم/شهر/سنة" // dd/mm/yyyy
function dateToInput(d: string): string {
  if (!d || !d.trim()) return ""
  const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  return d
}
function inputToDate(v: string): string {
  if (!v || !v.trim()) return ""
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  return v
}

// تعريف خصائص المكون
export interface CtrInputProps extends Omit<React.ComponentProps<"input">, "size" | "onChange"> {
  // التحكم في المظهر
  variant?: InputVariant
  size?: InputSize
  className?: string
  
  // التحكم في الوظائف
  showPasswordToggle?: boolean
  showClearButton?: boolean
  showSearchIcon?: boolean
  
  // التحكم في النص
  label?: string
  placeholder?: string
  helperText?: string
  errorText?: string
  
  // التحكم في الحالة
  disabled?: boolean
  required?: boolean
  error?: boolean
  
  // التحكم في الأبعاد
  width?: number | string
  height?: number | string
  
  // التحكم في الأحداث
  onClear?: () => void
  onSearch?: (value: string) => void
  
  // التحكم في القيم
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
}

export function CtrInput({
  variant = "default",
  size = "default",
  className,
  showPasswordToggle = false,
  showClearButton = false,
  showSearchIcon = false,
  label,
  placeholder,
  helperText,
  errorText,
  disabled = false,
  required = false,
  error = false,
  width,
  height,
  onClear,
  onSearch,
  value,
  defaultValue,
  onChange,
  type = "text",
  ...props
}: CtrInputProps) {
  const [inputValue, setInputValue] = React.useState(() => {
    const v = value ?? defaultValue ?? ""
    return type === "date" ? dateToInput(v) : v
  })
  const [showPassword, setShowPassword] = React.useState(false)
  const [_isFocused, setIsFocused] = React.useState(false)

  // تحديث القيمة عند تغيير البروبس
  React.useEffect(() => {
    if (value !== undefined) {
      const v = type === "date" ? dateToInput(value) : value
      setInputValue(v)
    }
  }, [value, type])

  // دالة التعامل مع التغيير
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setInputValue(raw)
    const out = type === "date" ? inputToDate(raw) : raw
    onChange?.(out)
  }

  // دالة مسح القيمة
  const handleClear = () => {
    setInputValue("")
    onChange?.("")
    onClear?.()
  }

  // دالة البحث
  const handleSearch = () => {
    onSearch?.(inputValue)
  }

  // دالة التعامل مع الضغط على Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.defaultPrevented) {
      props.onKeyDown?.(e)
      return
    }
    if (type === "number" && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault()
      props.onKeyDown?.(e)
      return
    }
    if (e.key === "Enter" && onSearch) {
      handleSearch()
    }
    props.onKeyDown?.(e)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    if (type === "number") {
      e.target.select()
    }
    props.onFocus?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    props.onBlur?.(e)
  }

  // تحديد نوع الحقل
  const inputType = type === "password" && showPassword ? "text" : type

  // تحديد أحجام المكون
  const sizeClasses = {
    sm: "h-8 px-2 text-sm",
    default: "h-9 px-3 text-base",
    lg: "h-11 px-4 text-lg"
  }

  // تحديد أشكال المكون
  const variantClasses = {
    default: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
    outline: "border-2 border-input bg-transparent",
    filled: "border-0 bg-muted",
    underline: "border-0 border-b-2 border-input bg-transparent rounded-none"
  }

  // تحديد ألوان الخطأ
  const errorClasses = error || errorText ? "border-destructive focus-visible:border-destructive" : ""

  return (
    <div className="w-full flex flex-col gap-2.5" style={{ width }}>
      {/* التسمية */}
      {label && (
        <label className="text-sm font-medium text-foreground block shrink-0">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      {/* الحقل */}
      <div className="relative">
        {/* أيقونة البحث */}
        {showSearchIcon && type === "search" && (
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}

        <input
          {...props}
          type={inputType}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={type === "date" ? (placeholder ?? DATE_FORMAT_DMY) : placeholder}
          disabled={disabled}
          required={required}
          className={cn(
            "w-full rounded-md transition-all duration-200 outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            sizeClasses[size],
            variantClasses[variant],
            errorClasses,
            showSearchIcon && "pr-10",
            showPasswordToggle && "pr-10",
            showClearButton && inputValue && "pr-20",
            type === "number" && "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            className
          )}
          style={{ height }}
        />

        {/* أزرار التحكم */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* زر إظهار/إخفاء كلمة المرور */}
          {showPasswordToggle && type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 hover:bg-muted rounded-sm transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          )}

          {/* زر البحث */}
          {showSearchIcon && type === "search" && onSearch && (
            <button
              type="button"
              onClick={handleSearch}
              className="p-1 hover:bg-muted rounded-sm transition-colors"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>
          )}

          {/* زر المسح */}
          {showClearButton && inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-muted rounded-sm transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* النصوص المساعدة */}
      {(helperText || errorText) && (
        <div className={cn(
          "text-xs",
          errorText ? "text-destructive" : "text-muted-foreground"
        )}>
          {errorText || helperText}
        </div>
      )}
    </div>
  )
}

export default CtrInput
