import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  adminGetStatistics,
  getAdminToken,
  type AdminStatisticsDTO,
  type AdminStatsMonthly,
} from '../services/adminApi'

// ---------------------------------------------------------------------------
// Small reusable primitives
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="text-xs font-semibold text-yellow-600 uppercase tracking-widest mb-3">
        {title}
      </h2>
      {children}
    </div>
  )
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1">
      <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-amber-400">{value}</p>
      {sub && <p className="text-xs text-zinc-600">{sub}</p>}
    </div>
  )
}

function StatTable({
  cols,
  rows,
}: {
  cols: string[]
  rows: (string | number)[][]
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            {cols.map((c) => (
              <th
                key={c}
                className="px-4 py-2 text-left text-xs text-zinc-500 uppercase tracking-wider font-medium"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-zinc-300 whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

interface PeriodStats {
  total: number
  revenue: number
  canceled: number
}

function getPeriodStats(breakdown: AdminStatsMonthly[], months: number): PeriodStats {
  const now = new Date()
  const keys = new Set<string>()
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.add(`${d.getFullYear()}-${d.getMonth() + 1}`)
  }
  const rel = breakdown.filter((r) => keys.has(`${r.year}-${r.month}`))
  return {
    total: rel.reduce((s, r) => s + r.total, 0),
    revenue: rel.reduce((s, r) => s + r.revenue, 0),
    canceled: rel.reduce((s, r) => s + r.canceled, 0),
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AdminStatisticsPage() {
  const navigate = useNavigate()

  const _today = new Date()
  const [fromDate, setFromDate] = useState(
    `${_today.getFullYear()}-01-01`,
  )
  const [toDate, setToDate] = useState(
    _today.toISOString().split('T')[0],
  )
  const [data, setData] = useState<AdminStatisticsDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Baseline: always unfiltered — powers the period quick-cards
  const [baseline, setBaseline] = useState<AdminStatisticsDTO | null>(null)

  useEffect(() => {
    if (!getAdminToken()) {
      navigate('/admin')
    }
  }, [navigate])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const result = await adminGetStatistics(fromDate || undefined, toDate || undefined)
      setData(result)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg === 'UNAUTHORIZED') navigate('/admin')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load filtered data and baseline (unfiltered) in parallel on first mount
    load()
    adminGetStatistics().then(setBaseline).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* Header */}
        <div>
          <button
            onClick={() => navigate('/admin')}
            className="text-zinc-500 hover:text-zinc-300 text-xs uppercase tracking-wider
              transition-colors mb-2 flex items-center gap-1">
            ← Назад
          </button>
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent mb-2" />
          <h1 className="text-xl font-bold text-yellow-600 uppercase tracking-widest">
            Статистика
          </h1>
        </div>

        {/* Date filter */}
        <div className="mt-5 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500 uppercase tracking-wider">С даты</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white
                focus:outline-none focus:border-amber-500/60 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500 uppercase tracking-wider">По дату</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white
                focus:outline-none focus:border-amber-500/60 transition-colors"
            />
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400
              hover:bg-amber-500/30 hover:border-amber-500/60 text-sm font-medium transition-all
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Загрузка…' : 'Применить'}
          </button>
          {(fromDate || toDate) && (
            <button
              onClick={() => { setFromDate(''); setToDate('') }}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Сбросить
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-900/20 border border-red-700/30 rounded-xl p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* ── Period quick-overview (always unfiltered) ───────────────────── */}
        {baseline && (() => {
          const now = new Date()
          const curMonthName = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`
          const cur = getPeriodStats(baseline.monthlyBreakdown, 1)
          const m3 = getPeriodStats(baseline.monthlyBreakdown, 3)
          const m6 = getPeriodStats(baseline.monthlyBreakdown, 6)
          const future = baseline.summary.activeBookings

          return (
            <div className="mt-6">
              <h2 className="text-xs font-semibold text-yellow-600 uppercase tracking-widest mb-3">
                Актуально сейчас
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-900 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Будущие брони</p>
                  <p className="text-3xl font-bold text-amber-400">{future}</p>
                  <p className="text-xs text-zinc-600">не отменены, не завершены</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">{curMonthName}</p>
                  <p className="text-2xl font-bold text-amber-400">{cur.total}</p>
                  <p className="text-xs text-zinc-600">{fmt(cur.revenue)} BYN · {cur.canceled} отм.</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">3 месяца</p>
                  <p className="text-2xl font-bold text-amber-400">{m3.total}</p>
                  <p className="text-xs text-zinc-600">{fmt(m3.revenue)} BYN · {m3.canceled} отм.</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">6 месяцев</p>
                  <p className="text-2xl font-bold text-amber-400">{m6.total}</p>
                  <p className="text-xs text-zinc-600">{fmt(m6.revenue)} BYN · {m6.canceled} отм.</p>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Skeleton while loading (first load) */}
        {loading && !data && (
          <div className="mt-8 text-center text-zinc-600 text-sm">Загрузка статистики…</div>
        )}

        {data && (
          <>
            {/* ── 1. Summary KPIs ─────────────────────────────────────────────── */}
            <Section title="Сводка">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard label="Всего броней" value={fmt(data.summary.totalBookings)} />
                <KpiCard label="Активных" value={fmt(data.summary.activeBookings)} />
                <KpiCard label="Завершённых" value={fmt(data.summary.doneBookings)} />
                <KpiCard
                  label="Отменённых"
                  value={fmt(data.summary.canceledBookings)}
                  sub={`${fmt(data.summary.cancelRate, 1)}% отмены`}
                />
                <KpiCard
                  label="Выручка"
                  value={`${fmt(data.summary.totalRevenue)} BYN`}
                />
                <KpiCard
                  label="Средний чек"
                  value={`${fmt(data.summary.avgPrice)} BYN`}
                />
                <KpiCard label="С предоплатой" value={fmt(data.summary.prepaidCount)} />
              </div>
            </Section>

            {/* ── 2. Monthly breakdown ─────────────────────────────────────────── */}
            {data.monthlyBreakdown.length > 0 && (
              <Section title="По месяцам">
                <StatTable
                  cols={['Период', 'Всего', 'Завершено', 'Отменено', 'Выручка, BYN']}
                  rows={data.monthlyBreakdown.map((r) => [
                    `${MONTH_NAMES[r.month - 1]} ${r.year}`,
                    r.total,
                    r.done,
                    r.canceled,
                    fmt(r.revenue),
                  ])}
                />
              </Section>
            )}

            {/* ── 3. Tariff breakdown ──────────────────────────────────────────── */}
            {data.tariffBreakdown.length > 0 && (
              <Section title="По тарифам">
                <StatTable
                  cols={['Тариф', 'Всего', 'Выручка, BYN', 'Ср. чек, BYN', 'Отменено']}
                  rows={data.tariffBreakdown.map((r) => [
                    r.tariff,
                    r.total,
                    fmt(r.revenue),
                    fmt(r.avgPrice),
                    r.cancelCount,
                  ])}
                />
              </Section>
            )}

            {/* ── 4. Source breakdown ──────────────────────────────────────────── */}
            {data.sourceBreakdown.length > 0 && (
              <Section title="По источнику">
                <StatTable
                  cols={['Источник', 'Всего', 'Завершено', 'Отменено', '% отмены']}
                  rows={data.sourceBreakdown.map((r) => [
                    r.source,
                    r.total,
                    r.done,
                    r.canceled,
                    `${fmt(r.cancelRate, 1)}%`,
                  ])}
                />
              </Section>
            )}

            {/* ── 5. Day-of-week ───────────────────────────────────────────────── */}
            {data.dayOfWeekBreakdown.length > 0 && (
              <Section title="По дням недели (не отменённые)">
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                  {data.dayOfWeekBreakdown.map((d) => (
                    <div
                      key={d.dow}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center"
                    >
                      <p className="text-xs text-zinc-500 mb-1">{d.dayName.slice(0, 2)}</p>
                      <p className="text-lg font-bold text-amber-400">{d.total}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ── 6. Duration buckets ──────────────────────────────────────────── */}
            {data.durationBreakdown.length > 0 && (
              <Section title="По продолжительности (не отменённые)">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {data.durationBreakdown.map((d) => (
                    <div
                      key={d.bucket}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center"
                    >
                      <p className="text-xs text-zinc-500 mb-1">{d.label}</p>
                      <p className="text-lg font-bold text-amber-400">{d.total}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ── 7. Guest count ───────────────────────────────────────────────── */}
            {data.guestCountBreakdown.length > 0 && (
              <Section title="По количеству гостей (не отменённые)">
                <StatTable
                  cols={['Гостей', 'Бронирований']}
                  rows={data.guestCountBreakdown.map((r) => [r.guestCount, r.total])}
                />
              </Section>
            )}

            {/* ── 8. Options ───────────────────────────────────────────────────── */}
            <Section title="Опции (не отменённые)">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <KpiCard label="С сауной" value={data.options.hasSauna} />
                <KpiCard label="Белая спальня" value={data.options.hasWhiteBedroom} />
                <KpiCard label="Зелёная спальня" value={data.options.hasGreenBedroom} />
                <KpiCard label="Тайная комната" value={data.options.hasSecretRoom} />
                <KpiCard label="Фотосессия" value={data.options.hasPhotoshoot} />
                <KpiCard label="Ванна" value={data.options.hasBathTub} />
                <KpiCard
                  label="Ср. чек с сауной"
                  value={`${fmt(data.options.saunaAvgPrice)} BYN`}
                />
                <KpiCard
                  label="Ср. чек без сауны"
                  value={`${fmt(data.options.noSaunaAvgPrice)} BYN`}
                />
              </div>
            </Section>

            {/* ── 9. Users (all-time) ──────────────────────────────────────────── */}
            <Section title="Пользователи (за всё время)">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard label="Всего" value={fmt(data.users.total)} />
                <KpiCard label="Активных" value={fmt(data.users.active)} />
                <KpiCard label="С бронированиями" value={fmt(data.users.withBookings)} />
                <KpiCard label="С завершёнными" value={fmt(data.users.withCompleted)} />
                <KpiCard label="Повторных (≥2)" value={fmt(data.users.repeatCustomers)} />
                <KpiCard label="Лояльных (≥3)" value={fmt(data.users.loyalCustomers)} />
                <KpiCard label="Telegram" value={fmt(data.users.telegramAccounts)} />
              </div>
            </Section>

            {/* ── 10. Gifts (all-time) ─────────────────────────────────────────── */}
            <Section title="Подарочные сертификаты (за всё время)">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard label="Всего" value={fmt(data.gifts.total)} />
                <KpiCard label="Оплачено" value={fmt(data.gifts.paid)} />
                <KpiCard label="Использовано" value={fmt(data.gifts.used)} />
                <KpiCard label="Истекло" value={fmt(data.gifts.expired)} />
                <KpiCard label="Ср. цена, BYN" value={fmt(data.gifts.avgPrice)} />
              </div>
            </Section>

            {/* Generated at */}
            <p className="mt-8 text-xs text-zinc-700 text-right">
              Сформировано: {new Date(data.generatedAt).toLocaleString('ru-RU')}
            </p>
          </>
        )}

        <div className="h-12" />
      </div>
    </div>
  )
}
