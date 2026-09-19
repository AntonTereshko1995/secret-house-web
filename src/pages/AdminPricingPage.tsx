import { useState, useEffect, useCallback, type ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  getAdminToken,
  adminGetPricing,
  adminUpdateTariffPricing,
  adminUpdatePricingSettings,
  type TariffPriceUpdatePayload,
  type PricingSettingsPayload,
} from '../services/adminApi'
import type { TariffPriceRecord } from '../services/api'
import { usePricingContext } from '../context/PricingContext'

const TARIFF_NAMES: Record<string, string> = {
  'incognito-daily': 'Инкогнито Суточно',
  'incognito-12h': 'Инкогнито 12 часов',
  'incognito-work': 'Инкогнито Рабочий',
  'daily-3plus': 'Суточно от 3 человек',
  'daily-couple': 'Суточно для двоих',
  '12h-standard': '12 часов',
  'work-standard': 'Рабочий',
}

const TARIFF_ORDER = Object.keys(TARIFF_NAMES)

const NO_MULTI_DAY = new Set(['incognito-12h', 'incognito-work', '12h-standard', 'work-standard'])

const PRICE_FIELDS: Array<{ key: keyof TariffPriceUpdatePayload; label: string }> = [
  { key: 'price', label: 'Базовая цена' },
  { key: 'saunaPrice', label: 'Сауна' },
  { key: 'bathTubPrice', label: 'Банный чан' },
  { key: 'secretRoomPrice', label: 'Секретная комната' },
  { key: 'extraBedroomPrice', label: 'Доп. спальня' },
  { key: 'extraHourPrice', label: 'Доп. час' },
  { key: 'extraPeoplePrice', label: 'Доп. гость' },
  { key: 'photoshootPrice', label: 'Фотосессия' },
]

const SALE_PRICE_FIELDS: Array<{ key: keyof TariffPriceUpdatePayload; label: string }> = [
  { key: 'salePrice', label: 'Базовая цена (акция)' },
  { key: 'saleSaunaPrice', label: 'Сауна (акция)' },
  { key: 'saleBathTubPrice', label: 'Банный чан (акция)' },
  { key: 'saleSecretRoomPrice', label: 'Секретная комната (акция)' },
  { key: 'saleExtraBedroomPrice', label: 'Доп. спальня (акция)' },
  { key: 'saleExtraHourPrice', label: 'Доп. час (акция)' },
  { key: 'saleExtraPeoplePrice', label: 'Доп. гость (акция)' },
  { key: 'salePhotoshootPrice', label: 'Фотосессия (акция)' },
]

function recordToPayload(r: TariffPriceRecord): TariffPriceUpdatePayload {
  return {
    price: r.price,
    saunaPrice: r.saunaPrice,
    bathTubPrice: r.bathTubPrice,
    secretRoomPrice: r.secretRoomPrice,
    extraBedroomPrice: r.extraBedroomPrice,
    extraHourPrice: r.extraHourPrice,
    extraPeoplePrice: r.extraPeoplePrice,
    photoshootPrice: r.photoshootPrice,
    multiDayPrices: r.multiDayPrices,
    salePrice: r.salePrice,
    saleSaunaPrice: r.saleSaunaPrice,
    saleBathTubPrice: r.saleBathTubPrice,
    saleSecretRoomPrice: r.saleSecretRoomPrice,
    saleExtraBedroomPrice: r.saleExtraBedroomPrice,
    saleExtraHourPrice: r.saleExtraHourPrice,
    saleExtraPeoplePrice: r.saleExtraPeoplePrice,
    salePhotoshootPrice: r.salePhotoshootPrice,
    saleMultiDayPrices: r.saleMultiDayPrices,
  }
}

interface MultiDayEditorProps {
  values: Record<number, number>
  saleValues: Record<number, number>
  onChange: (std: Record<number, number>, sale: Record<number, number>) => void
}

