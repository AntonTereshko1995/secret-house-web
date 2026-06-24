export type RoomCategory =
  | 'green-bedroom'
  | 'white-bedroom'
  | 'secret-room'
  | 'sauna'
  | 'first-floor'
  | 'first-bathroom'
  | 'second-bathroom'
  | 'terrace'

export interface ImageVariant {
  jpg: string
  width: number
  height: number
}

export interface ImageSet {
  thumbnail: ImageVariant
  medium: ImageVariant
  large: ImageVariant
}

export interface GalleryItem {
  id: string
  category: RoomCategory
  alt: string
  description: string
  featured?: boolean
  images: ImageSet
}

export interface GalleryManifest {
  items: GalleryItem[]
  lastUpdated: string
  totalImages: number
  categories: {
    [key in RoomCategory]: number
  }
}
