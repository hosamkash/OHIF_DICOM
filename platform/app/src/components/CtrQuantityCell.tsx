"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { CtrInput } from "./CtrInput"

export interface CtrQuantityCellProps {
  recordId: string
  value: number
  readOnly?: boolean
  onBlurChange: (id: string, field: string, val: number) => void
  /** اسم الحقل المُمرَّر لـ onBlurChange (افتراضي "Quantity") */
  field?: string
  /** الحد الأدنى للكمية (افتراضي 0) */
  min?: number
  className?: string
  /** اتجاه الانتقال عند Enter */
  tabNextCell?: "nextRowSameColumn" | "nextColumnSameRow"
  /** نطاق/معرف جدول للتنقل داخل نفس الجدول فقط */
  tabScopeId?: string
  /** إحداثيات الخلية القابلة للكتابة */
  tabRowIndex?: number
  tabColIndex?: number
  /** إجمالي الصفوف/الأعمدة القابلة للكتابة */
  tabRowCount?: number
  tabColCount?: number
}

/**
 * خلية كمية للجداول: تحفظ القيمة محلياً وتُحدّث الأب عند onBlur فقط
 * لتجنب فقدان التركيز عند الكتابة داخل CtrDataTableAdvanced
 */
export function CtrQuantityCell({
  recordId,
  value,
  readOnly = false,
  onBlurChange,
  field = "Quantity",
  min = 0,
  className = "w-20",
  tabNextCell = "nextColumnSameRow",
  tabScopeId,
  tabRowIndex,
  tabColIndex,
  tabRowCount,
  tabColCount,
}: CtrQuantityCellProps) {
  const [local, setLocal] = useState(String(Math.max(min, Math.abs(value || 0))))
  useEffect(() => {
    setLocal(String(Math.max(min, Math.abs(value || 0))))
  }, [value, min])
  const handleBlur = () => {
    const num = parseInt(local, 10)
    const final = isNaN(num) || num < min ? min : num
    onBlurChange(recordId, field, final)
  }

  return (
    <CtrInput
      type="number"
      min={min}
      className={className}
      value={local}
      onChange={(val) => setLocal(val)}
      onBlur={handleBlur}
      disabled={readOnly}
      onKeyDown={(e) => {
        if (e.key !== "Enter") return
        // التنقل يتم مركزياً من CtrDataTableAdvanced
      }}
      data-ctr-tab-scope={tabScopeId}
      data-ctr-tab-row={tabRowIndex}
      data-ctr-tab-col={tabColIndex}
    />
  )
}