function MultiDayEditor({ values, saleValues, onChange }: MultiDayEditorProps) {
  const days = Array.from({ length: 14 }, (_, i) => i + 1)
  return (
    <div className="mt-3">
      <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">Мультидневные цены (BYN)</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-zinc-500">
              <th className="text-left py-1 pr-3 font-normal">Дней</th>
              <th className="text-left py-1 pr-3 font-normal">Стандарт</th>
              <th className="text-left py-1 font-normal">Акция</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d}>
                <td className="pr-3 py-0.5 text-zinc-400">{d}</td>
                <td className="pr-3 py-0.5">
                  <input
                    type="number"
                    min={0}
                    value={values[d] ?? ''}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      const next = { ...values }
                      if (!isNaN(v) && v > 0) {
                        next[d] = v
                      } else {
                        delete next[d]
                      }
                      onChange(next, saleValues)
                    }}
                    className="w-20 bg-zinc-800 border border-zinc-700 text-white text-xs px-2 py-0.5 rounded outline-none focus:border-amber-500"
                    placeholder="0"
                  />
                </td>
                <td className="py-0.5">
                  <input
                    type="number"
                    min={0}
                    value={saleValues[d] ?? ''}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      const next = { ...saleValues }
                      if (!isNaN(v) && v > 0) {
                        next[d] = v
                      } else {
                        delete next[d]
                      }
                      onChange(values, next)
                    }}
                    className="w-20 bg-zinc-800 border border-zinc-700 text-white text-xs px-2 py-0.5 rounded outline-none focus:border-amber-500"
                    placeholder="0"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AdminPricingPage() {
  const navigate = useNavigate()
  const { refresh: refreshContext } = usePricingContext()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [forms, setForms] = useState<Record<string, TariffPriceUpdatePayload>>({})
  const [settings, setSettings] = useState<PricingSettingsPayload>({ isSaleActive: false })

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (!getAdminToken()) {
      navigate('/admin')
    }
  }, [navigate])

  const loadPricing = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminGetPricing()
      const initialForms: Record<string, TariffPriceUpdatePayload> = {}
      for (const r of data.tariffs) {
        initialForms[r.tariffId] = recordToPayload(r)
      }
      setForms(initialForms)
      setSettings({ isSaleActive: data.isSaleActive })
    } catch (e) {
      if (e instanceof Error && e.message === 'UNAUTHORIZED') {
        navigate('/admin')
        return
      }
      setError(e instanceof Error ? e.message : 'Ошибка загрузки цен')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void loadPricing()
  }, [loadPricing])

  const handleFieldChange = (
    tariffId: string,
    field: keyof TariffPriceUpdatePayload,
    value: number,
  ) => {
    setForms((prev) => ({
      ...prev,
      [tariffId]: { ...prev[tariffId], [field]: value },
    }))
  }

  const handleMultiDayChange = (
    tariffId: string,
    std: Record<number, number>,
    sale: Record<number, number>,
  ) => {
    setForms((prev) => ({
      ...prev,
      [tariffId]: { ...prev[tariffId], multiDayPrices: std, saleMultiDayPrices: sale },
    }))
  }

  const handleSaveAll = async () => {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      await Promise.all([
        adminUpdatePricingSettings(settings),
        ...TARIFF_ORDER.filter((id) => forms[id]).map((id) =>
          adminUpdateTariffPricing(id, forms[id]),
        ),
      ])
      refreshContext()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (e) {
      if (e instanceof Error && e.message === 'UNAUTHORIZED') {
        navigate('/admin')
        return
      }
      setSaveError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-amber-400 uppercase tracking-widest">
              Управление ценами
            </h1>
            <p className="text-xs text-zinc-500 mt-1">Стандартные и акционные цены по тарифам</p>
          </div>
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-green-400 text-xs">✓ Сохранено</span>
            )}
            {saveError && (
              <span className="text-red-400 text-xs">{saveError}</span>
            )}
            <button
              onClick={() => void handleSaveAll()}
              disabled={saving || loading}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-xs uppercase tracking-wider px-5 py-2 rounded-lg transition-all"
            >
              {saving ? 'Сохранение...' : 'Сохранить всё'}
            </button>
            <Link
              to="/admin"
              className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:border-amber-500/50 hover:text-amber-400 transition-all"
            >
              ← Назад
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/40 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-zinc-500 text-sm">Загрузка цен...</div>
        )}

        {!loading && !error && (
          <>
            {/* Global settings */}
            <div className="bg-zinc-900 border border-amber-500/30 rounded-xl p-5 mb-6">
              <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-4">
                Глобальные настройки
              </h2>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() =>
                    setSettings((s) => ({ ...s, isSaleActive: !s.isSaleActive }))
                  }
                  className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${
                    settings.isSaleActive ? 'bg-amber-500' : 'bg-zinc-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.isSaleActive ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </div>
                <span className="text-sm text-white">
                  Акционные цены {settings.isSaleActive ? '(включены)' : '(выключены)'}
                </span>
              </label>
            </div>

            {/* Tariff cards */}
            {TARIFF_ORDER.filter((id) => forms[id]).map((tariffId) => {
              const form = forms[tariffId]
              return (
                <div
                  key={tariffId}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4"
                >
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-white">
                      {TARIFF_NAMES[tariffId]}
                    </h3>
                    <p className="text-xs text-zinc-600 mt-0.5">{tariffId}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Standard prices */}
                    <div>
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                        Стандартные цены
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {PRICE_FIELDS.map(({ key, label }) => (
                          <div key={key}>
                            <label className="block text-xs text-zinc-500 mb-1">{label}</label>
                            <input
                              type="number"
                              min={0}
                              value={form[key] as number}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleFieldChange(
                                  tariffId,
                                  key,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-1.5 rounded outline-none focus:border-amber-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sale prices */}
                    <div>
                      <p className="text-xs font-semibold text-amber-500/80 uppercase tracking-wider mb-3">
                        Акционные цены
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {SALE_PRICE_FIELDS.map(({ key, label }) => (
                          <div key={key}>
                            <label className="block text-xs text-zinc-500 mb-1">{label}</label>
                            <input
                              type="number"
                              min={0}
                              value={form[key] as number}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleFieldChange(
                                  tariffId,
                                  key,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-1.5 rounded outline-none focus:border-amber-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Multi-day prices */}
                  {!NO_MULTI_DAY.has(tariffId) && (
                    <MultiDayEditor
                      values={form.multiDayPrices}
                      saleValues={form.saleMultiDayPrices}
                      onChange={(std, sale) => handleMultiDayChange(tariffId, std, sale)}
                    />
                  )}

                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminPricingPage
