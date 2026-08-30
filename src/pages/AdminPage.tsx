import { useState, useEffect, useCallback, type FormEvent } from 'react'
import {
  adminLogin,
  adminGetBookings,
  adminGetBooking,
  adminConfirmBooking,
  adminCancelBooking,
  adminUpdateTariff,
  adminUpdateServices,
  adminRescheduleBooking,
  adminUpdatePrice,
  clearAdminToken,
  getAdminToken,
  type AdminBookingDTO,
} from '../services/adminApi'
import { logger } from '../services/logger'
import { BookingDetailView, type BookingViewData, type BookingViewActions } from '../components/BookingDetailView'
import RescheduleView from '../components/RescheduleView'
import { TARIFF_OPTIONS } from '../utils/booking'
import { getBookingStatusBadge } from '../lib/bookingStatus'

const PAGE_SIZE = 50

// ─── DTO mapper ───────────────────────────────────────────────────────────────

function toViewData(b: AdminBookingDTO): BookingViewData {
  const canAct = !b.isCanceled && !b.isDone
  return {
    ...b,
    canModify: canAct,
    canReschedule: canAct,
    canCancel: canAct,
    canPay: false,
  }
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function getStatusBadge(b: AdminBookingDTO) {
  return getBookingStatusBadge(b)
}

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function getTariffName(tariffId: string): string {
  return TARIFF_OPTIONS.find(t => t.id === tariffId)?.name ?? tariffId
}

// ─── Status filter tabs ───────────────────────────────────────────────────────

const STATUS_TABS = [
  { id: 'all', label: 'Все' },
  { id: 'upcoming', label: 'Предстоящие' },
  { id: 'past', label: 'Прошедшие' },
  { id: 'canceled', label: 'Отменённые' },
  { id: 'done', label: 'Завершённые' },
  { id: 'unpaid', label: 'Ждёт подтверждения' },
]

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(() => getAdminToken() || null)

  // Login
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  // Booking list
  const [bookings, setBookings] = useState<AdminBookingDTO[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = useState('all')

  // Detail
  const [selectedBooking, setSelectedBooking] = useState<AdminBookingDTO | null>(null)
  const [rescheduleMode, setRescheduleMode] = useState(false)

  // ── Auth ──────────────────────────────────────────────────────────────────

  const handleUnauthorized = useCallback(() => {
    clearAdminToken()
    setToken(null)
    setBookings([])
    setTotal(0)
    setPage(1)
    setSelectedBooking(null)
  }, [])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError(null)
    logger.info('admin_login_attempt', { username: loginUsername })
    try {
      const tok = await adminLogin(loginUsername, loginPassword)
      setToken(tok)
      logger.info('admin_login_success', { username: loginUsername })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка входа'
      logger.error('admin_login_error', { username: loginUsername, error_message: message })
      setLoginError(message)
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    logger.info('admin_logout')
    clearAdminToken()
    setToken(null)
    setBookings([])
    setSelectedBooking(null)
  }

  // ── Bookings list ─────────────────────────────────────────────────────────

  const loadBookings = useCallback(async (pageOverride?: number) => {
    setListLoading(true)
    setListError(null)
    const currentPage = pageOverride ?? page
    try {
      const result = await adminGetBookings(sortOrder, statusFilter, currentPage, PAGE_SIZE)
      setBookings(result.items)
      setTotal(result.total)
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        logger.warn('admin_session_expired')
        handleUnauthorized()
      } else {
        const message = err instanceof Error ? err.message : 'Ошибка загрузки'
        logger.error('admin_bookings_load_error', { error_message: message })
        setListError(message)
      }
    } finally {
      setListLoading(false)
    }
  }, [sortOrder, statusFilter, page, handleUnauthorized])

  // Reset page on filter/sort change
  useEffect(() => { setPage(1) }, [sortOrder, statusFilter])

  useEffect(() => { if (token) loadBookings() }, [token, loadBookings])

  // ── Detail reload ─────────────────────────────────────────────────────────

  const reloadSelectedBooking = useCallback(async () => {
    if (!selectedBooking) return
    try {
      const b = await adminGetBooking(selectedBooking.bookingId)
      setSelectedBooking(b)
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') handleUnauthorized()
    }
  }, [selectedBooking, handleUnauthorized])

  // ── Login screen ──────────────────────────────────────────────────────────

  if (!token) {
    return (
      <div className="min-h-screen bg-luxury-gradient flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-yellow-600 uppercase tracking-widest mb-1">Администратор</h1>
            <p className="text-zinc-500 text-sm">Войдите для доступа к панели</p>
          </div>

          <form onSubmit={handleLogin} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">Логин</label>
              <input type="text" value={loginUsername} onChange={e => setLoginUsername(e.target.value)}
                autoComplete="username"
                className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm
                  focus:outline-none focus:border-amber-500/60 placeholder-zinc-600"
                placeholder="admin" />
            </div>
            <div>
              <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">Пароль</label>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm
                  focus:outline-none focus:border-amber-500/60 placeholder-zinc-600"
                placeholder="••••••••" />
            </div>
            {loginError && <p className="text-red-400 text-sm text-center">{loginError}</p>}
            <button type="submit" disabled={loginLoading || !loginUsername.trim() || !loginPassword.trim()}
              className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-zinc-700 disabled:text-zinc-500
                text-black font-bold py-2.5 rounded-lg text-sm uppercase tracking-wider transition-all">
              {loginLoading ? 'Вход…' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Booking detail ────────────────────────────────────────────────────────

  if (selectedBooking) {
    const id = selectedBooking.bookingId
    const tariffName = TARIFF_OPTIONS.find(t => t.id === selectedBooking.tariff)?.name ?? selectedBooking.tariff

    if (rescheduleMode) {
      return (
        <RescheduleView
          booking={selectedBooking}
          tariffName={tariffName}
          isAdmin
          onReschedule={async (ci, co, price) => {
            await adminRescheduleBooking(id, ci, co, price)
            await reloadSelectedBooking()
            setRescheduleMode(false)
          }}
          onBack={() => setRescheduleMode(false)}
        />
      )
    }

    const actions: BookingViewActions = {
      saveTariff: async (tariff, price) => {
        logger.info('admin_update_tariff', { bookingId: id, tariff, price })
        await adminUpdateTariff(id, tariff, price)
      },
      saveServices: async (payload) => {
        logger.info('admin_update_services', { bookingId: id })
        await adminUpdateServices(id, payload)
      },
      reschedule: async (ci, co, price) => {
        logger.info('admin_reschedule', { bookingId: id, checkIn: ci, checkOut: co, price })
        await adminRescheduleBooking(id, ci, co, price)
      },
      cancel: async () => {
        logger.info('admin_cancel_booking', { bookingId: id })
        await adminCancelBooking(id)
      },
      confirm: async () => {
        logger.info('admin_confirm_booking', { bookingId: id })
        await adminConfirmBooking(id)
      },
      savePrice: async (total, prepayment) => {
        logger.info('admin_update_price', { bookingId: id, total, prepayment })
        await adminUpdatePrice(id, total, prepayment)
      },
    }

    return (
      <BookingDetailView
        booking={toViewData(selectedBooking)}
        mode="admin"
        onBack={() => { setSelectedBooking(null); setRescheduleMode(false); loadBookings() }}
        onReload={reloadSelectedBooking}
        actions={actions}
        onReschedule={() => setRescheduleMode(true)}
      />
    )
  }

  // ── Booking list ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-luxury-gradient text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent mb-3" />
            <h1 className="text-xl font-bold text-yellow-600 uppercase tracking-widest">Панель администратора</h1>
          </div>
          <button onClick={handleLogout}
            className="text-zinc-400 hover:text-white text-sm border border-zinc-700 hover:border-zinc-500
              px-3 py-1.5 rounded-lg transition-all">
            Выйти
          </button>
        </div>

        {/* Sort + filter */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <button onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 border
              border-amber-500/30 hover:border-amber-500/60 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap">
            По дате {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_TABS.map(tab => (
              <button key={tab.id} onClick={() => setStatusFilter(tab.id)}
                className={[
                  'text-xs px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap',
                  statusFilter === tab.id
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-400'
                    : 'bg-transparent border-zinc-700 text-zinc-500 hover:border-zinc-500',
                ].join(' ')}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        {!listLoading && !listError && total > 0 && (
          <p className="mt-3 text-zinc-600 text-xs uppercase tracking-widest">
            Всего: {total} · страница {page} из {Math.ceil(total / PAGE_SIZE)}
          </p>
        )}
      </div>

      {/* Error */}
      {listError && (
        <div className="max-w-7xl mx-auto px-4 mb-4">
          <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 text-center">
            <p className="text-red-400 text-sm">{listError}</p>
          </div>
        </div>
      )}

      {/* Spinner */}
      {listLoading && (
        <div className="flex items-center justify-center gap-3 py-16 text-zinc-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm">Загружаем бронирования…</span>
        </div>
      )}

      {/* List */}
      {!listLoading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {bookings.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <p className="text-sm">Бронирований не найдено</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {bookings.map(b => {
                  const badge = getStatusBadge(b)
                  return (
                    <button key={b.bookingId}
                      onClick={() => setSelectedBooking(b)}
                      className="w-full text-left bg-zinc-900 border border-zinc-700 hover:border-zinc-500
                        rounded-xl p-4 transition-all group">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="text-white font-semibold text-sm group-hover:text-amber-400 transition-colors truncate">
                            {getTariffName(b.tariff)}
                            <span className="text-zinc-600 font-normal ml-2">#{b.bookingId}</span>
                          </p>
                          {(b.userContact || b.userName) && (
                            <p className="text-zinc-500 text-xs mt-0.5 truncate">
                              {b.userContact ?? ''}
                              {b.userName && b.userName !== b.userContact ? ` · ${b.userName}` : ''}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap flex-shrink-0 ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-zinc-600 uppercase tracking-wider text-[10px]">Заезд</span>
                          <p className="text-zinc-300 font-medium">{formatDatetime(b.startDate)}</p>
                        </div>
                        <div>
                          <span className="text-zinc-600 uppercase tracking-wider text-[10px]">Выезд</span>
                          <p className="text-zinc-300 font-medium">{formatDatetime(b.endDate)}</p>
                        </div>
                        <div>
                          <span className="text-zinc-600 uppercase tracking-wider text-[10px]">Стоимость</span>
                          <p className="text-yellow-500 font-bold">{b.totalPrice} BYN</p>
                        </div>
                        <div>
                          <span className="text-zinc-600 uppercase tracking-wider text-[10px]">Предоплата</span>
                          <p className="text-zinc-300 font-medium">{b.prepaymentPrice} BYN</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Pagination */}
              {total > PAGE_SIZE && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button onClick={() => { const p = page - 1; setPage(p); loadBookings(p) }}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white
                      hover:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-all">
                    ← Назад
                  </button>
                  <span className="text-zinc-500 text-sm">{page} / {Math.ceil(total / PAGE_SIZE)}</span>
                  <button onClick={() => { const p = page + 1; setPage(p); loadBookings(p) }}
                    disabled={page >= Math.ceil(total / PAGE_SIZE)}
                    className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white
                      hover:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-all">
                    Вперёд →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
