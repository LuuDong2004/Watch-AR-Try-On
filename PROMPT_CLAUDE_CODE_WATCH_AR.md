# 🕐 CLAUDE CODE PROMPT — WEBSITE TRƯNG BÀY ĐỒNG HỒ + AR TRY-ON

---

## 🎯 TỔNG QUAN DỰ ÁN

Xây dựng **website thương mại điện tử trưng bày và bán đồng hồ cao cấp** tích hợp công nghệ **AR Watch Try-On** (thử đồng hồ thực tế ảo tăng cường). Giao diện sáng, hiện đại, responsive mobile. Hệ thống có 3 vai trò: **Khách hàng**, **Cửa hàng** và **Admin**.

---

## 🏗️ KIẾN TRÚC KỸ THUẬT

### Frontend
- **ReactJS 18+** + Vite
- **TailwindCSS** + Shadcn/UI components
- **Three.js** + `@react-three/fiber` + `@react-three/drei` — render 3D đồng hồ
- **MediaPipe Hands** (`@mediapipe/hands`) + **TensorFlow.js** — nhận diện cổ tay AR
- **React Router v6** — điều hướng
- **Zustand** — state management
- **React Query (TanStack)** — data fetching + cache
- **i18next** — ngôn ngữ tiếng Việt
- **Google OAuth** (`@react-oauth/google`) — đăng nhập Google

### Backend
- **Spring Boot 3.x** (Java 21)
- **Spring Security + OAuth2** (Google Login)
- **Spring Data JPA** + **Hibernate**
- **PostgreSQL 16** — cơ sở dữ liệu chính
- **MinIO** — lưu trữ ảnh sản phẩm và file 3D (`.glb`, `.gltf`)
- **JWT** — xác thực token
- **MapStruct** — DTO mapping
- **Swagger/OpenAPI** — tài liệu API

### Hạ tầng
- Docker Compose (PostgreSQL + MinIO + Backend + Frontend)
- Nginx reverse proxy

---

## 📁 CẤU TRÚC THƯ MỤC

```
watch-store/
├── backend/
│   ├── src/main/java/com/watchstore/
│   │   ├── config/          # Security, MinIO, CORS, OAuth2
│   │   ├── controller/      # REST APIs
│   │   ├── service/         # Business logic
│   │   ├── repository/      # JPA Repositories
│   │   ├── entity/          # JPA Entities
│   │   ├── dto/             # Request/Response DTOs
│   │   ├── mapper/          # MapStruct mappers
│   │   └── exception/       # Global exception handler
│   ├── src/main/resources/
│   │   └── application.yml
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ar/          # AR Try-On components
│   │   │   ├── watch/       # Watch 3D viewer
│   │   │   ├── layout/      # Header, Footer, Sidebar
│   │   │   └── ui/          # Reusable UI components
│   │   ├── pages/
│   │   │   ├── customer/    # Trang khách hàng
│   │   │   ├── store/       # Trang cửa hàng
│   │   │   └── admin/       # Trang admin
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # Zustand stores
│   │   ├── services/        # API calls
│   │   ├── utils/           # AR utilities
│   │   └── assets/
│   │       └── models/      # File .glb mẫu đồng hồ 3D
│   └── vite.config.ts
│
└── docker-compose.yml
```

---

## 🗄️ DATABASE SCHEMA (PostgreSQL)

