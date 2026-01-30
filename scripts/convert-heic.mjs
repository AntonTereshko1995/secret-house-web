import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import convert from 'heic-convert'
import { glob } from 'glob'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '..')

const ROOMS_DIR = path.join(projectRoot, 'public/images/rooms')

async function convertHEICtoJPG(heicPath) {
  try {
    console.log(`Converting: ${heicPath}`)

    const inputBuffer = await fs.readFile(heicPath)

    const outputBuffer = await convert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 0.95
    })

    // Replace .HEIC/.heic extension with .JPG
    const jpgPath = heicPath.replace(/\.heic$/i, '.JPG')
    await fs.writeFile(jpgPath, outputBuffer)

    console.log(`✅ Created: ${jpgPath}`)

    // Delete original HEIC file
    await fs.unlink(heicPath)
    console.log(`🗑️  Deleted: ${heicPath}`)

    return jpgPath
  } catch (error) {
    console.error(`❌ Failed to convert ${heicPath}:`, error.message)
    return null
  }
}

async function main() {
  console.log('🔍 Scanning for HEIC files...\n')

  // Find all HEIC files recursively
  const heicFiles = await glob(`${ROOMS_DIR}/**/*.{heic,HEIC}`, {
    ignore: ['**/original/**']  // Skip original folder
  })

  if (heicFiles.length === 0) {
    console.log('✨ No HEIC files found. All images are already in compatible formats.')
    return
  }

  console.log(`Found ${heicFiles.length} HEIC files:\n`)
  heicFiles.forEach(file => console.log(`  - ${path.relative(projectRoot, file)}`))
  console.log()

  // Convert all HEIC files
  let successCount = 0
  let failCount = 0

  for (const heicFile of heicFiles) {
    const result = await convertHEICtoJPG(heicFile)
    if (result) {
      successCount++
    } else {
      failCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Successfully converted: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log('='.repeat(50))
}

main().catch(console.error)
