import { Routes, Route, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import BookingRedirect from './pages/BookingRedirect'
import FullGallery from './components/FullGallery'
import type { RoomCategory } from './types/gallery.types'

function App() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const isGalleryOpen = searchParams.get('gallery') === 'open'
  const categoryParam = searchParams.get('category')
  const initialCategory = categoryParam as RoomCategory | undefined

  const openGallery = (category?: RoomCategory) => {
    const params = new URLSearchParams()
    params.set('gallery', 'open')
    if (category) {
      params.set('category', category)
    }
    navigate(`?${params.toString()}`, { replace: false })
  }

  const closeGallery = () => {
    navigate('/', { replace: false })
  }

  // Show gallery overlay only on home page
  const showGallery = location.pathname === '/' && isGalleryOpen

  return (
    <>
      <div className="min-h-screen bg-gray-900">
        <Routes>
          <Route path="/" element={<HomePage onOpenGallery={openGallery} />} />
          <Route path="/book" element={<BookingRedirect />} />
          <Route path="/booking" element={<BookingRedirect />} />
          <Route path="/telegram" element={<BookingRedirect />} />
        </Routes>
      </div>

      {/* Gallery Modal - only on home page */}
      {showGallery && (
        <FullGallery
          isOpen={showGallery}
          onClose={closeGallery}
          initialCategory={initialCategory}
        />
      )}
    </>
  )
}

export default App
