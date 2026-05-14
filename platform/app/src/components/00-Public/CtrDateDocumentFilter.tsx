"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { CtrInput } from "../CtrInput"

export type CtrDateDocumentFilterValue = "today" | "month" | "all" | "period"

export interface CtrDateDocumentFilterProps {
  dateFilter: CtrDateDocumentFilterValue | string
  fromDate?: string
  toDate?: string
  selectedMonth?: string
  onDateFilterChange: (value: CtrDateDocumentFilterValue | string) => void
  onFromDateChange?: (value: string) => void
  onToDateChange?: (value: string) => void
  onMonthChange?: (value: string) => void
  storageKey?: string
  className?: string
  disabled?: boolean
  showToday?: boolean
  showMonth?: boolean
  showAll?: boolean
  showPeriod?: boolean
  showDateLable?: boolean
  hideCard?: boolean
}

const filterOptions: Array<{
  value: CtrDateDocumentFilterValue
  label: string
  prop: "showToday" | "showMonth" | "showAll" | "showPeriod"
}> = [
  { value: "today", label: "اليوم", prop: "showToday" },
  { value: "month", label: "الشهر", prop: "showMonth" },
  { value: "period", label: "فترة", prop: "showPeriod" },
  { value: "all", label: "الكل", prop: "showAll" },
]

export default function CtrDateDocumentFilter({
  dateFilter,
  fromDate,
  toDate,
  selectedMonth,
  onDateFilterChange,
  onFromDateChange,
  onToDateChange,
  onMonthChange,
  className,
  disabled = false,
  showToday = true,
  showMonth = true,
  showAll = true,
  showPeriod = true,
  showDateLable = true,
  hideCard = false,
}: CtrDateDocumentFilterProps) {
  const visibleOptions = filterOptions.filter(option => {
    const visibility = { showToday, showMonth, showAll, showPeriod }
    return visibility[option.prop]
  })

  const content = (
    <div className={cn("flex flex-col gap-2", className)}>
      {showDateLable && <span className="text-sm font-medium">فلتر التاريخ</span>}
      <select
        value={dateFilter}
        disabled={disabled}
        onChange={event => onDateFilterChange(event.target.value)}
        className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {visibleOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {dateFilter === "month" && (
        <CtrInput
          type="date"
          value={selectedMonth}
          disabled={disabled}
          onChange={value => onMonthChange?.(value)}
        />
      )}

      {dateFilter === "period" && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <CtrInput
            type="date"
            label="من"
            value={fromDate}
            disabled={disabled}
            onChange={value => onFromDateChange?.(value)}
          />
          <CtrInput
            type="date"
            label="إلى"
            value={toDate}
            disabled={disabled}
            onChange={value => onToDateChange?.(value)}
          />
        </div>
      )}
    </div>
  )

  if (hideCard) {
    return content
  }

  return <div className="rounded-md border bg-background p-3">{content}</div>
}
