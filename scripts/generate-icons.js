import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import pngToIco from 'png-to-ico';

const svgPath = path.resolve('./public/icon.svg');
const publicDir = path.resolve('./public');

async function run() {
  console.log('Generating complete PWA icons & ICO from vector SVG...');

  const svgBuffer = fs.readFileSync(svgPath);

  // 192x192 standard icon (TrueColor RGBA)
  const pwa192Buffer = await sharp(svgBuffer)
    .resize(192, 192)
    .png({ compressionLevel: 9, adaptiveFiltering: true, force: true })
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'pwa-192.png'), pwa192Buffer);
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), pwa192Buffer);
  fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), pwa192Buffer);
  console.log('Created pwa-192.png & aliases');

  // 512x512 high-res icon (TrueColor RGBA)
  const pwa512Buffer = await sharp(svgBuffer)
    .resize(512, 512)
    .png({ compressionLevel: 9, adaptiveFiltering: true, force: true })
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'pwa-512.png'), pwa512Buffer);
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), pwa512Buffer);
  fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), pwa512Buffer);
  console.log('Created pwa-512.png & aliases');

  // 512x512 maskable icon with safe margin
  await sharp(svgBuffer)
    .resize(410, 410, { fit: 'contain', background: { r: 250, g: 248, b: 245, alpha: 1 } })
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 250, g: 248, b: 245, alpha: 1 }
    })
    .png({ compressionLevel: 9, force: true })
    .toFile(path.join(publicDir, 'pwa-512-maskable.png'));
  console.log('Created pwa-512-maskable.png');

  // Apple touch icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ compressionLevel: 9, force: true })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // Small favicons for ICO creation
  const icon16 = await sharp(svgBuffer).resize(16, 16).png().toFile(path.join(publicDir, 'favicon-16x16.png'));
  const icon32 = await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'));
  const icon48 = await sharp(svgBuffer).resize(48, 48).png().toFile(path.join(publicDir, 'favicon-48x48.png'));
  const icon64 = await sharp(svgBuffer).resize(64, 64).png().toFile(path.join(publicDir, 'favicon.png'));

  // Multi-size .ICO file
  try {
    const icoBuf = await pngToIco([
      path.join(publicDir, 'favicon-16x16.png'),
      path.join(publicDir, 'favicon-32x32.png'),
      path.join(publicDir, 'favicon-48x48.png'),
      path.join(publicDir, 'favicon.png')
    ]);
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);
    console.log('Created multi-size public/favicon.ico successfully!');
  } catch (e) {
    console.error('ICO generation notice:', e);
  }
}

run().catch(console.error);
