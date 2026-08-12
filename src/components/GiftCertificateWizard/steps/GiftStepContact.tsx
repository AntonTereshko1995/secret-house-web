import { useState } from 'react'
import { validateTelegramUsername, validatePhoneNumber } from '../../../utils/booking'
import { logger } from '../../../services/logger'
import type { GiftStepProps } from '../../../types/gift.types'
import type { ContactType } from '../../../types/booking.types'

function GiftStepContact({ giftData, updateGiftData, nextStep, prevStep }: GiftStepProps) {
  const [contactType, setContactType] = useState<ContactType>(giftData.contactType)
  const [telegram, setTelegram] = useState(giftData.telegram ?? '')
  const [phone, setPhone] = useState(giftData.phone ?? '')

  const handleNext = () => {
    if (contactType === 'telegram') {
      const clean = telegram.replace('@', '')
      if (!validateTelegramUsername(clean)) {
        alert('Пожалуйста, введите корректный Telegram username (5-32 символа, буквы, цифры, подчеркивания)')
        return
      }
      updateGiftData({ contactType, telegram: clean, phone: undefined })
    } else {
      if (!validatePhoneNumber(phone)) {
        alert('Пожалуйста, введите корректный номер телефона в формате +375XXXXXXXXX')
        return
      }
      updateGiftData({ contactType, phone, telegram: undefined })
    }
    logger.info('gift_select', {
      step: 'contact',
      contactType,
      contact: contactType === 'telegram' ? `@${telegram.replace('@', '')}` : phone,
    })
    nextStep()
  }

  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-2xl">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-2 uppercase tracking-wider">
        Контактная информация
      </h2>
      <p className="text-gray-400 mb-3 text-sm">
        Как нам с вами связаться?
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setContactType('telegram')}
          className={`
            p-6 border-2 rounded-lg font-bold uppercase tracking-wider transition-all
            ${contactType === 'telegram'
              ? 'border-amber-400 bg-amber-400/10 text-white'
              : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}
          `}
        >
          <div className="text-3xl mb-2">📱</div>
          Telegram
        </button>
        <button
          onClick={() => setContactType('phone')}
          className={`
            p-6 border-2 rounded-lg font-bold uppercase tracking-wider transition-all
            ${contactType === 'phone'
              ? 'border-amber-400 bg-amber-400/10 text-white'
              : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}
          `}
        >
          <div className="text-3xl mb-2">📞</div>
          Телефон
        </button>
      </div>

      {contactType === 'telegram' ? (
        <div className="mb-6">
          <label className="block text-white font-semibold mb-2 uppercase text-sm tracking-wider">
            Telegram Username
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">@</span>
            <input
              type="text"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value.replace('@', ''))}
              placeholder="username"
              className="w-full bg-black border-2 border-gray-700 focus:border-amber-400 text-white px-4 py-3 pl-10 rounded-lg outline-none transition-colors"
            />
          </div>
          <div className="mt-2 text-gray-400 text-sm">
            Введите ваш Telegram username без символа @
          </div>
          {telegram && !validateTelegramUsername(telegram) && (
            <div className="mt-2 text-red-500 text-sm">
              ⚠️ Username должен содержать 5-32 символа (буквы, цифры, подчеркивания)
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6">
          <label className="block text-white font-semibold mb-2 uppercase text-sm tracking-wider">
            Номер телефона
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+375XXXXXXXXX"
            className="w-full bg-black border-2 border-gray-700 focus:border-amber-400 text-white px-4 py-3 rounded-lg outline-none transition-colors"
          />
          <div className="mt-2 text-gray-400 text-sm">
            Формат: +375 + 9 цифр (например, +375291234567)
          </div>
          {phone && !validatePhoneNumber(phone) && (
            <div className="mt-2 text-red-500 text-sm">
              ⚠️ Неверный формат номера телефона
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={prevStep}
          className="flex-1 border border-zinc-600 bg-transparent hover:bg-zinc-800/50 text-zinc-300 font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-all"
        >
          Назад
        </button>
        <button
          onClick={handleNext}
          disabled={
            contactType === 'telegram'
              ? !telegram || !validateTelegramUsername(telegram)
              : !phone || !validatePhoneNumber(phone)
          }
          className="flex-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-all"
        >
          Далее
        </button>
      </div>
    </div>
  )
}

export default GiftStepContact
