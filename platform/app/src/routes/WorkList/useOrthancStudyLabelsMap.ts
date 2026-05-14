import { useEffect, useMemo, useState } from 'react';
import { useSystem } from '@ohif/core';

import {
  authorizationHeaderFromUserAuth,
  getOrthancRestRootFromDataSource,
  orthancFindStudyId,
  orthancGetStudyLabels,
} from '../../lib/orthanc-study-labels';

const CONCURRENCY = 5;

async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  if (items.length === 0) {
    return;
  }
  let next = 0;
  const worker = async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) {
        break;
      }
      await fn(items[i]);
    }
  };
  const n = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: n }, () => worker()));
}

export function useOrthancStudyLabelsMap(
  studyInstanceUids: string[],
  dataSource: unknown
): { labelsByStudyUid: Record<string, string[]>; labelsLoading: boolean } {
  const { servicesManager } = useSystem();
  const [labelsByStudyUid, setLabelsByStudyUid] = useState<Record<string, string[]>>({});
  const [labelsLoading, setLabelsLoading] = useState(false);

  const orthancRestRoot = useMemo(() => getOrthancRestRootFromDataSource(dataSource), [dataSource]);

  const uidKey = useMemo(() => {
    const u = [...new Set(studyInstanceUids.filter(Boolean))].sort();
    return u.join('|');
  }, [studyInstanceUids]);

  useEffect(() => {
    if (!orthancRestRoot || !uidKey) {
      setLabelsByStudyUid({});
      setLabelsLoading(false);
      return;
    }
    const uids = uidKey.split('|').filter(Boolean);
    let cancelled = false;
    setLabelsLoading(true);
    const auth = authorizationHeaderFromUserAuth(
      servicesManager.services.userAuthenticationService
    );
    const acc: Record<string, string[]> = {};
    (async () => {
      await mapWithConcurrency(uids, CONCURRENCY, async uid => {
        if (cancelled) {
          return;
        }
        try {
          const oid = await orthancFindStudyId(orthancRestRoot, uid, auth);
          if (!oid) {
            acc[uid] = [];
            return;
          }
          acc[uid] = await orthancGetStudyLabels(orthancRestRoot, oid, auth);
        } catch {
          acc[uid] = [];
        }
      });
      if (!cancelled) {
        setLabelsByStudyUid({ ...acc });
        setLabelsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orthancRestRoot, uidKey, servicesManager]);

  return { labelsByStudyUid, labelsLoading };
}
