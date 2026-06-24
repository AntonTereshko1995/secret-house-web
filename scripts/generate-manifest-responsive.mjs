/**
 * Scans the flat public/images/rooms/ directory for optimized images and
 * writes src/data/gallery-manifest.json used by the React gallery component.
 *
 * Expects files named:  {category}__{name}__{size}.webp
 * where size ∈ { thumb, medium, large }
 *
 * URLs in the manifest point to /images/rooms/... which nginx aliases
 * to /data/images/rooms/ in production (Amvera persistent storage).
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { glob } from 'glob'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOMS_DIR = path.join(__dirname, '..', 'public/images/rooms')
const OUTPUT_PATH = path.join(__dirname, '..', 'src/data/gallery-manifest.json')

const CATEGORIES = [
  'green-bedroom',
  'white-bedroom',
  'secret-room',
  'sauna',
  'first-floor',
  'first-bathroom',
  'second-bathroom',
  'terrace',
]

const CATEGORY_LABELS = {
  'green-bedroom':    'Зеленая спальня',
  'white-bedroom':    'Белая спальня',
  'secret-room':      'Секретная комната',
  'sauna':            'Сауна',
  'first-floor':      '1й этаж',
  'first-bathroom':   '1-ая ванная',
  'second-bathroom':  '2-ая ванная',
  'terrace':          'Терраса',
}

async function getDims(p) {
  try {
    const m = await sharp(p).metadata()
    return { width: m.width ?? 0, height: m.height ?? 0 }
  } catch {
    return { width: 0, height: 0 }
  }
}

async function generateManifest() {
  console.log('🔍 Scanning for optimized images...\n')

  // Each thumb webp file represents one photo
  const thumbFiles = (await glob(`${ROOMS_DIR}/*__thumb.webp`)).sort()

  if (thumbFiles.length === 0) {
    console.log('No *__thumb.webp files found. Run npm run images:optimize first.')
    return
  }

  // Group by category (preserving CATEGORIES order)
  const byCategory = Object.fromEntries(CATEGORIES.map(c => [c, []]))

  for (const f of thumbFiles) {
    const base = path.parse(f).name           // e.g. "green-bedroom__DSC05736__thumb"
    const category = base.split('__')[0]
    if (byCategory[category]) {
      byCategory[category].push(base)
    } else {
      console.warn(`⚠️  Unknown category in filename: ${path.basename(f)}`)
    }
  }

  const manifest = {
    items: [],
    lastUpdated: new Date().toISOString(),
    totalImages: 0,
    categories: Object.fromEntries(CATEGORIES.map(c => [c, 0])),
  }

  for (const category of CATEGORIES) {
    const bases = byCategory[category]
    console.log(`📁 ${category}: ${bases.length} images`)

    for (let i = 0; i < bases.length; i++) {
      const thumbBase = bases[i]                              // "green-bedroom__DSC05736__thumb"
      const imageBase = thumbBase.replace(/__thumb$/, '')     // "green-bedroom__DSC05736"
      const urlBase   = `/images/rooms/${imageBase}`

      const thumbDim  = await getDims(path.join(ROOMS_DIR, `${thumbBase}.webp`))
      const mediumDim = await getDims(path.join(ROOMS_DIR, `${imageBase}__medium.webp`))
      const largeDim  = await getDims(path.join(ROOMS_DIR, `${imageBase}__large.webp`))

      const thumb = {
        webp: `${urlBase}__thumb.webp`,
        jpg:  `${urlBase}__thumb.jpg`,
        ...thumbDim,
      }

      const medium = mediumDim.width > 0
        ? { webp: `${urlBase}__medium.webp`, jpg: `${urlBase}__medium.jpg`, ...mediumDim }
        : thumb

      const large = largeDim.width > 0
        ? { webp: `${urlBase}__large.webp`, jpg: `${urlBase}__large.jpg`, ...largeDim }
        : medium

      const label = CATEGORY_LABELS[category]
      manifest.items.push({
        id:          `${category}-${i}`,
        category,
        alt:         bases.length > 1 ? `${label} вид ${i + 1}` : label,
        description: bases.length > 1 ? `${label} - фото ${i + 1}` : label,
        featured:    i === 0,
        images:      { thumbnail: thumb, medium, large },
      })

      manifest.categories[category]++
    }
  }

  manifest.totalImages = manifest.items.length

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(manifest, null, 2))

  console.log('\n' + '='.repeat(60))
  console.log(`✅ Manifest: ${manifest.totalImages} items → src/data/gallery-manifest.json`)
  console.log('='.repeat(60))
  console.log('\nImages per category:')
  CATEGORIES.filter(c => manifest.categories[c] > 0).forEach(c => {
    console.log(`  ${CATEGORY_LABELS[c]}: ${manifest.categories[c]}`)
  })
}

generateManifest().catch(console.error)
