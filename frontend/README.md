# Watch AR Studio — Frontend MVP

MVP demo cho tính năng **AR Watch Try-On** (thử đồng hồ qua camera) trích từ spec `PROMPT_CLAUDE_CODE_WATCH_AR.md`.

## Tech stack
- ReactJS 18 + Vite
- Three.js + @react-three/fiber + @react-three/drei
- MediaPipe Hands (nhận diện cổ tay) + MediaPipe Camera Utils
- TailwindCSS (qua CDN — đủ cho MVP, không cần PostCSS config)

## Chạy local

```bash
cd frontend
npm install
npm run dev
```

Mở https://localhost:5173 (hoặc port Vite gợi ý). **Quan trọng**: trình duyệt chỉ cho phép truy cập camera trên `localhost` hoặc `https://`.

## Đặt model 3D đồng hồ

Đặt file `watch.glb` vào `public/models/watch.glb`. Nếu chưa có, trang chủ sẽ hiển thị thông báo nhắc.

### Nguồn .glb miễn phí
- [Sketchfab — Watch (Downloadable + glTF)](https://sketchfab.com/search?features=downloadable&q=watch&type=models)
- [Poly Pizza](https://poly.pizza/search/watch)
- [Khronos glTF sample models](https://github.com/KhronosGroup/glTF-Sample-Models)

Tải về `.glb`, đổi tên thành `watch.glb`, đặt vào `frontend/public/models/`.

Tuỳ chỉnh trục/scale của model nếu đồng hồ nằm không đúng cổ tay — sửa `arConfig` trong `src/App.jsx`:

```js
arConfig: { arScale: 2.6, arPositionY: -0.05, arRotationOffset: 0 }
```

- `arScale` — hệ số scale theo độ rộng cổ tay (lớn → đồng hồ to)
- `arPositionY` — dịch lên/xuống dọc theo cổ tay
- `arRotationOffset` — bù góc xoay nếu model gốc không hướng đúng

## Cấu trúc
```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── public/models/         # đặt watch.glb tại đây
└── src/
    ├── main.jsx
    ├── App.jsx            # trang demo: chi tiết sản phẩm + nút mở AR
    └── components/
        ├── ar/ARTryOn.jsx       # AR overlay toàn màn hình
        └── watch/Watch3DViewer.jsx  # viewer 360° (không cần camera)
```

## Hạn chế MVP
- Chưa có routing (single page demo).
- Chưa kết nối backend — dữ liệu sản phẩm hardcode trong `App.jsx`.
- Chưa có login Google, giỏ hàng, đánh giá.
- Chỉ test 1 model. Triển khai đầy đủ checklist xem trong spec gốc.
