import { useEffect, useRef } from 'react'

function Location() {
  const lat = import.meta.env.VITE_LOCATION_LAT || '55.7558'
  const lon = import.meta.env.VITE_LOCATION_LON || '37.6173'
  const address = import.meta.env.VITE_LOCATION_ADDRESS || 'Moscow, Russia'

  const yandexMapsUrl = 'https://yandex.by/maps/-/CHs9n8po'
  const googleMapsUrl = 'https://maps.app.goo.gl/XiRGji5EBjxRVbP58'

  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Wait for Yandex Maps API to load
    const initMap = () => {
      if (typeof window.ymaps === 'undefined') {
        setTimeout(initMap, 100)
        return
      }

      window.ymaps.ready(() => {
        if (!mapRef.current) return

        const map = new window.ymaps.Map(mapRef.current, {
          center: [parseFloat(lat), parseFloat(lon)],
          zoom: 16,
          controls: ['zoomControl', 'fullscreenControl']
        })

        // Add a placemark for the house
        const placemark = new window.ymaps.Placemark(
          [parseFloat(lat), parseFloat(lon)],
          {
            balloonContent: address,
            hintContent: 'Secret House'
          },
          {
            preset: 'islands#redHomeIcon'
          }
        )

        map.geoObjects.add(placemark)
      })
    }

    initMap()
  }, [lat, lon, address])

  return (
    <section className="py-24 sm:py-32 bg-luxury-gradient relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-yellow-600 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent mx-auto mb-6"></div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            <span className="text-luxury-gold">Расположение</span>
          </h2>
          <p className="text-xl sm:text-2xl text-gray-400 font-light">
            {address}
          </p>
        </div>

        {/* Map Links */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <a
            href={yandexMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative w-full sm:w-auto bg-transparent text-yellow-600 font-bold py-4 px-10 border-2 border-yellow-600 hover:bg-yellow-600 hover:text-black transition-all duration-500 uppercase tracking-widest text-sm text-center hover:scale-105"
          >
            Яндекс Карты
          </a>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative w-full sm:w-auto bg-transparent text-yellow-600 font-bold py-4 px-10 border-2 border-yellow-600 hover:bg-yellow-600 hover:text-black transition-all duration-500 uppercase tracking-widest text-sm text-center hover:scale-105"
          >
            Google Maps
          </a>
        </div>

        {/* Yandex Map */}
        <div className="max-w-5xl mx-auto overflow-hidden shadow-luxury border-2 border-yellow-600/30">
          <div
            ref={mapRef}
            className="w-full h-[300px] sm:h-[400px] lg:h-[600px]"
          />
        </div>
      </div>
    </section>
  )
}

export default Location
