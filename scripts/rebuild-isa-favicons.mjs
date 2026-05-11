import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'

const src = '/Users/vaughnharrison/.openclaw/workspace/website/public/icon-512.png'
const out = '/Users/vaughnharrison/.openclaw/workspace/regatta-scoring/public'
const source = await sharp(src).ensureAlpha().png().toBuffer()
await fs.writeFile(path.join(out, 'logo-icon-original.png'), source)
await fs.writeFile(path.join(out, 'logo-icon.png'), source)
for (const size of [16, 32, 48, 180, 192, 512]) {
  await sharp(source).resize(size, size, { fit: 'contain' }).png().toFile(path.join(out, `favicon-${size}x${size}.png`))
}
await sharp(source).resize(180, 180, { fit: 'contain' }).png().toFile(path.join(out, 'apple-touch-icon.png'))
await sharp(source).resize(192, 192, { fit: 'contain' }).png().toFile(path.join(out, 'android-chrome-192x192.png'))
await sharp(source).resize(512, 512, { fit: 'contain' }).png().toFile(path.join(out, 'android-chrome-512x512.png'))
await sharp(source).resize(150, 150, { fit: 'contain' }).png().toFile(path.join(out, 'mstile-150x150.png'))
const icoPngs = await Promise.all([16, 32, 48].map(async size => ({ size, data: await sharp(source).resize(size, size, { fit: 'contain' }).png().toBuffer() })))
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(icoPngs.length, 4)
let offset = 6 + icoPngs.length * 16
const dirs = []
for (const img of icoPngs) {
  const dir = Buffer.alloc(16)
  dir.writeUInt8(img.size === 256 ? 0 : img.size, 0)
  dir.writeUInt8(img.size === 256 ? 0 : img.size, 1)
  dir.writeUInt8(0, 2)
  dir.writeUInt8(0, 3)
  dir.writeUInt16LE(1, 4)
  dir.writeUInt16LE(32, 6)
  dir.writeUInt32LE(img.data.length, 8)
  dir.writeUInt32LE(offset, 12)
  dirs.push(dir)
  offset += img.data.length
}
await fs.writeFile(path.join(out, 'favicon.ico'), Buffer.concat([header, ...dirs, ...icoPngs.map(img => img.data)]))
const b64 = source.toString('base64')
await fs.writeFile(path.join(out, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="International Sailing Academy"><image href="data:image/png;base64,${b64}" width="512" height="512"/></svg>\n`)