```sql
-- Bảng người dùng
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    google_id VARCHAR(255) UNIQUE,
    role VARCHAR(50) DEFAULT 'CUSTOMER', -- CUSTOMER | STORE | ADMIN
    store_id UUID REFERENCES stores(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bảng cửa hàng
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    address TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng danh mục
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- Bảng thương hiệu
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    logo_url TEXT,
    country VARCHAR(100)
);

-- Bảng đồng hồ (sản phẩm)
CREATE TABLE watches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id),
    category_id UUID REFERENCES categories(id),
    brand_id UUID REFERENCES brands(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL,
    original_price DECIMAL(15,2),
    stock INTEGER DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    
    -- Thông số kỹ thuật
    dial_diameter DECIMAL(5,1),     -- Đường kính mặt số (mm)
    case_thickness DECIMAL(5,1),    -- Độ dày vỏ (mm)
    strap_width DECIMAL(5,1),       -- Bề rộng dây (mm)
    water_resistance INTEGER,        -- Chống nước (m)
    movement_type VARCHAR(100),      -- Loại máy
    case_material VARCHAR(100),      -- Chất liệu vỏ
    strap_material VARCHAR(100),     -- Chất liệu dây
    glass_material VARCHAR(100),     -- Chất liệu kính
    
    -- AR/3D
    model_3d_url TEXT,              -- URL file .glb trên MinIO
    model_3d_thumbnail TEXT,         -- Ảnh preview model 3D
    ar_enabled BOOLEAN DEFAULT false,
    ar_scale DECIMAL(5,3) DEFAULT 1.0,
    ar_position_x DECIMAL(6,3) DEFAULT 0.0,
    ar_position_y DECIMAL(6,3) DEFAULT 0.0,
    ar_rotation_offset DECIMAL(6,3) DEFAULT 0.0,
    
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE | INACTIVE | OUT_OF_STOCK
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ảnh sản phẩm
CREATE TABLE watch_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watch_id UUID REFERENCES watches(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false
);

-- Đặt hàng
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    store_id UUID REFERENCES stores(id),
    status VARCHAR(50) DEFAULT 'PENDING',
    total_amount DECIMAL(15,2),
    shipping_address TEXT,
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Chi tiết đơn hàng
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    watch_id UUID REFERENCES watches(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL
);

-- Đánh giá
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watch_id UUID REFERENCES watches(id),
    user_id UUID REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    ar_tried BOOLEAN DEFAULT false, -- Có dùng AR không
    created_at TIMESTAMP DEFAULT NOW()
);

-- Yêu thích
CREATE TABLE wishlists (
    user_id UUID REFERENCES users(id),
    watch_id UUID REFERENCES watches(id),
    PRIMARY KEY (user_id, watch_id)
);

-- AR Try-On sessions (analytics)
CREATE TABLE ar_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    watch_id UUID REFERENCES watches(id),
    duration_seconds INTEGER,
    screenshot_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ⚙️ BACKEND — SPRING BOOT

### application.yml
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/watchstore
    username: postgres
    password: postgres
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope: email, profile

minio:
  endpoint: http://localhost:9000
  access-key: minioadmin
  secret-key: minioadmin
  bucket-name: watchstore
  bucket-3d: watchstore-3d

jwt:
  secret: ${JWT_SECRET}
  expiration: 86400000

app:
  frontend-url: http://localhost:5173
```

### Các REST API cần implement

#### 🔐 Auth API
```
POST /api/auth/google          — Đăng nhập bằng Google OAuth2 token
POST /api/auth/refresh         — Refresh JWT token
POST /api/auth/logout          — Đăng xuất
GET  /api/auth/me              — Lấy thông tin người dùng hiện tại
```

#### ⌚ Watch API (Public)
```
GET  /api/watches              — Danh sách đồng hồ (filter, sort, phân trang)
GET  /api/watches/{id}         — Chi tiết đồng hồ
GET  /api/watches/featured     — Đồng hồ nổi bật
GET  /api/watches/search       — Tìm kiếm
GET  /api/watches/{id}/ar-config — Lấy cấu hình AR/3D
POST /api/watches/{id}/view    — Tăng lượt xem
```

#### ⌚ Watch API (Store/Admin)
```
POST   /api/store/watches         — Thêm đồng hồ mới
PUT    /api/store/watches/{id}    — Cập nhật đồng hồ
DELETE /api/store/watches/{id}    — Xóa đồng hồ
POST   /api/store/watches/{id}/images     — Upload ảnh sản phẩm
POST   /api/store/watches/{id}/model-3d   — Upload file 3D (.glb)
PUT    /api/store/watches/{id}/ar-config  — Cập nhật cấu hình AR
GET    /api/store/watches         — Danh sách đồng hồ của cửa hàng
```

#### 🏪 Store API
```
GET  /api/stores               — Danh sách cửa hàng
GET  /api/stores/{id}          — Chi tiết cửa hàng
POST /api/admin/stores         — Tạo cửa hàng (Admin)
PUT  /api/store/profile        — Cập nhật thông tin cửa hàng
```

