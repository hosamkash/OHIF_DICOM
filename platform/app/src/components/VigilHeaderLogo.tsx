import React from 'react';

function vigilLogoUrl(): string {
  const base =
    typeof window !== 'undefined' && window.PUBLIC_URL != null ? window.PUBLIC_URL : '/';
  return `${base}LogoVigil.jpg`;
}

export type VigilHeaderLogoProps = {
  /** Default matches study list header; `hero` is used on full-page flows (e.g. local drop). */
  variant?: 'header' | 'hero';
};

/**
 * Vigil lockup shown in OHIF `@ohif/ui-next` Header (via `whiteLabeling.createLogoComponentFn`).
 */
export function VigilHeaderLogo({ variant = 'header' }: VigilHeaderLogoProps) {
  const imgClass =
    variant === 'hero'
      ? 'h-16 w-auto max-w-[min(260px,50vw)] rounded object-contain'
      : 'h-9 w-auto max-h-9 rounded object-contain';

  const titleClass =
    variant === 'hero'
      ? 'font-semibold text-foreground text-lg tracking-tight'
      : 'font-semibold text-foreground text-sm leading-tight tracking-tight';

  return (
    <div
      className="flex min-w-0 max-w-full items-center gap-2 select-none"
      aria-label="Vigil DICOM Viewr"
    >
      <img
        src={vigilLogoUrl()}
        alt=""
        className={imgClass}
        draggable={false}
      />
      <span className={`min-w-0 truncate ${titleClass}`}>Vigil DICOM Viewr</span>
    </div>
  );
}

/**
 * Signature matches `WhiteLabeling.createLogoComponentFn` in `@ohif/ui-next` Header.
 */
export function createVigilHeaderLogoComponent(
  ReactArg: typeof React,
  _props?: unknown
): React.ReactNode {
  return ReactArg.createElement(VigilHeaderLogo, { variant: 'header' });
}
