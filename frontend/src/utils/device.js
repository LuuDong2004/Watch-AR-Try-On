export function detectMobile() {
  if (typeof navigator === 'undefined') return false
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return true
  if (typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches) return true
  return false
}
