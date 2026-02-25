/**
 * Parse popup content that may contain text and an image separated by a marker.
 * Format: "text content\n---IMAGE---\nbase64-or-url"
 */
export function parsePopupContent(content: string): { text: string; image: string | null } {
  const separator = '\n---IMAGE---\n';
  const idx = content.indexOf(separator);
  if (idx === -1) return { text: content, image: null };
  return { text: content.slice(0, idx), image: content.slice(idx + separator.length) };
}

/**
 * Format a number with Korean locale (comma-separated) + 원 suffix.
 */
export function formatPrice(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '-';
  const num = typeof val === 'number' ? val : Number(String(val).replace(/,/g, ''));
  if (!num || isNaN(num)) return '-';
  return `${num.toLocaleString('ko-KR')}원`;
}
