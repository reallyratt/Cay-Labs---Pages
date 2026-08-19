import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sourceImage = path.resolve('./src/assets/images/pages_app_icon_1787145248634.jpg');
const publicDir = path.resolve('./public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function run() {
  console.log('Generating TrueColor RGBA PWA icons from:', sourceImage);

  // 192x192 standard icon (TrueColor 32-bit RGBA, no palette)
  await sharp(sourceImage)
    .resize(192, 192, { fit: 'cover' })
    .ensureAlpha()
    .png({
      palette: false,
      compressionLevel: 6,
      adaptiveFiltering: true,
      force: true
    })
    .toFile(path.join(publicDir, 'pwa-192.png'));
  console.log('Created TrueColor pwa-192.png');

  // 512x512 high-res icon (TrueColor 32-bit RGBA, no palette)
  await sharp(sourceImage)
    .resize(512, 512, { fit: 'cover' })
    .ensureAlpha()
    .png({
      palette: false,
      compressionLevel: 6,
      adaptiveFiltering: true,
      force: true
    })
    .toFile(path.join(publicDir, 'pwa-512.png'));
  console.log('Created TrueColor pwa-512.png');

  // 512x512 maskable icon with safe margin (TrueColor 32-bit RGBA, no palette)
  await sharp(sourceImage)
    .resize(410, 410, { fit: 'contain', background: { r: 249, g: 247, b: 242, alpha: 1 } })
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 249, g: 247, b: 242, alpha: 1 }
    })
    .ensureAlpha()
    .png({
      palette: false,
      compressionLevel: 6,
      adaptiveFiltering: true,
      force: true
    })
    .toFile(path.join(publicDir, 'pwa-512-maskable.png'));
  console.log('Created TrueColor pwa-512-maskable.png');

  // Apple touch icon 180x180
  await sharp(sourceImage)
    .resize(180, 180, { fit: 'cover' })
    .ensureAlpha()
    .png({ palette: false })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // Favicon 64x64
  await sharp(sourceImage)
    .resize(64, 64, { fit: 'cover' })
    .ensureAlpha()
    .png({ palette: false })
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Created favicon.png');
}

run().catch(console.error);
