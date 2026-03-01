import type { BookingFormData, TariffConfig, TariffOption, TariffType, WineOption } from '../types/booking.types'
import { validatePromocodeApi, submitBooking as submitBookingApi } from '../services/api'
import type { BookingCreatePayload } from '../services/api'

/**
 * Booked period interface
 */
export interface BookedPeriod {
  checkIn: Date
  checkOut: Date
  bookingId: string
}

/**
 * Minimum booking duration in hours
 */
export const MIN_BOOKING_HOURS = 3

/**
 * Cleaning buffer in hours required between bookings.
 * After a booking ends, the house is closed for 2 hours for cleaning.
 * Before a booking starts, 2 hours must be reserved for the previous guest's checkout + cleaning.
 */
export const CLEANING_BUFFER_HOURS = 2

/**
 * Mock booked periods with exact check-in/check-out times.
 * Replace with API call in production.
 */
export const MOCK_BOOKED_PERIODS: BookedPeriod[] = [
  {
    checkIn: new Date(2026, 1, 17, 18, 0),  // Feb 17 18:00
    checkOut: new Date(2026, 1, 18, 10, 0), // Feb 18 10:00
    bookingId: 'BK-000'
  },
  {
    checkIn: new Date(2026, 1, 18, 14, 0),  // Feb 18 14:00
    checkOut: new Date(2026, 1, 20, 12, 0), // Feb 20 12:00
    bookingId: 'BK-001'
  },
  {
    checkIn: new Date(2026, 1, 22, 16, 0),  // Feb 22 16:00
    checkOut: new Date(2026, 1, 23, 10, 0), // Feb 23 10:00
    bookingId: 'BK-002'
  },
  {
    checkIn: new Date(2026, 1, 25, 12, 0),  // Feb 25 12:00
    checkOut: new Date(2026, 1, 28, 11, 0), // Feb 28 11:00
    bookingId: 'BK-003'
  },
  {
    checkIn: new Date(2026, 2, 3, 13, 0),   // Mar 3 13:00
    checkOut: new Date(2026, 2, 5, 12, 0),  // Mar 5 12:00
    bookingId: 'BK-004'
  }
]

/**
 * Get occupied time ranges for a specific day (hours on 0–24 scale)
 */
export function getOccupiedRangesForDay(
  date: Date,
  periods: BookedPeriod[]
): Array<{ start: number; end: number }> {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).getTime()
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0).getTime()
  const ranges: Array<{ start: number; end: number }> = []

  for (const period of periods) {
    const overlapStart = Math.max(period.checkIn.getTime(), dayStart)
    const overlapEnd = Math.min(period.checkOut.getTime(), dayEnd)
    if (overlapEnd > overlapStart) {
      ranges.push({
        start: (overlapStart - dayStart) / 3600000,
        end: (overlapEnd - dayStart) / 3600000,
      })
    }
  }
  return ranges
}

/**
 * Returns a Set of 'HH:MM' strings unavailable for check-in on the given date
 */
export function getUnavailableCheckInSlots(
  date: Date,
  periods: BookedPeriod[]
): Set<string> {
  const unavailable = new Set<string>()
  const minDurationMs = MIN_BOOKING_HOURS * 3600000
  const cleaningBufferMs = CLEANING_BUFFER_HOURS * 3600000
  const slots = [
    ...Array.from({ length: 24 }, (_, h) => ({ h, m: 0, str: `${h.toString().padStart(2, '0')}:00` })),
    { h: 23, m: 59, str: '23:59' },
  ]
  for (const { h, m, str } of slots) {
    const slot = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m)
    // Block if slot falls within an existing booking
    if (periods.some(p => slot >= p.checkIn && slot < p.checkOut)) {
      unavailable.add(str)
      continue
    }
    // Block if slot is within the 2-hour cleaning window after a booking ends
    // (the house needs time to be cleaned before the next guests arrive)
    if (periods.some(p => slot >= p.checkOut && slot.getTime() - p.checkOut.getTime() < cleaningBufferMs)) {
      unavailable.add(str)
      continue
    }
    // Block if the next booking starts before slot + MIN_BOOKING_HOURS,
    // leaving no valid checkout slot
    const minCheckOut = new Date(slot.getTime() + minDurationMs)
    if (periods.some(p => p.checkIn > slot && p.checkIn <= minCheckOut)) {
      unavailable.add(str)
    }
  }
  return unavailable
}

/**
 * Returns a Set of 'HH:MM' strings unavailable for check-out on the given date,
 * given the check-in datetime and minimum booking duration.
 */
