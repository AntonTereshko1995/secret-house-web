export function normalizePhone(raw: string): string {
  const cleaned = raw.trim().replace(/[\s\-()]/g, '')
  const digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned

  // 375XXXXXXXXX or +375XXXXXXXXX → +375XXXXXXXXX
  if (/^375\d{9}$/.test(digits)) return `+${digits}`

  // 80XXXXXXXXX (Belarus local trunk prefix) → +375XXXXXXXXX
  if (/^80\d{9}$/.test(digits)) return `+375${digits.slice(2)}`

  // 9-digit starting with mobile code 29/25/33/44 → +375XXXXXXXXX
  if (/^(29|25|33|44)\d{7}$/.test(digits)) return `+375${digits}`

  return cleaned
}
