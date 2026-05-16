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

/** Remove all instances from a study (keeps study shell; used before manual image replace). */
export async function orthancClearStudyInstances(
  orthancRestRoot: string,
  orthancStudyId: string,
  authHeaders: Record<string, string>,
  signal?: AbortSignal
): Promise<void> {
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
  const data = (await res.json()) as { Instances?: unknown };
  const instanceIds = Array.isArray(data.Instances)
    ? data.Instances.filter((id): id is string => typeof id === 'string')
    : [];
  for (const instanceId of instanceIds) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    await orthancDeleteInstance(orthancRestRoot, instanceId, authHeaders, signal);
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
    if (row.ParentStudy && row.ParentStudy !== orthancStudyId) {
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
