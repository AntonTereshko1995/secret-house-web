import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { glob } from 'glob'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '..')

const ROOMS_DIR = path.join(projectRoot, 'public/images/rooms')
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'JPG', 'JPEG', 'png', 'PNG']

// Size configurations
const SIZES = {
  thumbnails: { width: 640, quality: 80 },
  medium: { width: 1280, quality: 85 },
  large: { width: 1920, quality: 85 }
}

// Semaphore to limit concurrent processing (avoid memory exhaustion)
class Semaphore {
  constructor(max) {
    this.max = max
    this.count = 0
    this.queue = []
  }

  async acquire() {
    if (this.count < this.max) {
      this.count++
      return Promise.resolve()
    }

    return new Promise(resolve => {
      this.queue.push(resolve)
    })
  }

  release() {
    this.count--
    if (this.queue.length > 0) {
      this.count++
      const resolve = this.queue.shift()
      resolve()
    }
  }

  async run(fn) {
    await this.acquire()
    try {
      return await fn()
    } finally {
      this.release()
    }
  }
}

async function createDirectories(baseDir) {
  await fs.mkdir(path.join(baseDir, 'original'), { recursive: true })
  await fs.mkdir(path.join(baseDir, 'thumbnails'), { recursive: true })
  await fs.mkdir(path.join(baseDir, 'medium'), { recursive: true })
  await fs.mkdir(path.join(baseDir, 'large'), { recursive: true })
}

async function processImage(imagePath, semaphore) {
  return semaphore.run(async () => {
    const filename = path.basename(imagePath)
    const categoryDir = path.dirname(imagePath)
    const baseFilename = path.parse(filename).name

    console.log(`\n📸 Processing: ${filename}`)

    try {
      // Create directories if they don't exist
      await createDirectories(categoryDir)

      // Move original to original/ folder
      const originalPath = path.join(categoryDir, 'original', filename)
      const originalExists = await fs.access(originalPath).then(() => true).catch(() => false)

      if (!originalExists) {
        await fs.rename(imagePath, originalPath)
        console.log(`  📁 Moved to: original/${filename}`)
      } else {
        console.log(`  ⏭️  Original already exists, skipping move`)
      }

      // Load image
      const image = sharp(originalPath, {
        limitInputPixels: 100000000,  // Limit to ~100 MP
        sequentialRead: true
      })

      const metadata = await image.metadata()
      const aspectRatio = metadata.width / metadata.height

      console.log(`  📏 Original: ${metadata.width}x${metadata.height}px`)

      // Process each size
      const processes = []

      for (const [sizeName, config] of Object.entries(SIZES)) {
        const targetWidth = config.width
        const targetHeight = Math.round(targetWidth / aspectRatio)

        // Skip if original is smaller than target
        if (metadata.width < targetWidth) {
          console.log(`  ⏭️  Skipping ${sizeName} (original is smaller)`)
          continue
        }

        // WebP output
        const webpPath = path.join(categoryDir, sizeName, `${baseFilename}.webp`)
        const webpExists = await fs.access(webpPath).then(() => true).catch(() => false)

        if (!webpExists) {
          processes.push(
            sharp(originalPath)
              .resize(targetWidth, targetHeight, {
                fit: 'cover',
                position: 'center',
                withoutEnlargement: true
              })
              .webp({ quality: config.quality, effort: 4 })
              .toFile(webpPath)
              .then(() => {
                console.log(`  ✅ Created: ${sizeName}/${baseFilename}.webp`)
              })
          )
        } else {
          console.log(`  ⏭️  ${sizeName} WebP already exists`)
        }

        // JPG fallback
        const jpgPath = path.join(categoryDir, sizeName, `${baseFilename}.jpg`)
        const jpgExists = await fs.access(jpgPath).then(() => true).catch(() => false)

        if (!jpgExists) {
          processes.push(
            sharp(originalPath)
              .resize(targetWidth, targetHeight, {
                fit: 'cover',
                position: 'center',
                withoutEnlargement: true
              })
              .jpeg({ quality: config.quality, mozjpeg: true })
              .toFile(jpgPath)
              .then(() => {
                console.log(`  ✅ Created: ${sizeName}/${baseFilename}.jpg`)
              })
          )
        } else {
          console.log(`  ⏭️  ${sizeName} JPG already exists`)
        }
      }

      await Promise.all(processes)

      console.log(`  ✨ Completed: ${filename}`)

      return { success: true, filename }
    } catch (error) {
      console.error(`  ❌ Error processing ${filename}:`, error.message)
      return { success: false, filename, error: error.message }
    }
  })
}

async function main() {
  console.log('🚀 Starting image optimization...\n')
  console.log('Configuration:')
  console.log(`  - Thumbnail: ${SIZES.thumbnails.width}px (quality ${SIZES.thumbnails.quality})`)
  console.log(`  - Medium: ${SIZES.medium.width}px (quality ${SIZES.medium.quality})`)
  console.log(`  - Large: ${SIZES.large.width}px (quality ${SIZES.large.quality})`)
  console.log()

  // Find all images (excluding already processed folders)
  const imagePatterns = IMAGE_EXTENSIONS.map(ext => `${ROOMS_DIR}/**/*.${ext}`)
  let allImages = []

  for (const pattern of imagePatterns) {
    const images = await glob(pattern, {
      ignore: [
        '**/original/**',
        '**/thumbnails/**',
        '**/medium/**',
        '**/large/**',
        '**/.gitkeep'
      ]
    })
    allImages = [...allImages, ...images]
  }

  if (allImages.length === 0) {
    console.log('✨ No images to process. All images are already optimized.')
    return
  }

  console.log(`Found ${allImages.length} images to process\n`)

  const startTime = Date.now()

  // Process images with concurrency limit (4 concurrent processes)
  const semaphore = new Semaphore(4)
  const results = await Promise.all(
    allImages.map(imagePath => processImage(imagePath, semaphore))
  )

  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)

  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length

  console.log('\n' + '='.repeat(60))
  console.log(`✅ Successfully processed: ${successCount} images`)
  console.log(`❌ Failed: ${failCount} images`)
  console.log(`⏱️  Total time: ${duration}s`)
  console.log('='.repeat(60))

  if (failCount > 0) {
    console.log('\nFailed images:')
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`  - ${r.filename}: ${r.error}`))
  }
}

main().catch(console.error)
