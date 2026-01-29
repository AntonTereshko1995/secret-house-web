import { useState, useEffect, useCallback } from 'react'
import type { GalleryItem, RoomCategory, GalleryManifest } from '../../types/gallery.types'

interface FullGalleryProps {
  isOpen: boolean
  onClose: () => void
  initialCategory?: RoomCategory
}

function FullGallery({ isOpen, onClose, initialCategory }: FullGalleryProps) {
  const [images, setImages] = useState<GalleryItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<RoomCategory | 'all'>('all')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const categories: Array<{ value: RoomCategory | 'all'; label: string; shortLabel: string }> = [
    { value: 'all', label: 'Все фото', shortLabel: 'Все' },
    { value: 'green-bedroom', label: 'Зеленая спальня', shortLabel: 'Зеленая' },
    { value: 'white-bedroom', label: 'Белая спальня', shortLabel: 'Белая' },
    { value: 'secret-room', label: 'Секретная комната', shortLabel: 'Секретная' },
    { value: 'sauna', label: 'Сауна', shortLabel: 'Сауна' },
    { value: 'first-floor', label: '1й этаж', shortLabel: '1 этаж' },
    { value: 'first-bathroom', label: '1-ая ванная', shortLabel: '1 ванная' },
    { value: 'second-bathroom', label: '2-ая ванная', shortLabel: '2 ванная' },
    { value: 'terrace', label: 'Терраса', shortLabel: 'Терраса' },
  ]

  // Load images
  useEffect(() => {
    import('../../data/gallery-manifest.json')
      .then((data) => {
        const manifest = data as GalleryManifest
        setImages(manifest.items)
      })
      .catch(console.error)
  }, [])

  // Set initial category when gallery opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(initialCategory || 'all')
    }
  }, [isOpen, initialCategory])

  // Filter images
  const filteredImages = selectedCategory === 'all'
    ? images
    : images.filter(img => img.category === selectedCategory)

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isLightboxOpen) {
          setIsLightboxOpen(false)
        } else {
          onClose()
        }
      } else if (isLightboxOpen) {
        if (e.key === 'ArrowLeft') {
          setCurrentIndex(prev => Math.max(0, prev - 1))
        } else if (e.key === 'ArrowRight') {
          setCurrentIndex(prev => Math.min(filteredImages.length - 1, prev + 1))
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLightboxOpen, onClose, filteredImages.length])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY

      // Add lock class to body
      document.body.classList.add('body-scroll-lock')

      // Set top position to maintain scroll position visually
      document.body.style.top = `-${scrollY}px`

      return () => {
        // Remove lock class
        document.body.classList.remove('body-scroll-lock')

        // Restore scroll position
        document.body.style.top = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen])

  const openLightbox = useCallback((index: number) => {
    setCurrentIndex(index)
    setIsLightboxOpen(true)
  }, [])

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false)
  }, [])

  if (!isOpen) return null

  return (
    <>
      {/* Gallery Modal */}
      <div className="fixed inset-0 z-40 bg-black overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-luxury-gradient border-b border-yellow-600/20 backdrop-blur-lg">
          <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-6">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-xl sm:text-3xl font-bold text-luxury-gold uppercase tracking-wide sm:tracking-wider flex-shrink">
                Галерея
              </h2>
              <button
                onClick={onClose}
                className="p-2 sm:p-3 border border-yellow-600/50 hover:bg-yellow-600/10 transition-all duration-300 text-yellow-600"
                aria-label="Close gallery"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Category Filters */}
            <div className="w-full grid grid-cols-4 sm:flex sm:flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-6 overflow-hidden">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`
                    w-full px-1 py-2 text-[8px] sm:w-auto sm:px-4 sm:py-3 sm:text-sm font-bold text-center transition-all duration-500 uppercase tracking-tighter sm:tracking-wider border sm:border-2 min-w-0
                    ${selectedCategory === cat.value
                      ? 'bg-yellow-600 text-black border-yellow-600'
                      : 'bg-transparent text-yellow-600 border-yellow-600/50 hover:bg-yellow-600/10'
                    }
                  `}
                >
                  <span className="sm:hidden block leading-tight">{cat.shortLabel}</span>
                  <span className="hidden sm:inline whitespace-nowrap">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="w-full max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 py-2 sm:py-8">
          {filteredImages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">
                Фотографии скоро появятся
              </p>
            </div>
          ) : (
            <div className="w-full grid grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-8">
              {filteredImages.map((image, index) => (
                <div
                  key={image.id}
                  className="group relative overflow-hidden shadow-luxury hover:shadow-luxury-hover transition-all duration-500 bg-luxury-card border border-yellow-600/20 w-full"
                >
                  {/* Image */}
                  <div
                    className="relative w-full aspect-[4/3] cursor-pointer overflow-hidden"
                    onClick={() => openLightbox(index)}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-yellow-600/10 transition-all duration-500" />

                    {/* Gold border effect on hover */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-yellow-600/50 transition-all duration-500"></div>

                    {/* Zoom icon on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-black/70 backdrop-blur-sm p-4 border border-yellow-600/50">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2 sm:p-4 border border-yellow-600/50 hover:bg-yellow-600/10 transition-all duration-300 z-10"
            aria-label="Close lightbox"
          >
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation buttons */}
          {currentIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(prev => prev - 1)
              }}
              className="absolute left-2 sm:left-8 p-2 sm:p-4 border border-yellow-600/50 hover:bg-yellow-600/10 transition-all duration-300 z-10"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {currentIndex < filteredImages.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(prev => prev + 1)
              }}
              className="absolute right-2 sm:right-8 p-2 sm:p-4 border border-yellow-600/50 hover:bg-yellow-600/10 transition-all duration-300 z-10"
              aria-label="Next image"
            >
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Image - fullscreen on mobile, with border on desktop */}
          <div className="relative w-full h-full sm:w-auto sm:h-auto sm:border-2 sm:border-yellow-600/30 sm:p-4">
            <img
              src={filteredImages[currentIndex]?.src}
              alt={filteredImages[currentIndex]?.alt}
              className="w-full h-full sm:w-auto sm:h-auto object-contain sm:max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Image counter */}
          <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 px-4 py-2 sm:px-8 sm:py-3 bg-black/70 backdrop-blur-sm border border-yellow-600/50">
            <span className="text-yellow-600 font-bold uppercase tracking-widest text-xs sm:text-sm">
              {currentIndex + 1} / {filteredImages.length}
            </span>
          </div>
        </div>
      )}
    </>
  )
}

export default FullGallery
