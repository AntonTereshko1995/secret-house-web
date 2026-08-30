import { describe, it, expect, vi } from 'vitest'

// Mock modules that use Vite's import.meta.env
vi.mock('../services/api', () => ({
  validatePromocodeApi: vi.fn(),
  submitBooking: vi.fn(),
}))
vi.mock('../services/logger', () => ({ logger: { info: vi.fn(), error: vi.fn() } }))
vi.mock('../utils/env', () => ({ getEnv: vi.fn(() => 'http://localhost:8000') }))

import {
  calculateBasePrice,
  calculatePriceWithServices,
  getTariffConfig,
  TARIFF_CONFIG,
} from './booking'

// ─── calculateBasePrice ───────────────────────────────────────────────────────

describe('calculateBasePrice', () => {
  it('12h-standard exact duration returns base price', () => {
    expect(calculateBasePrice('12h-standard', 12)).toBe(250)
  })

  it('12h-standard with 2 extra hours adds extra-hour cost', () => {
    // 250 + 2 * 30 = 310
    expect(calculateBasePrice('12h-standard', 14)).toBe(310)
  })

  it('work-standard exact duration returns base price', () => {
    expect(calculateBasePrice('work-standard', 11)).toBe(180)
  })

  it('incognito-daily exact duration (24h) returns table price', () => {
    // multiDayPrices[1] = 900
    expect(calculateBasePrice('incognito-daily', 24)).toBe(900)
  })

  it('incognito-daily 2 days returns table price', () => {
    // multiDayPrices[2] = 1600
    expect(calculateBasePrice('incognito-daily', 48)).toBe(1600)
  })

  it('incognito-daily 1 day + 10 remainder hours', () => {
    // floor(34/24)=1 day, remainder=10h ≤ 15h → no round-up
    // dayPrice[1]=900, remainderPrice=10*30=300 → 1200
    expect(calculateBasePrice('incognito-daily', 34)).toBe(1200)
  })

  it('incognito-daily remainder > 15h rounds up to next day', () => {
    // floor(40/24)=1, remainder=16h > 15 → totalDays=2, remainder=0
    // dayPrice[2]=1600
    expect(calculateBasePrice('incognito-daily', 40)).toBe(1600)
  })

  it('unknown tariff returns 0', () => {
    expect(calculateBasePrice('unknown-tariff', 12)).toBe(0)
  })

  it('sale price for 12h-standard returns lower base', () => {
    expect(calculateBasePrice('12h-standard', 12, true)).toBe(200)
  })
})

// ─── calculatePriceWithServices ───────────────────────────────────────────────

