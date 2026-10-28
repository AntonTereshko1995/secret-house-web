export type RoomCategory =
  | 'green-bedroom'
  | 'white-bedroom'
  | 'secret-room'
  | 'sauna'
  | 'first-floor'
  | 'first-bathroom'
  | 'second-bathroom'
  | 'terrace'

export interface GalleryItem {
  id: string
  category: RoomCategory
  alt: string
  src: string
  featured: boolean
}
