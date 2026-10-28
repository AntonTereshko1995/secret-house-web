import { useState, useEffect, useMemo } from 'react'
import type { GalleryItem, RoomCategory } from '../../types/gallery.types'
import { CATEGORY_LABELS, loadGallery } from '../../utils/gallery'

interface GalleryPreviewProps {
  onOpenFullGallery: (category?: RoomCategory) => void
}

const ROOMS_ON_PAGE = 4
// Every TICK_MS one tile (in turn) moves to its next photo
const TICK_MS = 1500

interface RoomSlides {
  category: RoomCategory
  images: GalleryItem[]
}

function GalleryPreview({ onOpenFullGallery }: GalleryPreviewProps) {
  const [images, setImages] = useState<GalleryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  const [tick, setTick] = useState(0)

  useEffect(() => {
    loadGallery()
      .then((items) => {
        setImages(items)
        setIsLoading(false)
      })
      .catch((error) => {
        console.error('Failed to load gallery:', error)
        setIsLoading(false)
      })
  }, [])

  // First rooms that have photos; each tile cycles through its room from __1 to the last number
  const rooms = useMemo(() => {
    const byCategory = new Map<RoomCategory, GalleryItem[]>()
    for (const image of images) {
      if (failedImages.has(image.id)) continue
      byCategory.set(image.category, [...(byCategory.get(image.category) ?? []), image])
    }
    return Array.from(byCategory, ([category, roomImages]): RoomSlides => ({ category, images: roomImages }))
      .slice(0, ROOMS_ON_PAGE)
  }, [images, failedImages])

  useEffect(() => {
    if (rooms.length === 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setTick((t) => t + 1), TICK_MS)
    return () => window.clearInterval(id)
  }, [rooms.length])

  // Tile i has advanced once for every full round of ticks that reached it
  const slideIndex = (tileIndex: number, count: number) =>
    Math.floor((tick + rooms.length - 1 - tileIndex) / rooms.length) % count

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
        ) : rooms.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {rooms.map((room, tileIndex) => {
                const current = slideIndex(tileIndex, room.images.length)
                return (
                <div
                  key={room.category}
                  className="group relative overflow-hidden shadow-luxury hover:shadow-luxury-hover transition-all duration-500 cursor-pointer bg-luxury-card"
                  onClick={() => onOpenFullGallery(room.category)}
                >
                  <div className="relative w-full aspect-[4/3] overflow-hidden">
                    {room.images.map((image, i) => (
                      <img
                        key={image.id}
                        src={image.src}
                        alt={i === current ? image.alt : ''}
                        aria-hidden={i !== current}
                        loading={i === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                        className={`absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-[opacity,transform] duration-1000 ease-out ${i === current ? 'opacity-100' : 'opacity-0'}`}
                        onError={() => setFailedImages(prev => new Set(prev).add(image.id))}
                      />
                    ))}
                    {/* Luxury overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-yellow-600/10 transition-all duration-500" />

                    {/* Gold border effect on hover */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-yellow-600/50 transition-all duration-500"></div>
                  </div>
                  {/* Category Badge */}
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1 border border-yellow-600/30 text-xs font-light text-yellow-500 uppercase tracking-wider">
                    {CATEGORY_LABELS[room.category]}
                  </div>
                </div>
                )
              })}
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
