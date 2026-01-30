import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { glob } from 'glob'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '..')

const ROOMS_DIR = path.join(projectRoot, 'public/images/rooms')
const OUTPUT_PATH = path.join(projectRoot, 'src/data/gallery-manifest.json')

const CATEGORIES = [
  'green-bedroom',
  'white-bedroom',
  'secret-room',
  'sauna',
  'first-floor',
  'first-bathroom',
  'second-bathroom',
  'terrace'
]

const CATEGORY_LABELS = {
  'green-bedroom': 'Зеленая спальня',
  'white-bedroom': 'Белая спальня',
  'secret-room': 'Секретная комната',
  'sauna': 'Сауна',
  'first-floor': '1й этаж',
  'first-bathroom': '1-ая ванная',
  'second-bathroom': '2-ая ванная',
  'terrace': 'Терраса'
}

async function getImageDimensions(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata()
    return { width: metadata.width, height: metadata.height }
  } catch {
    return { width: 0, height: 0 }
  }
}

async function generateManifest() {
  console.log('🔍 Scanning for optimized images...\n')

  const manifest = {
    items: [],
    lastUpdated: new Date().toISOString(),
    totalImages: 0,
    categories: {}
  }

  // Initialize category counts
  CATEGORIES.forEach(cat => {
    manifest.categories[cat] = 0
  })

  for (const category of CATEGORIES) {
    const categoryDir = path.join(ROOMS_DIR, category)
    const thumbnailDir = path.join(categoryDir, 'thumbnails')

    // Check if thumbnails directory exists
    try {
      await fs.access(thumbnailDir)
    } catch {
      console.log(`⚠️  No thumbnails found for ${category}, skipping...`)
      continue
    }

    // Find all WebP thumbnails (each represents one image)
    const thumbnails = await glob(`${thumbnailDir}/*.webp`)

    console.log(`📁 ${category}: Found ${thumbnails.length} images`)

    for (let i = 0; i < thumbnails.length; i++) {
      const thumbnailPath = thumbnails[i]
      const baseFilename = path.parse(thumbnailPath).name

      // Build paths for all variants
      const relativeCategoryPath = `/images/rooms/${category}`

      const thumbnailWebp = `${relativeCategoryPath}/thumbnails/${baseFilename}.webp`
      const thumbnailJpg = `${relativeCategoryPath}/thumbnails/${baseFilename}.jpg`
      const mediumWebp = `${relativeCategoryPath}/medium/${baseFilename}.webp`
      const mediumJpg = `${relativeCategoryPath}/medium/${baseFilename}.jpg`
      const largeWebp = `${relativeCategoryPath}/large/${baseFilename}.webp`
      const largeJpg = `${relativeCategoryPath}/large/${baseFilename}.jpg`

      // Get dimensions for each size
      const thumbDim = await getImageDimensions(path.join(projectRoot, 'public', thumbnailWebp))
      const mediumDim = await getImageDimensions(path.join(projectRoot, 'public', mediumWebp))
      const largeDim = await getImageDimensions(path.join(projectRoot, 'public', largeWebp))

      // Fallback logic: if larger size doesn't exist, use smaller size
      // Medium fallback to thumbnail
      const mediumPaths = mediumDim.width > 0
        ? { webp: mediumWebp, jpg: mediumJpg, width: mediumDim.width, height: mediumDim.height }
        : { webp: thumbnailWebp, jpg: thumbnailJpg, width: thumbDim.width, height: thumbDim.height }

      // Large fallback to medium, then to thumbnail
      let largePaths
      if (largeDim.width > 0) {
        largePaths = { webp: largeWebp, jpg: largeJpg, width: largeDim.width, height: largeDim.height }
      } else if (mediumDim.width > 0) {
        largePaths = { webp: mediumWebp, jpg: mediumJpg, width: mediumDim.width, height: mediumDim.height }
      } else {
        largePaths = { webp: thumbnailWebp, jpg: thumbnailJpg, width: thumbDim.width, height: thumbDim.height }
      }

      const item = {
        id: `${category}-${i}`,
        category,
        alt: `${CATEGORY_LABELS[category]}${thumbnails.length > 1 ? ` вид ${i + 1}` : ''}`,
        description: `${CATEGORY_LABELS[category]}${thumbnails.length > 1 ? ` - фото ${i + 1}` : ''}`,
        featured: i === 0,  // First image of each category is featured
        images: {
          thumbnail: {
            webp: thumbnailWebp,
            jpg: thumbnailJpg,
            width: thumbDim.width,
            height: thumbDim.height
          },
          medium: mediumPaths,
          large: largePaths
        }
      }

      manifest.items.push(item)
      manifest.categories[category]++
    }
  }

  manifest.totalImages = manifest.items.length

  // Write manifest
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(manifest, null, 2))

  console.log('\n' + '='.repeat(60))
  console.log(`✅ Generated manifest with ${manifest.totalImages} items`)
  console.log(`📄 Saved to: src/data/gallery-manifest.json`)
  console.log('='.repeat(60))
  console.log('\nImages per category:')
  Object.entries(manifest.categories)
    .filter(([_, count]) => count > 0)
    .forEach(([category, count]) => {
      console.log(`  - ${CATEGORY_LABELS[category]}: ${count}`)
    })
}

generateManifest().catch(console.error)