#### 📦 Order API
```
POST /api/orders               — Tạo đơn hàng
GET  /api/orders               — Danh sách đơn hàng của user
GET  /api/orders/{id}          — Chi tiết đơn hàng
PUT  /api/store/orders/{id}/status  — Cập nhật trạng thái (Store)
GET  /api/store/orders         — Đơn hàng của cửa hàng
```

#### ⭐ Review API
```
POST /api/watches/{id}/reviews — Đăng đánh giá
GET  /api/watches/{id}/reviews — Lấy đánh giá
```

#### 💾 Upload API (MinIO)
```
POST /api/upload/image         — Upload ảnh → trả về URL
POST /api/upload/model-3d      — Upload file .glb → trả về URL
DELETE /api/upload/{key}       — Xóa file
```

#### 📊 AR Session API
```
POST /api/ar/sessions          — Lưu phiên AR try-on
GET  /api/admin/ar/analytics   — Thống kê AR (Admin)
```

#### 🔧 Admin API
```
GET  /api/admin/users          — Quản lý người dùng
PUT  /api/admin/users/{id}/role — Phân quyền
GET  /api/admin/dashboard      — Thống kê tổng quan
GET  /api/admin/stores         — Quản lý cửa hàng
```

---

## 🎨 FRONTEND — REACTJS

### Design System
```
Màu sắc chính:
  - Primary: #1A1A2E (Navy đậm)
  - Secondary: #C9A84C (Gold)
  - Background: #FAFAFA (Trắng sáng)
  - Surface: #FFFFFF
  - Text Primary: #0D0D0D
  - Text Secondary: #6B7280
  - Border: #E5E7EB
  - Accent: #D4AF37 (Gold accent)

Font:
  - Display: "Playfair Display" — tiêu đề sang trọng
  - Body: "DM Sans" — đọc dễ, hiện đại

Breakpoints:
  - Mobile: < 768px
  - Tablet: 768px - 1024px  
  - Desktop: > 1024px
```

### Trang và Component cần xây dựng

#### 🏠 Trang Khách hàng (Customer)
```
/                          — Trang chủ
  ├── HeroSection          — Banner lớn với video background
  ├── FeaturedWatches      — Đồng hồ nổi bật (carousel)
  ├── BrandSection         — Thương hiệu đối tác
  ├── ARPromoSection       — Giới thiệu tính năng AR Try-On
  └── NewArrivals          — Hàng mới về

/san-pham                  — Danh sách sản phẩm
  ├── FilterSidebar        — Lọc theo giá, thương hiệu, danh mục
  ├── SortBar              — Sắp xếp
  └── WatchGrid            — Grid sản phẩm (3 cột desktop, 2 tablet, 1 mobile)

/san-pham/:slug            — Chi tiết sản phẩm
  ├── ImageGallery         — Ảnh sản phẩm + zoom
  ├── Watch3DViewer        — Xem 3D xoay 360°
  ├── ARTryOnButton        — Nút mở AR Try-On
  ├── ProductInfo          — Thông tin, giá, thông số
  ├── AddToCart            — Thêm vào giỏ
  ├── ReviewSection        — Đánh giá + rating
  └── RelatedWatches       — Sản phẩm liên quan

/ar-try-on/:id             — Trang AR Try-On (toàn màn hình)

/gio-hang                  — Giỏ hàng
/thanh-toan                — Thanh toán
/don-hang                  — Danh sách đơn hàng
/yeu-thich                 — Danh sách yêu thích
/tai-khoan                 — Thông tin tài khoản
```

#### 🏪 Trang Cửa hàng (Store Dashboard)
```
/cua-hang/tong-quan        — Dashboard: doanh thu, đơn hàng, lượt xem
/cua-hang/san-pham         — CRUD danh sách đồng hồ
/cua-hang/san-pham/them    — Form thêm đồng hồ mới
/cua-hang/san-pham/:id/sua — Form sửa đồng hồ + upload 3D model
/cua-hang/don-hang         — Quản lý đơn hàng
/cua-hang/ar-thong-ke      — Thống kê lượt AR try-on
/cua-hang/ho-so            — Thông tin cửa hàng
```

#### 🔧 Trang Admin
```
/admin/tong-quan           — Dashboard tổng
/admin/nguoi-dung          — Quản lý người dùng
/admin/cua-hang            — Quản lý cửa hàng
/admin/san-pham            — Quản lý tất cả sản phẩm
/admin/don-hang            — Quản lý tất cả đơn hàng
/admin/danh-muc            — Quản lý danh mục
/admin/thuong-hieu         — Quản lý thương hiệu
/admin/ar-analytics        — Thống kê AR toàn hệ thống
```

