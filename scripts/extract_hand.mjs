import sharp from 'sharp';

async function perfectExtract() {
  const image = sharp('public/assets/hologram-hand.jpg');
  const metadata = await image.metadata();
  const width = metadata.width;
  const height = metadata.height;

  const { data } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const outBuffer = Buffer.alloc(width * height * 4);

  // Exact hand bounds in 1408x768 image
  // Thumb is on left (x ~ 440), Pinky is on right (x ~ 890), Middle fingertip is on top (y ~ 65), Base of palm/wrist is at y ~ 700.
  const cx = 715;
  const cy = 385;
  const rx = 270;
  const ry = 345;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const outIdx = (y * width + x) * 4;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const cyanEnergy = g * 0.45 + b * 0.55;

      // Elliptical distance from center of hand
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let spatialMask = 1.0;
      if (dist > 0.92) {
        spatialMask = Math.max(0, 1.0 - (dist - 0.92) / 0.22);
      }

      let alpha = 0;
      // Background in original image has brightness around 10-30.
      // Cyan glowing hand lines have brightness > 45 and cyanEnergy > 50.
      if (brightness > 22 && (b > r || g > r || brightness > 50)) {
        alpha = Math.min(255, Math.pow((brightness - 20) / 120, 0.85) * 255);
        if (cyanEnergy > 55) {
          alpha = Math.max(alpha, Math.min(255, (cyanEnergy - 35) * 1.8));
        }
      }

      alpha = alpha * spatialMask;

      if (alpha < 4) {
        outBuffer[outIdx] = 0;
        outBuffer[outIdx + 1] = 0;
        outBuffer[outIdx + 2] = 0;
        outBuffer[outIdx + 3] = 0;
      } else {
        // Boost cyan/blue highlights so it's luminous and transparent
        outBuffer[outIdx] = Math.min(255, Math.round(r * 1.05));
        outBuffer[outIdx + 1] = Math.min(255, Math.round(g * 1.15));
        outBuffer[outIdx + 2] = Math.min(255, Math.round(b * 1.2));
        outBuffer[outIdx + 3] = Math.min(255, Math.round(alpha));
      }
    }
  }

  // Crop tightly around the hand
  const cropLeft = 430;
  const cropTop = 50;
  const cropWidth = 570;
  const cropHeight = 670;

  await sharp(outBuffer, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .extract({
      left: cropLeft,
      top: cropTop,
      width: cropWidth,
      height: cropHeight,
    })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile('public/assets/hologram-hand-cutout.png');

  console.log('Finished extracting hologram-hand-cutout.png perfectly!');
}

perfectExtract().catch(console.error);
