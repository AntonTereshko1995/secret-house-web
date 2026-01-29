import { useEffect } from 'react'

function BookingRedirect() {
  useEffect(() => {
    const botUsername = import.meta.env.VITE_BOT_USERNAME || 'the_secret_house_booking_bot'
    const telegramUrl = `https://t.me/${botUsername}`

    // Redirect immediately
    window.location.href = telegramUrl
  }, [])

  return (
    <div className="min-h-screen bg-luxury-gradient flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-3xl font-bold text-luxury-gold mb-4 uppercase tracking-wider">
          Перенаправление...
        </h2>
        <p className="text-gray-400 text-lg">
          Открываем Telegram бот для бронирования
        </p>
      </div>
    </div>
  )
}

export default BookingRedirect
