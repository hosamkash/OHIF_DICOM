/** Path segment for OHIF viewer app (study list & modes); old home used to be `/`. */
export const OHIF_VIEWER_HOME_PATH = '/ohif';

/** Marketing / product landing route (outside OHIF viewer shell). */
export const APP_MARKETING_LANDING_PATH = '/';

function trimTrailingSlash(path: string): string {
  return path.replace(/\/+$/, '') || '/';
}

function normalizeLeadingSlashForSegment(segment: string): string {
  return segment.replace(/^\/+/, '').replace(/\/+$/, '');
}

/**
 * Pathname to open a mode under {@link OHIF_VIEWER_HOME_PATH}, e.g.
 * `/ohif/segmentation` or `/ohif/segmentation/ohif`.
 *
 * @param routeName OHIF mode route (`viewer`, `segmentation`, …)
 * @param dataSourcePath Optional segment from study list (`/ohif`, `/orthancProxy`, …).
 */
export function viewerModePathname(routeName: string, dataSourcePath: string = ''): string {
  const base = trimTrailingSlash(OHIF_VIEWER_HOME_PATH);
  const modeSeg = normalizeLeadingSlashForSegment(routeName);
  const ds = normalizeLeadingSlashForSegment(
    typeof dataSourcePath === 'string' ? dataSourcePath : ''
  );
  const root = `${base}/${modeSeg}`.replace(/\/+/g, '/');
  if (ds.length > 0) {
    return `${root}/${ds}`.replace(/\/+/g, '/');
  }
  return root;
}

/**
 * Part of the pathname after {@link OHIF_VIEWER_HOME_PATH} (`viewer`, `viewer/ohif`, …).
 * Falls back to pre-nesting URLs (`segmentation/ohif`) for legacy bookmarks.
 */
export function getViewerRelativeModePath(pathname: string): string {
  const full = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const base = trimTrailingSlash(OHIF_VIEWER_HOME_PATH);
  if (full === base || full === `${base}/`) {
    return '';
  }
  if (full.startsWith(`${base}/`)) {
    return normalizeLeadingSlashForSegment(full.slice(base.length + 1));
  }
  return normalizeLeadingSlashForSegment(pathname.startsWith('/') ? pathname.slice(1) : pathname);
}

/** Data-source slug from a viewer mode URL (`/ohif/segmentation/ohif` → `ohif`). */
/**
 * Paths like `viewer/dicomlocal` used by baked-in `/localbasic` routes.
 */
export function viewerCompositeModePathname(compositeModePath: string): string {
  const idx = compositeModePath.indexOf('/');
  if (idx === -1) {
    return viewerModePathname(compositeModePath, '');
  }
  return viewerModePathname(
    compositeModePath.slice(0, idx),
    compositeModePath.slice(idx + 1)
  );
}

export function getDatasourceSlugFromViewerPath(pathname: string): string | null {
  const rel = getViewerRelativeModePath(pathname);
  const slash = rel.indexOf('/');
  if (slash === -1) {
    return null;
  }
  const slug = rel.slice(slash + 1).split('/')[0];
  return slug.length > 0 ? slug : null;
}
