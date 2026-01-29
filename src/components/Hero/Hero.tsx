import { openTelegramBot } from '../../utils/telegram'
import { scrollToElement } from '../../utils/scroll'

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-luxury-gradient overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-48 sm:w-64 lg:w-72 h-48 sm:h-64 lg:h-72 bg-gradient-to-br from-yellow-600 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-64 sm:w-80 lg:w-96 h-64 sm:h-80 lg:h-96 bg-gradient-to-tl from-yellow-700 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Decorative line */}
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent mx-auto mb-8"></div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 tracking-tight">
          <span className="text-luxury-gold">Secret</span>
          <span className="text-white"> House</span>
        </h1>

        {/* Decorative line */}
        <div className="w-32 h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent mx-auto mb-8"></div>

        {/* Subheading */}
        <p className="text-xl sm:text-2xl lg:text-3xl text-gray-300 mb-4 max-w-4xl mx-auto font-light leading-relaxed">
          Закрытый дом для пар, где эстетика встречается с искушением.
        </p>
        <p className="text-lg sm:text-xl text-gray-400 mb-16 max-w-3xl mx-auto font-light leading-relaxed">
          Профессионально оборудованная Red Room, продуманный свет и полная анонимность.
          <span className="block mt-2 text-yellow-600/80">Позвольте себе сценарий, о котором раньше только мечтали.</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          {/* Primary CTA - Book via Telegram */}
          <button
            onClick={() => openTelegramBot()}
            className="group relative w-full sm:w-auto bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-500 text-black font-bold py-5 px-8 sm:px-12 rounded-none transition-all duration-500 shadow-luxury hover:shadow-luxury-hover hover:scale-105 uppercase tracking-widest text-sm"
          >
            <span className="relative z-10">Забронировать</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
          </button>

          {/* Secondary CTA - View Rooms */}
          <button
            onClick={() => scrollToElement('gallery-preview')}
            className="w-full sm:w-auto bg-transparent text-white font-semibold py-5 px-8 sm:px-12 rounded-none transition-all duration-500 border border-yellow-600 hover:bg-yellow-600 hover:bg-opacity-10 uppercase tracking-widest text-sm hover:scale-105"
          >
            Интерьер
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center gap-2">
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-yellow-600 to-transparent"></div>
            <svg
              className="w-6 h-6 text-yellow-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
