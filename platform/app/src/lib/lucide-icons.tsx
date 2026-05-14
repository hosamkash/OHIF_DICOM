import * as React from 'react';
import { icons } from 'lucide-react';

type IconProps = React.SVGProps<SVGSVGElement>;
type IconComponent = React.ComponentType<IconProps>;

const FallbackIcon: IconComponent = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
  </svg>
);

export function getLucideIcon(name: string, fallbackName?: string): IconComponent {
  const iconMap = icons as Record<string, IconComponent | undefined>;
  return iconMap[name] ?? (fallbackName ? iconMap[fallbackName] : undefined) ?? FallbackIcon;
}
