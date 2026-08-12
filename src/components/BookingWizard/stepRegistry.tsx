import type { StepConfig } from '../../types/booking.types'
import Step1Tariff from './steps/Step1Tariff'
import Step2Guests from './steps/Step2Guests'
import Step3CheckIn from './steps/Step3CheckIn'
import Step4CheckOut from './steps/Step4CheckOut'
import Step5Photoshoot from './steps/Step5Photoshoot'
import Step6Sauna from './steps/Step6Sauna'
import StepBathTub from './steps/StepBathTub'
import Step7Bedroom from './steps/Step7Bedroom'
import Step8ExtraBedroom from './steps/Step8ExtraBedroom'
import Step9SecretRoom from './steps/Step9SecretRoom'
import Step5Comment from './steps/Step5Comment'
import Step6Promocode from './steps/Step6Promocode'
import Step7Wine from './steps/Step7Wine'
import Step8Transfer from './steps/Step8Transfer'
import Step9Summary from './steps/Step9Summary'
import Step10Contact from './steps/Step10Contact'
import Step11Receipt from './steps/Step11Receipt'

/**
 * Master registry of all possible steps
 * Steps are ordered by their logical flow, but visibility is controlled by shouldShow()
 */
export const STEP_REGISTRY: StepConfig[] = [
  {
    id: 'tariff',
    type: 'tariff',
    component: Step1Tariff,
    title: 'Выбор тарифа',
    shortTitle: 'Тариф',
    shouldShow: () => true,  // Always show
    requiredFields: ['tariff']
  },
  {
    id: 'checkin',
    type: 'checkin',
    component: Step3CheckIn,
    title: 'Дата и время заезда',
    shortTitle: 'Заезд',
    shouldShow: () => true,  // Always show
    requiredFields: ['checkInDate', 'checkInTime']
  },
  {
    id: 'checkout',
    type: 'checkout',
    component: Step4CheckOut,
    title: 'Дата и время выезда',
    shortTitle: 'Выезд',
    shouldShow: () => true,  // Always show
    requiredFields: ['checkOutDate', 'checkOutTime']
  },
  {
    id: 'guests',
    type: 'guests',
    component: Step2Guests,
    title: 'Количество гостей',
    shortTitle: 'Гости',
    shouldShow: () => true,  // Always show
    requiredFields: ['guestCount']
  },
  {
    id: 'photoshoot',
    type: 'photoshoot',
    component: Step5Photoshoot,
    title: 'Фотосессия',
    shortTitle: 'Фото',
    shouldShow: (data) => {
      const tariff = data.tariff
      // Show for incognito-daily, daily-couple, daily-3plus
      return tariff === 'incognito-daily' ||
             tariff === 'daily-couple' ||
             tariff === 'daily-3plus'
    }
  },
  {
    id: 'wine',
    type: 'wine',
    component: Step7Wine,
    title: 'Выбор вина',
    shortTitle: 'Вино',
    shouldShow: (data) => {
      const tariff = data.tariff
      return tariff === 'incognito-daily' ||
             tariff === 'incognito-12h' ||
             tariff === 'incognito-work'
    }
  },
  {
    id: 'transfer',
    type: 'transfer',
    component: Step8Transfer,
    title: 'Трансфер',
    shortTitle: 'Трансфер',
    shouldShow: (data) => {
      const tariff = data.tariff
      return tariff === 'incognito-daily' ||
             tariff === 'incognito-12h' ||
             tariff === 'incognito-work'
    }
  },
  {
    id: 'sauna',
    type: 'sauna',
    component: Step6Sauna,
    title: 'Сауна',
    shortTitle: 'Сауна',
    shouldShow: (data) => {
      const tariff = data.tariff
      const supportsSauna = tariff === 'daily-couple' ||
             tariff === 'daily-3plus' ||
             tariff === '12h-standard' ||
             tariff === 'work-standard'
      // Skip if option is already covered by the gift certificate
      if (data.giftId && data.giftHasSauna) return false
      return supportsSauna
    }
  },
  {
    id: 'bath-tub',
    type: 'bath-tub',
    component: StepBathTub,
    title: 'Банный чан',
    shortTitle: 'Чан',
    shouldShow: (data) => {
      if (data.giftId && data.giftHasBathTub) return false
      return !!data.tariff && data.tariff !== 'gift-certificate'
    }
  },
  {
    id: 'bedroom',
    type: 'bedroom',
    component: Step7Bedroom,
    title: 'Выбор спальни',
    shortTitle: 'Спальня',
    shouldShow: (data) => {
      const tariff = data.tariff
      if (!tariff || (tariff !== '12h-standard' && tariff !== 'work-standard')) return false
      // Skip if gift certificate already includes both bedrooms
      if (data.giftId && data.giftHasAdditionalBedroom) return false
      return true
    },
    requiredFields: ['bedroomType']
  },
  {
    id: 'extra-bedroom',
    type: 'extra-bedroom',
    component: Step8ExtraBedroom,
    title: 'Дополнительная спальня',
    shortTitle: 'Доп спальня',
    shouldShow: (data) => {
      const tariff = data.tariff
      const supportsExtraBedroom = tariff === '12h-standard' || tariff === 'work-standard'
      // Skip if option is already covered by the gift certificate
      if (data.giftId && data.giftHasAdditionalBedroom) return false
      return supportsExtraBedroom
    }
  },
  {
    id: 'secret-room',
    type: 'secret-room',
    component: Step9SecretRoom,
    title: 'Секретная комната',
    shortTitle: 'Секрет',
    shouldShow: (data) => {
      const tariff = data.tariff
      const supportsSecretRoom = tariff === '12h-standard' || tariff === 'work-standard'
      // Skip if option is already covered by the gift certificate
      if (data.giftId && data.giftHasSecretRoom) return false
      return supportsSecretRoom
    }
  },
  {
    id: 'comment',
    type: 'comment',
    component: Step5Comment,
    title: 'Комментарий',
    shortTitle: 'Комментарий',
    shouldShow: () => true  // Always show
  },
  {
    id: 'promocode',
    type: 'promocode',
    component: Step6Promocode,
    title: 'Промокод',
    shortTitle: 'Промокод',
    shouldShow: (data) => !data.giftId
  },
  {
    id: 'summary',
    type: 'summary',
    component: Step9Summary,
    title: 'Финальное подтверждение',
    shortTitle: 'Итого',
    shouldShow: () => true,  // Always show
    requiredFields: ['termsAccepted']
  },
  {
    id: 'contact',
    type: 'contact',
    component: Step10Contact,
    title: 'Контактная информация',
    shortTitle: 'Контакт',
    shouldShow: () => true,  // Always show
    requiredFields: ['contactType']
  },
  {
    id: 'receipt',
    type: 'receipt',
    component: Step11Receipt,
    title: 'Подтверждение оплаты',
    shortTitle: 'Чек',
    shouldShow: (data) => {
      if (!data.giftId) return true
      // Hide receipt if gift fully covers the booking
      const totalPrice = data.totalPrice ?? 0
      const giftPrice = data.giftPrice ?? 0
      return totalPrice > giftPrice
    },
  },
]
