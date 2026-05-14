"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// تعريف أنواع البطاقات
export type CardVariant = "default" | "outline" | "filled" | "elevated" | "bordered"
export type CardSize = "sm" | "default" | "lg"
export type CardShadow = "none" | "sm" | "md" | "lg" | "xl"

// تعريف خصائص البطاقة الرئيسية
export interface CtrCardProps extends React.ComponentProps<"div"> {
  variant?: CardVariant
  size?: CardSize
  shadow?: CardShadow
  hover?: boolean
  clickable?: boolean
  className?: string
  children?: React.ReactNode
}

// تعريف خصائص رأس البطاقة
export interface CtrCardHeaderProps extends React.ComponentProps<"div"> {
  title?: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

// تعريف خصائص محتوى البطاقة
export interface CtrCardContentProps extends React.ComponentProps<"div"> {
  className?: string
  children?: React.ReactNode
}

// تعريف خصائص تذييل البطاقة
export interface CtrCardFooterProps extends React.ComponentProps<"div"> {
  className?: string
  children?: React.ReactNode
}

// تعريف خصائص عنوان البطاقة
export interface CtrCardTitleProps extends React.ComponentProps<"h3"> {
  className?: string
  children?: React.ReactNode
}

// تعريف خصائص وصف البطاقة
export interface CtrCardDescriptionProps extends React.ComponentProps<"p"> {
  className?: string
  children?: React.ReactNode
}

// المكون الرئيسي للبطاقة
export function CtrCard({
  variant = "default",
  size = "default",
  shadow = "sm",
  hover = false,
  clickable = false,
  className,
  children,
  ...props
}: CtrCardProps) {
  // تحديد أشكال البطاقة
  const variantClasses = {
    default: "bg-card text-card-foreground border",
    outline: "bg-transparent border-2 border-border",
    filled: "bg-muted border-0",
    elevated: "bg-card text-card-foreground border-0 shadow-lg",
    bordered: "bg-card text-card-foreground border-2 border-primary"
  }

  // تحديد أحجام البطاقة
  const sizeClasses = {
    sm: "p-4 gap-3",
    default: "p-6 gap-4",
    lg: "p-8 gap-6"
  }

  // تحديد الظلال
  const shadowClasses = {
    none: "shadow-none",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl"
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl transition-all duration-200",
        variantClasses[variant],
        sizeClasses[size],
        shadowClasses[shadow],
        hover && "hover:shadow-md hover:scale-[1.02]",
        clickable && "cursor-pointer hover:shadow-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// رأس البطاقة
export function CtrCardHeader({
  title,
  subtitle,
  action,
  className,
  children,
  ...props
}: CtrCardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4",
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0">
        {title && (
          <CtrCardTitle>{title}</CtrCardTitle>
        )}
        {subtitle && (
          <CtrCardDescription>{subtitle}</CtrCardDescription>
        )}
        {children}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}

// عنوان البطاقة
export function CtrCardTitle({
  className,
  children,
  ...props
}: CtrCardTitleProps) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

// وصف البطاقة
export function CtrCardDescription({
  className,
  children,
  ...props
}: CtrCardDescriptionProps) {
  return (
    <p
      className={cn(
        "text-sm text-muted-foreground mt-1",
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

// محتوى البطاقة
export function CtrCardContent({
  className,
  children,
  ...props
}: CtrCardContentProps) {
  return (
    <div
      className={cn(
        "flex-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// تذييل البطاقة
export function CtrCardFooter({
  className,
  children,
  ...props
}: CtrCardFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 pt-4 border-t border-border",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// تصدير المكونات
export {
  CtrCard as Card,
  CtrCardHeader as CardHeader,
  CtrCardTitle as CardTitle,
  CtrCardDescription as CardDescription,
  CtrCardContent as CardContent,
  CtrCardFooter as CardFooter,
}

export default CtrCard
