export type TableDensity =
  | 'ultra-compact'
  | 'extra-compact'
  | 'compact'
  | 'normal'
  | 'comfortable';

export type DisplayMode = 'table' | 'card';

export interface ScreenSettings {
  ItemsPerPage?: number;
  ColumnVisibility?: Record<string, boolean>;
  TableDensity?: TableDensity;
  DisplayMode?: DisplayMode;
}
