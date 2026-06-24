/**
 * Processes flat originals in public/images/rooms/.
 *
 * Input:  {category}__{name}.jpg  (e.g. green-bedroom__DSC05736.jpg)
 * Output: {category}__{name}__thumb.webp / .jpg   (640px)
 *         {category}__{name}__medium.webp / .jpg  (1280px)
 *         {category}__{name}__large.webp / .jpg   (1920px)
 *
 * Skips variants that already exist. Safe to re-run.
 */

import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { glob } from 'glob'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOMS_DIR = path.join(__dirname, '..', 'public/images/rooms')

const SIZES = {
  thumb:  { width: 640,  quality: 80 },
  medium: { width: 1280, quality: 85 },
  large:  { width: 1920, quality: 85 },
}

const SIZE_SUFFIXES = ['__thumb', '__medium', '__large']

class Semaphore {
  constructor(max) {
    this.max = max
    this.count = 0
    this.queue = []
  }

  async acquire() {
    if (this.count < this.max) {
      this.count++
      return
    }
    return new Promise(resolve => this.queue.push(resolve))
  }

  release() {
    this.count--
    if (this.queue.length > 0) {
      this.count++
      this.queue.shift()()
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

async function exists(p) {
  return fs.access(p).then(() => true).catch(() => false)
}

async function processImage(src, semaphore) {
  return semaphore.run(async () => {
    const baseName = path.parse(src).name  // e.g. "green-bedroom__DSC05736"
    console.log(`\n📸 ${baseName}`)

    const meta = await sharp(src, { limitInputPixels: 100_000_000, sequentialRead: true }).metadata()
    const aspectRatio = meta.width / meta.height
    console.log(`   ${meta.width}×${meta.height}px`)

    const tasks = []

    for (const [sizeName, { width, quality }] of Object.entries(SIZES)) {
      if (meta.width < width) {
        console.log(`   ⏭️  ${sizeName}: original too small (${meta.width}px < ${width}px)`)
        continue
      }

      const height = Math.round(width / aspectRatio)

      const variants = [
        {
          dest: path.join(ROOMS_DIR, `${baseName}__${sizeName}.webp`),
          encode: (s) => s.webp({ quality, effort: 4 }),
        },
        {
          dest: path.join(ROOMS_DIR, `${baseName}__${sizeName}.jpg`),
          encode: (s) => s.jpeg({ quality, mozjpeg: true }),
        },
      ]

      for (const { dest, encode } of variants) {
        if (await exists(dest)) {
          console.log(`   ⏭️  ${path.basename(dest)} exists`)
          continue
        }
        tasks.push(
          encode(
            sharp(src).resize(width, height, { fit: 'cover', withoutEnlargement: true })
          )
            .toFile(dest)
            .then(() => console.log(`   ✅ ${path.basename(dest)}`))
            .catch(err => console.error(`   ❌ ${path.basename(dest)}: ${err.message}`))
        )
      }
    }

    await Promise.all(tasks)
  })
}

async function main() {
  console.log('🚀 Optimizing images (flat structure)...\n')

  // Find originals: flat .jpg files without a size suffix
  const allJpg = await glob(`${ROOMS_DIR}/*.{jpg,JPG,jpeg,JPEG}`)
  const originals = allJpg.filter(f => {
    const base = path.parse(f).name
    return !SIZE_SUFFIXES.some(s => base.endsWith(s))
  })

  if (originals.length === 0) {
    console.log('✨ No originals found. Run npm run images:flatten first.')
    return
  }

  console.log(`Found ${originals.length} originals to process\n`)

  const t0 = Date.now()
  const semaphore = new Semaphore(4)
  await Promise.all(originals.map(f => processImage(f, semaphore)))

  console.log(`\n✅ Done in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
}

main().catch(console.error)
