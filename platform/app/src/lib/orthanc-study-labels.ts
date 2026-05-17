/**
 * Orthanc native REST labels (persisted in Orthanc DB), not DICOMweb QIDO.
 * @see https://book.orthanc-server.com/users/rest.html
 */

import type { StudyUploadContext } from './remap-dicom-to-study';
import {
  buildStudyAnchorDicomBuffer,
  VIGIL_STUDY_ANCHOR_SERIES_DESCRIPTION,
} from './remap-dicom-to-study';

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
  const uid = studyInstanceUid?.trim();
  if (!uid) {
    return null;
  }
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
        StudyInstanceUID: uid,
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

/**
 * Resolve Orthanc internal study ID from DICOM StudyInstanceUID (find + fallbacks).
 */
export async function orthancResolveStudyId(
  orthancRestRoot: string,
  studyInstanceUid: string,
  authHeaders: Record<string, string>,
  signal?: AbortSignal,
  options?: { wadoRoot?: string }
): Promise<string | null> {
  const uid = studyInstanceUid?.trim();
  if (!uid) {
    return null;
  }

  let id = await orthancFindStudyId(orthancRestRoot, uid, authHeaders, signal);
  if (id) {
    return id;
  }

  const wadoRoot = options?.wadoRoot?.trim();
  if (wadoRoot) {
    const wadoBase = resolveDicomWebUrl(wadoRoot);
    const studyRes = await fetch(`${wadoBase}/studies/${encodeURIComponent(uid)}`, {
      method: 'GET',
      signal,
      credentials: 'include',
      headers: mergeHeaders(authHeaders, { Accept: 'application/dicom+json' }),
    });
    if (studyRes.ok) {
      id = await orthancFindStudyId(orthancRestRoot, uid, authHeaders, signal);
      if (id) {
        return id;
      }
    }
  }

  const base = resolveOrthancApiUrl(orthancRestRoot);
  const listRes = await fetch(`${base}/studies`, {
    method: 'GET',
    signal,
    credentials: 'include',
    headers: mergeHeaders(authHeaders, { Accept: 'application/json' }),
  });
  if (!listRes.ok) {
    return null;
  }
  const studyIds = (await listRes.json()) as unknown;
  if (!Array.isArray(studyIds)) {
    return null;
  }

  for (const studyId of studyIds) {
    if (signal?.aborted || typeof studyId !== 'string') {
      return null;
    }
    const tagsRes = await fetch(`${base}/studies/${encodeURIComponent(studyId)}/main-dicom-tags`, {
      method: 'GET',
      signal,
      credentials: 'include',
      headers: mergeHeaders(authHeaders, { Accept: 'application/json' }),
    });
    if (!tagsRes.ok) {
      continue;
    }
    const tags = (await tagsRes.json()) as { StudyInstanceUID?: string };
    if (tags.StudyInstanceUID?.trim() === uid) {
      return studyId;
    }
  }

  return null;
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

/** Orthanc REST: delete one instance. */
export async function orthancDeleteInstance(
  orthancRestRoot: string,
  orthancInstanceId: string,
  authHeaders: Record<string, string>,
  signal?: AbortSignal
): Promise<void> {
  const base = resolveOrthancApiUrl(orthancRestRoot);
  const res = await fetch(`${base}/instances/${encodeURIComponent(orthancInstanceId)}`, {
    method: 'DELETE',
    signal,
    credentials: 'include',
    headers: mergeHeaders(authHeaders, { Accept: 'application/json' }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(
      `Orthanc delete instance failed: ${res.status}${detail ? ` — ${detail.slice(0, 200)}` : ''}`
    );
  }
}

type OrthancFindLevel = 'Study' | 'Series' | 'Instance';

/** Orthanc REST `POST /tools/find` — returns internal resource IDs. */
export async function orthancFindResourceIds(
  orthancRestRoot: string,
  level: OrthancFindLevel,
  query: Record<string, string>,
  authHeaders: Record<string, string>,
  signal?: AbortSignal
): Promise<string[]> {
  const base = resolveOrthancApiUrl(orthancRestRoot);
  const res = await fetch(`${base}/tools/find`, {
    method: 'POST',
    signal,
    credentials: 'include',
    headers: mergeHeaders(authHeaders, {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: JSON.stringify({ Level: level, Query: query }),
  });
  if (!res.ok) {
    throw new Error(`Orthanc find (${level}) failed: ${res.status}`);
  }
  const ids = (await res.json()) as unknown;
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
}

async function orthancGetStudyChildIds(
  orthancRestRoot: string,
  orthancStudyId: string,
  childKey: 'Series' | 'Instances',
  authHeaders: Record<string, string>,
  signal?: AbortSignal
): Promise<string[]> {
  const base = resolveOrthancApiUrl(orthancRestRoot);
  const res = await fetch(`${base}/studies/${encodeURIComponent(orthancStudyId)}`, {
    method: 'GET',
    signal,
    credentials: 'include',
    headers: mergeHeaders(authHeaders, { Accept: 'application/json' }),
  });
  if (!res.ok) {
    throw new Error(`Orthanc get study failed: ${res.status}`);
  }
  const data = (await res.json()) as { Series?: unknown; Instances?: unknown };
  const raw = childKey === 'Series' ? data.Series : data.Instances;
  return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : [];
}

async function orthancGetSeriesInstanceIds(
  orthancRestRoot: string,
  orthancSeriesId: string,
  authHeaders: Record<string, string>,
  signal?: AbortSignal
): Promise<string[]> {
  const base = resolveOrthancApiUrl(orthancRestRoot);
  const res = await fetch(`${base}/series/${encodeURIComponent(orthancSeriesId)}`, {
    method: 'GET',
    signal,
    credentials: 'include',
    headers: mergeHeaders(authHeaders, { Accept: 'application/json' }),
  });
  if (!res.ok) {
    return [];
  }
  const data = (await res.json()) as { Instances?: unknown };
  return Array.isArray(data.Instances)
    ? data.Instances.filter((id): id is string => typeof id === 'string')
    : [];
}

function resolveDicomWebUrl(wadoRoot: string): string {
  const r = wadoRoot.replace(/\/+$/, '');
  if (/^https?:\/\//i.test(r)) {
    return r;
  }
  if (typeof window === 'undefined' || !window.location?.href) {
    return r;
  }
  return new URL(r.startsWith('/') ? r : `/${r}`, window.location.href).href.replace(/\/+$/, '');
}

async function fetchImageBlob(
  url: string,
  authHeaders: Record<string, string>,
  signal?: AbortSignal
): Promise<Blob | null> {
  const res = await fetch(url, {
    method: 'GET',
    signal,
    credentials: 'include',
    headers: mergeHeaders(authHeaders, {
      Accept: 'image/png, image/jpeg, image/*, */*',
    }),
  });
  if (!res.ok) {
    return null;
  }
  const blob = await res.blob();
  if (!blob.size) {
    return null;
  }
  const type = (blob.type || '').toLowerCase();
  if (type.includes('json') || type.includes('xml') || type.includes('text')) {
    return null;
  }
  return blob;
}

function dicomJsonTagValue(instance: Record<string, unknown>, tag: string): string | null {
  const entry = instance[tag] as { Value?: unknown[] } | undefined;
  const raw = entry?.Value?.[0];
  if (raw == null || raw === '') {
    return null;
  }
  return String(raw).trim();
}

async function dicomWebFetchFirstSopInstanceUid(
  wadoRoot: string,
  studyInstanceUid: string,
  seriesInstanceUid: string,
  authHeaders: Record<string, string>,
  signal?: AbortSignal
): Promise<string | null> {
  const base = resolveDicomWebUrl(wadoRoot);
  const url = `${base}/studies/${encodeURIComponent(studyInstanceUid)}/series/${encodeURIComponent(seriesInstanceUid)}/instances?limit=1`;
  const res = await fetch(url, {
    method: 'GET',
    signal,
    credentials: 'include',
    headers: mergeHeaders(authHeaders, {
      Accept: 'application/dicom+json',
    }),
  });
  if (!res.ok) {
    return null;
  }
  const rows = (await res.json()) as unknown;
  if (!Array.isArray(rows) || !rows.length || typeof rows[0] !== 'object' || rows[0] === null) {
    return null;
  }
  const inst = rows[0] as Record<string, unknown>;
  return dicomJsonTagValue(inst, '00080018') || dicomJsonTagValue(inst, 'SOPInstanceUID');
}

async function dicomWebFetchRenderedInstanceBlob(
  wadoRoot: string,
  studyInstanceUid: string,
  seriesInstanceUid: string,
  sopInstanceUid: string,
  authHeaders: Record<string, string>,
  signal?: AbortSignal
): Promise<Blob | null> {
  const base = resolveDicomWebUrl(wadoRoot);
  const path = `/studies/${encodeURIComponent(studyInstanceUid)}/series/${encodeURIComponent(seriesInstanceUid)}/instances/${encodeURIComponent(sopInstanceUid)}/rendered?accept=image/jpeg`;
  return fetchImageBlob(`${base}${path}`, authHeaders, signal);
}

/**
 * Worklist thumbnail: Orthanc instance/series preview, then DICOMweb rendered.
 */
export async function orthancFetchSeriesPreviewBlob(
  orthancRestRoot: string,
  seriesInstanceUid: string,
  authHeaders: Record<string, string>,
  signal?: AbortSignal,
  options?: { studyInstanceUid?: string; wadoRoot?: string }
): Promise<Blob | null> {
  const seriesUid = seriesInstanceUid.trim();
  const studyUid = options?.studyInstanceUid?.trim();
  const wadoRoot = options?.wadoRoot?.trim();

  const seriesId = await orthancFindSeriesId(
    orthancRestRoot,
    seriesUid,
    authHeaders,
    signal,
    studyUid
  );

  const base = resolveOrthancApiUrl(orthancRestRoot);

  if (seriesId) {
    const seriesPreview = await fetchImageBlob(
      `${base}/series/${encodeURIComponent(seriesId)}/preview`,
      authHeaders,
      signal
    );
    if (seriesPreview) {
      return seriesPreview;
    }

    const instanceIds = await orthancGetSeriesInstanceIds(
      orthancRestRoot,
      seriesId,
      authHeaders,
      signal
    );
    for (const instanceId of instanceIds.slice(0, 3)) {
      if (signal?.aborted) {
        return null;
      }
      const instancePreview = await fetchImageBlob(
        `${base}/instances/${encodeURIComponent(instanceId)}/preview`,
        authHeaders,
        signal
      );
      if (instancePreview) {
        return instancePreview;
      }
      const instanceRendered = await fetchImageBlob(
        `${base}/instances/${encodeURIComponent(instanceId)}/rendered`,
        authHeaders,
        signal
      );
      if (instanceRendered) {
        return instanceRendered;
      }
    }
  }

  if (studyUid && wadoRoot) {
    let sop = await dicomWebFetchFirstSopInstanceUid(
      wadoRoot,
      studyUid,
      seriesUid,
      authHeaders,
      signal
    );
    if (!sop && seriesId) {
      const instanceIds = await orthancGetSeriesInstanceIds(
        orthancRestRoot,
        seriesId,
        authHeaders,
        signal
      );
      if (instanceIds[0]) {
        const tagsRes = await fetch(
          `${base}/instances/${encodeURIComponent(instanceIds[0])}/simplified-tags`,
          {
            method: 'GET',
            signal,
            credentials: 'include',
            headers: mergeHeaders(authHeaders, { Accept: 'application/json' }),
          }
        );
        if (tagsRes.ok) {
          const tags = (await tagsRes.json()) as Record<string, string>;
          sop = tags.SOPInstanceUID || tags['0008,0018'] || null;
        }
      }
    }
    if (sop) {
      const rendered = await dicomWebFetchRenderedInstanceBlob(
        wadoRoot,
        studyUid,
        seriesUid,
        sop,
        authHeaders,
        signal
      );
      if (rendered) {
        return rendered;
      }
    }

    const wadoBase = resolveDicomWebUrl(wadoRoot);
    const seriesRendered = await fetchImageBlob(
      `${wadoBase}/studies/${encodeURIComponent(studyUid)}/series/${encodeURIComponent(seriesUid)}/rendered?accept=image/jpeg`,
      authHeaders,
      signal
    );
    if (seriesRendered) {
      return seriesRendered;
    }
  }

  return null;
}

/** Resolve Orthanc internal series ID from DICOM SeriesInstanceUID. */
export async function orthancFindSeriesId(
  orthancRestRoot: string,
  seriesInstanceUid: string,
  authHeaders: Record<string, string>,
  signal?: AbortSignal,
  studyInstanceUid?: string
): Promise<string | null> {
  const query: Record<string, string> = { SeriesInstanceUID: seriesInstanceUid };
  const study = studyInstanceUid?.trim();
  if (study) {
    query.StudyInstanceUID = study;
  }
  const ids = await orthancFindResourceIds(
    orthancRestRoot,
    'Series',
    query,
    authHeaders,
    signal
  );
  return ids[0] ?? null;
}

/** Remove internal placeholder series (after user uploads real DICOM). */
export async function orthancDeleteVigilStudyAnchorSeries(
  orthancRestRoot: string,
  studyInstanceUid: string,
  authHeaders: Record<string, string>,
  signal?: AbortSignal
): Promise<void> {
  const studyUid = studyInstanceUid?.trim();
  if (!studyUid) {
    return;
  }
  const seriesIds = await orthancFindResourceIds(
    orthancRestRoot,
    'Series',
    { StudyInstanceUID: studyUid },
    authHeaders,
    signal
  );
  const base = resolveOrthancApiUrl(orthancRestRoot);
  for (const seriesId of seriesIds) {
    if (signal?.aborted) {
      return;
    }
    const res = await fetch(`${base}/series/${encodeURIComponent(seriesId)}`, {
      method: 'GET',
      signal,
      credentials: 'include',
      headers: mergeHeaders(authHeaders, { Accept: 'application/json' }),
    });
    if (!res.ok) {
      continue;
    }
    const data = (await res.json()) as { MainDicomTags?: { SeriesDescription?: string } };
    if (data.MainDicomTags?.SeriesDescription === VIGIL_STUDY_ANCHOR_SERIES_DESCRIPTION) {
      await orthancDeleteSeries(orthancRestRoot, seriesId, authHeaders, signal);
    }
  }
}

async function orthancUploadStudyAnchor(
  orthancRestRoot: string,
  context: StudyUploadContext,
  authHeaders: Record<string, string>,
  signal?: AbortSignal
): Promise<void> {
  const buffer = buildStudyAnchorDicomBuffer(context);
  await orthancUploadInstanceToStudy(orthancRestRoot, '', buffer, authHeaders, {
    expectedStudyInstanceUid: context.studyInstanceUid,
    signal,
  });
}

/**
 * Delete one series by DICOM SeriesInstanceUID.
 * If it was the last series, re-create a minimal study shell so the case row stays in the list.
 */
export async function orthancDeleteSeriesBySeriesInstanceUid(
  orthancRestRoot: string,
  seriesInstanceUid: string,
  authHeaders: Record<string, string>,
  signal?: AbortSignal,
  options?: {
    studyInstanceUid?: string;
    studyAnchorContext?: StudyUploadContext;
  }
): Promise<{ wasLastSeriesInStudy: boolean }> {
  const studyUid = options?.studyInstanceUid?.trim();
  let seriesInStudy = 0;
  if (studyUid) {
    const allSeries = await orthancFindResourceIds(
      orthancRestRoot,
      'Series',
      { StudyInstanceUID: studyUid },
      authHeaders,
      signal
    );
    seriesInStudy = allSeries.length;
  }

  const seriesId = await orthancFindSeriesId(
    orthancRestRoot,
    seriesInstanceUid,
    authHeaders,
    signal,
    studyUid
  );
  if (!seriesId) {
    throw new Error('لم يُعثر على السلسلة على الخادم.');
  }

  const wasLastSeriesInStudy = studyUid ? seriesInStudy <= 1 : false;

  await orthancDeleteSeries(orthancRestRoot, seriesId, authHeaders, signal);

  if (wasLastSeriesInStudy && options?.studyAnchorContext) {
    await orthancUploadStudyAnchor(orthancRestRoot, options.studyAnchorContext, authHeaders, signal);
  }

  return { wasLastSeriesInStudy };
}

/** Orthanc REST: delete one series (and its instances). */
export async function orthancDeleteSeries(
  orthancRestRoot: string,
  orthancSeriesId: string,
  authHeaders: Record<string, string>,
  signal?: AbortSignal
): Promise<void> {
  const base = resolveOrthancApiUrl(orthancRestRoot);
  const res = await fetch(`${base}/series/${encodeURIComponent(orthancSeriesId)}`, {
    method: 'DELETE',
    signal,
    credentials: 'include',
    headers: mergeHeaders(authHeaders, { Accept: 'application/json' }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(
      `Orthanc delete series failed: ${res.status}${detail ? ` — ${detail.slice(0, 200)}` : ''}`
    );
  }
}

async function orthancBulkDeleteResources(
  orthancRestRoot: string,
  resourceIds: string[],
  authHeaders: Record<string, string>,
  signal?: AbortSignal
): Promise<void> {
  if (!resourceIds.length) {
    return;
  }
  const base = resolveOrthancApiUrl(orthancRestRoot);
  const res = await fetch(`${base}/tools/bulk-delete`, {
    method: 'POST',
    signal,
    credentials: 'include',
    headers: mergeHeaders(authHeaders, {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: JSON.stringify(resourceIds),
  });
  if (res.ok) {
    return;
  }
  for (const id of resourceIds) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    const del = await fetch(`${base}/instances/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      signal,
      credentials: 'include',
      headers: mergeHeaders(authHeaders, { Accept: 'application/json' }),
    });
    if (!del.ok && del.status !== 404) {
      const detail = await del.text().catch(() => '');
      throw new Error(
        `Orthanc delete instance failed: ${del.status}${detail ? ` — ${detail.slice(0, 200)}` : ''}`
      );
    }
  }
}

/**
 * Remove all instances (and leftover series) from a study before replace-upload.
 * Orthanc often omits `Instances` on `GET /studies/{id}` — instances are listed per series.
 */
export async function orthancClearStudyInstances(
  orthancRestRoot: string,
  orthancStudyId: string | null,
  authHeaders: Record<string, string>,
  signal?: AbortSignal,
  studyInstanceUid?: string
): Promise<void> {
  const instanceIds = new Set<string>();
  const uid = studyInstanceUid?.trim();

  if (orthancStudyId) {
    const legacyInstanceIds = await orthancGetStudyChildIds(
      orthancRestRoot,
      orthancStudyId,
      'Instances',
      authHeaders,
      signal
    );
    legacyInstanceIds.forEach(id => instanceIds.add(id));

    const seriesIds = await orthancGetStudyChildIds(
      orthancRestRoot,
      orthancStudyId,
      'Series',
      authHeaders,
      signal
    );
    for (const seriesId of seriesIds) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      const ids = await orthancGetSeriesInstanceIds(
        orthancRestRoot,
        seriesId,
        authHeaders,
        signal
      );
      ids.forEach(id => instanceIds.add(id));
    }
  }

  if (uid) {
    const found = await orthancFindResourceIds(
      orthancRestRoot,
      'Instance',
      { StudyInstanceUID: uid },
      authHeaders,
      signal
    );
    found.forEach(id => instanceIds.add(id));
  }

  await orthancBulkDeleteResources(orthancRestRoot, [...instanceIds], authHeaders, signal);

  if (orthancStudyId) {
    const seriesAfter = await orthancGetStudyChildIds(
      orthancRestRoot,
      orthancStudyId,
      'Series',
      authHeaders,
      signal
    );
    for (const seriesId of seriesAfter) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      await orthancDeleteSeries(orthancRestRoot, seriesId, authHeaders, signal);
    }
  } else if (uid) {
    const seriesIds = await orthancFindResourceIds(
      orthancRestRoot,
      'Series',
      { StudyInstanceUID: uid },
      authHeaders,
      signal
    );
    for (const seriesId of seriesIds) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      await orthancDeleteSeries(orthancRestRoot, seriesId, authHeaders, signal);
    }
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

export type OrthancMainDicomTags = {
  StudyInstanceUID?: string;
  PatientID?: string;
  PatientName?: string;
  AccessionNumber?: string;
  StudyDescription?: string;
  StudyDate?: string;
  StudyTime?: string;
};

export async function orthancGetStudyMainTags(
  orthancRestRoot: string,
  orthancStudyId: string,
  authHeaders: Record<string, string>,
  signal?: AbortSignal
): Promise<OrthancMainDicomTags> {
  const base = resolveOrthancApiUrl(orthancRestRoot);
  const res = await fetch(`${base}/studies/${encodeURIComponent(orthancStudyId)}`, {
    method: 'GET',
    signal,
    credentials: 'include',
    headers: mergeHeaders(authHeaders, { Accept: 'application/json' }),
  });
  if (!res.ok) {
    throw new Error(`Orthanc get study failed: ${res.status}`);
  }
  const data = (await res.json()) as { MainDicomTags?: OrthancMainDicomTags };
  return data.MainDicomTags || {};
}

type OrthancStoredInstance = {
  ID?: string;
  ParentStudy?: string;
  Status?: string;
};

function parseOrthancStoreResponse(body: unknown): OrthancStoredInstance[] {
  if (Array.isArray(body)) {
    return body.filter((x): x is OrthancStoredInstance => x && typeof x === 'object');
  }
  if (body && typeof body === 'object') {
    return [body as OrthancStoredInstance];
  }
  return [];
}

async function orthancGetInstanceStudyInstanceUID(
  orthancRestRoot: string,
  instanceId: string,
  authHeaders: Record<string, string>,
  signal?: AbortSignal
): Promise<string | null> {
  const base = resolveOrthancApiUrl(orthancRestRoot);
  const res = await fetch(`${base}/instances/${encodeURIComponent(instanceId)}/simplified-tags`, {
    method: 'GET',
    signal,
    credentials: 'include',
    headers: mergeHeaders(authHeaders, { Accept: 'application/json' }),
  });
  if (!res.ok) {
    return null;
  }
  const tags = (await res.json()) as Record<string, string>;
  const uid = tags.StudyInstanceUID || tags['0020,000D'];
  return uid ? String(uid).trim() : null;
}

async function verifyInstancesBelongToStudy(
  orthancRestRoot: string,
  orthancStudyId: string,
  stored: OrthancStoredInstance[],
  expectedStudyInstanceUid: string,
  authHeaders: Record<string, string>,
  signal?: AbortSignal
): Promise<void> {
  const expected = expectedStudyInstanceUid.trim();
  for (const row of stored) {
    if (!row.ID) {
      continue;
    }
    const uid = await orthancGetInstanceStudyInstanceUID(
      orthancRestRoot,
      row.ID,
      authHeaders,
      signal
    );
    if (uid) {
      if (uid !== expected) {
        throw new Error(
          `تم رفع الملف لكن StudyInstanceUID على الخادم (${uid}) لا يطابق الدراسة المفتوحة.`
        );
      }
      continue;
    }
    if (
      orthancStudyId &&
      row.ParentStudy &&
      row.ParentStudy !== orthancStudyId
    ) {
      throw new Error('تم رفع الملف لكنه أُضيف لدراسة أخرى. حاول مرة أخرى أو تحقق من ملف DICOM.');
    }
  }
}

/**
 * Store a DICOM instance via Orthanc REST `POST /instances` (same as manual upload in Explorer).
 */
export function orthancUploadInstanceToStudy(
  orthancRestRoot: string,
  orthancStudyId: string,
  dicomBuffer: ArrayBuffer,
  authHeaders: Record<string, string>,
  options?: {
    expectedStudyInstanceUid?: string;
    signal?: AbortSignal;
    onProgress?: (percent: number) => void;
  }
): Promise<void> {
  const base = resolveOrthancApiUrl(orthancRestRoot);
  const url = `${base}/instances`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.responseType = 'json';
    xhr.withCredentials = true;

    const headers = mergeHeaders(authHeaders, {
      Accept: 'application/json',
      'Content-Type': 'application/dicom',
    });
    for (const [k, v] of Object.entries(headers)) {
      xhr.setRequestHeader(k, v);
    }

    const signal = options?.signal;
    const onAbort = () => {
      xhr.abort();
      reject(new DOMException('Aborted', 'AbortError'));
    };
    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener('abort', onAbort);

    xhr.upload.onprogress = evt => {
      if (evt.lengthComputable && options?.onProgress) {
        options.onProgress(Math.round((100 * evt.loaded) / evt.total));
      }
    };

    xhr.onload = () => {
      signal?.removeEventListener('abort', onAbort);
      if (xhr.status >= 200 && xhr.status < 300) {
        const stored = parseOrthancStoreResponse(xhr.response);
        const expectedUid = options?.expectedStudyInstanceUid?.trim();
        if (expectedUid && stored.some(r => r.ID)) {
          void verifyInstancesBelongToStudy(
            orthancRestRoot,
            orthancStudyId,
            stored,
            expectedUid,
            authHeaders,
            signal
          )
            .then(() => resolve())
            .catch(reject);
          return;
        }
        const parentStudy = stored.find(r => r.ParentStudy)?.ParentStudy;
        if (parentStudy && parentStudy !== orthancStudyId) {
          reject(
            new Error(
              'تم رفع الملف لكنه أُضيف لدراسة أخرى. حاول مرة أخرى أو تحقق من ملف DICOM.'
            )
          );
          return;
        }
        resolve();
        return;
      }
      let detail = xhr.statusText;
      if (typeof xhr.response === 'string') {
        detail = xhr.response;
      } else if (xhr.response && typeof xhr.response === 'object') {
        const err = xhr.response as { Message?: string; Details?: string };
        detail = err.Message || err.Details || detail;
      }
      reject(
        new Error(
          `Orthanc upload instance failed: ${xhr.status}${detail ? ` — ${String(detail).slice(0, 200)}` : ''}`
        )
      );
    };

    xhr.onerror = () => {
      signal?.removeEventListener('abort', onAbort);
      reject(new Error('Orthanc upload instance failed: network error'));
    };

    xhr.onabort = () => {
      signal?.removeEventListener('abort', onAbort);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    xhr.send(dicomBuffer);
  });
}
