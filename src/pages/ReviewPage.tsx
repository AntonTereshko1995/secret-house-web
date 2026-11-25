import { useState, useCallback, useEffect, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getBookingDetail, submitReview, ApiError } from '../services/api'
import { logger } from '../services/logger'
import type { BookingDetailDTO } from '../types/booking.types'
import { TARIFF_OPTIONS } from '../utils/booking'
import { formatFullDate } from '../utils/review'

// ─── Questions (exact guest-facing texts from the PRP) ────────────────────────

const RATING_QUESTIONS: { key: RatingKey; label: string }[] = [
  { key: 'ratingExpectations', label: 'Оправдались ли ваши ожидания от отдыха в нашем доме?' },
  { key: 'ratingComfort', label: 'Как бы вы оценили уровень комфорта и удобства пребывания в доме?' },
  { key: 'ratingCleanliness', label: 'Как бы вы оценили чистоту и общую уборку в доме?' },
  { key: 'ratingCommunication', label: 'Как бы вы оценили общение и поддержку от нас как хозяев?' },
  { key: 'ratingLocation', label: 'Как бы вы оценили расположение дома и его окружающую территорию?' },
  { key: 'ratingRecommendation', label: 'Рекомендовали бы вы наш дом своим друзьям?' },
]

const TEXT_QUESTIONS: { key: TextKey; label: string }[] = [
  { key: 'likedMost', label: 'Что вам больше всего понравилось в доме и на его территории?' },
  { key: 'improvement', label: 'Есть ли что-то, что, по вашему мнению, следует улучшить?' },
  { key: 'publicReview', label: 'Напишите, пожалуйста, ваш отзыв, которым мы поделимся с другими гостями.' },
]

type RatingKey =
  | 'ratingExpectations'
  | 'ratingComfort'
  | 'ratingCleanliness'
  | 'ratingCommunication'
  | 'ratingLocation'
  | 'ratingRecommendation'

type TextKey = 'likedMost' | 'improvement' | 'publicReview'

