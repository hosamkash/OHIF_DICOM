"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { getLucideIcon } from "@/lib/lucide-icons"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const Check = getLucideIcon("Check")
const ChevronsUpDown = getLucideIcon("ChevronsUpDown")

// تعريف نوع البيانات للبحث
export interface SearchOption {
  id: string
  label: string
  value: string
  icon?: React.ReactNode
  disabled?: boolean
  description?: string
}

export interface CtrDropdownSearchProps {
  // البيانات الأساسية
  data: SearchOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  
  // التحكم في القيمة
  value?: string
  onSelect?: (option: SearchOption) => void
  onValueChange?: (value: string) => void
  
  // التحكم في المحفز
  triggerText?: string
  triggerIcon?: React.ReactNode
  triggerIconColor?: string
  triggerIconSize?: string | number
  triggerVariant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary"
  triggerSize?: "default" | "sm" | "lg" | "icon"
  triggerClassName?: string
  
  // التحكم في الأبعاد
  width?: number | string
  maxHeight?: number | string
  
  // التحكم في البحث
  searchable?: boolean
  caseSensitive?: boolean
  
  // التحكم في العرض
  showCheckIcon?: boolean
  showSearchIcon?: boolean
  
  // التحكم في الحالة
  disabled?: boolean
  loading?: boolean
  
  // التحكم في الموضع
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
  sideOffset?: number
  
  // كلاسات إضافية
  className?: string
  contentClassName?: string
  /** عرض القائمة وعرض زر الفتح = عرض الحاوية (مفيد للنصوص الطويلة) */
  matchTriggerWidth?: boolean

  /** محتوى بجوار حقل البحث داخل القائمة (مثل زر إضافة) */
  commandInputEndSlot?: React.ReactNode
  /** إشعار أصلي عند تغيير نص البحث (للاستخدام مع commandInputEndSlot) */
  onSearchValueChange?: (value: string) => void
  
  // أحداث
  onOpenChange?: (open: boolean) => void
}

