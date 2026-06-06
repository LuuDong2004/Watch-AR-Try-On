# PROMPT — MIGRATE AR WATCH TRY-ON: MediaPipe JS → TF.js HandPose v2

## NHIỆM VỤ
Nâng cấp tính năng AR Watch Try-On từ `@mediapipe/hands` (WASM, ~15fps, jitter cao) sang `@tensorflow-models/hand-pose-detection` với TF.js WebGL runtime (~35fps, Kalman filter, wrist locking chính xác). Đây là thay đổi **frontend only**, không đụng backend.

---

## BƯỚC 1 — CẬP NHẬT DEPENDENCIES

```bash
# Xoá packages cũ
npm uninstall @mediapipe/hands @mediapipe/camera_utils

# Cài packages mới
npm install @tensorflow/tfjs-core \
            @tensorflow/tfjs-backend-webgl \
            @tensorflow-models/hand-pose-detection
```

---

## BƯỚC 2 — TẠO KALMAN FILTER UTILITY

Tạo file `src/utils/KalmanFilter.js`:

```js
/**
 * 1D Kalman Filter — khử jitter cho từng trục toạ độ
 * R = nhiễu đo lường (nhỏ → tin sensor hơn, mượt hơn nhưng lag)
 * Q = nhiễu quá trình  (nhỏ → tin model hơn, bám sát hơn)
 */
export class KalmanFilter {
  constructor(R = 0.008, Q = 2) {
    this.R = R
    this.Q = Q
    this.P = 1
    this.X = 0
    this.K = 0
  }

  filter(measurement) {
    // Prediction
    this.P = this.P + this.Q
    // Update
    this.K = this.P / (this.P + this.R)
    this.X = this.X + this.K * (measurement - this.X)
    this.P = (1 - this.K) * this.P
    return this.X
  }

  reset(value = 0) {
    this.X = value
    this.P = 1
  }
}

/**
 * Preset configs cho từng use-case
 */
export const KF_PRESETS = {
  position: { R: 0.008, Q: 2   },   // x, y, z — balance mượt & bám
  angle:    { R: 0.005, Q: 1   },   // rotation — mượt hơn
  scale:    { R: 0.003, Q: 0.5 },   // scale — ổn định nhất
}
```

---

## BƯỚC 3 — THAY THẾ HOÀN TOÀN `ARTryOn.jsx`

Tạo/ghi đè `src/components/ar/ARTryOn.jsx`:

