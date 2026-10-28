import { describe, expect, it } from 'vitest'
import { parseGalleryFiles } from './gallery'

describe('parseGalleryFiles', () => {
  it('groups by category and sorts numerically', () => {
    const items = parseGalleryFiles([
      'terrace__10.jpg',
      'terrace__2.jpg',
      'sauna__1.jpg',
      'terrace__4.png',
      'logo.png',
      'logo.png.png',
      'unknown__1.jpg',
    ])

    expect(items.map((i) => i.src)).toEqual([
      '/images/rooms/sauna__1.jpg',
      '/images/rooms/terrace__2.jpg',
      '/images/rooms/terrace__4.png',
      '/images/rooms/terrace__10.jpg',
    ])
    expect(items.filter((i) => i.featured).map((i) => i.id)).toEqual(['sauna-1', 'terrace-2'])
    expect(items[0].alt).toBe('Сауна')
    expect(items[3].alt).toBe('Терраса вид 3')
  })
})
