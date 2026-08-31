import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAdminToken,
  clearAdminToken,
  adminGetPromocodes,
  adminCreatePromocode,
  adminUpdatePromocode,
  type AdminPromoDTO,
  type AdminPromoPayload,
} from '../services/adminApi'

// Tariff int values (0-7) → display labels.
// Matches TARIFF_ID_TO_INT in the backend: 0=12h-standard, 1=daily-3plus, etc.
const TARIFF_INT_OPTIONS = [
  { value: 0, label: '12 часов (стандарт)' },
  { value: 1, label: 'Суточно от 3 человек' },
  { value: 2, label: 'Рабочий' },
  { value: 3, label: 'Инкогнито (Суточно)' },
  { value: 4, label: 'Инкогнито (12 часов)' },
  { value: 5, label: 'Инкогнито (Рабочий)' },
  { value: 6, label: 'Подарочный сертификат' },
  { value: 7, label: 'Суточно для двоих' },
] as const

const today = new Date().toISOString().slice(0, 10)

const BLANK_FORM: AdminPromoPayload = {
  name: '',
  promocodeType: 1,
  dateFrom: today,
  dateTo: today,
  discountPercentage: 10,
  applicableTariffs: null,
  isActive: true,
}

function tariffLabel(value: number): string {
  return TARIFF_INT_OPTIONS.find(t => t.value === value)?.label ?? String(value)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FormPanelProps {
  form: AdminPromoPayload
  isEditing: boolean
  loading: boolean
  error: string | null
  onChange: (f: AdminPromoPayload) => void
  onSave: (e: FormEvent) => void
  onCancel: () => void
}

function PromoFormPanel({ form, isEditing, loading, error, onChange, onSave, onCancel }: FormPanelProps) {
  const allTariffs = form.applicableTariffs === null

  const toggleAllTariffs = () => {
    onChange({ ...form, applicableTariffs: allTariffs ? [] : null })
  }

  const toggleTariff = (value: number) => {
    const current = form.applicableTariffs ?? []
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    // if user deselects all → treat as "all tariffs"
    onChange({ ...form, applicableTariffs: next.length === 0 ? null : next })
  }

  return (
    <div className="bg-zinc-900 border border-amber-500/30 rounded-xl p-5 mb-5">
      <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-4">
        {isEditing ? 'Редактировать промокод' : 'Новый промокод'}
      </h2>

      <form onSubmit={onSave} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">
            Код промокода
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => onChange({ ...form, name: e.target.value })}
            required
            placeholder="summer10"
            className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm
              focus:outline-none focus:border-amber-500/60 placeholder-zinc-600 uppercase"
          />
          <p className="text-zinc-600 text-xs mt-1">Будет сохранён в нижнем регистре</p>
        </div>

        {/* Type */}
        <div>
          <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-2">
            Тип промокода
          </label>
          <div className="flex gap-4">
            {([1, 2] as const).map(t => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="promocodeType"
                  value={t}
                  checked={form.promocodeType === t}
                  onChange={() => onChange({ ...form, promocodeType: t })}
                  className="accent-amber-500"
                />
                <span className="text-zinc-300 text-sm">
                  {t === 1 ? 'По дате заезда' : 'По периоду использования'}
                </span>
              </label>
            ))}
          </div>
          <p className="text-zinc-600 text-xs mt-1">
            {form.promocodeType === 1
              ? 'Действует, если дата заезда входит в диапазон'
              : 'Действует, если сегодняшняя дата входит в диапазон'}
          </p>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">
              Дата с
            </label>
            <input
              type="date"
              value={form.dateFrom}
              onChange={e => onChange({ ...form, dateFrom: e.target.value })}
              required
              className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm
                focus:outline-none focus:border-amber-500/60"
            />
          </div>
          <div>
            <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">
              Дата по
            </label>
            <input
              type="date"
              value={form.dateTo}
              onChange={e => onChange({ ...form, dateTo: e.target.value })}
              required
              className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm
                focus:outline-none focus:border-amber-500/60"
            />
          </div>
        </div>

        {/* Discount */}
        <div>
          <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">
            Скидка (%)
          </label>
          <input
            type="number"
            value={form.discountPercentage}
            onChange={e => onChange({ ...form, discountPercentage: Number(e.target.value) })}
            min={0.5}
            max={100}
            step={0.5}
            required
            className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm
              focus:outline-none focus:border-amber-500/60"
          />
        </div>

        {/* Applicable tariffs */}
        <div>
          <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-2">
            Тарифы
          </label>
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allTariffs}
              onChange={toggleAllTariffs}
              className="accent-amber-500 w-4 h-4"
            />
            <span className="text-zinc-300 text-sm font-medium">Все тарифы</span>
          </label>
          {!allTariffs && (
            <div className="grid grid-cols-2 gap-1.5 pl-1">
              {TARIFF_INT_OPTIONS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form.applicableTariffs ?? []).includes(value)}
                    onChange={() => toggleTariff(value)}
                    className="accent-amber-500 w-4 h-4"
                  />
                  <span className="text-zinc-400 text-xs">{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Active */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={e => onChange({ ...form, isActive: e.target.checked })}
            className="accent-amber-500 w-4 h-4"
          />
          <span className="text-zinc-300 text-sm">Активен</span>
        </label>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={loading || !form.name.trim()}
            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500
              text-black font-bold py-2.5 rounded-lg text-sm transition-all">
            {loading ? 'Сохранение…' : isEditing ? 'Сохранить' : 'Создать'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-400
              hover:border-zinc-500 hover:text-white text-sm transition-all">
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPromocodesPage() {
  const navigate = useNavigate()

  const [promos, setPromos] = useState<AdminPromoDTO[]>([])
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive'>('active')
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const [form, setForm] = useState<AdminPromoPayload | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleUnauthorized = useCallback(() => {
    clearAdminToken()
    navigate('/admin')
  }, [navigate])

  // Redirect to login if no token
  useEffect(() => {
    if (!getAdminToken()) navigate('/admin')
  }, [navigate])

  const loadPromos = useCallback(async () => {
    setLoading(true)
    setListError(null)
    try {
      const result = await adminGetPromocodes(statusFilter)
      setPromos(result)
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        handleUnauthorized()
      } else {
        setListError(err instanceof Error ? err.message : 'Ошибка загрузки')
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter, handleUnauthorized])

  useEffect(() => { loadPromos() }, [loadPromos])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...BLANK_FORM })
    setSaveError(null)
  }

  const openEdit = (promo: AdminPromoDTO) => {
    setEditingId(promo.id)
    setForm({
      name: promo.name,
      promocodeType: promo.promocodeType,
      dateFrom: promo.dateFrom,
      dateTo: promo.dateTo,
      discountPercentage: promo.discountPercentage,
      applicableTariffs: promo.applicableTariffs,
      isActive: promo.isActive,
    })
    setSaveError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSaveLoading(true)
    setSaveError(null)
    // treat empty tariff selection as "all tariffs"
    const payload: AdminPromoPayload = {
      ...form,
      applicableTariffs:
        form.applicableTariffs && form.applicableTariffs.length > 0
          ? form.applicableTariffs
          : null,
    }
    try {
      if (editingId !== null) {
        await adminUpdatePromocode(editingId, payload)
      } else {
        await adminCreatePromocode(payload)
      }
      setForm(null)
      setEditingId(null)
      await loadPromos()
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        handleUnauthorized()
      } else {
        setSaveError(err instanceof Error ? err.message : 'Ошибка сохранения')
      }
    } finally {
      setSaveLoading(false)
    }
  }

  const handleCancel = () => {
    setForm(null)
    setEditingId(null)
    setSaveError(null)
  }

  return (
    <div className="min-h-screen bg-luxury-gradient text-white">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
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
              Промокоды
            </h1>
          </div>
          <button
            onClick={openCreate}
            disabled={!!form}
            className="bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500
              text-black font-bold px-4 py-2 rounded-lg text-sm transition-all">
            + Создать
          </button>
        </div>

        {/* Create / Edit form */}
        {form && (
          <PromoFormPanel
            form={form}
            isEditing={editingId !== null}
            loading={saveLoading}
            error={saveError}
            onChange={setForm}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        {/* Status sub-tabs */}
        <div className="flex gap-1.5 mb-4">
          {(['active', 'inactive'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={[
                'text-xs px-3 py-1.5 rounded-lg border transition-all',
                statusFilter === s
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                  : 'bg-transparent border-zinc-700 text-zinc-500 hover:border-zinc-500',
              ].join(' ')}>
              {s === 'active' ? 'Активные' : 'Деактивированные'}
            </button>
          ))}
        </div>

        {/* Error */}
        {listError && (
          <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 mb-4">
            <p className="text-red-400 text-sm text-center">{listError}</p>
          </div>
        )}

        {/* Spinner */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-16 text-zinc-500">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-sm">Загружаем промокоды…</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && !listError && promos.length === 0 && (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-sm">
              {statusFilter === 'active' ? 'Нет активных промокодов' : 'Нет деактивированных промокодов'}
            </p>
          </div>
        )}

        {/* Promo list */}
        {!loading && promos.length > 0 && (
          <div className="space-y-2">
            {promos.map(p => (
              <button
                key={p.id}
                onClick={() => openEdit(p)}
                className="w-full text-left bg-zinc-900 border border-zinc-700 hover:border-zinc-500
                  rounded-xl p-4 transition-all group">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-amber-400 uppercase tracking-widest text-sm
                      group-hover:text-amber-300 transition-colors">
                      {p.name}
                    </p>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {p.promocodeType === 1 ? 'По дате заезда' : 'По периоду'}
                      {' · '}
                      {p.dateFrom} → {p.dateTo}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-yellow-500 font-bold text-sm">{p.discountPercentage}%</span>
                    <span className={[
                      'text-xs px-2 py-0.5 rounded-full border',
                      p.isActive
                        ? 'border-green-500/40 text-green-400'
                        : 'border-zinc-600 text-zinc-500',
                    ].join(' ')}>
                      {p.isActive ? 'Активен' : 'Выключен'}
                    </span>
                  </div>
                </div>
                <p className="text-zinc-600 text-xs mt-1.5">
                  {p.applicableTariffs && p.applicableTariffs.length > 0
                    ? p.applicableTariffs.map(tariffLabel).join(', ')
                    : 'Все тарифы'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
