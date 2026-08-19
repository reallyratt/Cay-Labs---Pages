import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sourceImage = path.resolve('./src/assets/images/pages_app_icon_1787145248634.jpg');
const publicDir = path.resolve('./public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function run() {
  console.log('Generating PWA icons from:', sourceImage);

  // 192x192 standard icon
  await sharp(sourceImage)
    .resize(192, 192, { fit: 'cover' })
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'pwa-192.png'));
  console.log('Created pwa-192.png');

  // 512x512 high-res icon
  await sharp(sourceImage)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'pwa-512.png'));
  console.log('Created pwa-512.png');

  // 512x512 maskable icon with 10% safe margin padding
  await sharp(sourceImage)
    .resize(430, 430, { fit: 'contain', background: { r: 249, g: 247, b: 242, alpha: 1 } })
    .extend({
      top: 41,
      bottom: 41,
      left: 41,
      right: 41,
      background: { r: 249, g: 247, b: 242, alpha: 1 }
    })
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'pwa-512-maskable.png'));
  console.log('Created pwa-512-maskable.png');

  // Apple touch icon 180x180
  await sharp(sourceImage)
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // Favicon 64x64
  await sharp(sourceImage)
    .resize(64, 64, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Created favicon.png');
}

run().catch(console.error);
