import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSystem } from '@ohif/core';
import { OHIF_VIEWER_HOME_PATH } from '../constants/viewerRoutes';

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
 * زر مركز التصدير بجانب العلامة — يظهر فقط داخل مسارات المشاهد (`/ohif/<mode>/…`) وليس قائمة الدراسات (`/ohif` فقط).
 */
function VigilViewerExportHubHeaderControl() {
  const { pathname } = useLocation();
  const { commandsManager } = useSystem();
  const base = OHIF_VIEWER_HOME_PATH.replace(/\/$/, '');
  const normPath = pathname.replace(/\/$/, '') || '/';
  const isViewerSubRoute = normPath.startsWith(`${base}/`);
  if (!isViewerSubRoute) {
    return null;
  }

  const openHub = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    commandsManager.run({
      commandName: 'openViewerExportHubDialog',
      context: 'VIEWER',
    });
  };

  return (
    <button
      type="button"
      onClick={openHub}
      onMouseDown={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      title="فتح مركز التصدير والمشاركة"
      className="ms-1.5 inline-flex max-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-white/35 bg-white/12 px-2.5 py-1 text-[11px] font-bold leading-tight text-white shadow-sm backdrop-blur-sm animate-[float_3s_ease-in-out_infinite] transition hover:border-white/55 hover:bg-white/20 hover:shadow-md sm:text-xs"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        aria-hidden
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line
          x1="10"
          y1="14"
          x2="21"
          y2="3"
        />
      </svg>
      <span className="max-w-[9.5rem] truncate sm:max-w-[12rem]">تصدير ومشاركة</span>
    </button>
  );
}

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
      {variant === 'header' ? <VigilViewerExportHubHeaderControl /> : null}
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
