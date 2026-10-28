import type { GalleryItem, RoomCategory } from '../types/gallery.types'

// nginx serves a JSON listing of Amvera storage (/data/) at this URL
// and the files themselves under it (see nginx.conf)
const ROOMS_URL = '/images/rooms/'

export const CATEGORY_LABELS: Record<RoomCategory, string> = {
  'green-bedroom': 'Зеленая спальня',
  'white-bedroom': 'Белая спальня',
  'secret-room': 'Секретная комната',
  'sauna': 'Сауна',
  'first-floor': '1й этаж',
  'first-bathroom': '1-ая ванная',
  'second-bathroom': '2-ая ванная',
  'terrace': 'Терраса',
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as RoomCategory[]

// "terrace__4.png" → category "terrace", number 4
const IMAGE_RE = /^([a-z-]+)__(\d+)\.(jpe?g|png|webp)$/i

/** Groups file names like "sauna__2.jpg" into gallery items, ordered by category then number. */
export function parseGalleryFiles(names: string[]): GalleryItem[] {
  const byCategory = new Map<RoomCategory, Array<{ name: string; num: number }>>()

  for (const name of names) {
    const match = IMAGE_RE.exec(name)
    if (!match) continue
    const category = match[1] as RoomCategory
    if (!(category in CATEGORY_LABELS)) continue
    const files = byCategory.get(category) ?? []
    files.push({ name, num: Number(match[2]) })
    byCategory.set(category, files)
  }

  return CATEGORIES.flatMap((category) => {
    const files = (byCategory.get(category) ?? []).sort((a, b) => a.num - b.num)
    const label = CATEGORY_LABELS[category]
    return files.map(({ name, num }, i) => ({
      id: `${category}-${num}`,
      category,
      alt: files.length > 1 ? `${label} вид ${i + 1}` : label,
      src: ROOMS_URL + encodeURIComponent(name),
      featured: i === 0,
    }))
  })
}

let cached: Promise<GalleryItem[]> | null = null

export function loadGallery(): Promise<GalleryItem[]> {
  cached ??= fetch(ROOMS_URL, { headers: { Accept: 'application/json' } })
    .then((res) => {
      if (!res.ok) throw new Error(`Gallery listing failed: ${res.status}`)
      return res.json() as Promise<Array<{ name: string; type: string }>>
    })
    .then((entries) => parseGalleryFiles(entries.filter((e) => e.type === 'file').map((e) => e.name)))
    .catch((error) => {
      cached = null
      throw error
    })
  return cached
}
