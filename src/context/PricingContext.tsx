import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { getPricing, type EffectiveTariffPriceRecord } from '../services/api'
import type { TariffConfig, TariffType } from '../types/booking.types'
import { TARIFF_CONFIG, _updateRuntimePricing } from '../utils/booking'

interface PricingContextValue {
  tariffConfig: Record<TariffType, TariffConfig>
  isSaleActive: boolean
  isSaunaBathTubComboActive: boolean
  loading: boolean
  refresh: () => void
}

function buildTariffConfig(
  records: EffectiveTariffPriceRecord[],
): Record<TariffType, TariffConfig> {
  const result: Record<TariffType, TariffConfig> = { ...TARIFF_CONFIG }
  for (const r of records) {
    const id = r.tariffId as TariffType
    if (!result[id]) continue
    const mdp = Object.fromEntries(
      Object.entries(r.multiDayPrices).map(([k, v]) => [Number(k), v]),
    ) as Record<number, number>
    result[id] = {
      ...result[id],
      price: r.price,
      saunaPrice: r.saunaPrice,
      bathTubPrice: r.bathTubPrice,
      secretRoomPrice: r.secretRoomPrice,
      extraBedroomPrice: r.extraBedroomPrice,
      extraHourPrice: r.extraHourPrice,
      extraPeoplePrice: r.extraPeoplePrice,
      photoshootPrice: r.photoshootPrice,
      combinedSaunaBathTubPrice: r.combinedSaunaBathTubPrice,
      multiDayPrices: mdp,
    }
  }
  return result
}

const PricingContext = createContext<PricingContextValue>({
  tariffConfig: TARIFF_CONFIG,
  isSaleActive: false,
  isSaunaBathTubComboActive: false,
  loading: true,
  refresh: () => {},
})

export function PricingProvider({ children }: { children: ReactNode }) {
  const [tariffConfig, setTariffConfig] = useState<Record<TariffType, TariffConfig>>(TARIFF_CONFIG)
  const [isSaleActive, setIsSaleActive] = useState(false)
  const [isSaunaBathTubComboActive, setIsSaunaBathTubComboActive] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchPricing = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPricing()
      const effectiveConfig = buildTariffConfig(data.tariffs)
      // Update module-level state so getTariffConfig() in step files works
      _updateRuntimePricing(effectiveConfig, effectiveConfig)
      setTariffConfig(effectiveConfig)
      setIsSaleActive(data.isSaleActive)
      setIsSaunaBathTubComboActive(data.isSaunaBathTubComboActive)
    } catch {
      // Fall back to hardcoded defaults silently — app remains functional
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchPricing()
  }, [fetchPricing])

  return (
    <PricingContext.Provider
      value={{ tariffConfig, isSaleActive, isSaunaBathTubComboActive, loading, refresh: fetchPricing }}
    >
      {children}
    </PricingContext.Provider>
  )
}

export function usePricingContext(): PricingContextValue {
  return useContext(PricingContext)
}

// Re-export for convenience in admin page
export type { PricingContextValue }
