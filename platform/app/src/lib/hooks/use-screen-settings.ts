import * as React from 'react';

import type { DisplayMode, ScreenSettings, TableDensity } from '@/lib/types/screen-settings';

const STORAGE_PREFIX = 'ctr-screen-settings:';

function readSettings(route: string): ScreenSettings {
  if (typeof window === 'undefined' || route === '__disabled__') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${route}`);
    return raw ? (JSON.parse(raw) as ScreenSettings) : {};
  } catch {
    return {};
  }
}

export function useScreenSettings(route: string) {
  const [settings, setSettings] = React.useState<ScreenSettings>(() => readSettings(route));

  React.useEffect(() => {
    setSettings(readSettings(route));
  }, [route]);

  const updateSettings = React.useCallback(
    (patch: ScreenSettings) => {
      setSettings(current => {
        const next = { ...current, ...patch };

        if (typeof window !== 'undefined' && route !== '__disabled__') {
          window.localStorage.setItem(`${STORAGE_PREFIX}${route}`, JSON.stringify(next));
        }

        return next;
      });
    },
    [route]
  );

  return {
    settings,
    updateItemsPerPage: (ItemsPerPage: number) => updateSettings({ ItemsPerPage }),
    updateColumnVisibility: (ColumnVisibility: Record<string, boolean>) =>
      updateSettings({ ColumnVisibility }),
    updateTableDensity: (TableDensity: TableDensity) => updateSettings({ TableDensity }),
    updateDisplayMode: (DisplayMode: DisplayMode) => updateSettings({ DisplayMode }),
  };
}