export function CtrDropdownSearch({
  data,
  placeholder = "اختر عنصر...",
  searchPlaceholder = "ابحث...",
  emptyMessage = "لا توجد نتائج",
  value,
  onSelect,
  onValueChange,
  triggerText,
  triggerIcon,
  triggerIconColor = "#6b7280",
  triggerIconSize = "16px",
  triggerVariant = "outline",
  triggerSize = "default",
  triggerClassName = "w-full justify-between",
  width = 250,
  maxHeight = 300,
  searchable = true,
  caseSensitive = false,
  showCheckIcon = true,
  showSearchIcon: _showSearchIcon = true,
  disabled = false,
  loading: _loading = false,
  align = "start",
  side = "bottom",
  sideOffset = 4,
  className,
  contentClassName = "p-0",
  matchTriggerWidth = false,
  commandInputEndSlot,
  onSearchValueChange,
  onOpenChange,
}: CtrDropdownSearchProps) {
  const shouldMatchTriggerWidth =
    matchTriggerWidth || width === "100%" || String(width).trim() === "100%"
  const [open, setOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || "")
  const [searchValue, setSearchValue] = React.useState("")

  // تحديث selectedValue عندما يتغير value prop من الخارج
  React.useEffect(() => {
    setSelectedValue(value || "")
  }, [value])

  // العثور على العنصر المحدد
  const selectedOption = data.find(option => option.value === selectedValue)

  // فلترة البيانات حسب البحث
  const filteredData = React.useMemo(() => {
    if (!searchable || !searchValue.trim()) return data
    
    const searchTerm = caseSensitive ? searchValue.trim() : searchValue.trim().toLowerCase()
    
    return data.filter(option => {
      const label = caseSensitive ? option.label : option.label.toLowerCase()
      const value = caseSensitive ? option.value : option.value.toLowerCase()
      const description = option.description 
        ? (caseSensitive ? option.description : option.description.toLowerCase())
        : ""
      
      // البحث في الاسم
      const labelMatch = label.includes(searchTerm)
      // البحث في القيمة
      const valueMatch = value.includes(searchTerm)
      // البحث في الوصف
      const descriptionMatch = description.includes(searchTerm)
      
      return labelMatch || valueMatch || descriptionMatch
    })
  }, [data, searchValue, searchable, caseSensitive])

  const handleSelect = (option: SearchOption) => {
    if (option.disabled) return
    
    setSelectedValue(option.value)
    setOpen(false)
    setSearchValue("")
    
    onSelect?.(option)
    onValueChange?.(option.value)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) setSearchValue("")
    onOpenChange?.(newOpen)
  }

  const popoverWidthStyle: React.CSSProperties = shouldMatchTriggerWidth
    ? {
        width: "var(--radix-popover-trigger-width)",
        minWidth: "var(--radix-popover-trigger-width)",
        maxWidth: "min(100vw - 1rem, var(--radix-popover-content-available-width))",
      }
    : {
        width: typeof width === "number" ? `${width}px` : width,
      }

  // محفز مخصص أو افتراضي
  const trigger = (
    <Button
      variant={triggerVariant}
      size={triggerSize}
      disabled={disabled}
      className={cn(
        "w-full min-w-0 justify-between gap-2",
        !shouldMatchTriggerWidth &&
          `w-[${typeof width === "number" ? width + "px" : width}]`,
        shouldMatchTriggerWidth && "h-auto min-h-9 whitespace-normal py-2",
        triggerClassName,
        className
      )}
      role="combobox"
      aria-expanded={open}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2">
        {triggerIcon && (
          <span 
            style={{ 
              color: triggerIconColor,
              fontSize: triggerIconSize 
            }}
          >
            {triggerIcon}
          </span>
        )}
        <span
          className={cn(
            "text-start leading-snug",
            shouldMatchTriggerWidth ? "min-w-0 flex-1 break-words whitespace-normal" : "truncate"
          )}
        >
          {selectedOption ? selectedOption.label : (triggerText || placeholder)}
        </span>
      </div>
      <ChevronsUpDown 
        className="ml-2 h-4 w-4 shrink-0 opacity-50" 
        style={{ color: triggerIconColor }}
      />
    </Button>
  )

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "p-0",
          shouldMatchTriggerWidth && "!w-[var(--radix-popover-trigger-width)] max-w-[min(100vw-1rem,var(--radix-popover-content-available-width))]",
          contentClassName
        )}
        align={align}
        side={side}
        sideOffset={sideOffset}
        style={popoverWidthStyle}
      >
        <Command shouldFilter={false}>
          {searchable && (
            <div className="flex items-stretch gap-1 border-b px-2">
              <CommandInput
                placeholder={searchPlaceholder}
                value={searchValue}
                onValueChange={(v) => {
                  setSearchValue(v)
                  onSearchValueChange?.(v)
                }}
                className="min-h-9 flex-1 border-0 focus:ring-0"
              />
              {commandInputEndSlot != null && (
                <div className="flex shrink-0 items-center py-1">{commandInputEndSlot}</div>
              )}
            </div>
          )}
          <CommandList 
            style={{ maxHeight: typeof maxHeight === 'number' ? maxHeight + 'px' : maxHeight }}
          >
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {filteredData.map((option) => (
                <CommandItem
                  key={option.id}
                  value={`${option.label} ${option.description || ''} ${option.value}`}
                  onSelect={() => handleSelect(option)}
                  disabled={option.disabled}
                  className={cn(
                    "flex items-center gap-2",
                    option.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {showCheckIcon && (
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selectedValue === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  )}
                  {option.icon && (
                    <span className="flex-shrink-0">
                      {option.icon}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className={cn("font-medium", shouldMatchTriggerWidth ? "break-words whitespace-normal" : "truncate")}>
                      {option.label}
                    </div>
                    {option.description && (
                      <div className={cn("text-xs text-muted-foreground", shouldMatchTriggerWidth ? "break-words" : "truncate")}>
                        {option.description}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default CtrDropdownSearch
