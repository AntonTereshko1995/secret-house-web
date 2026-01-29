import { useState, useEffect } from 'react'
import type { GalleryItem, GalleryManifest, RoomCategory } from '../../types/gallery.types'

interface GalleryPreviewProps {
  onOpenFullGallery: (category?: RoomCategory) => void
}

function GalleryPreview({ onOpenFullGallery }: GalleryPreviewProps) {
  const [featuredImages, setFeaturedImages] = useState<GalleryItem[]>([])

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
      })
      .catch((error) => {
        console.error('Failed to load gallery manifest:', error)
      })
  }, [])

  return (
    <section id="gallery-preview" className="py-24 sm:py-32 bg-luxury-gradient relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-600 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent mx-auto mb-6"></div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            <span className="text-luxury-gold">Интерьер</span>
          </h2>
          <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto font-light">
            Изысканный дизайн и безупречный вкус в каждой детали
          </p>
        </div>

        {/* Image Grid */}
        {featuredImages.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
              {featuredImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative overflow-hidden shadow-luxury hover:shadow-luxury-hover transition-all duration-500 cursor-pointer bg-luxury-card"
                  onClick={() => onOpenFullGallery(image.category)}
                >
                  <div className="relative w-full aspect-[4/3] overflow-hidden">
                    <img
                      src={image.src}
                      alt={image.alt}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    {/* Luxury overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-yellow-600/10 transition-all duration-500" />

                    {/* Gold border effect on hover */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-yellow-600/50 transition-all duration-500"></div>
                  </div>
                  {/* Category Badge */}
                  <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-2 border border-yellow-600/30 text-sm font-light text-yellow-500 uppercase tracking-wider">
                    {categoryLabels[image.category] || image.category}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <button
                onClick={() => onOpenFullGallery()}
                className="group relative bg-transparent text-yellow-600 font-bold py-5 px-8 sm:px-12 lg:px-16 border-2 border-yellow-600 hover:bg-yellow-600 hover:text-black transition-all duration-500 uppercase tracking-widest text-sm hover:scale-105 shadow-luxury"
              >
                <span className="relative z-10">Полная Галерея</span>
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              Фотографии скоро появятся
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default GalleryPreview
