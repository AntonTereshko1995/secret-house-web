import { useState, useEffect } from 'react'
import type { GalleryItem, GalleryManifest, RoomCategory } from '../../types/gallery.types'

interface GalleryPreviewProps {
  onOpenFullGallery: (category?: RoomCategory) => void
}

function GalleryPreview({ onOpenFullGallery }: GalleryPreviewProps) {
  const [featuredImages, setFeaturedImages] = useState<GalleryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  const categoryLabels: Record<string, string> = {
    'green-bedroom': 'Зеленая спальня',
    'white-bedroom': 'Белая спальня',
    'secret-room': 'Секретная комната',
    'sauna': 'Сауна',
    'first-floor': '1й этаж',
    'first-bathroom': '1-ая ванная',
    'second-bathroom': '2-ая ванная',
    'terrace': 'Терраса'
  }

  useEffect(() => {
    setIsLoading(true)

    // Load gallery manifest
    import('../../data/gallery-manifest.json')
      .then((data) => {
        const manifest = data as GalleryManifest

        // Get first 4 featured images or first 4 images
        const featured = manifest.items
          .filter((item) => item.featured)
          .slice(0, 4)

        if (featured.length < 4) {
          // If less than 4 featured, fill with regular images
          const remaining = manifest.items
            .filter((item) => !item.featured)
            .slice(0, 4 - featured.length)
          setFeaturedImages([...featured, ...remaining])
        } else {
          setFeaturedImages(featured)
        }

        setIsLoading(false)
      })
      .catch((error) => {
        console.error('Failed to load gallery manifest:', error)
        setIsLoading(false)
      })
  }, [])

  return (
    <section id="gallery-preview" className="py-10 sm:py-14 bg-luxury-gradient relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-600 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent mx-auto mb-4"></div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="text-luxury-gold">Интерьер</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-400 max-w-3xl mx-auto font-light">
            Изысканный дизайн и безупречный вкус в каждой детали
          </p>
        </div>

        {/* Image Grid */}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-yellow-600/60">Загрузка...</p>
          </div>
        ) : featuredImages.filter(img => !failedImages.has(img.id)).length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {featuredImages.filter(img => !failedImages.has(img.id)).map((image, index) => (
                <div
                  key={image.id}
                  className="group relative overflow-hidden shadow-luxury hover:shadow-luxury-hover transition-all duration-500 cursor-pointer bg-luxury-card"
                  onClick={() => onOpenFullGallery(image.category)}
                >
                  <div className="relative w-full aspect-[4/3] overflow-hidden">
                    <img
                        src={image.images.thumbnail.jpg}
                        alt={image.alt}
                        width={image.images.thumbnail.width}
                        height={image.images.thumbnail.height}
                        loading={index < 4 ? 'eager' : 'lazy'}
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        onError={() => setFailedImages(prev => new Set(prev).add(image.id))}
                      />
                    {/* Luxury overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-yellow-600/10 transition-all duration-500" />

                    {/* Gold border effect on hover */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-yellow-600/50 transition-all duration-500"></div>
                  </div>
                  {/* Category Badge */}
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1 border border-yellow-600/30 text-xs font-light text-yellow-500 uppercase tracking-wider">
                    {categoryLabels[image.category] || image.category}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <button
                onClick={() => onOpenFullGallery()}
                className="group relative inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-black px-8 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-luxury hover:shadow-luxury-hover overflow-hidden"
              >
                {/* Button shine effect */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>

                <span className="relative">Смотреть всю галерею</span>

                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-yellow-600/60">Фотографии скоро появятся</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default GalleryPreview
