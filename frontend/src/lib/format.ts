export function formatVND(n: number): string {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(n) + ' vnđ';
}

export function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(ts));
}

/** A soft radial gradient used as a watch thumbnail (no product photos here). */
export function watchGradient(metal: string, dial: string): string {
  return `radial-gradient(circle at 32% 28%, ${metal} 0%, ${dial} 78%)`;
}
