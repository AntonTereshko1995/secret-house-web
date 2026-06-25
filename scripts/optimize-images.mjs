/**
 * Generates medium (1280px) JPG variants for flat originals in public/images/rooms/.
 *
 * Input:  {category}__{name}.jpg   (original, no size suffix)
 * Output: {category}__{name}__medium.jpg
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

const MEDIUM = { width: 1280, quality: 85 }

class Semaphore {
  constructor(max) {
    this.max = max
    this.count = 0
    this.queue = []
  }

  async acquire() {
    if (this.count < this.max) { this.count++; return }
    return new Promise(resolve => this.queue.push(resolve))
  }

  release() {
    this.count--
    if (this.queue.length > 0) { this.count++; this.queue.shift()() }
  }

  async run(fn) {
    await this.acquire()
    try { return await fn() } finally { this.release() }
  }
}

async function exists(p) {
  return fs.access(p).then(() => true).catch(() => false)
}

async function processImage(src, semaphore) {
  return semaphore.run(async () => {
    const baseName = path.parse(src).name
    const meta = await sharp(src, { limitInputPixels: 100_000_000, sequentialRead: true }).metadata()
    const height = Math.round(MEDIUM.width / (meta.width / meta.height))

    console.log(`📸 ${baseName}  (${meta.width}×${meta.height}px)`)

    const dest = path.join(ROOMS_DIR, `${baseName}__medium.jpg`)

    if (await exists(dest)) {
      console.log(`   ⏭️  ${path.basename(dest)} exists`)
      return
    }

    const resize = meta.width >= MEDIUM.width
      ? sharp(src).resize(MEDIUM.width, height, { fit: 'cover', withoutEnlargement: true })
      : sharp(src)

    await resize
      .jpeg({ quality: MEDIUM.quality, mozjpeg: true })
      .toFile(dest)
      .then(() => console.log(`   ✅ ${path.basename(dest)}`))
      .catch(err => console.error(`   ❌ ${path.basename(dest)}: ${err.message}`))
  })
}

async function main() {
  console.log('🚀 Generating medium JPG variants...\n')

  const all = await glob(`${ROOMS_DIR}/*.{jpg,JPG,jpeg,JPEG}`)
  const originals = all.filter(f => !path.parse(f).name.endsWith('__medium'))

  if (originals.length === 0) {
    console.log('No originals found. Run npm run images:flatten first.')
    return
  }

  console.log(`Found ${originals.length} originals\n`)

  const t0 = Date.now()
  const semaphore = new Semaphore(4)
  await Promise.all(originals.map(f => processImage(f, semaphore)))

  console.log(`\n✅ Done in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
}

main().catch(console.error)