---

## 🔮 AR WATCH TRY-ON — CHI TIẾT KỸ THUẬT

### Luồng hoạt động AR

```
1. User nhấn "Thử đồng hồ AR"
2. Yêu cầu quyền truy cập Camera
3. MediaPipe Hands khởi động → nhận diện bàn tay
4. Xác định vị trí cổ tay (landmark điểm 0: wrist)
5. Tính toán: góc xoay cổ tay, scale theo khoảng cách camera
6. Three.js render model .glb đồng hồ lên canvas overlay
7. Đồng hồ "bám" vào cổ tay real-time (60fps)
8. User có thể chụp màn hình chia sẻ
```

### Component ARTryOn.jsx — Implementation đầy đủ

```jsx
// src/components/ar/ARTryOn.jsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { Hands } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

// Landmarks cổ tay từ MediaPipe
const WRIST = 0
const INDEX_MCP = 5
const PINKY_MCP = 17

export default function ARTryOn({ watchModelUrl, watchConfig, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraThreeRef = useRef(null)
  const watchModelRef = useRef(null)
  const handsRef = useRef(null)
  const cameraMediaPipeRef = useRef(null)
  const animFrameRef = useRef(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [loadingStep, setLoadingStep] = useState('Khởi động camera...')
  const [handDetected, setHandDetected] = useState(false)
  const [isMirrored, setIsMirrored] = useState(true)

  // Khởi tạo Three.js scene
  const initThreeJS = useCallback((canvas) => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 1000)
    camera.position.z = 5

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false
    })
    renderer.setSize(canvas.width, canvas.height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2

    // Ánh sáng chân thực
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5)
    dirLight1.position.set(5, 10, 5)
    dirLight1.castShadow = true
    scene.add(dirLight1)

    const dirLight2 = new THREE.DirectionalLight(0xFFD700, 0.4)
    dirLight2.position.set(-5, -5, -5)
    scene.add(dirLight2)

    const pointLight = new THREE.PointLight(0xffffff, 0.8, 10)
    pointLight.position.set(0, 3, 3)
    scene.add(pointLight)

    // Environment map cho reflection (kim loại/kính đồng hồ)
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()

    sceneRef.current = scene
    rendererRef.current = renderer
    cameraThreeRef.current = camera

    return { scene, camera, renderer }
  }, [])

  // Load model 3D đồng hồ
  const loadWatchModel = useCallback(async (scene) => {
    setLoadingStep('Đang tải mô hình 3D đồng hồ...')

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)

    return new Promise((resolve, reject) => {
      loader.load(
        watchModelUrl,
        (gltf) => {
          const model = gltf.scene
          
          // Scale theo cấu hình AR
          const scale = watchConfig?.arScale || 0.08
          model.scale.set(scale, scale, scale)
          
          // Kích hoạt shadow
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true
              child.receiveShadow = true
              if (child.material) {
                child.material.envMapIntensity = 1.5
              }
            }
          })

          scene.add(model)
          watchModelRef.current = model
          resolve(model)
        },
        (progress) => {
          const pct = Math.round((progress.loaded / progress.total) * 100)
          setLoadingStep(`Đang tải model 3D... ${pct}%`)
        },
        reject
      )
    })
  }, [watchModelUrl, watchConfig])

  // Xử lý kết quả nhận diện tay
  const onHandResults = useCallback((results) => {
    if (!canvasRef.current || !sceneRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Vẽ video frame lên canvas 2D (background)
    ctx.save()
    if (isMirrored) {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)
    ctx.restore()

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setHandDetected(true)
      const landmarks = results.multiHandLandmarks[0]
      
      const wrist = landmarks[WRIST]
      const indexMCP = landmarks[INDEX_MCP]
      const pinkyMCP = landmarks[PINKY_MCP]

      // Tính khoảng cách cổ tay → scale đồng hồ
      const wristWidth = Math.sqrt(
        Math.pow(indexMCP.x - pinkyMCP.x, 2) +
        Math.pow(indexMCP.y - pinkyMCP.y, 2)
      )
      
      // Convert từ normalized coords → Three.js world coords
      const x = isMirrored ? (1 - wrist.x) * 2 - 1 : wrist.x * 2 - 1
      const y = -(wrist.y * 2 - 1)
      const z = -wrist.z * 3

      if (watchModelRef.current) {
        // Đặt vị trí đồng hồ
        watchModelRef.current.position.set(x * 3.5, y * 2.5, z)

        // Tính góc xoay cổ tay
        const angle = Math.atan2(
          indexMCP.y - pinkyMCP.y,
          isMirrored ? pinkyMCP.x - indexMCP.x : indexMCP.x - pinkyMCP.x
        )
        watchModelRef.current.rotation.z = angle + (watchConfig?.arRotationOffset || 0)
        watchModelRef.current.rotation.x = -wrist.z * 0.5
        
        // Scale theo khoảng cách cổ tay
        const dynamicScale = wristWidth * (watchConfig?.arScale || 2.5)
        watchModelRef.current.scale.setScalar(dynamicScale)
        
        watchModelRef.current.visible = true
      }
    } else {
      setHandDetected(false)
      if (watchModelRef.current) {
        watchModelRef.current.visible = false
      }
    }

    // Render Three.js lên canvas overlay
    if (rendererRef.current && sceneRef.current && cameraThreeRef.current) {
      rendererRef.current.render(sceneRef.current, cameraThreeRef.current)
    }
  }, [isMirrored, watchConfig])

  // Khởi động MediaPipe Hands
  const initMediaPipe = useCallback(async () => {
    setLoadingStep('Đang khởi động nhận diện tay...')

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    })

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,       // 0=Lite, 1=Full — dùng Full để chính xác hơn
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.6
    })

    hands.onResults(onHandResults)
    handsRef.current = hands

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (handsRef.current && videoRef.current) {
          await handsRef.current.send({ image: videoRef.current })
        }
      },
      width: 1280,
      height: 720,
      facingMode: 'user'
    })

    await camera.start()
    cameraMediaPipeRef.current = camera
    setIsLoading(false)
  }, [onHandResults])

  useEffect(() => {
    const setup = async () => {
      try {
        // Set canvas size
        const canvas = canvasRef.current
        canvas.width = 1280
        canvas.height = 720

        initThreeJS(canvas)
        await loadWatchModel(sceneRef.current)
        await initMediaPipe()
      } catch (err) {
        console.error('AR setup error:', err)
        setLoadingStep('Lỗi khởi động AR. Vui lòng thử lại.')
      }
    }

    setup()

    return () => {
      // Cleanup
      if (cameraMediaPipeRef.current) cameraMediaPipeRef.current.stop()
      if (handsRef.current) handsRef.current.close()
      if (rendererRef.current) rendererRef.current.dispose()
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  // Chụp màn hình
  const handleScreenshot = () => {
    const canvas = canvasRef.current
    const dataURL = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `thu-dong-ho-ar-${Date.now()}.png`
    link.href = dataURL
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header AR */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <h2 className="text-white font-semibold text-lg">🕐 Thử Đồng Hồ AR</h2>
        <button onClick={onClose} className="text-white bg-white/20 rounded-full p-2 hover:bg-white/30">✕</button>
      </div>

      {/* Canvas chính — video + 3D overlay */}
      <video ref={videoRef} className="hidden" playsInline />
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <div className="animate-spin w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full mb-4" />
          <p className="text-white text-center">{loadingStep}</p>
        </div>
      )}

      {/* Hướng dẫn */}
      {!isLoading && !handDetected && (
        <div className="absolute inset-x-0 bottom-32 flex justify-center">
          <div className="bg-black/60 text-white px-6 py-3 rounded-full text-sm backdrop-blur">
            ✋ Đưa cổ tay vào khung hình để thử đồng hồ
          </div>
        </div>
      )}

      {handDetected && (
        <div className="absolute inset-x-0 bottom-32 flex justify-center">
          <div className="bg-green-500/80 text-white px-6 py-3 rounded-full text-sm backdrop-blur">
            ✅ Đã nhận diện cổ tay
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-center gap-4 bg-gradient-to-t from-black/60 to-transparent">
        <button
          onClick={() => setIsMirrored(m => !m)}
          className="bg-white/20 text-white px-4 py-2 rounded-full backdrop-blur hover:bg-white/30"
        >
          🔄 Lật gương
        </button>
        <button
          onClick={handleScreenshot}
          className="bg-yellow-400 text-black px-6 py-3 rounded-full font-semibold hover:bg-yellow-300 flex items-center gap-2"
        >
          📸 Chụp ảnh
        </button>
      </div>
    </div>
  )
}
```

