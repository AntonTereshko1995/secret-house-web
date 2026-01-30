export type RoomCategory =
  | 'green-bedroom'
  | 'white-bedroom'
  | 'secret-room'
  | 'sauna'
  | 'first-floor'
  | 'first-bathroom'
  | 'second-bathroom'
  | 'terrace'

/**
 * Image with specific size and format
 */
export interface ImageVariant {
  webp: string    // Path to WebP version
  jpg: string     // Path to JPG fallback
  width: number   // Image width in pixels
  height: number  // Image height in pixels
}

/**
 * Responsive image set with multiple sizes
 */
export interface ImageSet {
  thumbnail: ImageVariant  // 640px - for gallery grid
  medium: ImageVariant     // 1280px - for lightbox on mobile
  large: ImageVariant      // 1920px - for lightbox on desktop
}

/**
 * Gallery item with responsive images
 */
export interface GalleryItem {
  id: string
  category: RoomCategory
  alt: string
  description: string
  featured?: boolean
  images: ImageSet
}

/**
 * Gallery manifest structure
 */
export interface GalleryManifest {
  items: GalleryItem[]
  lastUpdated: string
  totalImages: number
  categories: {
    [key in RoomCategory]: number  // Count per category
  }
}
