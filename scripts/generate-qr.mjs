#!/usr/bin/env node
/**
 * Generates the QR code for print flyers.
 *
 *   npm run qr                          # uses VITE_PUBLIC_URL from .env
 *   npm run qr -- https://example.org   # or an explicit URL
 *
 * Writes public/qr-code.svg and public/qr-code.png. A static image is fine;
 * this does not need to be dynamic. The code encodes a plain URL and nothing
 * else — no campaign parameters, no redirect service, nothing that would let
 * a scan be traced back to a person.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function urlFromEnvFile() {
  for (const file of ['.env', '.env.local', '.env.example']) {
    try {
      const contents = readFileSync(join(root, file), 'utf8')
      const match = /^VITE_PUBLIC_URL=(.+)$/m.exec(contents)
      if (match && match[1].trim()) return match[1].trim()
    } catch {
      // Not every file exists in every checkout.
    }
  }
  return null
}

const target = process.argv[2] ?? process.env.VITE_PUBLIC_URL ?? urlFromEnvFile()

if (!target) {
  console.error('No URL. Pass one as an argument or set VITE_PUBLIC_URL.')
  process.exit(1)
}

try {
  new URL(target)
} catch {
  console.error(`Not a valid URL: ${target}`)
  process.exit(1)
}

const outDir = join(root, 'public')
mkdirSync(outDir, { recursive: true })

// High error correction so the code still scans off a photocopied flyer taped
// to a wall.
const options = { errorCorrectionLevel: 'H', margin: 2, width: 1024 }

const svg = await QRCode.toString(target, { ...options, type: 'svg' })
writeFileSync(join(outDir, 'qr-code.svg'), svg)
await QRCode.toFile(join(outDir, 'qr-code.png'), target, options)

console.log(`QR code written for ${target}`)
console.log('  public/qr-code.svg')
console.log('  public/qr-code.png')
