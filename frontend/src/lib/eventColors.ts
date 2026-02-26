/** Shared event theme color definitions used across all event card UIs */

export const EVENT_CARD_COLORS: Record<string, {
  bg: string; hover: string; title: string; sub: string; badge: string; border: string; iconBg: string; icon: string;
}> = {
  blue:   { bg: 'bg-blue-100',   hover: 'hover:bg-blue-200',   title: 'text-blue-900',   sub: 'text-blue-600',   badge: 'text-blue-700',   border: 'border-blue-200',   iconBg: 'bg-blue-50',   icon: 'text-blue-500' },
  purple: { bg: 'bg-purple-100', hover: 'hover:bg-purple-200', title: 'text-purple-900', sub: 'text-purple-600', badge: 'text-purple-700', border: 'border-purple-200', iconBg: 'bg-purple-50', icon: 'text-purple-500' },
  green:  { bg: 'bg-green-100',  hover: 'hover:bg-green-200',  title: 'text-green-900',  sub: 'text-green-600',  badge: 'text-green-700',  border: 'border-green-200',  iconBg: 'bg-green-50',  icon: 'text-green-500' },
  orange: { bg: 'bg-orange-100', hover: 'hover:bg-orange-200', title: 'text-orange-900', sub: 'text-orange-600', badge: 'text-orange-700', border: 'border-orange-200', iconBg: 'bg-orange-50', icon: 'text-orange-500' },
  red:    { bg: 'bg-red-100',    hover: 'hover:bg-red-200',    title: 'text-red-900',    sub: 'text-red-600',    badge: 'text-red-700',    border: 'border-red-200',    iconBg: 'bg-red-50',    icon: 'text-red-500' },
  pink:   { bg: 'bg-pink-100',   hover: 'hover:bg-pink-200',   title: 'text-pink-900',   sub: 'text-pink-600',   badge: 'text-pink-700',   border: 'border-pink-200',   iconBg: 'bg-pink-50',   icon: 'text-pink-500' },
  teal:   { bg: 'bg-teal-100',   hover: 'hover:bg-teal-200',   title: 'text-teal-900',   sub: 'text-teal-600',   badge: 'text-teal-700',   border: 'border-teal-200',   iconBg: 'bg-teal-50',   icon: 'text-teal-500' },
  indigo: { bg: 'bg-indigo-100', hover: 'hover:bg-indigo-200', title: 'text-indigo-900', sub: 'text-indigo-600', badge: 'text-indigo-700', border: 'border-indigo-200', iconBg: 'bg-indigo-50', icon: 'text-indigo-500' },
};

const DEFAULT_COLOR = EVENT_CARD_COLORS.blue;

export function getEventColor(themeColor?: string) {
  return EVENT_CARD_COLORS[themeColor || 'blue'] || DEFAULT_COLOR;
}
