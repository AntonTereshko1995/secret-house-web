import type { BookingFormData, TariffOption, WineOption } from '../types/booking.types'

/**
 * Booked period interface
 */
export interface BookedPeriod {
  checkIn: Date
  checkOut: Date
  bookingId: string
}

/**
 * Mock booked periods (replace with API call in production)
 */
export const MOCK_BOOKED_PERIODS: BookedPeriod[] = [
  {
    checkIn: new Date(2026, 1, 18), // Feb 18, 2026
    checkOut: new Date(2026, 1, 20), // Feb 20, 2026
    bookingId: 'BK-001'
  },
  {
    checkIn: new Date(2026, 1, 22), // Feb 22, 2026
    checkOut: new Date(2026, 1, 23), // Feb 23, 2026
    bookingId: 'BK-002'
  },
  {
    checkIn: new Date(2026, 1, 25), // Feb 25, 2026
    checkOut: new Date(2026, 1, 28), // Feb 28, 2026
    bookingId: 'BK-003'
  },
  {
    checkIn: new Date(2026, 2, 3), // Mar 3, 2026
    checkOut: new Date(2026, 2, 5), // Mar 5, 2026
    bookingId: 'BK-004'
  }
]

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
 * Tariff options with pricing
 */
export const TARIFF_OPTIONS: TariffOption[] = [
  {
    id: 'incognito-daily',
    name: 'Инкогнито (Суточно)',
    description: '24 часа с полной конфиденциальностью',
    basePrice: 900,
    unit: '900 BYN'
  },
  {
    id: 'incognito-12h',
    name: 'Инкогнито (12 часов)',
    description: '12 часов с полной конфиденциальностью',
    basePrice: 600,
    unit: '600 BYN'
  },
  {
    id: 'incognito-work',
    name: 'Инкогнито (Рабочий)',
    description: 'Будни с полной конфиденциальностью',
    basePrice: 450,
    unit: '450 BYN'
  },
  {
    id: 'daily-3plus',
    name: 'Суточно от 3 человек',
    description: '24 часа для компании от 3 человек',
    basePrice: 700,
    unit: '700 BYN'
  },
  {
    id: 'daily-couple',
    name: 'Суточно для двоих',
    description: '24 часа для пары',
    basePrice: 500,
    unit: '500 BYN'
  },
  {
    id: '12h-standard',
    name: '12 часов',
    description: 'Стандартный тариф на 12 часов',
    basePrice: 250,
    unit: 'от 250 BYN'
  },
  {
    id: 'work-standard',
    name: 'Рабочий',
    description: 'Будние дни (пн-пт)',
    basePrice: 180,
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
  {
    id: 'champagne',
    name: 'Шампанское',
    description: 'Французское игристое вино',
    price: 500
  },
  {
    id: 'red-wine',
    name: 'Красное вино',
    description: 'Каберне Совиньон',
    price: 350
  },
  {
    id: 'white-wine',
    name: 'Белое вино',
    description: 'Шардоне',
    price: 350
  }
]

/**
 * Calculate duration in hours between two dates
 */
export function calculateDuration(checkIn: Date, checkOut: Date): number {
  const diff = checkOut.getTime() - checkIn.getTime()
  return Math.ceil(diff / (1000 * 60 * 60)) // Round up to nearest hour
}

/**
 * Calculate base price based on tariff and duration
 */
export function calculateBasePrice(tariff: string, durationHours: number): number {
  const tariffOption = TARIFF_OPTIONS.find(t => t.id === tariff)
  if (!tariffOption) return 0

  // Gift certificate has special handling
  if (tariff === 'gift-certificate') {
    return 0 // Price will be determined separately
  }

  // For fixed-price tariffs (daily, 12h, work)
  switch (tariff) {
    case 'incognito-daily':
    case 'daily-3plus':
    case 'daily-couple':
      // Daily tariffs - fixed price per day
      return Math.ceil(durationHours / 24) * tariffOption.basePrice

    case 'incognito-12h':
    case '12h-standard':
      // 12-hour tariffs - fixed price per 12 hours
      return Math.ceil(durationHours / 12) * tariffOption.basePrice

    case 'incognito-work':
    case 'work-standard':
      // Work day tariffs - fixed price
      return tariffOption.basePrice

    default:
      // Fallback to base price
      return tariffOption.basePrice
  }
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
 * Transfer price (flat rate, per direction)
 */
export const TRANSFER_PRICE = 300

/**
 * Additional service pricing
 */
export const PHOTOSHOOT_PRICE = 300  // BYN
export const SAUNA_PRICE = 200       // BYN
export const EXTRA_BEDROOM_PRICE = 150  // BYN
export const SECRET_ROOM_PRICE = 250    // BYN

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
  const winePrice = formData.winePrice || 0
  const transferPrice = formData.transferPrice || 0
  const photoshootPrice = formData.photoshootPrice || 0
  const saunaPrice = formData.saunaPrice || 0
  const extraBedroomPrice = formData.extraBedroomPrice || 0
  const secretRoomPrice = formData.secretRoomPrice || 0
  const discount = formData.promocodeDiscount || 0

  const totalPrice =
    basePrice +
    winePrice +
    transferPrice +
    photoshootPrice +
    saunaPrice +
    extraBedroomPrice +
    secretRoomPrice -
    discount

  return {
    basePrice,
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
export async function validatePromocode(code: string): Promise<{
  valid: boolean
  discount: number
  message: string
}> {
  // Mock validation - replace with actual API call
  const validCodes: Record<string, number> = {
    'SECRET10': 100,
    'WELCOME': 150,
    'VIP20': 200,
    'PROMO50': 50
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))

  const discount = validCodes[code.toUpperCase()] || 0

  return {
    valid: discount > 0,
    discount,
    message: discount > 0
      ? `Промокод применен! Скидка ${discount} BYN`
      : 'Промокод недействителен'
  }
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

    localStorage.setItem('booking-form-draft', JSON.stringify(dataToSave))
  } catch (error) {
    console.error('Failed to save form to localStorage:', error)
  }
}

/**
 * Load form data from localStorage
 */
export function loadFormFromLocalStorage(): Partial<BookingFormData> | null {
  try {
    const saved = localStorage.getItem('booking-form-draft')
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
  localStorage.removeItem('booking-form-draft')
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