describe('calculatePriceWithServices', () => {
  const noServices = {
    hasPhotoshoot: false,
    hasSauna: false,
    hasBathTub: false,
    hasExtraBedroom: false,
    hasSecretRoom: false,
  }

  it('no services equals base price', () => {
    expect(calculatePriceWithServices('12h-standard', 12, noServices)).toBe(250)
  })

  it('12h-standard with sauna adds 120', () => {
    // 250 + 120 = 370
    expect(calculatePriceWithServices('12h-standard', 12, { ...noServices, hasSauna: true })).toBe(370)
  })

  it('12h-standard with bathTub adds 180', () => {
    // 250 + 180 = 430
    expect(calculatePriceWithServices('12h-standard', 12, { ...noServices, hasBathTub: true })).toBe(430)
  })

  it('12h-standard with secretRoom adds 70', () => {
    // 250 + 70 = 320
    expect(calculatePriceWithServices('12h-standard', 12, { ...noServices, hasSecretRoom: true })).toBe(320)
  })

  it('12h-standard with extraBedroom adds 70', () => {
    // 250 + 70 = 320
    expect(calculatePriceWithServices('12h-standard', 12, { ...noServices, hasExtraBedroom: true })).toBe(320)
  })

  it('12h-standard with all services sums correctly', () => {
    // 250 + 120(sauna) + 180(bathTub) + 70(secretRoom) + 70(extraBedroom) + 0(photoshoot) = 690
    const allServices = {
      hasPhotoshoot: false,
      hasSauna: true,
      hasBathTub: true,
      hasExtraBedroom: true,
      hasSecretRoom: true,
    }
    expect(calculatePriceWithServices('12h-standard', 12, allServices)).toBe(690)
  })

  it('incognito-daily: sauna, secretRoom, extraBedroom, photoshoot are free (0 price)', () => {
    const servicesOnIncognito = {
      hasPhotoshoot: true,
      hasSauna: true,
      hasBathTub: false,
      hasExtraBedroom: true,
      hasSecretRoom: true,
    }
    // base = 900, sauna=0, secretRoom=0, extraBedroom=0, photoshoot=0 → 900
    expect(calculatePriceWithServices('incognito-daily', 24, servicesOnIncognito)).toBe(900)
  })

  it('incognito-daily: only bathTub adds cost (130)', () => {
    // 900 + 130 = 1030
    expect(calculatePriceWithServices('incognito-daily', 24, { ...noServices, hasBathTub: true })).toBe(1030)
  })

  // ── The original bug: tariff switch doesn't account for existing services ──

  it('bug scenario: 12h with bathTub → switch to incognito-daily reprices at new tariff rates', () => {
    const servicesWithBathTub = { ...noServices, hasBathTub: true }
    // Old (wrong) way: 12h base + 12h bathTub = 250 + 180 = 430
    // Correct: incognito-daily base + incognito-daily bathTub = 900 + 130 = 1030
    const result = calculatePriceWithServices('incognito-daily', 24, servicesWithBathTub)
    expect(result).toBe(1030)
    expect(result).not.toBe(250 + 180) // guard against old bug
  })

  it('bug scenario: 12h with sauna → switch to work-standard reprices at new tariff rates', () => {
    const servicesWithSauna = { ...noServices, hasSauna: true }
    // work-standard base=180, sauna=120 → 300
    const result = calculatePriceWithServices('work-standard', 11, servicesWithSauna)
    expect(result).toBe(300)
  })

  it('bug scenario: work-standard with sauna → switch to incognito-work (sauna included, price 0)', () => {
    const servicesWithSauna = { ...noServices, hasSauna: true }
    // incognito-work base=450, sauna=0 (included) → 450
    const result = calculatePriceWithServices('incognito-work', 11, servicesWithSauna)
    expect(result).toBe(450)
    expect(result).not.toBe(450 + 120) // should NOT charge old work-standard sauna price
  })

  it('daily-3plus with sauna and bathTub', () => {
    // base=700, sauna=120, bathTub=180 → 1000
    expect(calculatePriceWithServices('daily-3plus', 24, { ...noServices, hasSauna: true, hasBathTub: true })).toBe(1000)
  })

  it('unknown tariff returns 0', () => {
    expect(calculatePriceWithServices('nonexistent', 12, noServices)).toBe(0)
  })

  it('sale price applies correctly', () => {
    // 12h-standard sale base=200, sauna sale=100 → 300
    expect(calculatePriceWithServices('12h-standard', 12, { ...noServices, hasSauna: true }, true)).toBe(300)
  })

  it('with extra hours: base includes extra-hour cost', () => {
    // 12h-standard 14h: base = 250 + 2*30 = 310, bathTub = 180 → 490
    expect(calculatePriceWithServices('12h-standard', 14, { ...noServices, hasBathTub: true })).toBe(490)
  })
})

// ─── getTariffConfig ──────────────────────────────────────────────────────────

describe('getTariffConfig', () => {
  it('returns standard config by default', () => {
    expect(getTariffConfig('12h-standard')?.price).toBe(250)
  })

  it('returns sale config when sale=true', () => {
    expect(getTariffConfig('12h-standard', true)?.price).toBe(200)
  })

  it('incognito tariffs have hasTransfer=true', () => {
    expect(TARIFF_CONFIG['incognito-daily'].hasTransfer).toBe(true)
    expect(TARIFF_CONFIG['incognito-12h'].hasTransfer).toBe(true)
    expect(TARIFF_CONFIG['incognito-work'].hasTransfer).toBe(true)
  })

  it('non-incognito tariffs have hasTransfer=false', () => {
    expect(TARIFF_CONFIG['12h-standard'].hasTransfer).toBe(false)
    expect(TARIFF_CONFIG['daily-3plus'].hasTransfer).toBe(false)
    expect(TARIFF_CONFIG['work-standard'].hasTransfer).toBe(false)
  })

  it('incognito tariffs have sauna price 0 (included)', () => {
    expect(TARIFF_CONFIG['incognito-daily'].saunaPrice).toBe(0)
    expect(TARIFF_CONFIG['incognito-12h'].saunaPrice).toBe(0)
    expect(TARIFF_CONFIG['incognito-work'].saunaPrice).toBe(0)
  })
})
