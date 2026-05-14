/**
 * Orthanc native REST labels (persisted in Orthanc DB), not DICOMweb QIDO.
 * @see https://book.orthanc-server.com/users/rest.html
 */

const DICOM_WEB_SUFFIXES = ['/dicom-web', '/dicomweb', '/dicom-web-rs'];

export type DicomWebLikeConfig = {
  qidoRoot?: string;
  wadoRoot?: string;
  orthancRestRoot?: string;
};

export function authorizationHeaderFromUserAuth(ua: {
  getAuthorizationHeader?: () => unknown;
}): Record<string, string> {
  if (!ua?.getAuthorizationHeader || typeof ua.getAuthorizationHeader !== 'function') {
    return {};
  }
  const raw = ua.getAuthorizationHeader() as unknown;
  const auth: Record<string, string> = {};
  if (raw && typeof raw === 'object' && raw !== null && 'Authorization' in raw) {
    const a = (raw as { Authorization?: unknown }).Authorization;
    if (a != null && String(a).length) {
      auth.Authorization = String(a);
    }
  }
  return auth;
}

export function getOrthancRestRootFromDataSource(dataSource: unknown): string | null {
  const ds = dataSource as { getConfig?: () => DicomWebLikeConfig };
  const cfg = ds?.getConfig?.();
  if (!cfg) {
    return null;
  }
  return orthancRestRootFromDicomWebRoots(cfg.qidoRoot, cfg.wadoRoot, cfg.orthancRestRoot);
}

export function orthancRestRootFromDicomWebRoots(
  qidoRoot?: string,
  wadoRoot?: string,
  explicitOrthancRestRoot?: string
): string | null {
  if (explicitOrthancRestRoot && explicitOrthancRestRoot.trim()) {
    return explicitOrthancRestRoot.replace(/\/+$/, '');
  }
  for (const root of [qidoRoot, wadoRoot]) {
    if (!root) {
      continue;
    }
    const trimmed = root.replace(/\/+$/, '');
    const lower = trimmed.toLowerCase();
    for (const suf of DICOM_WEB_SUFFIXES) {
      if (lower.endsWith(suf)) {
        const out = trimmed.slice(0, trimmed.length - suf.length);
        return out.length ? out : null;
      }
    }
  }
  return null;
}

export function resolveOrthancApiUrl(orthancRestRoot: string): string {
  const r = orthancRestRoot.replace(/\/+$/, '');
  if (/^https?:\/\//i.test(r)) {
    return r;
  }
  if (typeof window === 'undefined' || !window.location?.href) {
    return r;
  }
  return new URL(r.startsWith('/') ? r : `/${r}`, window.location.href).href.replace(/\/+$/, '');
}

function mergeHeaders(
  base: HeadersInit | undefined,
  extra: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = { ...extra };
  if (!base) {
    return out;
  }
  if (base instanceof Headers) {
    base.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  if (Array.isArray(base)) {
    for (const [k, v] of base) {
      out[k] = v;
    }
    return out;
  }
  return { ...base, ...out };
}

export async function orthancFindStudyId(
  orthancRestRoot: string,
  studyInstanceUid: string,
  authHeaders: Record<string, string>,
  signal?: AbortSignal
): Promise<string | null> {
  const base = resolveOrthancApiUrl(orthancRestRoot);
  const res = await fetch(`${base}/tools/find`, {
    method: 'POST',
    signal,
    credentials: 'include',
    headers: mergeHeaders(authHeaders, {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: JSON.stringify({
      Level: 'Study',
      Query: {
        StudyInstanceUID: studyInstanceUid,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Orthanc find failed: ${res.status}`);
  }
  const ids = (await res.json()) as unknown;
  if (!Array.isArray(ids) || ids.length === 0 || typeof ids[0] !== 'string') {
    return null;
  }
  return ids[0];
}

/** Orthanc REST: delete study instance from server DB (not DICOMweb QIDO). */
export async function orthancDeleteStudy(
  orthancRestRoot: string,
  orthancStudyId: string,
  authHeaders: Record<string, string>,
  signal?: AbortSignal
): Promise<void> {
  const base = resolveOrthancApiUrl(orthancRestRoot);
  const res = await fetch(`${base}/studies/${encodeURIComponent(orthancStudyId)}`, {
    method: 'DELETE',
    signal,
    credentials: 'include',
    headers: mergeHeaders(authHeaders, { Accept: 'application/json' }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(
      `Orthanc delete study failed: ${res.status}${detail ? ` — ${detail.slice(0, 200)}` : ''}`
    );
  }
}

/** Orthanc REST: anonymize study (Explorer 2 / default rules on server). @see https://book.orthanc-server.com/users/rest.html */
export async function orthancAnonymizeStudy(
  orthancRestRoot: string,
  orthancStudyId: string,
  authHeaders: Record<string, string>,
  anonymizationJson: Record<string, unknown> = {},
  signal?: AbortSignal
): Promise<unknown> {
  const base = resolveOrthancApiUrl(orthancRestRoot);
  const res = await fetch(`${base}/studies/${encodeURIComponent(orthancStudyId)}/anonymize`, {
    method: 'POST',
    signal,
    credentials: 'include',
    headers: mergeHeaders(authHeaders, {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: JSON.stringify(anonymizationJson),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(
      `Orthanc anonymize failed: ${res.status}${detail ? ` — ${detail.slice(0, 200)}` : ''}`
    );
  }
  return res.json().catch(() => ({}));
}

/** Orthanc Explorer 2: open filtered list for one StudyInstanceUID (OE2 ≥ 1.7). */
export function buildOrthancExplorerFilteredStudiesUrl(
  orthancRestRoot: string,
  studyInstanceUid: string,
  options?: { expandStudy?: boolean }
): string {
  const base = resolveOrthancApiUrl(orthancRestRoot).replace(/\/+$/, '');
  const params = new URLSearchParams();
  params.set('StudyInstanceUID', `"${studyInstanceUid}"`);
  if (options?.expandStudy) {
    params.set('expand', 'study');
  }
  return `${base}/ui/app/#/filtered-studies?${params.toString()}`;
}

export async function orthancGetStudyLabels(
  orthancRestRoot: string,
  orthancStudyId: string,
  authHeaders: Record<string, string>,
  signal?: AbortSignal
): Promise<string[]> {
  const base = resolveOrthancApiUrl(orthancRestRoot);
  const res = await fetch(`${base}/studies/${encodeURIComponent(orthancStudyId)}/labels`, {
    method: 'GET',
    signal,
    credentials: 'include',
    headers: mergeHeaders(authHeaders, { Accept: 'application/json' }),
  });
  if (!res.ok) {
    throw new Error(`Orthanc get labels failed: ${res.status}`);
  }
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? data.filter((x): x is string => typeof x === 'string') : [];
}

export async function orthancPutStudyLabel(
  orthancRestRoot: string,
  orthancStudyId: string,
  label: string,
  authHeaders: Record<string, string>
): Promise<void> {
  const base = resolveOrthancApiUrl(orthancRestRoot);
  const pathLabel = encodeURIComponent(label);
  const res = await fetch(`${base}/studies/${encodeURIComponent(orthancStudyId)}/labels/${pathLabel}`, {
    method: 'PUT',
    credentials: 'include',
    headers: mergeHeaders(authHeaders, { Accept: 'application/json' }),
  });
  if (!res.ok) {
    throw new Error(`Orthanc add label failed: ${res.status}`);
  }
}

export async function orthancDeleteStudyLabel(
  orthancRestRoot: string,
  orthancStudyId: string,
  label: string,
  authHeaders: Record<string, string>
): Promise<void> {
  const base = resolveOrthancApiUrl(orthancRestRoot);
  const pathLabel = encodeURIComponent(label);
  const res = await fetch(`${base}/studies/${encodeURIComponent(orthancStudyId)}/labels/${pathLabel}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: mergeHeaders(authHeaders, { Accept: 'application/json' }),
  });
  if (!res.ok) {
    throw new Error(`Orthanc remove label failed: ${res.status}`);
  }
}
