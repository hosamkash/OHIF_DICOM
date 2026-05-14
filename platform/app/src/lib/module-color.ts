const DEFAULT_MODULE_COLOR = '#3b82f6';

export function getModuleColor() {
  if (typeof document === 'undefined') {
    return DEFAULT_MODULE_COLOR;
  }

  const cssColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--primary')
    .trim();

  return cssColor || DEFAULT_MODULE_COLOR;
}