```jsx
import { useEffect, useRef, useState, useCallback } from 'react'
import * as tf from '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { KalmanFilter, KF_PRESETS } from '@/utils/KalmanFilter'

// ─── MediaPipe Hands landmark indices (21 điểm, giống hệt cũ) ────
const WRIST      = 0
const INDEX_MCP  = 5
const MIDDLE_MCP = 9
const PINKY_MCP  = 17
const INDEX_TIP  = 8

// ─── Convert landmark normalised → Three.js world space ──────────
function landmarkToWorld(lm, camera) {
  const ndc = new THREE.Vector3(lm.x * 2 - 1, -(lm.y * 2 - 1), 0.5)
  ndc.unproject(camera)
  const dir      = ndc.sub(camera.position).normalize()
  const distance = -camera.position.z / dir.z
  const pos      = camera.position.clone().add(dir.multiplyScalar(distance))
  pos.z = -(lm.z ?? 0) * 3
  return pos
}

// ─── Phát hiện tay ngửa / úp ─────────────────────────────────────
function isPalmFacing(keypoints) {
  return (keypoints[INDEX_TIP].z ?? 0) < (keypoints[WRIST].z ?? 0)
}

// ═════════════════════════════════════════════════════════════════
export default function ARTryOn({
  watchModelUrl,
  watchConfig = {},
  watchName   = 'Đồng hồ',
  onClose,
  onScreenshot,   // optional callback khi chụp ảnh xong
}) {
  const videoRef    = useRef(null)
  const bgRef       = useRef(null)   // Canvas: video background
  const glRef       = useRef(null)   // Canvas: Three.js overlay

  // Three.js refs
  const sceneRef    = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef   = useRef(null)
  const watchRef    = useRef(null)

  // TF.js detector
  const detectorRef = useRef(null)

  // Animation loop control
  const rafRef      = useRef(null)
  const activeRef   = useRef(false)

  // Kalman filters — 1 bộ lọc riêng cho mỗi trục
  const kf = useRef({
    x:     new KalmanFilter(KF_PRESETS.position.R, KF_PRESETS.position.Q),
    y:     new KalmanFilter(KF_PRESETS.position.R, KF_PRESETS.position.Q),
    z:     new KalmanFilter(KF_PRESETS.position.R, KF_PRESETS.position.Q),
    angle: new KalmanFilter(KF_PRESETS.angle.R,    KF_PRESETS.angle.Q),
    scale: new KalmanFilter(KF_PRESETS.scale.R,    KF_PRESETS.scale.Q),
  })

  const [ui, setUi] = useState({
    loading:  true,
    step:     'Khởi động...',
    detected: false,
    error:    null,
    fps:      0,
  })
  const [mirrored, setMirrored] = useState(false)
  const fpsRef = useRef({ last: 0, count: 0, display: 0 })

  // ── 1. Init Three.js scene ──────────────────────────────────────
  const initThree = useCallback(() => {
    const cvs    = glRef.current
    cvs.width    = 1280
    cvs.height   = 720

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1280 / 720, 0.1, 1000)
    camera.position.z = 5

    const renderer = new THREE.WebGLRenderer({
      canvas: cvs,
      alpha:  true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(1280, 720)
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.outputColorSpace   = THREE.SRGBColorSpace
    renderer.toneMapping        = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.35
    renderer.shadowMap.enabled  = true
    renderer.shadowMap.type     = THREE.PCFSoftShadowMap
    renderer.setClearColor(0x000000, 0)

    // Lighting setup — chân thực cho đồng hồ kim loại/kính
    scene.add(new THREE.AmbientLight(0xffffff, 0.5))

    const key = new THREE.DirectionalLight(0xffffff, 2.2)
    key.position.set(4, 8, 6)
    key.castShadow            = true
    key.shadow.mapSize.width  = 2048
    key.shadow.mapSize.height = 2048
    scene.add(key)

    const fill = new THREE.DirectionalLight(0xffe8c0, 0.7)
    fill.position.set(-4, 2, 3)
    scene.add(fill)

    const rim = new THREE.DirectionalLight(0xb0d4ff, 0.4)
    rim.position.set(0, -3, -5)
    scene.add(rim)

    sceneRef.current    = scene
    rendererRef.current = renderer
    cameraRef.current   = camera
  }, [])

  // ── 2. Load .glb model ──────────────────────────────────────────
  const loadModel = useCallback(async () => {
    setUi(s => ({ ...s, step: 'Tải mô hình 3D...' }))

    const draco = new DRACOLoader()
    draco.setDecoderPath('/draco/')

    const loader = new GLTFLoader()
    loader.setDRACOLoader(draco)

    return new Promise((resolve, reject) => {
      loader.load(
        watchModelUrl,
        ({ scene: model }) => {
          // ── Fix mặt đồng hồ hướng ra camera ──
          // Hầu hết .glb export từ Blender: mặt nhìn lên (Y+)
          // Xoay -90° quanh X → mặt hướng ra ngoài (Z+)
          model.rotation.x = watchConfig.baseRotX ?? -Math.PI / 2
          model.rotation.y = watchConfig.baseRotY ?? 0
          model.rotation.z = watchConfig.baseRotZ ?? 0

          const group = new THREE.Group()
          group.add(model)
          group.visible = false
          sceneRef.current.add(group)
          watchRef.current = group

          // Tăng chất lượng vật liệu
          model.traverse(child => {
            if (!child.isMesh) return
            child.castShadow    = true
            child.receiveShadow = true
            if (child.material) {
              child.material.envMapIntensity = 2.0
              child.material.needsUpdate     = true
            }
          })

          resolve(group)
        },
        xhr => {
          if (xhr.total > 0) {
            const pct = Math.round(xhr.loaded / xhr.total * 100)
            setUi(s => ({ ...s, step: `Tải model... ${pct}%` }))
          }
        },
        reject
      )
    })
  }, [watchModelUrl, watchConfig])

  // ── 3. Init TF.js HandPose v2 detector ─────────────────────────
  const initDetector = useCallback(async () => {
    setUi(s => ({ ...s, step: 'Khởi động WebGL AI detector...' }))

    // Bắt buộc set backend trước
    await tf.setBackend('webgl')
    await tf.ready()

    // Tắt verbose log của TF.js
    tf.env().set('WEBGL_CPU_FORWARD', false)

    const detector = await handPoseDetection.createDetector(
      handPoseDetection.SupportedModels.MediaPipeHands,
      {
        runtime:   'tfjs',    // ← KEY: dùng TF.js runtime → WebGL GPU
        modelType: 'full',    // full = chính xác, lite = nhanh hơn ~20%
        maxHands:  1,
      }
    )
    detectorRef.current = detector
  }, [])

  // ── 4. Khởi động camera ─────────────────────────────────────────
  const startCamera = useCallback(async (useFront = false) => {
    setUi(s => ({ ...s, step: 'Kết nối camera...' }))

    // Dừng stream cũ nếu có
    const oldStream = videoRef.current?.srcObject
    oldStream?.getTracks().forEach(t => t.stop())

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: useFront ? 'user' : 'environment',
        width:      { ideal: 1280 },
        height:     { ideal: 720  },
        frameRate:  { ideal: 60   },
      },
      audio: false,
    })

    const video       = videoRef.current
    video.srcObject   = stream
    await new Promise(r => { video.onloadedmetadata = r })
    await video.play()

    // Resize canvas background khớp video thực
    const bg    = bgRef.current
    bg.width    = video.videoWidth  || 1280
    bg.height   = video.videoHeight || 720
  }, [])

  // ── 5. Main detection + render loop ────────────────────────────
  const loop = useCallback(async () => {
    if (!activeRef.current) return

    const video    = videoRef.current
    const detector = detectorRef.current
    const bg       = bgRef.current
    const bgCtx    = bg?.getContext('2d')
    const camera   = cameraRef.current

    // Chờ video sẵn sàng
    if (!video || !detector || !bgCtx || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop)
      return
    }

    // ── Vẽ video frame lên canvas background ──
    bgCtx.save()
    bgCtx.clearRect(0, 0, bg.width, bg.height)
    bgCtx.drawImage(video, 0, 0, bg.width, bg.height)
    bgCtx.restore()

    // ── TF.js detect hands ──────────────────────────────────────
    let hands = []
    try {
      hands = await detector.estimateHands(video, {
        flipHorizontal: mirrored,
      })
    } catch (e) {
      // Bỏ qua lỗi frame lẻ, không crash loop
    }

    if (hands.length > 0) {
      // Ưu tiên keypoints3D nếu có (chính xác hơn)
      const kp = hands[0].keypoints3D ?? hands[0].keypoints

      const wristKp  = kp[WRIST]
      const iMCP     = kp[INDEX_MCP]
      const pMCP     = kp[PINKY_MCP]
      const midMCPkp = kp[MIDDLE_MCP]

      // Midpoint INDEX↔PINKY = tâm xương cổ tay
      const midLm = {
        x: (iMCP.x + pMCP.x) / 2,
        y: (iMCP.y + pMCP.y) / 2 + 0.025, // offset nhẹ về phía cổ tay
        z: ((iMCP.z ?? 0) + (pMCP.z ?? 0)) / 2,
      }

      // Convert → world coords
      const midWorld = landmarkToWorld(midLm, camera)

      // Apply Kalman filter
      midWorld.x = kf.current.x.filter(midWorld.x)
      midWorld.y = kf.current.y.filter(midWorld.y)
      midWorld.z = kf.current.z.filter(midWorld.z)

      // Góc xoay cổ tay (vector INDEX→PINKY)
      const dx       = mirrored ? pMCP.x - iMCP.x : iMCP.x - pMCP.x
      const dy       = iMCP.y - pMCP.y
      const rawAngle = Math.atan2(dy, dx)
      const angle    = kf.current.angle.filter(rawAngle)

      // Scale theo chiều rộng cổ tay (world units)
      const iWorld    = landmarkToWorld(iMCP, camera)
      const pWorld    = landmarkToWorld(pMCP, camera)
      const wristW    = iWorld.distanceTo(pWorld)
      const rawScale  = wristW * (watchConfig.arScale ?? 1.2)
      const scale     = kf.current.scale.filter(rawScale)
      const clampedSc = Math.max(0.04, Math.min(0.5, scale))

      // Tilt theo chiều sâu z (khi xoay tay ra/vào camera)
      const tiltX = ((midMCPkp.z ?? 0) - (wristKp.z ?? 0)) * 1.5

      // Palm facing camera?
      const palmUp = isPalmFacing(kp)

      // Áp dụng lên model
      const watch = watchRef.current
      if (watch) {
        watch.visible = true
        watch.position.copy(midWorld)
        watch.position.x += watchConfig.arOffsetX ?? 0
        watch.position.y += watchConfig.arOffsetY ?? 0

        watch.scale.setScalar(clampedSc)
        watch.rotation.z = angle + (watchConfig.arRotOffset ?? 0)

        watch.children[0].rotation.x =
          (watchConfig.baseRotX ?? -Math.PI / 2) + tiltX
        watch.children[0].rotation.y = palmUp
          ? (watchConfig.baseRotY ?? 0)
          : (watchConfig.baseRotY ?? 0) + Math.PI
      }

      setUi(s => ({ ...s, detected: true }))
    } else {
      if (watchRef.current) watchRef.current.visible = false
      setUi(s => ({ ...s, detected: false }))
    }

    // ── Render Three.js overlay ──
    rendererRef.current?.render(sceneRef.current, cameraRef.current)

    // ── FPS counter ──
    const now = performance.now()
    fpsRef.current.count++
    if (now - fpsRef.current.last >= 1000) {
      setUi(s => ({ ...s, fps: fpsRef.current.count }))
      fpsRef.current.count = 0
      fpsRef.current.last  = now
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [mirrored, watchConfig])

  // ── Setup on mount ──────────────────────────────────────────────
  useEffect(() => {
    const bgCvs   = bgRef.current
    bgCvs.width   = 1280
    bgCvs.height  = 720

    const run = async () => {
      try {
        initThree()
        await loadModel()
        await initDetector()
        await startCamera(mirrored)

        activeRef.current = true
        setUi({ loading: false, step: '', detected: false, error: null, fps: 0 })
        fpsRef.current.last = performance.now()
        rafRef.current = requestAnimationFrame(loop)
      } catch (err) {
        console.error('[ARTryOn]', err)
        setUi(s => ({ ...s, loading: false, error: err.message }))
      }
    }
    run()

    return () => {
      activeRef.current = false
      cancelAnimationFrame(rafRef.current)
      videoRef.current?.srcObject?.getTracks().forEach(t => t.stop())
      detectorRef.current?.dispose?.()
      rendererRef.current?.dispose()
    }
  }, []) // eslint-disable-line

  // Restart loop khi đổi mirror
  useEffect(() => {
    if (ui.loading) return
    startCamera(mirrored).catch(console.error)
  }, [mirrored]) // eslint-disable-line

  // ── Chụp ảnh ───────────────────────────────────────────────────
  const handleCapture = useCallback(() => {
    const merge = document.createElement('canvas')
    const bg    = bgRef.current
    const gl    = glRef.current
    merge.width  = bg.width
    merge.height = bg.height

    const ctx = merge.getContext('2d')
    ctx.drawImage(bg, 0, 0)
    ctx.drawImage(gl, 0, 0)

    merge.toBlob(blob => {
      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href     = url
      link.download = `thu-dong-ho-${Date.now()}.png`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      onScreenshot?.(url)
    }, 'image/png', 0.95)
  }, [onScreenshot])

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden select-none">

      {/* Hidden video source */}
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />

      {/* Canvas 1: video background */}
      <canvas
        ref={bgRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }}
      />

      {/* Canvas 2: Three.js transparent overlay */}
      <canvas
        ref={glRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }}
      />

      {/* ── Header ── */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4
                      bg-gradient-to-b from-black/70 to-transparent
                      flex items-start justify-between">
        <div>
          <p className="text-white/50 text-xs tracking-wide">
            AR Try-On · TF.js WebGL · {ui.fps > 0 ? `${ui.fps} fps` : '—'}
          </p>
          <h2 className="text-white font-bold text-lg leading-tight mt-0.5">
            {watchName}
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Đóng AR"
          className="w-10 h-10 rounded-full bg-white/20 text-white
                     flex items-center justify-center hover:bg-white/30 transition"
        >
          ✕
        </button>
      </div>

      {/* ── Loading overlay ── */}
      {ui.loading && (
        <div className="absolute inset-0 z-20 bg-black/88
                        flex flex-col items-center justify-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full
                            border-4 border-yellow-400/25" />
            <div className="absolute inset-0 rounded-full
                            border-4 border-yellow-400 border-t-transparent
                            animate-spin" />
            <span className="absolute inset-0 flex items-center
                             justify-center text-2xl">⌚</span>
          </div>
          <p className="text-white text-sm text-center px-8">{ui.step}</p>
          <p className="text-white/40 text-xs">Đang khởi động WebGL GPU...</p>
        </div>
      )}

      {/* ── Error overlay ── */}
      {ui.error && (
        <div className="absolute inset-0 z-20 bg-black/88
                        flex items-center justify-center p-6">
          <div className="bg-red-950/90 rounded-2xl p-6 text-center max-w-xs">
            <p className="text-3xl mb-3">⚠️</p>
            <p className="text-white font-semibold mb-2">Lỗi khởi động AR</p>
            <p className="text-red-300 text-sm mb-5">{ui.error}</p>
            <button
              onClick={onClose}
              className="bg-white text-black px-6 py-2 rounded-full
                         font-medium text-sm hover:bg-gray-100"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* ── Detection status pill ── */}
      {!ui.loading && !ui.error && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10
                        pointer-events-none">
          {ui.detected ? (
            <div className="bg-green-500/90 text-white px-5 py-2.5
                            rounded-full text-sm font-medium backdrop-blur
                            flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Đã nhận diện cổ tay
            </div>
          ) : (
            <div className="bg-black/60 text-white/90 px-5 py-2.5
                            rounded-full text-sm backdrop-blur">
              ✋ Đưa cổ tay vào khung hình
            </div>
          )}
        </div>
      )}

      {/* ── Bottom controls ── */}
      {!ui.loading && !ui.error && (
        <div className="absolute bottom-0 left-0 right-0 z-10 p-5 pb-8
                        bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center justify-center gap-3">

            <button
              onClick={() => setMirrored(m => !m)}
              className="flex items-center gap-1.5 bg-white/20 text-white
                         text-sm px-4 py-2.5 rounded-full backdrop-blur
                         hover:bg-white/30 active:scale-95 transition"
            >
              🔄 Đổi cam
            </button>

            <button
              onClick={handleCapture}
              disabled={!ui.detected}
              className={`flex items-center gap-1.5 text-sm px-7 py-3
                          rounded-full font-semibold transition
                          active:scale-95 shadow-lg
                          ${ui.detected
                            ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
            >
              📸 Chụp
            </button>

            <button
              onClick={() => setMirrored(m => !m)}
              className="flex items-center gap-1.5 bg-white/20 text-white
                         text-sm px-4 py-2.5 rounded-full backdrop-blur
                         hover:bg-white/30 active:scale-95 transition"
            >
              🪞 Gương
            </button>

          </div>
        </div>
      )}
    </div>
  )
}
```

---

## BƯỚC 4 — CẤU HÌNH AR CHO TỪNG MODEL (lưu DB hoặc constants)

Tạo `src/constants/watchArConfigs.js`:

```js
/**
 * Cấu hình AR per-watch.
 * Tune các giá trị này sau khi test thực tế trên điện thoại.
 *
 * arScale     — hệ số nhân chiều rộng cổ tay → scale model (thường 1.0–1.5)
 * arOffsetX   — dịch ngang (world units, thử 0.0 trước)
 * arOffsetY   — dịch dọc  (dương = lên, thử 0.02–0.05)
 * arRotOffset — xoay thêm quanh trục Z (radian, thử 0 trước)
 * baseRotX    — fix hướng mặt đồng hồ (-Math.PI/2 cho hầu hết model)
 * baseRotY    — flip 180° nếu mặt đồng hồ bị ngược (Math.PI)
 * baseRotZ    — xoay ban đầu quanh Z nếu model lệch
 */
