/** Date-only label from ISO string — avoids SSR/client timezone mismatches in Client Components */
export function formatIsoDate(iso: string): string {
  return iso.slice(0, 10);
}
