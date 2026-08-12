import type { TariffType, ContactType } from './booking.types'

export type GiftTariffType = Exclude<TariffType, 'gift-certificate'>

export type GiftStep =
  | 'tariff'
  | 'bedroom'
  | 'secret-room'
  | 'sauna'
  | 'bath-tub'
  | 'summary'
  | 'contact'
  | 'payment'
  | 'success'

export interface GiftFormData {
  tariff?: GiftTariffType
  hasSauna: boolean
  hasSecretRoom: boolean
  hasExtraBedroom: boolean
  hasBathTub: boolean
  saunaPrice: number
  secretRoomPrice: number
  extraBedroomPrice: number
  bathTubPrice: number
  totalPrice: number
  contactType: ContactType
  telegram?: string
  phone?: string
  receiptFile?: File
}

export interface GiftStepProps {
  giftData: GiftFormData
  updateGiftData: (data: Partial<GiftFormData>) => void
  nextStep: () => void
  prevStep: () => void
}
