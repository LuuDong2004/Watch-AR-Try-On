# 🔧 PROMPT FIX AR WATCH TRY-ON — KHÓA CHẶT CỔ TAY + HIỂN THỊ CHÂN THỰC

## 🚨 VẤN ĐỀ CẦN FIX (từ ảnh thực tế)

1. **Đồng hồ không bám cổ tay** — bị trôi, không lock vào điểm cổ tay
2. **Sai góc xoay** — hiển thị mặt bên/đáy đồng hồ thay vì mặt số hướng ra ngoài
3. **Scale sai** — không tỷ lệ với kích thước cổ tay thực
4. **Vị trí offset sai** — tâm đồng hồ không nằm đúng trên xương cổ tay

---

## 🎯 NGUYÊN NHÂN GỐC RỄ

### Lỗi 1: Sai hệ tọa độ (NDC vs World Space)
```js
// ❌ SAI — convert normalized coords kiểu cũ bị lệch
const x = wrist.x * 2 - 1      // Không tính camera FOV
const y = -(wrist.y * 2 - 1)

// ✅ ĐÚNG — dùng Raycasting từ camera để project lên plane
```

### Lỗi 2: Không dùng đủ landmarks
```js
// ❌ SAI — chỉ dùng 1 điểm WRIST (landmark 0)
// → Không biết hướng cổ tay → không biết góc xoay

// ✅ ĐÚNG — dùng 3 điểm:
// Landmark 0  = WRIST
// Landmark 5  = INDEX_FINGER_MCP  
// Landmark 17 = PINKY_MCP
// → Tính vector hướng cổ tay → rotation chính xác
```

### Lỗi 3: Rotation model .glb sai trục
```js
// Model .glb xuất từ Blender thường bị:
// - Mặt đồng hồ nhìn lên trên (trục Y) thay vì nhìn ra ngoài (trục Z)
// - Cần rotate -90° trên trục X để mặt đồng hồ hướng ra camera

// ✅ Fix khi load model:
model.rotation.x = -Math.PI / 2  // Mặt đồng hồ hướng ra ngoài
```

---

## ✅ CODE FIX HOÀN CHỈNH

### File: `src/components/ar/ARTryOn.jsx`

```jsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { Hands } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

// ============================================================
// LANDMARK INDICES — MediaPipe Hands
// ============================================================
const WRIST         = 0
const INDEX_MCP     = 5   // Gốc ngón trỏ
const MIDDLE_MCP    = 9   // Gốc ngón giữa
const PINKY_MCP     = 17  // Gốc ngón út
const INDEX_TIP     = 8   // Đầu ngón trỏ (phát hiện tay ngửa/úp)

// ============================================================
// HELPER: Convert MediaPipe landmark → Three.js world position
// ============================================================
function landmarkToWorld(landmark, camera, width, height) {
  // Bước 1: Normalize Device Coordinates (NDC)
  const ndc = new THREE.Vector3(
    landmark.x * 2 - 1,
    -(landmark.y * 2 - 1),
    0.5  // depth = giữa frustum
  )
  // Bước 2: Unproject từ NDC → world space theo camera perspective
  ndc.unproject(camera)
  // Bước 3: Tính ray từ camera
  const dir = ndc.sub(camera.position).normalize()
  // Bước 4: Intersect với plane z=0 (mặt phẳng cổ tay)
  const distance = -camera.position.z / dir.z
  const worldPos = camera.position.clone().add(dir.multiplyScalar(distance))
  // Thêm depth từ MediaPipe (z chuẩn hóa theo độ sâu)
  worldPos.z = -landmark.z * 3
  return worldPos
}

// ============================================================
// HELPER: Tính khoảng cách Euclidean 2D giữa 2 landmarks
// ============================================================
function landmarkDistance(a, b) {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)
  )
}

// ============================================================
// HELPER: Tính góc xoay cổ tay từ vector INDEX_MCP → PINKY_MCP
// ============================================================
function calcWristAngle(indexMCP, pinkyMCP, isMirrored) {
  const dx = isMirrored
    ? pinkyMCP.x - indexMCP.x   // Camera trước: mirror trục X
    : indexMCP.x - pinkyMCP.x
  const dy = indexMCP.y - pinkyMCP.y
  return Math.atan2(dy, dx)
}

// ============================================================
// HELPER: Phát hiện tay ngửa hay úp (palm up/down)
// dùng để rotate model 180° khi tay lật
// ============================================================
function isPalmFacingCamera(landmarks) {
  // So sánh z của WRIST và INDEX_TIP
  // Nếu đầu ngón tay gần camera hơn cổ tay → tay ngửa
  return landmarks[INDEX_TIP].z < landmarks[WRIST].z
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ARTryOn({ watchModelUrl, watchConfig = {}, onClose, watchName }) {
  const videoRef     = useRef(null)
  const canvasRef    = useRef(null)
  const overlayRef   = useRef(null)   // Canvas riêng cho Three.js (transparent)
  const sceneRef     = useRef(null)
  const rendererRef  = useRef(null)
  const cameraRef    = useRef(null)
  const watchRef     = useRef(null)   // Watch model group
  const handsRef     = useRef(null)
  const cameraMediaRef = useRef(null)
  const smoothPos    = useRef(new THREE.Vector3())  // Smoothed position
  const smoothAngle  = useRef(0)                    // Smoothed angle
  const frameRef     = useRef(null)

  const [state, setState] = useState({
    loading: true,
    step: 'Đang khởi động...',
    handDetected: false,
    mirrored: false,   // Mặc định KHÔNG mirror (cam sau)
    palmUp: false,
    error: null,
  })

  // ----------------------------------------------------------
  // INIT THREE.JS
  // ----------------------------------------------------------
  const initThree = useCallback(() => {
    const overlay = overlayRef.current
    overlay.width  = 1280
    overlay.height = 720

    // Scene
    const scene = new THREE.Scene()

    // Camera perspective khớp với video 16:9
    const camera = new THREE.PerspectiveCamera(
      45,
      overlay.width / overlay.height,
      0.1,
      1000
    )
    camera.position.set(0, 0, 5)

    // Renderer — alpha: true để trong suốt (overlay lên video)
    const renderer = new THREE.WebGLRenderer({
      canvas: overlay,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    })
    renderer.setSize(overlay.width, overlay.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap
    renderer.outputColorSpace  = THREE.SRGBColorSpace
    renderer.toneMapping       = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.4
    renderer.setClearColor(0x000000, 0)  // Trong suốt

    // ---- LIGHTING chân thực ----
    // Ambient nhẹ
    scene.add(new THREE.AmbientLight(0xffffff, 0.5))

    // Ánh sáng chính từ trên-trái (giống ánh sáng phòng)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0)
    keyLight.position.set(3, 8, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width  = 2048
    keyLight.shadow.mapSize.height = 2048
    scene.add(keyLight)

    // Fill light từ phải
    const fillLight = new THREE.DirectionalLight(0xffe8c0, 0.6)
    fillLight.position.set(-4, 2, 3)
    scene.add(fillLight)

    // Rim light từ sau (viền sáng kim loại)
    const rimLight = new THREE.DirectionalLight(0xadd8e6, 0.4)
    rimLight.position.set(0, -3, -5)
    scene.add(rimLight)

    // Point light gần cổ tay (phản chiếu da)
    const pointLight = new THREE.PointLight(0xfff5e0, 1.0, 8)
    pointLight.position.set(0, 2, 3)
    scene.add(pointLight)

    sceneRef.current   = scene
    rendererRef.current = renderer
    cameraRef.current  = camera
  }, [])

  // ----------------------------------------------------------
  // LOAD MODEL GLB
  // ----------------------------------------------------------
  const loadModel = useCallback(async (scene) => {
    setState(s => ({ ...s, step: 'Đang tải mô hình 3D...' }))

    const draco = new DRACOLoader()
    draco.setDecoderPath('/draco/')

    const loader = new GLTFLoader()
    loader.setDRACOLoader(draco)

    return new Promise((resolve, reject) => {
      loader.load(
        watchModelUrl,
        (gltf) => {
          const model = gltf.scene

          // ---- FIX ROTATION: Mặt đồng hồ hướng ra ngoài ----
          // Hầu hết model GLB export từ Blender: mặt nhìn lên (Y+)
          // Cần xoay -90° quanh X để mặt nhìn ra camera (Z+)
          model.rotation.x = watchConfig.baseRotX ?? -Math.PI / 2
          model.rotation.y = watchConfig.baseRotY ?? 0
          model.rotation.z = watchConfig.baseRotZ ?? 0

          // Wrap trong Group để dễ xoay độc lập
          const group = new THREE.Group()
          group.add(model)
          group.visible = false
          scene.add(group)

          // Enable shadow & improve materials
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow    = true
              child.receiveShadow = true
              if (child.material) {
                // Tăng độ bóng kim loại
                if (child.material.metalness !== undefined) {
                  child.material.envMapIntensity = 2.0
                  child.material.needsUpdate = true
                }
              }
            }
          })

          watchRef.current = group
          resolve(group)
        },
        (xhr) => {
          const pct = Math.round(xhr.loaded / xhr.total * 100)
          setState(s => ({ ...s, step: `Đang tải model... ${pct}%` }))
        },
        (err) => {
          console.error('Load model error:', err)
          reject(err)
        }
      )
    })
  }, [watchModelUrl, watchConfig])

  // ----------------------------------------------------------
  // ON HAND RESULTS — Xử lý frame AR
  // ----------------------------------------------------------
  const onResults = useCallback((results) => {
    if (!canvasRef.current || !sceneRef.current) return

    const video  = results.image
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    // Vẽ video frame lên canvas background
    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // KHÔNG mirror ở đây — để Three.js overlay khớp
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    ctx.restore()

    const detected = results.multiHandLandmarks?.length > 0
    
    if (detected) {
      const lm = results.multiHandLandmarks[0]

      // === 1. LẤY CÁC ĐIỂM LANDMARKS QUAN TRỌNG ===
      const wristLM   = lm[WRIST]
      const indexLM   = lm[INDEX_MCP]
      const pinkyLM   = lm[PINKY_MCP]
      const middleLM  = lm[MIDDLE_MCP]

      // === 2. TÍNH VỊ TRÍ WORLD SPACE ===
      const camera = cameraRef.current
      const wristWorld = landmarkToWorld(wristLM, camera, canvas.width, canvas.height)

      // Midpoint giữa INDEX_MCP và PINKY_MCP = tâm cổ tay chính xác hơn
      const midLM = {
        x: (indexLM.x + pinkyLM.x) / 2,
        y: (indexLM.y + pinkyLM.y) / 2 + 0.03,  // Offset nhẹ về phía cổ tay
        z: (indexLM.z + pinkyLM.z) / 2,
      }
      const midWorld = landmarkToWorld(midLM, camera, canvas.width, canvas.height)

      // Áp dụng offset cấu hình (fine-tune per watch)
      const offsetX = watchConfig.arOffsetX ?? 0
      const offsetY = watchConfig.arOffsetY ?? 0
      midWorld.x += offsetX
      midWorld.y += offsetY

      // === 3. SMOOTH POSITION (Exponential Moving Average) ===
      // Giảm jitter/rung — alpha càng nhỏ càng mượt nhưng lag hơn
      const alpha = 0.35
      smoothPos.current.lerp(midWorld, alpha)

      // === 4. TÍNH GÓC XOAY CỔ TAY ===
      const rawAngle = calcWristAngle(indexLM, pinkyLM, state.mirrored)
      
      // Smooth góc xoay
      const angleDiff = rawAngle - smoothAngle.current
      // Tránh nhảy góc khi vượt qua ±π
      const normalizedDiff = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI
      smoothAngle.current += normalizedDiff * 0.3

      // === 5. TÍNH SCALE DỰA TRÊN CHIỀU RỘNG CỔ TAY ===
      // Khoảng cách INDEX_MCP → PINKY_MCP trong normalized coords
      const wristWidthNorm = landmarkDistance(indexLM, pinkyLM)
      
      // Convert sang world units
      const indexWorld = landmarkToWorld(indexLM, camera, canvas.width, canvas.height)
      const pinkyWorld = landmarkToWorld(pinkyLM, camera, canvas.width, canvas.height)
      const wristWidthWorld = indexWorld.distanceTo(pinkyWorld)

      // Scale = chiều rộng cổ tay thực × hệ số scale model
      const baseScale = watchConfig.arScale ?? 1.2
      const dynamicScale = wristWidthWorld * baseScale
      const clampedScale = Math.max(0.05, Math.min(0.5, dynamicScale))

      // === 6. PHÁT HIỆN TAY NGỬA/ÚP → FLIP ===
      const palmUp = isPalmFacingCamera(lm)

      // === 7. ÁP DỤNG LÊN MODEL ===
      const watch = watchRef.current
      if (watch) {
        watch.visible = true

        // Position
        watch.position.copy(smoothPos.current)

        // Scale
        watch.scale.setScalar(clampedScale)

        // Rotation — xoay theo cổ tay
        watch.rotation.z = smoothAngle.current + (watchConfig.arRotOffset ?? 0)

        // Tilt theo độ sâu z của cổ tay (nghiêng khi xoay tay)
        const tiltX = (middleLM.z - wristLM.z) * 1.5
        watch.children[0].rotation.x = (watchConfig.baseRotX ?? -Math.PI / 2) + tiltX

        // Flip nếu tay úp
        watch.children[0].rotation.y = palmUp
          ? (watchConfig.baseRotY ?? 0)
          : (watchConfig.baseRotY ?? 0) + Math.PI
      }

      setState(s => ({
        ...s,
        handDetected: true,
        palmUp,
      }))
    } else {
      // Không detect tay → ẩn model
      if (watchRef.current) watchRef.current.visible = false
      setState(s => ({ ...s, handDetected: false }))
    }

    // Render Three.js
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }
  }, [state.mirrored, watchConfig])

  // ----------------------------------------------------------
  // INIT MEDIAPIPE
  // ----------------------------------------------------------
  const initMediaPipe = useCallback(async () => {
    setState(s => ({ ...s, step: 'Đang kết nối camera...' }))

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`,
    })

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,              // Full model — chính xác hơn
      minDetectionConfidence: 0.75,    // Tăng để tránh false positive
      minTrackingConfidence: 0.65,     // Balance giữa accuracy và smoothness
    })

    hands.onResults(onResults)
    handsRef.current = hands

    const cam = new Camera(videoRef.current, {
      onFrame: async () => {
        if (handsRef.current && videoRef.current?.readyState === 4) {
          await handsRef.current.send({ image: videoRef.current })
        }
      },
      width: 1280,
      height: 720,
    })

    await cam.start()
    cameraMediaRef.current = cam
    setState(s => ({ ...s, loading: false, step: '' }))
  }, [onResults])

  // ----------------------------------------------------------
  // SETUP
  // ----------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current
    canvas.width  = 1280
    canvas.height = 720

    const run = async () => {
      try {
        initThree()
        await loadModel(sceneRef.current)
        await initMediaPipe()
      } catch (err) {
        setState(s => ({ ...s, loading: false, error: err.message }))
      }
    }
    run()

    return () => {
      cameraMediaRef.current?.stop()
      handsRef.current?.close()
      rendererRef.current?.dispose()
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [])  // eslint-disable-line

  // ----------------------------------------------------------
  // CHỤP ẢNH — Merge canvas video + Three.js overlay
  // ----------------------------------------------------------
  const handleCapture = useCallback(() => {
    const bgCanvas  = canvasRef.current
    const fgCanvas  = overlayRef.current
    
    const merge = document.createElement('canvas')
    merge.width  = bgCanvas.width
    merge.height = bgCanvas.height
    const ctx = merge.getContext('2d')
    
    ctx.drawImage(bgCanvas, 0, 0)   // Video background
    ctx.drawImage(fgCanvas, 0, 0)   // Three.js overlay
    
    merge.toBlob((blob) => {
      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href     = url
      link.download = `dong-ho-ar-${Date.now()}.png`
      link.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }, [])

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      
      {/* Video hidden — MediaPipe đọc từ đây */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
        autoPlay
      />

      {/* Canvas 1: Video background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          // Mirror canvas video nếu dùng cam trước
          transform: state.mirrored ? 'scaleX(-1)' : 'none',
        }}
      />

      {/* Canvas 2: Three.js overlay (transparent) */}
      <canvas
        ref={overlayRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{
          transform: state.mirrored ? 'scaleX(-1)' : 'none',
        }}
      />

      {/* UI Overlay */}
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs">Đang thử AR · {state.mirrored ? 'Cam trước' : 'Cam sau'}</p>
            <h2 className="text-white font-bold text-lg leading-tight">{watchName}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30 transition"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Loading */}
      {state.loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20">
          <div className="relative w-16 h-16 mb-5">
            <div className="absolute inset-0 border-4 border-yellow-400/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center text-2xl">⌚</span>
          </div>
          <p className="text-white text-sm text-center px-8">{state.step}</p>
        </div>
      )}

      {/* Error */}
      {state.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/85 z-20 p-6">
          <div className="bg-red-900/80 rounded-2xl p-6 text-center max-w-xs">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-white font-semibold mb-2">Lỗi khởi động AR</p>
            <p className="text-red-200 text-sm mb-4">{state.error}</p>
            <button onClick={onClose} className="bg-white text-black px-6 py-2 rounded-full font-medium">
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Hand detection status */}
      {!state.loading && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-28 z-10">
          {state.handDetected ? (
            <div className="bg-green-500/90 text-white px-5 py-2.5 rounded-full text-sm font-medium backdrop-blur flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              ✅ Đã nhận diện cổ tay
            </div>
          ) : (
            <div className="bg-black/60 text-white px-5 py-2.5 rounded-full text-sm backdrop-blur">
              ✋ Đưa cổ tay vào khung hình
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      {!state.loading && (
        <div className="absolute bottom-0 left-0 right-0 z-10 p-5 pb-8 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center justify-center gap-3">
            {/* Đổi cam */}
            <button
              onClick={async () => {
                if (cameraMediaRef.current) {
                  await cameraMediaRef.current.stop()
                  setState(s => ({ ...s, mirrored: !s.mirrored }))
                  // TODO: Restart với facingMode khác
                }
              }}
              className="flex items-center gap-2 bg-white/20 text-white text-sm px-4 py-2.5 rounded-full backdrop-blur hover:bg-white/30 transition"
            >
              🔄 Đổi cam
            </button>

            {/* Chụp ảnh */}
            <button
              onClick={handleCapture}
              disabled={!state.handDetected}
              className={`flex items-center gap-2 text-sm px-6 py-3 rounded-full font-semibold transition shadow-lg
                ${state.handDetected
                  ? 'bg-yellow-400 text-black hover:bg-yellow-300 active:scale-95'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
            >
              📸 Chụp
            </button>

            {/* Lật gương */}
            <button
              onClick={() => setState(s => ({ ...s, mirrored: !s.mirrored }))}
              className="flex items-center gap-2 bg-white/20 text-white text-sm px-4 py-2.5 rounded-full backdrop-blur hover:bg-white/30 transition"
            >
              🪞 Lật gương
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## ⚙️ CẤU HÌNH AR PER-WATCH (lưu trong database)

```js
// Điều chỉnh cho từng model GLB cụ thể
// Thử từng giá trị cho đến khi đồng hồ hiển thị đúng

const WATCH_AR_CONFIGS = {
  // Model G-Shock / Chronograph (như trong ảnh)
  'casio-gshock': {
    arScale: 1.3,           // Hệ số nhân với chiều rộng cổ tay
    arOffsetX: 0,           // Dịch ngang (world units)
    arOffsetY: 0.05,        // Dịch lên/xuống (dương = lên)
    arRotOffset: 0,         // Xoay thêm quanh trục Z (radian)
    baseRotX: -Math.PI / 2, // Fix mặt đồng hồ hướng ra ngoài
    baseRotY: 0,
    baseRotZ: 0,
  },

  // Model đồng hồ dây da mỏng
  'classic-leather': {
    arScale: 1.1,
    arOffsetX: 0,
    arOffsetY: 0.03,
    arRotOffset: 0,
    baseRotX: -Math.PI / 2,
    baseRotY: Math.PI,      // Một số model cần flip 180°
    baseRotZ: 0,
  },

  // Model smartwatch vuông
  'smartwatch': {
    arScale: 1.0,
    arOffsetX: 0,
    arOffsetY: 0.02,
    arRotOffset: Math.PI / 4, // Xoay 45° nếu model bị nghiêng
    baseRotX: -Math.PI / 2,
    baseRotY: 0,
    baseRotZ: 0,
  },
}
```

---

## 🐛 DEBUG MODE — Thêm vào component để tune

```jsx
// Thêm debug overlay để thấy landmarks (chỉ dùng khi dev)
const DEBUG = import.meta.env.DEV

// Trong onResults, sau khi vẽ video:
if (DEBUG && detected) {
  const lm = results.multiHandLandmarks[0]
  const ctx = canvasRef.current.getContext('2d')
  const W = canvasRef.current.width
  const H = canvasRef.current.height

  // Vẽ tất cả landmarks
  lm.forEach((point, i) => {
    const x = point.x * W
    const y = point.y * H
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, 2 * Math.PI)
    ctx.fillStyle = i === WRIST ? 'red' : i === INDEX_MCP || i === PINKY_MCP ? 'yellow' : 'cyan'
    ctx.fill()
    ctx.fillStyle = 'white'
    ctx.font = '10px Arial'
    ctx.fillText(i, x + 6, y)
  })

  // Vẽ đường trục cổ tay
  ctx.beginPath()
  ctx.moveTo(lm[INDEX_MCP].x * W, lm[INDEX_MCP].y * H)
  ctx.lineTo(lm[PINKY_MCP].x * W, lm[PINKY_MCP].y * H)
  ctx.strokeStyle = 'lime'
  ctx.lineWidth = 3
  ctx.stroke()
}
```

---

## 📋 CHECKLIST FIX

- [ ] Thay toàn bộ `ARTryOn.jsx` bằng code mới ở trên
- [ ] Tách thành 2 canvas: `canvasRef` (video BG) + `overlayRef` (Three.js transparent)
- [ ] Thêm `smoothPos` và `smoothAngle` refs để khử rung
- [ ] Dùng `midpoint(INDEX_MCP, PINKY_MCP)` thay vì chỉ `WRIST`
- [ ] Thêm `isPalmFacingCamera()` để flip khi tay úp
- [ ] Cấu hình `baseRotX = -Math.PI/2` để fix mặt đồng hồ
- [ ] Test debug mode để tune `arOffsetY` cho từng model
- [ ] Cấu hình `arScale` per-watch cho đúng kích thước

---

## 🎯 KẾT QUẢ SAU KHI FIX

| Trước | Sau |
|-------|-----|
| Đồng hồ trôi tự do | Bám chặt cổ tay |
| Hiển thị mặt bên/đáy | Mặt số hướng ra camera |
| Scale sai tỷ lệ | Scale theo chiều rộng cổ tay thực |
| Bị rung/jitter | Chuyển động mượt (lerp 0.35) |
| Không biết tay ngửa/úp | Tự động flip |