---

## 📦 MẪU ĐỒNG HỒ 3D SẴN CÓ ĐỂ TEST

### Cách lấy file .glb mẫu (FREE, không cần mua)

```bash
# Thêm vào public/models/ của frontend

# 1. Đồng hồ đeo tay Classic (Sketchfab free)
# https://sketchfab.com/3d-models/watch-free-3d-model

# 2. Dùng script để download các model CC0/free:
npx gltf-pipeline -i input.glb -o output.glb --draco.compressionLevel 7
```

### Models mẫu tích hợp sẵn trong source code
```
public/
└── models/
    ├── watch-classic.glb      # Đồng hồ cổ điển dây da
    ├── watch-sport.glb        # Đồng hồ thể thao dây cao su
    ├── watch-luxury.glb       # Đồng hồ sang trọng vỏ vàng
    └── watch-smartwatch.glb   # Đồng hồ thông minh

# Cấu hình AR cho từng model (lưu trong DB):
watch-classic:  { arScale: 0.08, arPositionY: -0.05, arRotationOffset: 0 }
watch-sport:    { arScale: 0.09, arPositionY: -0.03, arRotationOffset: 0.1 }
watch-luxury:   { arScale: 0.07, arPositionY: -0.06, arRotationOffset: 0 }
```

### Nguồn model 3D đồng hồ miễn phí
```
1. Sketchfab.com → filter "Watches" + "Free download" + "glTF"
2. Poly.pizza → search "watch"
3. Quaternius.com → free game assets
4. KhronosGroup github → glTF sample models
```

