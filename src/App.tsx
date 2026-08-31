import { Routes, Route, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { logger } from './services/logger'
import HomePage from './pages/HomePage'
import BookingRedirect from './pages/BookingRedirect'
import BookingWizardPage from './pages/BookingWizardPage'
import BookingSuccessPage from './pages/BookingSuccessPage'
import AvailabilityPage from './pages/AvailabilityPage'
import GiftCertificatePage from './pages/GiftCertificatePage'
import MyBookingsPage from './pages/MyBookingsPage'
import BookingDetailPage from './pages/BookingDetailPage'
import ReschedulePage from './pages/ReschedulePage'
import AdminPage from './pages/AdminPage'
import AdminPromocodesPage from './pages/AdminPromocodesPage'
import AdminStatisticsPage from './pages/AdminStatisticsPage'
import FullGallery from './components/FullGallery'
import LoadingOverlay from './components/LoadingOverlay/LoadingOverlay'
import type { RoomCategory } from './types/gallery.types'

function App() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const isGalleryOpen = searchParams.get('gallery') === 'open'
  const categoryParam = searchParams.get('category')
  const initialCategory = categoryParam as RoomCategory | undefined

  // Log route changes
  useEffect(() => {
    logger.info('page_view', { path: location.pathname })
  }, [location.pathname])

  const openGallery = (category?: RoomCategory) => {
    logger.info('gallery_open', { category: category ?? 'all' })
    const params = new URLSearchParams()
    params.set('gallery', 'open')
    if (category) {
      params.set('category', category)
    }
    navigate(`?${params.toString()}`, { replace: false })
  }

  const closeGallery = () => {
    logger.info('gallery_close')
    navigate('/', { replace: false })
  }

  // Show gallery overlay only on home page
  const showGallery = location.pathname === '/' && isGalleryOpen

  return (
    <>
      <LoadingOverlay />
      <div className="min-h-screen bg-black">
        <Routes>
          <Route path="/" element={<HomePage onOpenGallery={openGallery} />} />
          <Route path="/booking" element={<BookingWizardPage />} />
          <Route path="/booking/success" element={<BookingSuccessPage />} />
          <Route path="/telegram" element={<BookingRedirect />} />
          <Route path="/availability" element={<AvailabilityPage />} />
          <Route path="/gift" element={<GiftCertificatePage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/my-bookings/:publicId" element={<BookingDetailPage />} />
          <Route path="/my-bookings/:publicId/reschedule" element={<ReschedulePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/promocodes" element={<AdminPromocodesPage />} />
          <Route path="/admin/statistics" element={<AdminStatisticsPage />} />
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