export const WATCH_AR_CONFIGS = {
  default: {
    arScale:     1.2,
    arOffsetX:   0,
    arOffsetY:   0.03,
    arRotOffset: 0,
    baseRotX:    -Math.PI / 2,
    baseRotY:    0,
    baseRotZ:    0,
  },

  // G-Shock / Chronograph style (model trong ảnh test)
  'gshock-white': {
    arScale:     1.3,
    arOffsetX:   0,
    arOffsetY:   0.04,
    arRotOffset: 0,
    baseRotX:    -Math.PI / 2,
    baseRotY:    0,
    baseRotZ:    0,
  },

  // Đồng hồ dây da mỏng
  'classic-leather': {
    arScale:     1.1,
    arOffsetX:   0,
    arOffsetY:   0.02,
    arRotOffset: 0,
    baseRotX:    -Math.PI / 2,
    baseRotY:    Math.PI,  // flip nếu model bị ngược
    baseRotZ:    0,
  },

  // Smartwatch / Apple Watch style
  'smartwatch': {
    arScale:     1.0,
    arOffsetX:   0,
    arOffsetY:   0.02,
    arRotOffset: 0,
    baseRotX:    -Math.PI / 2,
    baseRotY:    0,
    baseRotZ:    0,
  },
}

export function getWatchArConfig(watchId) {
  return WATCH_AR_CONFIGS[watchId] ?? WATCH_AR_CONFIGS.default
}
```

---

## BƯỚC 5 — SỬ DỤNG TRONG TRANG CHI TIẾT SẢN PHẨM

```jsx
// src/pages/customer/WatchDetail.jsx
import { useState } from 'react'
import ARTryOn from '@/components/ar/ARTryOn'
import { getWatchArConfig } from '@/constants/watchArConfigs'

