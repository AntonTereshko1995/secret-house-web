export type TariffType =
  | 'incognito-daily'
  | 'incognito-12h'
  | 'incognito-work'
  | 'daily-3plus'
  | 'daily-couple'
  | '12h-standard'
  | 'work-standard'
  | 'gift-certificate'

export type ContactType = 'telegram' | 'phone'

export type BedroomType = 'white' | 'green'

export type StepType =
  | 'tariff'
  | 'checkin'
  | 'checkout'
  | 'guests'
  | 'photoshoot'
  | 'sauna'
  | 'bedroom'
  | 'extra-bedroom'
  | 'secret-room'
  | 'comment'
  | 'promocode'
  | 'wine'
  | 'transfer'
  | 'summary'
  | 'contact'
  | 'receipt'

export interface TariffOption {
  id: TariffType
  name: string
  description: string
  basePrice: number
  unit: string
}

export interface WineOption {
  id: string
  name: string
  description: string
  price: number
}

export interface BookingFormData {
  // Step 1: Tariff
  tariff: TariffType
  giftCertificateCode?: string

  // Step 2: Check-in
  checkInDate: Date
  checkInTime: string

  // Step 3: Check-out
  checkOutDate: Date
  checkOutTime: string

  // Step 4: Guests
  guestCount: number

  // Step 5: Photoshoot
  hasPhotoshoot?: boolean
  photoshootPrice?: number

  // Step 6: Sauna
  hasSauna?: boolean
  saunaPrice?: number

  // Step 7: Bedroom
  bedroomType?: BedroomType

  // Step 8: Extra bedroom
  hasExtraBedroom?: boolean
  extraBedroomPrice?: number

  // Step 9: Secret room
  hasSecretRoom?: boolean
  secretRoomPrice?: number

  // Step 10: Comment
  comment?: string

  // Step 11: Promocode
  promocode?: string
  promocodeDiscount?: number
  promocodeValid?: boolean

  // Step 12: Wine
  wineSelection: string[]
  winePrice: number

  // Step 13: Transfer
  needsTransfer: boolean
  transferAddress?: string
  transferTime?: string
  transferBothDirections?: boolean
  transferReturnAddress?: string
  transferReturnTime?: string
  transferPrice: number

  // Step 14: Summary (calculated)
  basePrice: number
  totalPrice: number
  durationHours: number

  // Step 15: Contact
  contactType: ContactType
  telegram?: string
  phone?: string

  // Step 16: Receipt
  receiptFile?: File
  receiptPreview?: string

  // Metadata
  submittedAt?: Date
  bookingId?: string
  termsAccepted: boolean
}

export interface BookingSubmission {
  formData: BookingFormData
  receiptFile?: File
}

export interface StepProps {
  formData: Partial<BookingFormData>
  updateFormData: (data: Partial<BookingFormData>) => void
  nextStep: () => void
  prevStep: () => void
  jumpToStep?: (index: number) => void
  onSubmit?: () => void
}

export interface StepConfig {
  id: string
  type: StepType
  component: React.ComponentType<StepProps>
  title: string
  shortTitle: string
  shouldShow: (formData: Partial<BookingFormData>) => boolean
  requiredFields?: (keyof BookingFormData)[]
}