export function getUnavailableCheckOutSlots(
  date: Date,
  checkInDateTime: Date,
  periods: BookedPeriod[]
): Set<string> {
  const minDurationMs = MIN_BOOKING_HOURS * 3600000
  const cleaningBufferMs = CLEANING_BUFFER_HOURS * 3600000
  const unavailable = new Set<string>()
  const slots = [
    ...Array.from({ length: 24 }, (_, h) => ({ h, m: 0, str: `${h.toString().padStart(2, '0')}:00` })),
    { h: 23, m: 59, str: '23:59' },
  ]
  for (const { h, m, str } of slots) {
    const slot = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m)
    // Too short
    if (slot.getTime() - checkInDateTime.getTime() < minDurationMs) {
      unavailable.add(str)
      continue
    }
    // Would overlap an existing booking
    if (periods.some(p => p.checkIn <= slot && p.checkOut > checkInDateTime)) {
      unavailable.add(str)
      continue
    }
    // The next booking starts within 2 hours of this checkout — not enough time to clean
    // (p.checkIn > slot ensures we only look at bookings AFTER the proposed checkout)
    if (periods.some(p => p.checkIn > slot && p.checkIn.getTime() - slot.getTime() < cleaningBufferMs)) {
      unavailable.add(str)
    }
  }
  return unavailable
}

/**
 * Get all booked dates (including check-in and all days in between)
 */
export function getBookedDates(): Date[] {
  const bookedDates: Date[] = []

  MOCK_BOOKED_PERIODS.forEach(period => {
    const current = new Date(period.checkIn)
    const end = new Date(period.checkOut)

    // Include all dates from check-in to check-out
    while (current < end) {
      bookedDates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
  })

  return bookedDates
}

/**
 * Check if a date is booked
 */
export function isDateBooked(date: Date): boolean {
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  return MOCK_BOOKED_PERIODS.some(period => {
    const checkIn = new Date(period.checkIn.getFullYear(), period.checkIn.getMonth(), period.checkIn.getDate())
    const checkOut = new Date(period.checkOut.getFullYear(), period.checkOut.getMonth(), period.checkOut.getDate())

    return dateOnly >= checkIn && dateOnly < checkOut
  })
}

/**
 * Check if a date range overlaps with any booked period
 */
export function isRangeAvailable(checkIn: Date, checkOut: Date): boolean {
  const checkInDate = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate())
  const checkOutDate = new Date(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate())

  return !MOCK_BOOKED_PERIODS.some(period => {
    const bookedStart = new Date(period.checkIn.getFullYear(), period.checkIn.getMonth(), period.checkIn.getDate())
    const bookedEnd = new Date(period.checkOut.getFullYear(), period.checkOut.getMonth(), period.checkOut.getDate())

    // Check if ranges overlap
    return checkInDate < bookedEnd && checkOutDate > bookedStart
  })
}

/**
 * Full tariff configuration sourced from the booking bot (tariff_rate.json).
 * These are the standard (weekend/holiday) prices.
 */
