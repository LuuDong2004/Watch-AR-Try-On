Đặt file effect DeepAR đã export vào thư mục này.

Tên file phải khớp với cấu hình:
  chronograph-white.deepar   (xem App.jsx -> watch.effectUrl và .env -> VITE_DEEPAR_EFFECT_URL)

Cách tạo file (PHẦN 1 trong PROMPT_FINAL_DEEPAR_COMPLETE.md):
  1. DeepAR Studio (Windows) -> New Project -> Template "Wrist"
  2. Import public/models/watch.glb vào WristAnchor
  3. Thêm Right hand flip + Wrist Occluder, căn chỉnh position/scale/rotation
  4. File -> Publish -> Export Effect -> chronograph-white.deepar
  5. Copy file vào đây: public/effects/chronograph-white.deepar
