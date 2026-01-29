import Hero from '../components/Hero'
import GalleryPreview from '../components/GalleryPreview'
import Amenities from '../components/Amenities'
import Location from '../components/Location'
import type { RoomCategory } from '../types/gallery.types'

interface HomePageProps {
  onOpenGallery: (category?: RoomCategory) => void
}

function HomePage({ onOpenGallery }: HomePageProps) {
  return (
    <>
      <Hero />
      <GalleryPreview onOpenFullGallery={onOpenGallery} />
      <Amenities />
      <Location />

      {/* Footer */}
      <footer className="bg-black border-t border-yellow-600/20 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center">
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent mb-8"></div>
            <h3 className="text-3xl font-bold text-luxury-gold mb-8">Secret House</h3>

            {/* Social Links */}
            <div className="flex items-center justify-center gap-4 sm:gap-8 mb-8">
              {/* Telegram Admin */}
              <div className="flex flex-col items-center gap-2">
                <a
                  href={`https://t.me/${import.meta.env.VITE_TELEGRAM_ADMIN}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center w-14 h-14 border-2 border-yellow-600/50 hover:border-yellow-600 hover:bg-yellow-600/10 transition-all duration-300"
                  aria-label="Telegram Admin"
                >
                  <svg className="w-7 h-7 text-yellow-600 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </a>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Админ</span>
              </div>

              {/* Telegram Channel */}
              <div className="flex flex-col items-center gap-2">
                <a
                  href={`https://t.me/${import.meta.env.VITE_TELEGRAM_CHANNEL}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center w-14 h-14 border-2 border-yellow-600/50 hover:border-yellow-600 hover:bg-yellow-600/10 transition-all duration-300"
                  aria-label="Telegram Channel"
                >
                  <svg className="w-7 h-7 text-yellow-600 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </a>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Канал</span>
              </div>

              {/* Instagram */}
              <div className="flex flex-col items-center gap-2">
                <a
                  href={`https://instagram.com/${import.meta.env.VITE_INSTAGRAM_USERNAME}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center w-14 h-14 border-2 border-yellow-600/50 hover:border-yellow-600 hover:bg-yellow-600/10 transition-all duration-300"
                  aria-label="Instagram"
                >
                  <svg className="w-7 h-7 text-yellow-600 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Instagram</span>
              </div>

              {/* Phone */}
              <div className="flex flex-col items-center gap-2">
                <a
                  href={`tel:${import.meta.env.VITE_PHONE_NUMBER}`}
                  className="group flex items-center justify-center w-14 h-14 border-2 border-yellow-600/50 hover:border-yellow-600 hover:bg-yellow-600/10 transition-all duration-300"
                  aria-label="Позвонить"
                >
                  <svg className="w-7 h-7 text-yellow-600 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </a>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Телефон</span>
              </div>
            </div>

            {/* Contact Info */}
            <div className="text-center mb-6">
              <a
                href={`tel:${import.meta.env.VITE_PHONE_NUMBER}`}
                className="text-yellow-600 hover:text-yellow-500 text-lg font-light tracking-wider transition-colors"
              >
                {import.meta.env.VITE_PHONE_NUMBER}
              </a>
            </div>

            <div className="w-32 h-px bg-gradient-to-r from-transparent via-yellow-600/30 to-transparent mb-6"></div>

            <p className="text-gray-500 text-sm uppercase tracking-widest">
              © {new Date().getFullYear()} Secret House. Все права защищены
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}

export default HomePage