export const TARIFF_CONFIG: Record<TariffType, TariffConfig> = {
  'incognito-daily': {
    id: 'incognito-daily',
    botTariffId: 3,
    durationHours: 24,
    price: 900,
    saunaPrice: 0,
    secretRoomPrice: 0,
    extraBedroomPrice: 0,
    extraHourPrice: 30,
    extraPeoplePrice: 0,
    photoshootPrice: 0,   // included in tariff price
    maxPeople: 6,
    isCheckInTimeLimit: false,
    hasPhotoshoot: true,
    hasTransfer: true,
    multiDayPrices: { 1: 900, 2: 1600, 3: 2300, 4: 3000, 5: 3700, 6: 4400, 7: 5000, 8: 5500, 9: 6100, 10: 6600, 11: 5100, 12: 5600, 13: 6200, 14: 6500 }
  },
  'incognito-12h': {
    id: 'incognito-12h',
    botTariffId: 4,
    durationHours: 12,
    price: 600,
    saunaPrice: 0,
    secretRoomPrice: 0,
    extraBedroomPrice: 0,
    extraHourPrice: 30,
    extraPeoplePrice: 0,
    photoshootPrice: 100,
    maxPeople: 6,
    isCheckInTimeLimit: false,
    hasPhotoshoot: false,
    hasTransfer: true,
    multiDayPrices: {}
  },
  'incognito-work': {
    id: 'incognito-work',
    botTariffId: 5,
    durationHours: 11,
    price: 450,
    saunaPrice: 0,
    secretRoomPrice: 0,
    extraBedroomPrice: 0,
    extraHourPrice: 30,
    extraPeoplePrice: 0,
    photoshootPrice: 100,
    maxPeople: 6,
    isCheckInTimeLimit: true,
    hasPhotoshoot: false,
    hasTransfer: true,
    multiDayPrices: {}
  },
  'daily-3plus': {
    id: 'daily-3plus',
    botTariffId: 1,
    durationHours: 24,
    price: 700,
    saunaPrice: 100,
    secretRoomPrice: 0,
    extraBedroomPrice: 0,
    extraHourPrice: 30,
    extraPeoplePrice: 0,
    photoshootPrice: 100,
    maxPeople: 6,
    isCheckInTimeLimit: false,
    hasPhotoshoot: true,
    hasTransfer: false,
    multiDayPrices: { 1: 700, 2: 1100, 3: 1500, 4: 1900, 5: 2300, 6: 2700, 7: 3100, 8: 3500, 9: 3900, 10: 4300, 11: 4700, 12: 5100, 13: 5500, 14: 5900 }
  },
  'daily-couple': {
    id: 'daily-couple',
    botTariffId: 7,
    durationHours: 24,
    price: 500,
    saunaPrice: 100,
    secretRoomPrice: 0,
    extraBedroomPrice: 0,
    extraHourPrice: 30,
    extraPeoplePrice: 200,
    photoshootPrice: 100,
    maxPeople: 2,
    isCheckInTimeLimit: false,
    hasPhotoshoot: true,
    hasTransfer: false,
    multiDayPrices: { 1: 500, 2: 900, 3: 1200, 4: 1600, 5: 2000, 6: 2400, 7: 2800, 8: 3100, 9: 3500, 10: 3900, 11: 4300, 12: 4600, 13: 4900, 14: 5200 }
  },
  '12h-standard': {
    id: '12h-standard',
    botTariffId: 0,
    durationHours: 12,
    price: 250,
    saunaPrice: 100,
    secretRoomPrice: 70,
    extraBedroomPrice: 70,
    extraHourPrice: 30,
    extraPeoplePrice: 70,
    photoshootPrice: 0,
    maxPeople: 2,
    isCheckInTimeLimit: false,
    hasPhotoshoot: false,
    hasTransfer: false,
    multiDayPrices: {}
  },
  'work-standard': {
    id: 'work-standard',
    botTariffId: 2,
    durationHours: 11,
    price: 180,
    saunaPrice: 100,
    secretRoomPrice: 50,
    extraBedroomPrice: 50,
    extraHourPrice: 30,
    extraPeoplePrice: 100,
    photoshootPrice: 0,
    maxPeople: 2,
    isCheckInTimeLimit: true,
    hasPhotoshoot: false,
    hasTransfer: false,
    multiDayPrices: {}
  },
  'gift-certificate': {
    id: 'gift-certificate',
    botTariffId: -1,
    durationHours: 0,
    price: 0,
    saunaPrice: 0,
    secretRoomPrice: 0,
    extraBedroomPrice: 0,
    extraHourPrice: 0,
    extraPeoplePrice: 0,
    photoshootPrice: 0,
    maxPeople: 6,
    isCheckInTimeLimit: false,
    hasPhotoshoot: false,
    hasTransfer: false,
    multiDayPrices: {}
  }
}

/**
 * Sale (weekday) tariff configuration sourced from the booking bot (tariff_rate_sale.json).
 * Lower prices applied on weekdays and off-peak periods.
 */