interface ReviewSuccess {
  rewardPromoCode: string
  validUntil: string
}

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ReviewPage() {
  const { publicId } = useParams<{ publicId: string }>()

  const [booking, setBooking] = useState<BookingDetailDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [ratings, setRatings] = useState<Record<RatingKey, string>>({} as Record<RatingKey, string>)
  const [texts, setTexts] = useState<Record<TextKey, string>>({} as Record<TextKey, string>)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<ReviewSuccess | null>(null)
  const [copied, setCopied] = useState(false)

  const loadBooking = useCallback(async () => {
    if (!publicId) return
    setLoading(true)
    try {
      const data = await getBookingDetail(publicId)
      setBooking(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить бронирование'
      logger.error('review_page_load_error', { publicId, error_message: message })
      setLoadError(message)
    } finally {
      setLoading(false)
    }
  }, [publicId])

  useEffect(() => { loadBooking() }, [loadBooking])

  const handleCopy = useCallback(async () => {
    if (!success) return
    const text = success.rewardPromoCode
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [success])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!publicId) return

    // Validate ratings (1..10)
    const missingRatings = RATING_QUESTIONS.filter(q => {
      const v = Number(ratings[q.key])
      return !Number.isInteger(v) || v < 1 || v > 10
    })
    // Validate text answers (non-empty)
    const missingTexts = TEXT_QUESTIONS.filter(q => !texts[q.key]?.trim())

    if (missingRatings.length > 0 || missingTexts.length > 0) {
      setSubmitError('Пожалуйста, ответьте на все вопросы: оценки от 1 до 10 и все текстовые поля.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload = {
        bookingPublicId: publicId,
        ratingExpectations: Number(ratings.ratingExpectations),
        ratingComfort: Number(ratings.ratingComfort),
        ratingCleanliness: Number(ratings.ratingCleanliness),
        ratingCommunication: Number(ratings.ratingCommunication),
        ratingLocation: Number(ratings.ratingLocation),
        ratingRecommendation: Number(ratings.ratingRecommendation),
        likedMost: texts.likedMost.trim(),
        improvement: texts.improvement.trim(),
        publicReview: texts.publicReview.trim(),
      }
      const result = await submitReview(payload)
      setSuccess({
        rewardPromoCode: result.rewardPromoCode.toUpperCase(),
        validUntil: result.validUntil,
      })
      logger.info('review_submitted', { publicId, reviewId: result.reviewId })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось отправить отзыв'
      logger.error('review_page_submit_error', {
        publicId,
        status: err instanceof ApiError ? err.status : undefined,
        error_message: message,
      })
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-gradient flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm">Загружаем бронирование…</span>
        </div>
      </div>
    )
  }

  if (loadError || !booking) {
    return (
      <div className="min-h-screen bg-luxury-gradient flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{loadError ?? 'Бронирование не найдено'}</p>
          <Link to="/my-bookings" className="text-amber-400 hover:text-amber-300 text-sm underline">
            Вернуться к моим бронированиям
          </Link>
        </div>
      </div>
    )
  }

  const tariffName = TARIFF_OPTIONS.find(t => t.id === booking.tariff)?.name ?? booking.tariff

  return (
    <div className="min-h-screen bg-luxury-gradient text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          to={`/my-bookings/${publicId}`}
          className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-sm transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Назад к бронированию
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-yellow-600 mb-2 uppercase tracking-widest">
            Отзыв о бронировании
          </h1>
          <p className="text-gray-400 text-sm">
            {tariffName} · {formatDatetime(booking.startDate)}
          </p>
        </div>

        {success ? (
          <div className="bg-zinc-900 border border-amber-500/40 rounded-xl p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Спасибо за ваш отзыв!</h2>
            <p className="text-gray-400 text-sm mb-6">Ваш промокод на скидку 10%:</p>
            <div className="bg-black/60 border border-zinc-700 rounded-lg px-4 py-3 mb-4">
              <p className="text-amber-300 text-2xl font-bold tracking-widest">
                {success.rewardPromoCode}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className={[
                'w-full flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-semibold transition-all',
                copied
                  ? 'border-emerald-700/50 text-emerald-400'
                  : 'border-zinc-700 hover:border-zinc-500 text-white',
              ].join(' ')}
            >
              {copied ? '✓ Скопировано' : 'Скопировать'}
            </button>
            <p className="text-gray-400 text-xs mt-4 leading-relaxed">
              Промокод именной: действует один раз при бронировании с вашим контактом, до{' '}
              {formatFullDate(success.validUntil)}
            </p>
            <Link
              to={`/my-bookings/${publicId}`}
              className="inline-block mt-6 text-amber-400 hover:text-amber-300 text-sm underline"
            >
              Вернуться к бронированию
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-700 rounded-xl p-5">
            <div className="space-y-6">
              {RATING_QUESTIONS.map((q, i) => (
                <div key={q.key}>
                  <label className="block text-sm text-zinc-300 font-medium mb-2">
                    {i + 1}. {q.label} <span className="text-amber-400">(1–10)</span>
                  </label>
                  <select
                    value={ratings[q.key] ?? ''}
                    onChange={e => setRatings(prev => ({ ...prev, [q.key]: e.target.value }))}
                    className="w-full bg-black/60 border border-zinc-700 rounded-lg py-2.5 px-3 text-white text-sm
                      focus:outline-none focus:border-amber-500/60"
                  >
                    <option value="" disabled>
                      Выберите оценку
                    </option>
                    {Array.from({ length: 10 }, (_, n) => n + 1).map(n => (
                      <option key={n} value={n} className="bg-zinc-900">
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {TEXT_QUESTIONS.map((q, i) => (
                <div key={q.key}>
                  <label className="block text-sm text-zinc-300 font-medium mb-2">
                    {RATING_QUESTIONS.length + i + 1}. {q.label}
                  </label>
                  <textarea
                    value={texts[q.key] ?? ''}
                    onChange={e => setTexts(prev => ({ ...prev, [q.key]: e.target.value }))}
                    rows={3}
                    className="w-full bg-black/60 border border-zinc-700 rounded-lg py-2.5 px-3 text-white text-sm
                      focus:outline-none focus:border-amber-500/60 resize-y"
                  />
                </div>
              ))}
            </div>

            {submitError && (
              <div className="mt-5 bg-red-900/20 border border-red-700/30 rounded-xl p-4 text-center">
                <p className="text-red-400 text-sm">{submitError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-zinc-700 disabled:text-zinc-500
                text-black font-bold py-3 rounded-lg text-sm uppercase tracking-wider transition-all"
            >
              {submitting ? 'Отправляем…' : 'Отправить отзыв'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
