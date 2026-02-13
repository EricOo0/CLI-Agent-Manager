const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

function createColoredCircle(size, r, g, b) {
  const png = new PNG({ width: size, height: size });
  const center = size / 2;
  const radius = (size / 2) - 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        png.data[idx] = r;
        png.data[idx + 1] = g;
        png.data[idx + 2] = b;
        png.data[idx + 3] = 255;
      } else {
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
      }
    }
  }
  return png;
}

const resourcesDir = path.join(__dirname, '..', 'resources');
const iconsDir = path.join(resourcesDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const trayPng = createColoredCircle(22, 34, 211, 238);
trayPng.pack().pipe(fs.createWriteStream(path.join(resourcesDir, 'tray-iconTemplate.png')));
console.log('Created tray-iconTemplate.png (22x22)');

const iconSizes = [16, 32, 64, 128, 256, 512, 1024];
const iconR = 34, iconG = 211, iconB = 238;

for (const size of iconSizes) {
  const png = createColoredCircle(size, iconR, iconG, iconB);
  const filename = size === 16 ? 'icon.png' : `icon${size}.png`;
  png.pack().pipe(fs.createWriteStream(path.join(iconsDir, filename)));
  console.log(`Created icons/${filename} (${size}x${size})`);
}

const mainIconPng = createColoredCircle(512, iconR, iconG, iconB);
mainIconPng.pack().pipe(fs.createWriteStream(path.join(resourcesDir, 'icon.png')));
console.log('Created icon.png (512x512)');
