import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
const sourceImage = path.resolve('src/assets/images/shreni_pwa_icon_1789552653171.jpg');

async function buildIcons() {
  console.log('Generating PWA icons from Shreni emblem:', sourceImage);

  const baseNavy = { r: 16, g: 38, b: 68, alpha: 1 }; // #102644 deep indigo matching uploaded emblem

  // 1. Generate 512x512 standard icon
  await sharp(sourceImage)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✓ Created public/pwa-512x512.png');

  // 2. Generate 192x192 standard icon
  await sharp(sourceImage)
    .resize(192, 192, { fit: 'cover' })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✓ Created public/pwa-192x192.png');

  // 3. Apple Touch Icon 180x180
  await sharp(sourceImage)
    .resize(180, 180, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created public/apple-touch-icon.png');

  // 4. Favicon 64x64 PNG and favicon.ico
  await sharp(sourceImage)
    .resize(64, 64, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  
  await sharp(sourceImage)
    .resize(48, 48, { fit: 'cover' })
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('✓ Created public/favicon.ico');

  // 5. Maskable icon (512x512 with safe-zone margin 80% so outer floral border is completely protected on Android adaptive icon squircle/circle masks)
  const innerIcon = await sharp(sourceImage)
    .resize(410, 410, { fit: 'contain' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: baseNavy,
    },
  })
    .composite([
      {
        input: innerIcon,
        gravity: 'center',
      },
    ])
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ Created public/pwa-maskable-512x512.png (maskable safe zone)');

  // 6. Vector SVG representation with the authentic Devanagari 'श्रे' and ornamental Indian filigree frame
  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="indigoBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f294a" />
      <stop offset="100%" stop-color="#19375e" />
    </linearGradient>
    <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Deep Indigo Navy Background -->
  <rect width="512" height="512" rx="40" fill="url(#indigoBg)" />

  <!-- Outer Traditional Lace / Filigree Border Frame -->
  <rect x="28" y="28" width="456" height="456" rx="24" fill="none" stroke="#f6f2ea" stroke-width="4.5" opacity="0.95" />
  <rect x="36" y="36" width="440" height="440" rx="20" fill="none" stroke="#f6f2ea" stroke-width="2" stroke-dasharray="6 4" opacity="0.6" />

  <!-- 4 Corner Floral Block-print Motifs -->
  <g fill="#f6f2ea" opacity="0.92">
    <!-- Top-Left Corner -->
    <path d="M44 44 C65 52 75 75 72 96 C84 84 94 65 92 44 Z" />
    <circle cx="58" cy="58" r="5" />
    <path d="M48 88 C60 88 70 78 70 66 C70 54 60 44 48 44" fill="none" stroke="#f6f2ea" stroke-width="2.5" />

    <!-- Top-Right Corner -->
    <path d="M468 44 C447 52 437 75 440 96 C428 84 418 65 420 44 Z" />
    <circle cx="454" cy="58" r="5" />
    <path d="M464 88 C452 88 442 78 442 66 C442 54 452 44 464 44" fill="none" stroke="#f6f2ea" stroke-width="2.5" />

    <!-- Bottom-Left Corner -->
    <path d="M44 468 C65 460 75 437 72 416 C84 428 94 447 92 468 Z" />
    <circle cx="58" cy="454" r="5" />
    <path d="M48 424 C60 424 70 434 70 446 C70 458 60 468 48 468" fill="none" stroke="#f6f2ea" stroke-width="2.5" />

    <!-- Bottom-Right Corner -->
    <path d="M468 468 C447 460 437 437 440 416 C428 428 418 447 420 468 Z" />
    <circle cx="454" cy="454" r="5" />
    <path d="M464 424 C452 424 442 434 442 446 C442 458 452 468 464 468" fill="none" stroke="#f6f2ea" stroke-width="2.5" />
  </g>

  <!-- Perimeter Kalamkari Floral Vine Pattern -->
  <g fill="#f6f2ea" opacity="0.88">
    <!-- Top & Bottom center buds -->
    <path d="M256 42 C244 58 238 72 256 88 C274 72 268 58 256 42 Z" />
    <circle cx="236" cy="62" r="4" /><circle cx="276" cy="62" r="4" />
    <path d="M256 470 C244 454 238 440 256 424 C274 440 268 454 256 470 Z" />
    <circle cx="236" cy="450" r="4" /><circle cx="276" cy="450" r="4" />

    <!-- Left & Right center buds -->
    <path d="M42 256 C58 244 72 238 88 256 C72 274 58 268 42 256 Z" />
    <circle cx="62" cy="236" r="4" /><circle cx="62" cy="276" r="4" />
    <path d="M470 256 C454 244 440 238 424 256 C440 274 454 268 470 256 Z" />
    <circle cx="450" cy="236" r="4" /><circle cx="450" cy="276" r="4" />
  </g>

  <!-- Central Medallion Frame (Quatrefoil / Clover Traditional Border) -->
  <path d="
    M 256 122
    C 285 122 308 140 318 166
    C 344 156 372 174 377 203
    C 382 232 370 256 356 268
    C 370 280 382 304 377 333
    C 372 362 344 380 318 370
    C 308 396 285 414 256 414
    C 227 414 204 396 194 370
    C 168 380 140 362 135 333
    C 130 304 142 280 156 268
    C 142 256 130 232 135 203
    C 140 174 168 156 194 166
    C 204 140 227 122 256 122 Z"
    fill="#0f294a" stroke="#f6f2ea" stroke-width="7" filter="url(#softGlow)" />
  
  <path d="
    M 256 132
    C 280 132 300 148 309 172
    C 333 162 358 178 363 204
    C 368 230 357 252 344 263
    C 357 274 368 296 363 322
    C 358 348 333 364 309 354
    C 300 378 280 394 256 394
    C 232 394 212 378 203 354
    C 179 364 154 348 149 322
    C 144 296 155 274 168 263
    C 155 252 144 230 149 204
    C 154 178 179 162 203 172
    C 212 148 232 132 256 132 Z"
    fill="none" stroke="#f6f2ea" stroke-width="2.5" opacity="0.75" />

  <!-- Center Devanagari Character: श्रे (Shre) in bold ivory craft lettering -->
  <g fill="#f6f2ea">
    <!-- Top Shirorekha Bar -->
    <rect x="180" y="194" width="152" height="15" rx="4" />

    <!-- Matra (े) slanted stroke on top left -->
    <path d="M296 195 C288 175 272 152 256 142 C262 140 270 142 278 147 C296 160 306 178 309 195 Z" />

    <!-- Loop and body of 'श' -->
    <circle cx="218" cy="226" r="22" fill="none" stroke="#f6f2ea" stroke-width="14" />
    <path d="M210 244 C210 262 226 276 244 276 L254 276 C262 276 268 282 264 290 L242 334 C239 340 232 344 225 344 L212 344 C204 344 200 336 204 330 L232 284 C218 282 200 270 196 252 Z" />

    <!-- Diagonal 'र' stroke of 'श्र' -->
    <path d="M246 252 L192 312 C186 318 190 328 198 328 L212 328 C218 328 224 324 228 318 L260 274 Z" />

    <!-- Vertical Stem Bar of 'श' -->
    <rect x="288" y="194" width="16" height="152" rx="4" />
  </g>
</svg>
`;

  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent.trim());
  console.log('✓ Created public/icon.svg (Vector Devanagari श्रे Emblem)');

  // Also copy to icon-192.svg and icon-512.svg for backward-compat
  fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), svgContent.trim());
  fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), svgContent.trim());
  fs.writeFileSync(path.join(publicDir, 'icon-maskable.svg'), svgContent.trim());

  console.log('\nAll PWA icons successfully updated with the Shreni emblem!');
}

buildIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