export default function WatchDetail({ watch }) {
  const [showAR, setShowAR] = useState(false)

  return (
    <div>
      {/* ... các phần khác của trang ... */}

      {watch.arEnabled && watch.model3dUrl && (
        <button
          onClick={() => setShowAR(true)}
          className="w-full bg-black text-white py-3 rounded-xl
                     font-semibold flex items-center justify-center gap-2
                     hover:bg-gray-800 transition"
        >
          ✨ Thử đồng hồ AR
        </button>
      )}

      {showAR && (
        <ARTryOn
          watchModelUrl={watch.model3dUrl}   // URL .glb từ MinIO
          watchConfig={getWatchArConfig(watch.arConfigKey ?? 'default')}
          watchName={watch.name}
          onClose={() => setShowAR(false)}
          onScreenshot={(url) => {
            // Lưu ảnh vào AR sessions (optional)
            console.log('Screenshot taken:', url)
          }}
        />
      )}
    </div>
  )
}
```

---

## CHECKLIST SAU KHI CHẠY

- [ ] `npm install` không lỗi
- [ ] Browser console không có warning về WebGL
- [ ] FPS hiển thị ≥ 25 trên desktop
- [ ] FPS hiển thị ≥ 20 trên mobile
- [ ] Đồng hồ bám cổ tay không bị trôi
- [ ] Mặt đồng hồ hướng ra ngoài (không thấy mặt bên/đáy)
- [ ] Khi lật tay → model tự flip
- [ ] Chụp ảnh merge đúng video + 3D model
- [ ] Nút "Đổi cam" chuyển đổi front/rear được

## DEBUG NẾU VẪN LỖI

```js
// Thêm vào đầu component để kiểm tra backend
import * as tf from '@tensorflow/tfjs-core'
console.log('TF backend:', tf.getBackend())  // Phải là "webgl"
console.log('TF version:', tf.version.tfjs)

// Nếu in ra "cpu" thay vì "webgl" → trình duyệt không hỗ trợ WebGL
// → Fallback: đổi sang 'tfjs' runtime với backend 'wasm'
import '@tensorflow/tfjs-backend-wasm'
await tf.setBackend('wasm')
```

## LƯU Ý QUAN TRỌNG

1. **Draco decoder**: Cần copy thư mục `draco/` vào `public/` — lấy từ `node_modules/three/examples/jsm/libs/draco/`
2. **CORS MinIO**: File `.glb` phải được serve với header `Access-Control-Allow-Origin: *`
3. **HTTPS**: Camera API chỉ hoạt động trên HTTPS hoặc localhost
4. **iOS Safari**: Cần thêm `playsinline` vào video tag (đã có trong code)
5. **Model orientation**: Nếu đồng hồ vẫn hiển thị sai góc sau khi deploy, vào trang Store Dashboard chỉnh `baseRotX/Y` per-watch
