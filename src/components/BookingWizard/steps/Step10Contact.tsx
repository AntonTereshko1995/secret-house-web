import { useState } from 'react'
import { validateTelegramUsername, validatePhoneNumber } from '../../../utils/booking'
import type { BookingFormData, ContactType } from '../../../types/booking.types'

interface StepProps {
  formData: Partial<BookingFormData>
  updateFormData: (data: Partial<BookingFormData>) => void
  nextStep: () => void
  prevStep: () => void
}

function Step10Contact({ formData, updateFormData, nextStep, prevStep }: StepProps) {
  const [contactType, setContactType] = useState<ContactType>(
    formData.contactType || 'telegram'
  )
  const [telegram, setTelegram] = useState(formData.telegram || '')
  const [phone, setPhone] = useState(formData.phone || '')

  const handleNext = () => {
    if (contactType === 'telegram') {
      const cleanTelegram = telegram.replace('@', '')
      if (!validateTelegramUsername(cleanTelegram)) {
        alert('Пожалуйста, введите корректный Telegram username (5-32 символа, буквы, цифры, подчеркивания)')
        return
      }
      updateFormData({
        contactType,
        telegram: cleanTelegram,
        phone: undefined
      })
    } else {
      if (!validatePhoneNumber(phone)) {
        alert('Пожалуйста, введите корректный номер телефона в формате +375XXXXXXXXX')
        return
      }
      updateFormData({
        contactType,
        phone,
        telegram: undefined
      })
    }
    nextStep()
  }

  return (
    <div className="bg-gray-900 p-5 sm:p-6 rounded-lg border border-yellow-600/30">
      <h2 className="text-2xl sm:text-3xl font-bold text-luxury-gold mb-6 uppercase tracking-wider">
        Контактная информация
      </h2>
      <p className="text-gray-400 mb-6">
        Как нам с вами связаться?
      </p>

      {/* Contact Type Toggle */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setContactType('telegram')}
          className={`
            p-6 border-2 rounded-lg font-bold uppercase tracking-wider transition-all
            ${contactType === 'telegram'
              ? 'border-yellow-600 bg-yellow-600/10 text-white'
              : 'border-gray-700 text-gray-400 hover:border-yellow-600/50'}
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
              ? 'border-yellow-600 bg-yellow-600/10 text-white'
              : 'border-gray-700 text-gray-400 hover:border-yellow-600/50'}
          `}
        >
          <div className="text-3xl mb-2">📞</div>
          Телефон
        </button>
      </div>

      {/* Input Fields */}
      {contactType === 'telegram' ? (
        <div className="mb-6">
          <label className="block text-white font-semibold mb-2 uppercase text-sm tracking-wider">
            Telegram Username
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
              @
            </span>
            <input
              type="text"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value.replace('@', ''))}
              placeholder="username"
              className="w-full bg-black border-2 border-gray-700 focus:border-yellow-600 text-white px-4 py-3 pl-10 rounded-lg outline-none transition-colors"
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
            className="w-full bg-black border-2 border-gray-700 focus:border-yellow-600 text-white px-4 py-3 rounded-lg outline-none transition-colors"
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

      {/* Info Box */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <div className="text-gray-400 text-sm">
          💡 Мы свяжемся с вами {contactType === 'telegram' ? 'в Telegram' : 'по телефону'} в течение 15 минут для подтверждения бронирования.
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={prevStep}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 uppercase tracking-wider transition-all"
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
          className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-bold py-3 px-6 uppercase tracking-wider transition-all shadow-lg hover:shadow-xl"
        >
          Далее
        </button>
      </div>
    </div>
  )
}

export default Step10Contact