export const TARIFF_SALE_CONFIG: Record<TariffType, TariffConfig> = {
  'incognito-daily': {
    id: 'incognito-daily',
    botTariffId: 3,
    durationHours: 24,
    price: 700,
    saunaPrice: 0,
    secretRoomPrice: 0,
    extraBedroomPrice: 0,
    extraHourPrice: 30,
    extraPeoplePrice: 0,
    photoshootPrice: 0,
    maxPeople: 6,
    isCheckInTimeLimit: false,
    hasPhotoshoot: true,
    hasTransfer: true,
    multiDayPrices: { 1: 700, 2: 1400, 3: 2000, 4: 2600, 5: 3200, 6: 3900, 7: 4500, 8: 5100, 9: 5700, 10: 6200, 11: 6600, 12: 7000, 13: 7100, 14: 7300 }
  },
  'incognito-12h': {
    id: 'incognito-12h',
    botTariffId: 4,
    durationHours: 12,
    price: 500,
    saunaPrice: 0,
    secretRoomPrice: 0,
    extraBedroomPrice: 0,
    extraHourPrice: 30,
    extraPeoplePrice: 0,
    photoshootPrice: 100,
    maxPeople: 6,
    isCheckInTimeLimit: false,
    hasPhotoshoot: false,
    hasTransfer: true,
    multiDayPrices: {}
  },
  'incognito-work': {
    id: 'incognito-work',
    botTariffId: 5,
    durationHours: 11,
    price: 400,
    saunaPrice: 0,
    secretRoomPrice: 0,
    extraBedroomPrice: 0,
    extraHourPrice: 30,
    extraPeoplePrice: 0,
    photoshootPrice: 100,
    maxPeople: 6,
    isCheckInTimeLimit: true,
    hasPhotoshoot: false,
    hasTransfer: true,
    multiDayPrices: {}
  },
  'daily-3plus': {
    id: 'daily-3plus',
    botTariffId: 1,
    durationHours: 24,
    price: 500,
    saunaPrice: 100,
    secretRoomPrice: 0,
    extraBedroomPrice: 0,
    extraHourPrice: 30,
    extraPeoplePrice: 0,
    photoshootPrice: 100,
    maxPeople: 6,
    isCheckInTimeLimit: false,
    hasPhotoshoot: true,
    hasTransfer: false,
    multiDayPrices: { 1: 500, 2: 950, 3: 1400, 4: 1800, 5: 2200, 6: 2600, 7: 3000, 8: 3400, 9: 3700, 10: 4000, 11: 4300, 12: 4500, 13: 4800, 14: 5000 }
  },
  'daily-couple': {
    id: 'daily-couple',
    botTariffId: 7,
    durationHours: 24,
    price: 400,
    saunaPrice: 100,
    secretRoomPrice: 0,
    extraBedroomPrice: 0,
    extraHourPrice: 30,
    extraPeoplePrice: 70,
    photoshootPrice: 100,
    maxPeople: 2,
    isCheckInTimeLimit: false,
    hasPhotoshoot: true,
    hasTransfer: false,
    multiDayPrices: { 1: 400, 2: 800, 3: 1200, 4: 1500, 5: 1800, 6: 2100, 7: 2500, 8: 2900, 9: 3200, 10: 3600, 11: 3900, 12: 4200, 13: 4600, 14: 4800 }
  },
  '12h-standard': {
    id: '12h-standard',
    botTariffId: 0,
    durationHours: 12,
    price: 200,
    saunaPrice: 100,
    secretRoomPrice: 70,
    extraBedroomPrice: 70,
    extraHourPrice: 30,
    extraPeoplePrice: 70,
    photoshootPrice: 0,
    maxPeople: 2,
    isCheckInTimeLimit: false,
    hasPhotoshoot: false,
    hasTransfer: false,
    multiDayPrices: {}
  },
  'work-standard': {
    id: 'work-standard',
    botTariffId: 2,
    durationHours: 11,
    price: 180,
    saunaPrice: 100,
    secretRoomPrice: 50,
    extraBedroomPrice: 50,
    extraHourPrice: 30,
    extraPeoplePrice: 100,
    photoshootPrice: 0,
    maxPeople: 2,
    isCheckInTimeLimit: true,
    hasPhotoshoot: false,
    hasTransfer: false,
    multiDayPrices: {}
  },
  'gift-certificate': {
    id: 'gift-certificate',
    botTariffId: -1,
    durationHours: 0,
    price: 0,
    saunaPrice: 0,
    secretRoomPrice: 0,
    extraBedroomPrice: 0,
    extraHourPrice: 0,
    extraPeoplePrice: 0,
    photoshootPrice: 0,
    maxPeople: 6,
    isCheckInTimeLimit: false,
    hasPhotoshoot: false,
    hasTransfer: false,
    multiDayPrices: {}
  }
}

/**
 * Returns the tariff config for the given tariff ID.
 * Defaults to the standard (weekend) config.
 */
export function getTariffConfig(tariffId: TariffType | string, sale = false): TariffConfig | undefined {
  const map = sale ? TARIFF_SALE_CONFIG : TARIFF_CONFIG
  return map[tariffId as TariffType]
}

