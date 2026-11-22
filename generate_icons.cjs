const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. Standard Logo SVG (512x512) for "any" purpose
const standardLogoSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="64" y1="64" x2="448" y2="448" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="50%" stop-color="#7c3aed" />
      <stop offset="100%" stop-color="#2563eb" />
    </linearGradient>
  </defs>

  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  <rect x="24" y="24" width="464" height="464" rx="96" fill="none" stroke="#6366f1" stroke-width="4" stroke-opacity="0.3"/>

  <rect x="64" y="64" width="384" height="384" rx="80" fill="url(#cardGrad)"/>

  <rect x="128" y="300" width="256" height="64" rx="18" fill="#ffffff" fill-opacity="0.15" stroke="#ffffff" stroke-opacity="0.2" stroke-width="3"/>
  <circle cx="168" cy="332" r="10" fill="#10b981"/>
  <rect x="196" y="326" width="136" height="12" rx="6" fill="#ffffff" fill-opacity="0.8"/>

  <rect x="128" y="224" width="256" height="64" rx="18" fill="#ffffff" fill-opacity="0.25" stroke="#ffffff" stroke-opacity="0.3" stroke-width="3"/>
  <circle cx="168" cy="256" r="10" fill="#38bdf8"/>
  <rect x="196" y="250" width="100" height="12" rx="6" fill="#ffffff" fill-opacity="0.9"/>

  <rect x="128" y="148" width="256" height="64" rx="18" fill="#ffffff"/>
  <circle cx="168" cy="180" r="10" fill="#6366f1"/>
  <rect x="196" y="174" width="148" height="12" rx="6" fill="#1e1b4b"/>

  <path d="M360 110 L366 126 L382 132 L366 138 L360 154 L354 138 L338 132 L354 126 Z" fill="#f59e0b"/>
</svg>`;

// 2. Maskable Logo SVG (512x512) - Safe zone is inner 80% circle (diameter 410px)
const maskableLogoSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mBgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0a0a0c" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </linearGradient>
    <linearGradient id="mCardGrad" x1="80" y1="80" x2="432" y2="432" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="50%" stop-color="#7c3aed" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>
  </defs>

  <rect width="512" height="512" fill="url(#mBgGrad)"/>
  <rect x="106" y="106" width="300" height="300" rx="64" fill="url(#mCardGrad)"/>

  <rect x="150" y="290" width="212" height="52" rx="14" fill="#ffffff" fill-opacity="0.2" stroke="#ffffff" stroke-opacity="0.3" stroke-width="2"/>
  <circle cx="182" cy="316" r="8" fill="#10b981"/>
  <rect x="204" y="311" width="110" height="10" rx="5" fill="#ffffff" fill-opacity="0.8"/>

  <rect x="150" y="226" width="212" height="52" rx="14" fill="#ffffff" fill-opacity="0.3" stroke="#ffffff" stroke-opacity="0.4" stroke-width="2"/>
  <circle cx="182" cy="252" r="8" fill="#38bdf8"/>
  <rect x="204" y="247" width="80" height="10" rx="5" fill="#ffffff" fill-opacity="0.9"/>

  <rect x="150" y="162" width="212" height="52" rx="14" fill="#ffffff"/>
  <circle cx="182" cy="188" r="8" fill="#6366f1"/>
  <rect x="204" y="183" width="120" height="10" rx="5" fill="#1e1b4b"/>

  <path d="M340 130 L345 143 L358 148 L345 153 L340 166 L335 153 L322 148 L335 143 Z" fill="#f59e0b"/>
</svg>`;

// 3. Wide Screenshot SVG (1280x720)
const screenshotWideSvg = `<svg width="1280" height="720" viewBox="0 0 1280 720" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1280" height="720" fill="#0f172a"/>
  <rect x="40" y="40" width="1200" height="56" rx="16" fill="#1e293b"/>
  <circle cx="72" cy="68" r="8" fill="#ef4444"/>
  <circle cx="96" cy="68" r="8" fill="#eab308"/>
  <circle cx="120" cy="68" r="8" fill="#22c55e"/>
  <rect x="160" y="56" width="400" height="24" rx="6" fill="#334155"/>
  <rect x="40" y="120" width="260" height="560" rx="16" fill="#1e293b"/>
  <rect x="320" y="120" width="920" height="560" rx="16" fill="#1e293b"/>
  <rect x="350" y="150" width="860" height="120" rx="12" fill="#334155"/>
  <rect x="350" y="290" width="860" height="360" rx="12" fill="#020617"/>
</svg>`;

