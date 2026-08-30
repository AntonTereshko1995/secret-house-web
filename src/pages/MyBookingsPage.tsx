import { useState, useEffect, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { searchMyBookings } from '../services/api'
import { logger } from '../services/logger'
import type { BookingDetailDTO } from '../types/booking.types'
import { TARIFF_OPTIONS } from '../utils/booking'
import { getBookingStatusBadge } from '../lib/bookingStatus'

type ContactType = 'telegram' | 'phone'

function getStatusBadge(booking: BookingDetailDTO) {
  return getBookingStatusBadge(booking)
}

function formatDatetime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getTariffName(tariffId: string): string {
  return TARIFF_OPTIONS.find(t => t.id === tariffId)?.name ?? tariffId
}

function detectContactType(contact: string): ContactType {
  return contact.startsWith('@') ? 'telegram' : 'phone'
}

export default function MyBookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlContact = searchParams.get('contact') ?? ''

  const [contactType, setContactType] = useState<ContactType>(
    urlContact ? detectContactType(urlContact) : 'telegram',
  )
  const [contactValue, setContactValue] = useState(
    urlContact.startsWith('@') ? urlContact.slice(1) : urlContact,
  )
  const [bookings, setBookings] = useState<BookingDetailDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const runSearch = async (contact: string) => {
    setLoading(true)
    setError(null)
    logger.info('my_bookings_search', { contactType: contact.startsWith('@') ? 'telegram' : 'phone' })
    try {
      const result = await searchMyBookings(contact)
      setBookings(result)
      setSearched(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить бронирования'
      logger.error('my_bookings_search_error', { error_message: message })
      setError(message)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  // Auto-search when URL already has a contact (e.g. after browser back)
  useEffect(() => {
    if (urlContact) {
      runSearch(urlContact)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    if (!contactValue.trim()) return

    const contact =
      contactType === 'telegram'
        ? contactValue.startsWith('@')
          ? contactValue.trim()
          : `@${contactValue.trim()}`
        : contactValue.trim()

    setSearchParams({ contact }, { replace: true })
    await runSearch(contact)
  }

  return (
    <div className="min-h-screen bg-luxury-gradient text-white">
      {/* Back link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-sm transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          На главную
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-12">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-yellow-600 mb-2 uppercase tracking-widest">
            Мои бронирования
          </h1>
          <p className="text-gray-400 text-sm">
            Введите ваш контакт, чтобы найти все бронирования
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-6">
          {/* Contact type toggle */}
          <div className="flex gap-3 mb-4">
            <button
              type="button"
              onClick={() => setContactType('telegram')}
              className={[
                'flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-all',
                contactType === 'telegram'
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-400'
                  : 'bg-transparent border-zinc-700 text-zinc-500 hover:border-zinc-500',
              ].join(' ')}
            >
              Telegram
            </button>
            <button
              type="button"
              onClick={() => setContactType('phone')}
              className={[
                'flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-all',
                contactType === 'phone'
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-400'
                  : 'bg-transparent border-zinc-700 text-zinc-500 hover:border-zinc-500',
              ].join(' ')}
            >
              Телефон
            </button>
          </div>

          {/* Input */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              {contactType === 'telegram' && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
              )}
              <input
                type={contactType === 'phone' ? 'tel' : 'text'}
                value={contactValue}
                onChange={e => setContactValue(e.target.value)}
                placeholder={contactType === 'telegram' ? 'username' : '+375XXXXXXXXX'}
                className={[
                  'w-full bg-black/60 border border-zinc-700 rounded-lg py-2.5 text-white text-sm',
                  'focus:outline-none focus:border-amber-500/60 placeholder-zinc-600',
                  contactType === 'telegram' ? 'pl-7 pr-3' : 'px-3',
                ].join(' ')}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !contactValue.trim()}
              className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-zinc-700 disabled:text-zinc-500
                text-black font-bold py-2.5 px-5 rounded-lg text-sm uppercase tracking-wider
                transition-all whitespace-nowrap"
            >
              {loading ? 'Поиск…' : 'Найти'}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 mb-6 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-12 text-zinc-500">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-sm">Ищем бронирования…</span>
          </div>
        )}

        {/* Results */}
        {!loading && searched && (
          <>
            {bookings.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <p className="text-sm">Бронирований по этому контакту не найдено</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">
                  Найдено бронирований: {bookings.length}
                </p>
                {bookings.map(booking => {
                  const badge = getStatusBadge(booking)
                  return (
                    <Link
                      key={booking.bookingId}
                      to={`/my-bookings/${booking.publicId}`}
                      className="block bg-zinc-900 border border-zinc-700 hover:border-zinc-500
                        rounded-xl p-4 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-white font-semibold text-sm group-hover:text-amber-400 transition-colors">
                            {getTariffName(booking.tariff)}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <p className="text-zinc-600 text-[10px] uppercase tracking-wider">Заезд</p>
                          <p className="text-zinc-300 text-xs font-medium">{formatDatetime(booking.startDate)}</p>
                        </div>
                        <div>
                          <p className="text-zinc-600 text-[10px] uppercase tracking-wider">Выезд</p>
                          <p className="text-zinc-300 text-xs font-medium">{formatDatetime(booking.endDate)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-yellow-600 font-bold text-sm">
                          {booking.totalPrice} BYN
                        </p>
                        <span className="text-amber-400 text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                          Подробнее
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
