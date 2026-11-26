import { useEffect, useState } from 'react'
import { getPublicReviews, type PublicReviewItem } from '../../services/api'
import { logger } from '../../services/logger'
import { formatStayMonth, formatAvgRating, formatReviewCount } from '../../utils/publicReviews'

const REVIEWS_LIMIT = 6
/** Long review texts collapse behind «Читать полностью». */
const COLLAPSE_AT = 200

function ReviewCard({ item }: { item: PublicReviewItem }) {
  const [expanded, setExpanded] = useState(false)
  const needsCollapse = item.text.length > COLLAPSE_AT
  const shownText = expanded || !needsCollapse ? item.text : `${item.text.slice(0, COLLAPSE_AT).trimEnd()}…`

  return (
    <article className="shrink-0 w-[280px] sm:w-[320px] bg-luxury-card border border-yellow-600/20 p-5 flex flex-col gap-4">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-yellow-600">{formatAvgRating(item.avgRating)}</span>
        <span className="text-sm text-gray-500">/ 10</span>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed flex-1">{shownText}</p>
      {needsCollapse && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="self-start text-amber-400 hover:text-amber-300 text-sm underline underline-offset-4"
        >
          {expanded ? 'Свернуть' : 'Читать полностью'}
        </button>
      )}
      <p className="text-xs text-gray-500 pt-2 border-t border-yellow-600/10">
        Гость · {formatStayMonth(item.stayMonth)}
      </p>
    </article>
  )
}

/**
 * «Отзывы гостей» home section. Silently hides itself when there are no
 * published reviews or the public API call fails (logged via logger).
 */
function GuestReviews() {
  const [reviews, setReviews] = useState<PublicReviewItem[]>([])
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [total, setTotal] = useState<number | null>(null)
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    let cancelled = false
    getPublicReviews(REVIEWS_LIMIT)
      .then(data => {
        if (cancelled) return
        if (!data.items || data.items.length === 0) {
          setHidden(true)
          return
        }
        setReviews(data.items.slice(0, REVIEWS_LIMIT))
        setAverageRating(data.averageRating)
        setTotal(data.total)
        setHidden(false)
      })
      .catch(err => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        logger.warn('public_reviews_load_failed', { error_message: message })
        setHidden(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (hidden) return null

  return (
    <section className="py-10 sm:py-14 bg-black relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-yellow-600 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent mx-auto mb-4"></div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="text-luxury-gold">Отзывы гостей</span>
          </h2>
          {averageRating !== null && total !== null && (
            <p className="text-sm sm:text-base text-gray-400 font-light">
              <span className="text-yellow-600 font-bold">{formatAvgRating(averageRating)}</span> —{' '}
              {formatReviewCount(total)}
            </p>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible">
          {reviews.map(item => (
            <ReviewCard key={item.reviewId} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default GuestReviews
