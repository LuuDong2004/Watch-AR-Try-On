# Test PNG assets for ARTryOnPNG

Drop two **transparent** PNG files here so the PNG try-on can launch:

- `watch-face.png`  — top-down view of the watch face (dial only, no strap)
- `watch-strap.png` — long strip of the strap, oriented vertically (top → bottom)

Both must have an alpha channel. Recommended size: 512×512 (face), 512×1024 (strap).

## Quick ways to get them

1. **remove.bg** — snap a top-down photo of the watch face on a plain background,
   upload, download the cutout as PNG.
2. **Product photos from the brand** — most catalog renders are already on a
   transparent background.
3. **Photoshop / GIMP / Photopea** — magic-wand the background out and export
   as PNG with alpha.

## Where they're wired

`frontend/src/App.jsx` references:
```
faceImageUrl:  '/images/test/watch-face.png'
strapImageUrl: '/images/test/watch-strap.png'
```

If either file is missing the "Thử AR (PNG)" button still renders, but Three.js
will throw a 404 when loading the texture. Either drop the files in or change
the URLs in `SAMPLE_WATCHES[0]`.

## Tuning after the first run

If the watch looks wrong, edit `frontend/src/components/ar/ARTryOnPNG.jsx`:

| Symptom                       | Knob to turn                                 |
| ----------------------------- | -------------------------------------------- |
| Watch too big / too small     | `rawScale = wristW * 1.8` — adjust 1.8       |
| Strap shows in front of wrist | `CylinderGeometry(0.38, 0.38, 1.0, 32)` — bump radius/height |
| Watch sits on knuckles        | `offsetVec.multiplyScalar(0.3)` — push higher (e.g. 0.5) |
| Face floats above the strap   | `face.position.z = 0.02` — lower toward 0.01 |
