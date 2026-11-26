import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAdminToken,
  clearAdminToken,
  adminGetReviews,
  adminSetReviewPublished,
  type AdminReviewDTO,
  type AdminReviewPublishedFilter,
} from '../services/adminApi'
import { logger } from '../services/logger'

const PAGE_SIZE = 50

const FILTER_TABS: { id: AdminReviewPublishedFilter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'true', label: 'Опубликованные' },
  { id: 'false', label: 'Не опубликованные' },
]

const RATING_LABELS = [
  'Ожидания',
  'Комфорт',
  'Чистота',
  'Общение',
  'Расположение',
  'Рекомендация',
] as const

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function promoStatusLabel(status: AdminReviewDTO['rewardPromoStatus']): string {
  if (status === 'active') return 'активен'
  if (status === 'used') return 'использован'
  if (status === 'expired') return 'истёк'
  return '—'
}

function ReviewCard({
  review,
  busy,
  onToggle,
}: {
  review: AdminReviewDTO
  busy: boolean
  onToggle: (review: AdminReviewDTO) => void
}) {
  const ratings = [
    review.ratingExpectations,
    review.ratingComfort,
    review.ratingCleanliness,
    review.ratingCommunication,
    review.ratingLocation,
    review.ratingRecommendation,
  ]

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {review.contact ?? '—'}
            {review.bookingId !== null && (
              <span className="text-zinc-600 font-normal ml-2">#{review.bookingId}</span>
            )}
          </p>
          <p className="text-zinc-500 text-xs mt-0.5">
            {formatDatetime(review.submittedAt)}
            {review.bookingPublicId && (
              <span className="text-zinc-600"> · бронь {review.bookingPublicId}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-yellow-500 font-bold text-sm">{review.avgRating.toFixed(1)} / 10</span>
          <span className={[
            'text-xs px-2 py-0.5 rounded-full border whitespace-nowrap',
            review.isPublished
              ? 'border-green-500/40 text-green-400'
              : 'border-zinc-600 text-zinc-500',
          ].join(' ')}>
            {review.isPublished ? 'Опубликован' : 'Скрыт'}
          </span>
        </div>
      </div>

      {/* 6 ratings */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-3">
        {RATING_LABELS.map((label, i) => (
          <div key={label} className="bg-black/40 border border-zinc-800 rounded-lg px-2 py-1.5">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider truncate">{label}</p>
            <p className="text-zinc-200 text-sm font-semibold">{ratings[i]}</p>
          </div>
        ))}
      </div>

      {/* 3 answers */}
      <div className="space-y-2 mb-3 text-sm">
        <div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Понравилось</p>
          <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{review.likedMost}</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Улучшить</p>
          <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{review.improvement}</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Публичный отзыв</p>
          <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{review.publicReview}</p>
        </div>
      </div>

      {/* Promo */}
      {review.rewardPromoCode && (
        <div className="flex items-center gap-2 text-xs mb-3">
          <span className="font-mono font-bold text-amber-400 uppercase tracking-widest">
            {review.rewardPromoCode}
          </span>
          <span className={[
            'px-2 py-0.5 rounded-full border',
            review.rewardPromoStatus === 'active'
              ? 'border-green-500/40 text-green-400'
              : review.rewardPromoStatus === 'used'
                ? 'border-zinc-600 text-zinc-500'
                : 'border-red-500/40 text-red-400',
          ].join(' ')}>
            {promoStatusLabel(review.rewardPromoStatus)}
          </span>
        </div>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={() => onToggle(review)}
        className={[
          'px-4 py-2 rounded-lg border text-sm font-semibold transition-all disabled:opacity-50',
          review.isPublished
            ? 'border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
            : 'border-amber-500/50 text-amber-400 hover:border-amber-400 hover:bg-amber-500/10',
        ].join(' ')}
      >
        {review.isPublished ? 'Скрыть' : 'Опубликовать'}
      </button>
    </div>
  )
}

export default function AdminReviewsPage() {
  const navigate = useNavigate()

  const [reviews, setReviews] = useState<AdminReviewDTO[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<AdminReviewPublishedFilter>('all')
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const handleUnauthorized = useCallback(() => {
    clearAdminToken()
    navigate('/admin')
  }, [navigate])

  useEffect(() => {
    if (!getAdminToken()) navigate('/admin')
  }, [navigate])

  const loadReviews = useCallback(async (pageOverride?: number) => {
    setLoading(true)
    setListError(null)
    const currentPage = pageOverride ?? page
    try {
      const result = await adminGetReviews(filter, currentPage, PAGE_SIZE)
      setReviews(result.items)
      setTotal(result.total)
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        handleUnauthorized()
      } else {
        const message = err instanceof Error ? err.message : 'Ошибка загрузки'
        logger.error('admin_reviews_load_error', { error_message: message })
        setListError(message)
      }
    } finally {
      setLoading(false)
    }
  }, [filter, page, handleUnauthorized])

  useEffect(() => { setPage(1) }, [filter])

  useEffect(() => { loadReviews() }, [loadReviews])

  const handleToggle = async (review: AdminReviewDTO) => {
    setBusyId(review.reviewId)
    try {
      await adminSetReviewPublished(review.reviewId, !review.isPublished)
      await loadReviews()
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        handleUnauthorized()
      } else {
        const message = err instanceof Error ? err.message : 'Ошибка обновления'
        logger.error('admin_review_toggle_error', { reviewId: review.reviewId, error_message: message })
        setListError(message)
      }
    } finally {
      setBusyId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="min-h-screen bg-luxury-gradient text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => navigate('/admin')}
              className="text-zinc-500 hover:text-zinc-300 text-xs uppercase tracking-wider
                transition-colors mb-2 flex items-center gap-1">
              ← Бронирования
            </button>
            <div className="w-10 h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent mb-2" />
            <h1 className="text-xl font-bold text-yellow-600 uppercase tracking-widest">
              Отзывы
            </h1>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={[
                'text-xs px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap',
                filter === tab.id
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                  : 'bg-transparent border-zinc-700 text-zinc-500 hover:border-zinc-500',
              ].join(' ')}>
              {tab.label}
            </button>
          ))}
        </div>

        {!loading && !listError && total > 0 && (
          <p className="mb-3 text-zinc-600 text-xs uppercase tracking-widest">
            Всего: {total} · страница {page} из {totalPages}
          </p>
        )}

        {listError && (
          <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 mb-4">
            <p className="text-red-400 text-sm text-center">{listError}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-3 py-16 text-zinc-500">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-sm">Загружаем отзывы…</span>
          </div>
        )}

        {!loading && !listError && reviews.length === 0 && (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-sm">Отзывов не найдено</p>
          </div>
        )}

        {!loading && reviews.length > 0 && (
          <>
            <div className="space-y-3">
              {reviews.map(review => (
                <ReviewCard
                  key={review.reviewId}
                  review={review}
                  busy={busyId === review.reviewId}
                  onToggle={handleToggle}
                />
              ))}
            </div>

            {total > PAGE_SIZE && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => { const p = page - 1; setPage(p); loadReviews(p) }}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white
                    hover:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-all">
                  ← Назад
                </button>
                <span className="text-zinc-500 text-sm">{page} / {totalPages}</span>
                <button
                  onClick={() => { const p = page + 1; setPage(p); loadReviews(p) }}
                  disabled={page >= totalPages}
                  className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white
                    hover:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-all">
                  Вперёд →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