---

## 🎨 UI COMPONENTS QUAN TRỌNG

### WatchCard.jsx
```jsx
// Card hiển thị trong danh sách sản phẩm
<div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
  <div className="relative overflow-hidden aspect-square bg-gray-50">
    <img src={watch.primaryImage} alt={watch.name}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
    {watch.arEnabled && (
      <span className="absolute top-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
        ✨ AR Try-On
      </span>
    )}
    <button className="absolute bottom-3 right-3 bg-white rounded-full p-2 shadow opacity-0 group-hover:opacity-100 transition-opacity">
      ♡
    </button>
  </div>
  <div className="p-4">
    <p className="text-xs text-gray-400 mb-1">{watch.brand.name}</p>
    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{watch.name}</h3>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-lg font-bold text-gray-900">{formatPrice(watch.price)}</p>
        {watch.originalPrice && (
          <p className="text-sm text-gray-400 line-through">{formatPrice(watch.originalPrice)}</p>
        )}
      </div>
      {watch.arEnabled && (
        <button onClick={() => openAR(watch)} 
          className="bg-black text-white text-xs px-3 py-1.5 rounded-full hover:bg-gray-800">
          Thử AR
        </button>
      )}
    </div>
  </div>
</div>
```

### Watch3DViewer.jsx — Xem 3D xoay 360° không cần AR
```jsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, useGLTF } from '@react-three/drei'

function WatchModel({ url }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

export function Watch3DViewer({ modelUrl }) {
  return (
    <div className="w-full h-80 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <Stage environment="city" intensity={0.5}>
          <WatchModel url={modelUrl} />
        </Stage>
        <OrbitControls
          enablePan={false}
          minDistance={1.5}
          maxDistance={5}
          autoRotate
          autoRotateSpeed={2}
        />
      </Canvas>
      <p className="text-center text-xs text-gray-400 py-2">
        🖱️ Kéo để xoay · Cuộn để zoom
      </p>
    </div>
  )
}
```

---

## 🐳 DOCKER COMPOSE

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: watchstore
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/src/main/resources/schema.sql:/docker-entrypoint-initdb.d/schema.sql

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/watchstore
      MINIO_ENDPOINT: http://minio:9000
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
      - minio

  frontend:
    build: ./frontend
    ports:
      - "5173:80"
    environment:
      VITE_API_URL: http://localhost:8080
      VITE_GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
    depends_on:
      - backend

