export type RoomCategory = 'green-bedroom' | 'white-bedroom' | 'secret-room' | 'sauna' | 'first-floor' | 'first-bathroom' | 'second-bathroom' | 'terrace'

export interface GalleryItem {
  id: string
  src: string
  category: RoomCategory
  alt: string
  description: string
  featured?: boolean  // For gallery preview selection
}

export interface GalleryManifest {
  items: GalleryItem[]
  lastUpdated: string
}