// ─── Date-specific pricing rules ─────────────────────────────────────────────
// Mirrors the bot's src/config/date_pricing_rules.json.
// When the booking's check-in date falls within a rule's date range,
// priceOverride replaces the standard base-price calculation entirely.
const DATE_PRICING_RULES: Array<{
  ruleId: string
  /** Inclusive start date YYYY-MM-DD */
  startDate: string
  /** Inclusive end date YYYY-MM-DD */
  endDate: string
  /** Flat base price in BYN (replaces tariff calculation) */
  priceOverride: number
  isActive: boolean
  description: string
}> = [
  {
    ruleId: 'new_year_2025',
    startDate: '2025-12-31',
    endDate: '2026-01-02',
    priceOverride: 3000,
    isActive: true,
    description: 'Новогодние праздники',
  },
]

/**
 * Returns a base-price override when the check-in date falls within a special
 * pricing period. Mirrors DatePricingService.get_price_override() from the bot.
 * The override replaces the entire base-price calculation (tariff + extra hours).
 */
export function getDatePriceOverride(
  checkInDate: Date
): { price: number; description: string } | null {
  const y = checkInDate.getFullYear()
  const mm = String(checkInDate.getMonth() + 1).padStart(2, '0')
  const dd = String(checkInDate.getDate()).padStart(2, '0')
  const dateStr = `${y}-${mm}-${dd}`
  for (const rule of DATE_PRICING_RULES) {
    if (rule.isActive && dateStr >= rule.startDate && dateStr <= rule.endDate) {
      return { price: rule.priceOverride, description: rule.description }
    }
  }
  return null
}

/**
 * Tariff options with pricing
 */
export const TARIFF_OPTIONS: TariffOption[] = [
  {
    id: 'incognito-daily',
    name: 'Инкогнито (Суточно)',
    description: '24 часа с полной конфиденциальностью',
    basePrice: TARIFF_CONFIG['incognito-daily'].price,
    unit: '900 BYN'
  },
  {
    id: 'incognito-12h',
    name: 'Инкогнито (12 часов)',
    description: '12 часов с полной конфиденциальностью',
    basePrice: TARIFF_CONFIG['incognito-12h'].price,
    unit: '600 BYN'
  },
  {
    id: 'incognito-work',
    name: 'Инкогнито (Рабочий)',
    description: 'Будни с полной конфиденциальностью',
    basePrice: TARIFF_CONFIG['incognito-work'].price,
    unit: '450 BYN'
  },
  {
    id: 'daily-3plus',
    name: 'Суточно от 3 человек',
    description: '24 часа для компании от 3 человек',
    basePrice: TARIFF_CONFIG['daily-3plus'].price,
    unit: '700 BYN'
  },
  {
    id: 'daily-couple',
    name: 'Суточно для двоих',
    description: '24 часа для пары',
    basePrice: TARIFF_CONFIG['daily-couple'].price,
    unit: '500 BYN'
  },
  {
    id: '12h-standard',
    name: '12 часов',
    description: 'Стандартный тариф на 12 часов',
    basePrice: TARIFF_CONFIG['12h-standard'].price,
    unit: 'от 250 BYN'
  },
  {
    id: 'work-standard',
    name: 'Рабочий',
    description: 'Будние дни (пн-пт)',
    basePrice: TARIFF_CONFIG['work-standard'].price,
    unit: 'от 180 BYN'
  },
  {
    id: 'gift-certificate',
    name: 'Подарочный сертификат',
    description: 'Бронирование по коду сертификата',
    basePrice: 0,
    unit: 'Бесплатно с сертификатом'
  }
]

/**
 * Wine options with pricing
 */
export const WINE_OPTIONS: WineOption[] = [
  { id: 'none',             name: 'Не нужно вино',       description: '', price: 0 },
  { id: 'white-sweet',      name: 'Белое сладкое',        description: '', price: 0 },
  { id: 'white-semi-sweet', name: 'Белое полусладкое',    description: '', price: 0 },
  { id: 'white-dry',        name: 'Белое сухое',          description: '', price: 0 },
  { id: 'white-semi-dry',   name: 'Белое полусухое',      description: '', price: 0 },
  { id: 'red-sweet',        name: 'Красное сладкое',      description: '', price: 0 },
  { id: 'red-semi-sweet',   name: 'Красное полусладкое',  description: '', price: 0 },
  { id: 'red-dry',          name: 'Красное сухое',        description: '', price: 0 },
  { id: 'red-semi-dry',     name: 'Красное полусухое',    description: '', price: 0 },
]

/**
 * Calculate extra guest charge for guests beyond the tariff's included limit.
 * Formula mirrors the bot: (guestCount - maxPeople) * extraPeoplePrice
 */
