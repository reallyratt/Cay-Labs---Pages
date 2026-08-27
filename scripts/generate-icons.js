import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('./public/icon.svg');
const publicDir = path.resolve('./public');

async function run() {
  console.log('Rendering paper and pen emoji PNGs (129, 192, 512, maskable, favicon)...');

  const svgBuffer = fs.readFileSync(svgPath);

  // 192x192 standard icon (TrueColor 32-bit RGBA)
  const pwa192Buffer = await sharp(svgBuffer)
    .resize(192, 192)
    .png({ compressionLevel: 6, adaptiveFiltering: true, force: true })
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'pwa-192.png'), pwa192Buffer);
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), pwa192Buffer);
  fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), pwa192Buffer);
  console.log('Generated pwa-192.png');

  // 129x129 icon
  const pwa129Buffer = await sharp(svgBuffer)
    .resize(129, 129)
    .png({ compressionLevel: 6, adaptiveFiltering: true, force: true })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'pwa-129.png'), pwa129Buffer);
  console.log('Generated pwa-129.png');

  // 512x512 high-res icon (TrueColor 32-bit RGBA)
  const pwa512Buffer = await sharp(svgBuffer)
    .resize(512, 512)
    .png({ compressionLevel: 6, adaptiveFiltering: true, force: true })
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'pwa-512.png'), pwa512Buffer);
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), pwa512Buffer);
  fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), pwa512Buffer);
  console.log('Generated pwa-512.png');

  // 512x512 maskable icon with safe margin (for Android adaptive icons)
  await sharp(svgBuffer)
    .resize(410, 410, { fit: 'contain', background: { r: 250, g: 248, b: 245, alpha: 1 } })
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 250, g: 248, b: 245, alpha: 1 }
    })
    .png({ compressionLevel: 6, force: true })
    .toFile(path.join(publicDir, 'pwa-512-maskable.png'));
  console.log('Generated pwa-512-maskable.png');

  // Apple touch icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ compressionLevel: 6, force: true })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // Favicons (PNG format only, replacing .ico)
  await sharp(svgBuffer).resize(64, 64).png().toFile(path.join(publicDir, 'favicon.png'));
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'));
  await sharp(svgBuffer).resize(16, 16).png().toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('Generated favicon.png (64x64, 32x32, 16x16)');

  // Remove favicon.ico if present so we strictly use .png
  if (fs.existsSync(path.join(publicDir, 'favicon.ico'))) {
    fs.unlinkSync(path.join(publicDir, 'favicon.ico'));
    console.log('Removed favicon.ico to use .png strictly');
  }
}

run().catch(console.error);
