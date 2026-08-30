export interface BookingStatusFields {
  isCanceled: boolean
  isDone: boolean
  isPrepaymented: boolean
  isFuture: boolean
}

export interface StatusBadgeInfo {
  label: string
  className: string
}

export function getBookingStatusBadge(b: BookingStatusFields): StatusBadgeInfo {
  if (b.isCanceled) return { label: 'Отменено',             className: 'bg-red-900/40 text-red-400 border-red-700/40' }
  if (b.isDone)     return { label: 'Прошедшее',            className: 'bg-zinc-800 text-zinc-500 border-zinc-700' }
  if (!b.isPrepaymented) return { label: 'Ждёт подтверждения', className: 'bg-yellow-900/40 text-yellow-400 border-yellow-700/40' }
  if (b.isFuture)   return { label: 'Предстоит',            className: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40' }
  return                   { label: 'Прошедшее',            className: 'bg-zinc-800 text-zinc-500 border-zinc-700' }
}