export function calculateExtraGuestPrice(tariff: string, guestCount: number, sale = false): number {
  const config = getTariffConfig(tariff, sale)
  if (!config || config.extraPeoplePrice === 0) return 0
  const extra = Math.max(0, guestCount - config.maxPeople)
  return extra * config.extraPeoplePrice
}

/**
 * Calculate duration in hours between two dates
 */
export function calculateDuration(checkIn: Date, checkOut: Date): number {
  const diff = checkOut.getTime() - checkIn.getTime()
  return Math.ceil(diff / (1000 * 60 * 60)) // Round up to nearest hour
}

/**
 * Extra-hours price breakdown for a given duration.
 * Mirrors the bot's calculation_rate_service.py algorithm.
 */
export interface BasePriceBreakdown {
  basePrice: number
  /** For daily tariffs with extra hours: number of full days (after rounding rule) */
  days?: number
  /** Price from the multi-day lookup table for those days */
  dayPrice?: number
  /** Remaining hours beyond full days (0 = rounded up to next day) */
  remainderHours?: number
  /** Cost of the remaining hours */
  remainderPrice?: number
  /** For fixed tariffs: the session's included hours */
  includedHours?: number
  /** Extra hours beyond the included session */
  extraHours?: number
  /** Price per extra hour (set when extra hours apply) */
  extraHourPrice?: number
  /** Total cost of extra hours */
  extraPrice?: number
}

/**
 * Returns a detailed breakdown of the base price.
 * Mirrors the bot's calculation_rate_service.py algorithm exactly:
 *   extra_hours = duration - tariff.duration
 *   if extra_hours <= 0: price = tariff.price
 *   daily tariffs: floor(h/24) days + remainder; if remainder > 15 h round up to next day
 *   fixed tariffs: base_price + extra_hours * extra_hour_price
 */
export function getBasePriceBreakdown(tariff: string, durationHours: number, sale = false): BasePriceBreakdown | null {
  if (tariff === 'gift-certificate') return { basePrice: 0 }
  const config = getTariffConfig(tariff, sale)
  if (!config) return null

  const extraHours = durationHours - config.durationHours

  // Within the included session duration — just the base price
  if (extraHours <= 0) {
    return { basePrice: config.price }
  }

  // Daily tariffs: multi-day price table + remainder hours
  if (Object.keys(config.multiDayPrices).length > 0) {
    let totalDays = Math.floor(durationHours / 24)
    let remainderHours = durationHours % 24
    // Bot rule: remainder > 15 h rounds up to a full extra day
    if (remainderHours > 15) {
      totalDays += 1
      remainderHours = 0
    }
    const dayPrice = config.multiDayPrices[totalDays] ?? totalDays * config.price
    const remainderPrice = remainderHours * config.extraHourPrice
    return {
      basePrice: dayPrice + remainderPrice,
      days: totalDays,
      dayPrice,
      remainderHours,
      remainderPrice,
      extraHourPrice: config.extraHourPrice,
    }
  }

  // Fixed-duration tariffs (12h, work): base price + extra hours
  const extraPrice = extraHours * config.extraHourPrice
  return {
    basePrice: config.price + extraPrice,
    includedHours: config.durationHours,
    extraHours,
    extraHourPrice: config.extraHourPrice,
    extraPrice,
  }
}

/**
 * Calculate base price based on tariff and duration.
 * Delegates to getBasePriceBreakdown which mirrors the bot's algorithm exactly.
 */
export function calculateBasePrice(tariff: string, durationHours: number, sale = false): number {
  return getBasePriceBreakdown(tariff, durationHours, sale)?.basePrice ?? 0
}

/**
 * Calculate wine total price
 */
export function calculateWinePrice(wineSelection: string[]): number {
  return wineSelection.reduce((total, wineId) => {
    const wine = WINE_OPTIONS.find(w => w.id === wineId)
    return total + (wine?.price || 0)
  }, 0)
}

/**
 * Transfer price (flat rate, per direction).
 * Not part of the tariff config — charged separately.
 */
export const TRANSFER_PRICE = 300

// ---------------------------------------------------------------------------
// Prepayment calculation (mirrors bot's PrepaymentService)
// ---------------------------------------------------------------------------

/** Holidays that require 100% prepayment. MM-DD = recurring, YYYY-MM-DD = one-time. */
const HOLIDAY_DATES: string[] = [
  '12-31', '01-01', '01-02',  // New Year
  '01-07',                     // Orthodox Christmas
  '02-14',                     // Valentine's Day
  '02-23',                     // Defenders' Day
  '03-08',                     // Women's Day
  '2026-04-21',                // Radonitsa 2026
  '05-01',                     // Labour Day
  '05-09',                     // Victory Day
  '07-03',                     // Belarus Independence Day
  '11-07',                     // October Revolution
  '12-25',                     // Catholic Christmas
]

