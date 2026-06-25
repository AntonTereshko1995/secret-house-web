/**
 * One-time script: finds true originals buried in the nested mess
 * (rooms/{category}/original/original/*.JPG) and flattens them into
 * rooms/{category}__{sanitized-name}.jpg — all subdirectories are removed.
 *
 * Run once, then commit the result and upload to /data/images/rooms/ on Amvera.
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { glob } from 'glob'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOMS_DIR = path.join(__dirname, '..', 'public/images/rooms')

function sanitizeName(name) {
  return name
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
}

async function main() {
  // True originals are always inside {category}/original/original/
  const originals = await glob(
    `${ROOMS_DIR}/*/original/original/*.{jpg,JPG,jpeg,JPEG}`,
    { nocase: false }
  )

  if (originals.length === 0) {
    console.log('No originals found in */original/original/ — already flattened?')
    return
  }

  console.log(`Found ${originals.length} original files:\n`)

  const toCreate = []
  const seen = new Set()

  for (const src of originals) {
    const relativeParts = path.relative(ROOMS_DIR, src).split(path.sep)
    const category = relativeParts[0]
    const basename = path.parse(src).name
    const sanitized = sanitizeName(basename)
    const destName = `${category}__${sanitized}.jpg`

    if (seen.has(destName)) {
      console.warn(`  ⚠️  Duplicate skipped: ${destName}`)
      continue
    }
    seen.add(destName)

    toCreate.push({ src, dest: path.join(ROOMS_DIR, destName) })
    console.log(`  ${category}  →  ${destName}`)
  }

  console.log('\nCopying originals to flat structure...')
  for (const { src, dest } of toCreate) {
    await fs.copyFile(src, dest)
  }

  console.log('\nRemoving all subdirectories...')
  const entries = await fs.readdir(ROOMS_DIR, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      await fs.rm(path.join(ROOMS_DIR, entry.name), { recursive: true, force: true })
      console.log(`  Removed: ${entry.name}/`)
    }
  }

  console.log(`\n✅ Done! ${toCreate.length} originals in flat structure.`)
  console.log('\nNext steps:')
  console.log('  1. npm run images:optimize         — generate thumbnails/medium/large variants')
  console.log('  2. npm run images:generate-manifest — regenerate gallery-manifest.json')
  console.log('  3. Upload all files from public/images/rooms/ to /data/images/rooms/ on Amvera')
}

main().catch(console.error)