// 4. Narrow Screenshot SVG (540x720)
const screenshotNarrowSvg = `<svg width="540" height="720" viewBox="0 0 540 720" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="540" height="720" fill="#0f172a"/>
  <rect x="20" y="20" width="500" height="48" rx="12" fill="#1e293b"/>
  <rect x="20" y="80" width="500" height="620" rx="16" fill="#1e293b"/>
  <rect x="40" y="100" width="460" height="120" rx="12" fill="#334155"/>
  <rect x="40" y="240" width="460" height="440" rx="12" fill="#020617"/>
</svg>`;

async function buildAllIcons() {
  console.log('Generating pristine binary PNG icons and screenshots...');

  const buf512 = await sharp(Buffer.from(standardLogoSvg)).png({ compressionLevel: 9, quality: 100 }).toBuffer();
  const buf192 = await sharp(Buffer.from(standardLogoSvg)).resize(192, 192).png({ compressionLevel: 9, quality: 100 }).toBuffer();
  const buf180 = await sharp(Buffer.from(standardLogoSvg)).resize(180, 180).png({ compressionLevel: 9, quality: 100 }).toBuffer();
  const buf64 = await sharp(Buffer.from(standardLogoSvg)).resize(64, 64).png({ compressionLevel: 9, quality: 100 }).toBuffer();

  const bufMaskable512 = await sharp(Buffer.from(maskableLogoSvg)).png({ compressionLevel: 9, quality: 100 }).toBuffer();

  const bufWide = await sharp(Buffer.from(screenshotWideSvg)).png({ compressionLevel: 9, quality: 100 }).toBuffer();
  const bufNarrow = await sharp(Buffer.from(screenshotNarrowSvg)).png({ compressionLevel: 9, quality: 100 }).toBuffer();

  const targetFiles = [
    // Root files
    { path: 'logo512.png', buf: buf512 },
    { path: 'logo192.png', buf: buf192 },
    { path: 'maskable-icon.png', buf: bufMaskable512 },
    { path: 'apple-touch-icon.png', buf: buf180 },
    { path: 'favicon.png', buf: buf64 },
    { path: 'screenshot-wide.png', buf: bufWide },
    { path: 'screenshot-narrow.png', buf: bufNarrow },

    // public/
    { path: 'public/logo512.png', buf: buf512 },
    { path: 'public/logo192.png', buf: buf192 },
    { path: 'public/maskable-icon.png', buf: bufMaskable512 },
    { path: 'public/apple-touch-icon.png', buf: buf180 },
    { path: 'public/favicon.png', buf: buf64 },
    { path: 'public/favicon-512.png', buf: buf512 },
    { path: 'public/favicon-192.png', buf: buf192 },
    { path: 'public/screenshot-wide.png', buf: bufWide },
    { path: 'public/screenshot-narrow.png', buf: bufNarrow },

    // public/icons/
    { path: 'public/icons/logo512.png', buf: buf512 },
    { path: 'public/icons/logo192.png', buf: buf192 },
    { path: 'public/icons/maskable-icon.png', buf: bufMaskable512 },

    // icons/
    { path: 'icons/logo512.png', buf: buf512 },
    { path: 'icons/logo192.png', buf: buf192 },
    { path: 'icons/maskable-icon.png', buf: bufMaskable512 },
  ];

  if (fs.existsSync('dist')) {
    targetFiles.push(
      { path: 'dist/logo512.png', buf: buf512 },
      { path: 'dist/logo192.png', buf: buf192 },
      { path: 'dist/maskable-icon.png', buf: bufMaskable512 },
      { path: 'dist/apple-touch-icon.png', buf: buf180 },
      { path: 'dist/favicon.png', buf: buf64 },
      { path: 'dist/favicon-512.png', buf: buf512 },
      { path: 'dist/favicon-192.png', buf: buf192 },
      { path: 'dist/screenshot-wide.png', buf: bufWide },
      { path: 'dist/screenshot-narrow.png', buf: bufNarrow },
      { path: 'dist/icons/logo512.png', buf: buf512 },
      { path: 'dist/icons/logo192.png', buf: buf192 },
      { path: 'dist/icons/maskable-icon.png', buf: bufMaskable512 }
    );
  }

  for (const t of targetFiles) {
    const dir = path.dirname(t.path);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(t.path, t.buf);
    console.log('Saved:', t.path, '=> size:', t.buf.length, 'bytes');
  }

  console.log('SUCCESS: All icons and screenshots generated as binary PNGs!');
}

module.exports = { buildAllIcons };

if (require.main === module) {
  buildAllIcons();
}