const HOLIDAY_NAMES: Record<string, string> = {
  '12-31': 'Новый год (31 декабря)',
  '01-01': 'Новый год (1 января)',
  '01-02': 'Новый год (2 января)',
  '01-07': 'Рождество Христово (православное)',
  '02-14': 'День всех влюблённых',
  '02-23': 'День защитников Отечества',
  '03-08': 'Международный женский день',
  '2026-04-21': 'Радуница',
  '05-01': 'Праздник труда',
  '05-09': 'День Победы',
  '07-03': 'День Независимости Республики Беларусь',
  '11-07': 'День Октябрьской революции',
  '12-25': 'Рождество Христово (католическое)',
}

function getHolidayKey(date: Date): string | null {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const yyyy = date.getFullYear()
  const specific = `${yyyy}-${mm}-${dd}`
  const recurring = `${mm}-${dd}`
  if (HOLIDAY_DATES.includes(specific)) return specific
  if (HOLIDAY_DATES.includes(recurring)) return recurring
  return null
}

export function getHolidayName(date: Date): string | null {
  const key = getHolidayKey(date)
  return key ? (HOLIDAY_NAMES[key] ?? null) : null
}

export function calculatePrepayment(totalPrice: number, checkInDate: Date): number {
  const key = getHolidayKey(checkInDate)
  return key ? totalPrice : Math.round(totalPrice * 0.5)
}

/**
 * Bedroom options
 */
export const BEDROOM_OPTIONS: { id: 'white' | 'green'; name: string; description: string }[] = [
  {
    id: 'white',
    name: 'Белая спальня',
    description: 'Современный минималистичный дизайн'
  },
  {
    id: 'green',
    name: 'Зеленая спальня',
    description: 'Уютная атмосфера с природными акцентами'
  }
]

/**
 * Calculate total price breakdown
 */
export function calculateTotalPrice(formData: Partial<BookingFormData>): {
  basePrice: number
  guestPrice: number
  winePrice: number
  transferPrice: number
  photoshootPrice: number
  saunaPrice: number
  extraBedroomPrice: number
  secretRoomPrice: number
  discount: number
  totalPrice: number
} {
  const basePrice = formData.basePrice || 0
  const guestPrice = formData.guestPrice || 0
  const winePrice = formData.winePrice || 0
  const transferPrice = formData.transferPrice || 0
  const photoshootPrice = formData.photoshootPrice || 0
  const saunaPrice = formData.saunaPrice || 0
  const extraBedroomPrice = formData.extraBedroomPrice || 0
  const secretRoomPrice = formData.secretRoomPrice || 0
  const discount = formData.promocodeDiscount || 0

  const totalPrice =
    basePrice +
    guestPrice +
    winePrice +
    transferPrice +
    photoshootPrice +
    saunaPrice +
    extraBedroomPrice +
    secretRoomPrice -
    discount

  return {
    basePrice,
    guestPrice,
    winePrice,
    transferPrice,
    photoshootPrice,
    saunaPrice,
    extraBedroomPrice,
    secretRoomPrice,
    discount,
    totalPrice: Math.max(0, totalPrice)
  }
}

/**
 * Validate promo code
 * TODO: Replace with API call
 */
export async function validatePromocode(
  code: string,
  bookingDate?: Date,
  tariff?: string,
): Promise<{
  valid: boolean
  discount: number
  discountPercentage: number
  message: string
  promocodeId?: number
}> {
  const date = bookingDate ?? new Date()
  const dateStr = date.toISOString().slice(0, 10)
  const tariffStr = tariff ?? '12h-standard'

  const result = await validatePromocodeApi(code, dateStr, tariffStr)

  return {
    valid: result.valid,
    discount: result.discount,
    discountPercentage: result.discountPercentage,
    message: result.message,
    promocodeId: result.promocodeId,
  }
}

/**
 * Submit a completed booking to the backend API.
 * Returns the new booking ID and a confirmation message.
 */