volumes:
  postgres_data:
  minio_data:
```

---

## 🚀 LỆNH KHỞI ĐỘNG CHO CLAUDE CODE

### Bước 1: Tạo cấu trúc project
```bash
# Yêu cầu Claude Code chạy:
mkdir watch-store && cd watch-store

# Backend
spring init --dependencies=web,data-jpa,security,oauth2-client,postgresql,lombok,validation \
  --type=maven-project --language=java --java-version=21 \
  --group-id=com.watchstore --artifact-id=backend backend

# Frontend  
npm create vite@latest frontend -- --template react
cd frontend && npm install
npm install @react-three/fiber @react-three/drei three
npm install @mediapipe/hands @mediapipe/camera_utils
npm install @react-oauth/google
npm install @tanstack/react-query zustand
npm install tailwindcss @tailwindcss/vite
npm install react-router-dom axios
npm install lucide-react
```

### Bước 2: Seed dữ liệu mẫu
```sql
-- Chạy sau khi khởi động
INSERT INTO brands (name, country) VALUES
  ('Rolex', 'Thụy Sĩ'),
  ('Omega', 'Thụy Sĩ'),
  ('Seiko', 'Nhật Bản'),
  ('Casio', 'Nhật Bản'),
  ('Tag Heuer', 'Thụy Sĩ');

INSERT INTO categories (name, slug) VALUES
  ('Đồng hồ cổ điển', 'co-dien'),
  ('Đồng hồ thể thao', 'the-thao'),
  ('Đồng hồ sang trọng', 'sang-trong'),
  ('Đồng hồ thông minh', 'thong-minh');

-- 10 đồng hồ mẫu với ar_enabled = true và model_3d_url trỏ đến file .glb
```

---

## ✅ CHECKLIST HOÀN THÀNH

### Backend
- [ ] Google OAuth2 login → JWT
- [ ] CRUD Watch API (Store/Admin)
- [ ] Upload ảnh lên MinIO
- [ ] Upload file .glb lên MinIO (bucket riêng)
- [ ] AR config API (scale, position, rotation)
- [ ] CRUD Order
- [ ] Review API
- [ ] Admin dashboard stats API
- [ ] AR session tracking

### Frontend
- [ ] Google Login button
- [ ] Trang chủ Hero + Featured watches
- [ ] Danh sách sản phẩm + Filter + Search
- [ ] Chi tiết sản phẩm + Gallery
- [ ] **Watch3DViewer** (xem 360° không cần camera)
- [ ] **ARTryOn Component** (MediaPipe + Three.js)
- [ ] Giỏ hàng + Thanh toán
- [ ] Store Dashboard (CRUD sản phẩm + upload 3D)
- [ ] Admin Dashboard
- [ ] Responsive mobile hoàn chỉnh
- [ ] Tiếng Việt toàn bộ

### AR Cụ thể
- [ ] Nhận diện cổ tay MediaPipe real-time
- [ ] Render .glb đồng hồ lên cổ tay
- [ ] Scale động theo khoảng cách tay
- [ ] Xoay theo góc cổ tay
- [ ] Chụp ảnh lưu/chia sẻ
- [ ] 3 model đồng hồ mẫu sẵn test
- [ ] Cấu hình AR per-watch (Admin)

---

## 📝 GHI CHÚ QUAN TRỌNG CHO CLAUDE CODE

1. **AR Performance**: Dùng `requestAnimationFrame` và tránh re-render React trong vòng lặp AR. Canvas 2D cho video + WebGL overlay riêng.

2. **Model .glb**: Download các file GLB miễn phí từ Sketchfab và đặt vào `public/models/`. Dùng `gltf-pipeline` để nén Draco giảm dung lượng.

3. **Mobile AR**: Trên mobile dùng `facingMode: 'user'` (camera trước). Đảm bảo `playsInline` cho video tag.

4. **MinIO CORS**: Cần cấu hình CORS cho MinIO bucket để frontend load được ảnh và model .glb trực tiếp.

5. **Security**: File .glb trong MinIO bucket riêng (`watchstore-3d`), có thể set public-read hoặc dùng presigned URL.

6. **Giao diện**: Font Playfair Display + DM Sans. Màu Gold (#C9A84C) cho accent. Background trắng sáng (#FAFAFA).
```
