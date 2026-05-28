# Setup DeepAR AR Try-On

Hướng dẫn tạo file `.deepar` effect cho tính năng AR Watch Try-On.

## Tại sao cần?

DeepAR SDK không tự render từ `.glb` được — nó cần một file **effect** (`.deepar`) bundling:
- 3D model (watch.glb)
- Transform per anchor (vị trí/scale/rotation gắn vào cổ tay)
- Vật liệu / animation / shader nếu có

Effect file được tạo trên **DeepAR Studio** (web app, miễn phí cho hobbyist).

---

## Các bước

### 1. Tạo tài khoản DeepAR

Vào https://studio.deepar.ai/ và đăng ký.

### 2. Tạo project mới

- **New Project** → chọn template **"Wrist"** (quan trọng — anchor cổ tay, không phải mặt).
- Đặt tên: `chronograph-white`.

### 3. Import model 3D

- Trong Studio → **Assets** panel → **Import** → upload `frontend/public/models/watch.glb`.
- Drag model từ Assets vào canvas / scene tree.
- Gắn vào anchor **"Wrist"** (cổ tay) — đây là điểm DeepAR tự track 6DOF.

### 4. Tinh chỉnh tư thế

Trên Studio:
- **Position**: kéo đồng hồ sao cho tâm dial nằm ngay trên cổ tay.
- **Rotation**: xoay sao cho mặt số quay ra ngoài (về phía camera khi user chìa cổ tay ra).
  - Khronos ChronographWatch: thường cần `Y = -90°`, `Z = -90°` (theo trục Blender).
- **Scale**: thử các giá trị 0.5 → 1.5 đến khi đồng hồ vừa cổ tay người mẫu Studio cung cấp.

### 5. Áp variant trắng (optional)

Model `.glb` có 4 variant qua `KHR_materials_variants` (Surgical White / Midnight Gold / Commerce Green / Khronos Red).
DeepAR Studio có thể chưa hỗ trợ trực tiếp variant API — nếu vậy, cần **bake** variant trắng trước:
- Mở `watch.glb` trên https://gltf.report/ hoặc Blender.
- Apply variant "Surgical White" làm material chính.
- Export `.glb` mới → upload vào Studio.

### 6. Export effect

- **File** → **Export** → chọn định dạng `.deepar`.
- Đặt tên: `chronograph-white.deepar`.
- Tải về và copy vào `frontend/public/effects/chronograph-white.deepar`.

```
frontend/
└── public/
    └── effects/
        └── chronograph-white.deepar   ← here
```

### 7. Cập nhật env

Ở local, file `frontend/.env` (đã tạo sẵn) trỏ tới effect mặc định:
```
VITE_DEEPAR_LICENSE_KEY=...
VITE_DEEPAR_EFFECT_URL=/effects/chronograph-white.deepar
```

Trên **Vercel**:
1. Project Settings → **Environment Variables**.
2. Add:
   - `VITE_DEEPAR_LICENSE_KEY` = `<key của bạn>` (cùng key trong `.env` local).
   - `VITE_DEEPAR_EFFECT_URL` = `/effects/chronograph-white.deepar`.
3. Redeploy.

### 8. Kiểm tra

- Local: `npm run dev` → mở http://localhost:5173 → nút "Thử AR" → effect load.
- Prod: push lên main → Vercel rebuild → mở https://watch-ar-try-on.vercel.app → quét QR trên điện thoại → AR mở với effect.

---

## Lỗi thường gặp

| Lỗi | Nguyên nhân | Fix |
|---|---|---|
| `License invalid` | Key sai hoặc domain không khớp | Kiểm tra `VITE_DEEPAR_LICENSE_KEY`. Key được lock theo domain tại developer.deepar.ai |
| `Failed to fetch effect` 404 | Chưa upload file `.deepar` | Hoàn tất bước 6 |
| `SharedArrayBuffer not defined` | Thiếu COOP/COEP headers | Đã set sẵn trong `vercel.json` + `vite.config.js`. Nếu vẫn lỗi, hard refresh (Ctrl+Shift+R) |
| Watermark "DeepAR" góc màn hình | Free tier | Bình thường — upgrade plan để bỏ |
| Watch lệch khỏi cổ tay | Position/rotation/scale chưa đúng trong Studio | Mở lại Studio, tinh chỉnh lại bước 4, re-export |

---

## Multi-model (sau này)

Khi có nhiều mẫu đồng hồ:
1. Tạo 1 file `.deepar` per mẫu trên Studio (mỗi mẫu = project riêng + scene riêng).
2. Đặt vào `public/effects/`:
   ```
   public/effects/
   ├── chronograph-white.deepar
   ├── classic-leather.deepar
   └── smartwatch.deepar
   ```
3. Trong `App.jsx`, đặt `effectUrl` per watch:
   ```js
   { id: 'classic', effectUrl: '/effects/classic-leather.deepar' }
   ```
4. Component sẽ gọi `deepAR.switchEffect()` khi prop thay đổi.

---

## Migrate ngược về TF.js (rollback)

Nếu DeepAR free-tier watermark hoặc tracking không như ý:
1. `git revert` đến commit trước commit DeepAR migration (`538030e`).
2. `npm install` các package TF.js đã uninstall.
3. Reset env vars trên Vercel nếu cần.