export async function submitBookingForm(
  formData: BookingFormData,
): Promise<{ bookingId: number; message: string }> {
  const payload: BookingCreatePayload = {
    checkInDate: new Date(
      formData.checkInDate.toDateString() + ' ' + formData.checkInTime,
    ).toISOString(),
    checkOutDate: new Date(
      formData.checkOutDate.toDateString() + ' ' + formData.checkOutTime,
    ).toISOString(),
    tariff: formData.tariff,
    giftCertificateCode: formData.giftCertificateCode,
    guestCount: formData.guestCount,
    hasPhotoshoot: formData.hasPhotoshoot ?? false,
    hasSauna: formData.hasSauna ?? false,
    bedroomType: formData.bedroomType,
    hasExtraBedroom: formData.hasExtraBedroom ?? false,
    hasSecretRoom: formData.hasSecretRoom ?? false,
    comment: formData.comment,
    promocode: formData.promocode,
    wineSelection: formData.wineSelection ?? [],
    needsTransfer: formData.needsTransfer ?? false,
    transferAddress: formData.transferAddress,
    totalPrice: formData.totalPrice,
    contactType: formData.contactType,
    telegram: formData.telegram,
    phone: formData.phone,
  }

  return submitBookingApi(payload)
}

/**
 * Format booking for Telegram message
 */
export function formatBookingMessage(formData: BookingFormData): string {
  const tariffName = TARIFF_OPTIONS.find(t => t.id === formData.tariff)?.name || formData.tariff
  const wineNames = formData.wineSelection
    .map(id => WINE_OPTIONS.find(w => w.id === id)?.name)
    .filter(Boolean)
    .join(', ')

  return `
🏠 <b>Новое бронирование</b>

📅 <b>Тариф:</b> ${tariffName}
👥 <b>Гостей:</b> ${formData.guestCount}

⏰ <b>Заезд:</b> ${formData.checkInDate.toLocaleDateString('ru-RU')} ${formData.checkInTime}
⏰ <b>Выезд:</b> ${formData.checkOutDate.toLocaleDateString('ru-RU')} ${formData.checkOutTime}
⏱️ <b>Длительность:</b> ${formData.durationHours} ч

📝 <b>Комментарий:</b> ${formData.comment || 'Нет'}

🍷 <b>Вино:</b> ${wineNames || 'Не выбрано'}
🚗 <b>Трансфер:</b> ${formData.needsTransfer ? `Да (${formData.transferAddress})` : 'Нет'}

💰 <b>Итого:</b> ${formData.totalPrice} BYN
${formData.promocodeDiscount ? `🎁 <b>Скидка:</b> -${formData.promocodeDiscount} BYN` : ''}

📱 <b>Контакт:</b> ${formData.contactType === 'telegram' ? `@${formData.telegram}` : formData.phone}

🆔 <b>ID бронирования:</b> ${formData.bookingId}
  `.trim()
}

/**
 * Save form data to localStorage
 */
export function saveFormToLocalStorage(formData: Partial<BookingFormData>): void {
  try {
    // Exclude File objects (can't serialize)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { receiptFile, ...serializable } = formData

    // Convert dates to ISO strings for JSON serialization
    const dataToSave = {
      ...serializable,
      checkInDate: serializable.checkInDate?.toISOString(),
      checkOutDate: serializable.checkOutDate?.toISOString()
    }

    sessionStorage.setItem('booking-form-draft', JSON.stringify(dataToSave))
  } catch (error) {
    console.error('Failed to save form to localStorage:', error)
  }
}

/**
 * Load form data from localStorage
 */
export function loadFormFromLocalStorage(): Partial<BookingFormData> | null {
  try {
    const saved = sessionStorage.getItem('booking-form-draft')
    if (!saved) return null

    const data = JSON.parse(saved)

    // Convert ISO strings back to Date objects
    if (data.checkInDate) data.checkInDate = new Date(data.checkInDate)
    if (data.checkOutDate) data.checkOutDate = new Date(data.checkOutDate)

    return data
  } catch (error) {
    console.error('Failed to load form from localStorage:', error)
    return null
  }
}

/**
 * Clear form from localStorage
 */
export function clearFormFromLocalStorage(): void {
  sessionStorage.removeItem('booking-form-draft')
}

/**
 * Generate booking ID
 */
export function generateBookingId(): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 7)
  return `BK-${timestamp}-${randomStr}`.toUpperCase()
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  // Belarus phone format: +375XXXXXXXXX
  const phoneRegex = /^\+375\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * Validate Telegram username
 */
export function validateTelegramUsername(username: string): boolean {
  // Remove @ if present
  const cleanUsername = username.replace('@', '')
  // Telegram username: 5-32 characters, letters, digits, underscores
  const telegramRegex = /^[a-zA-Z0-9_]{5,32}$/
  return telegramRegex.test(cleanUsername)
}
