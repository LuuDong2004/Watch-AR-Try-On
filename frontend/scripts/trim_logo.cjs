const path = require('path');
const Jimp = require('jimp');

(async () => {
  const src = 'C:/Users/Dong/Downloads/logo.jpg';
  const outDir = path.join(__dirname, '..', 'public', 'brand');
  const img = await Jimp.read(src);
  console.log('original', img.bitmap.width, img.bitmap.height);

  img.autocrop({ tolerance: 0.02, cropOnlyFrames: false, cropSymmetric: false });
  console.log('after autocrop', img.bitmap.width, img.bitmap.height);

  const pad = Math.round(img.bitmap.height * 0.12);
  const padded = new Jimp(img.bitmap.width + pad * 2, img.bitmap.height + pad * 2, 0xffffffff);
  padded.composite(img, pad, pad);
  // Downscale to a web-friendly size — still ~3x the largest on-screen height.
  padded.resize(Jimp.AUTO, 240);
  await padded.writeAsync(path.join(outDir, 'truewrist-logo.png'));
  console.log('saved white-bg', padded.bitmap.width, padded.bitmap.height);

  const trans = padded.clone();
  trans.scan(0, 0, trans.bitmap.width, trans.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx], g = this.bitmap.data[idx + 1], b = this.bitmap.data[idx + 2];
    if (r > 240 && g > 240 && b > 240) this.bitmap.data[idx + 3] = 0;
  });
  await trans.writeAsync(path.join(outDir, 'truewrist-logo-alpha.png'));
  console.log('saved transparent');
})().catch((e) => { console.error(e); process.exit(1); });
