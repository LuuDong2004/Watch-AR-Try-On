// PNG + Cylinder Occluder variant of the AR try-on.
//
// Architecture (per PROMPT_AR_PNG_TEXTURE_OCCLUDER.md):
//   strapBottom (renderOrder 1, behind wrist)
//   occluder    (renderOrder 2, invisible, depthWrite only — hides the strap behind the wrist)
//   strapTop    (renderOrder 3, in front of wrist)
//   face        (renderOrder 4, on top)
//
// The shop owner only needs to upload two transparent PNGs (face + strap).

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection'
import { KalmanFilter, KF_PRESETS } from '../../utils/KalmanFilter.js'
import { detectMobile } from '../../utils/device.js'

const WRIST       = 0
const INDEX_MCP   = 5
const MIDDLE_MCP  = 9
const PINKY_MCP   = 17

const FOV_DEG     = 45
const CAMERA_Z    = 5

let detectorPromise = null
function loadDetector() {
  if (detectorPromise) return detectorPromise
  detectorPromise = (async () => {
    try { await tf.setBackend('webgl') } catch {}
    await tf.ready()
    return handPoseDetection.createDetector(
      handPoseDetection.SupportedModels.MediaPipeHands,
      { runtime: 'tfjs', modelType: 'lite', maxHands: 1 }
    )
  })()
  return detectorPromise
}

export default function ARTryOnPNG({
  watchName    = 'Đồng hồ',
  faceImageUrl,
  strapImageUrl,
  onClose,
  onScreenshot,
}) {
  const isMobile  = useRef(detectMobile())

  const videoRef  = useRef(null)
  const bgRef     = useRef(null)   // canvas drawing the video frame
  const glRef     = useRef(null)   // canvas hosting the Three.js overlay

  const sceneRef       = useRef(null)
  const rendererRef    = useRef(null)
  const cameraRef      = useRef(null)
  const watchGroupRef  = useRef(null)
  const occluderRef    = useRef(null)

  const detectorRef    = useRef(null)
  const streamRef      = useRef(null)
  const rafRef         = useRef(null)
  const activeRef      = useRef(false)
  const mirroredRef    = useRef(false)
  const inputCanvasRef = useRef(null)

  const kf = useRef({
    x:     new KalmanFilter(KF_PRESETS.position.R, KF_PRESETS.position.Q),
    y:     new KalmanFilter(KF_PRESETS.position.R, KF_PRESETS.position.Q),
    z:     new KalmanFilter(KF_PRESETS.position.R, KF_PRESETS.position.Q),
    angle: new KalmanFilter(KF_PRESETS.angle.R,    KF_PRESETS.angle.Q),
    scale: new KalmanFilter(KF_PRESETS.scale.R,    KF_PRESETS.scale.Q),
    roll:  new KalmanFilter(KF_PRESETS.angle.R,    KF_PRESETS.angle.Q),
  })

  const lockedPos = useRef(new THREE.Vector3())
  const isLocked  = useRef(false)

  const [facingMode, setFacingMode] = useState(isMobile.current ? 'environment' : 'user')
  const [isMirrored, setIsMirrored] = useState(!isMobile.current)
  const [status, setStatus] = useState({
    loading: true, step: 'Khởi động...', detected: false, error: null, fps: 0
  })
  const fpsRef = useRef({ last: 0, count: 0 })

  useEffect(() => { mirroredRef.current = isMirrored }, [isMirrored])

  // ── Init Three.js ────────────────────────────────────────────
  const initThree = useCallback(() => {
    const cvs = glRef.current
    cvs.width  = 1280
    cvs.height = 720

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(FOV_DEG, 1280 / 720, 0.1, 1000)
    camera.position.z = CAMERA_Z

    const renderer = new THREE.WebGLRenderer({
      canvas: cvs,
      alpha: true,
      antialias: !isMobile.current,
      premultipliedAlpha: false,
      powerPreference: isMobile.current ? 'low-power' : 'high-performance',
    })
    renderer.setSize(1280, 720, false)
    renderer.setPixelRatio(isMobile.current ? 1 : Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.sortObjects = true  // critical: lets renderOrder + occluder work

    scene.add(new THREE.AmbientLight(0xffffff, 1.2))
    const dir = new THREE.DirectionalLight(0xffffff, 0.8)
    dir.position.set(2, 4, 3)
    scene.add(dir)

    sceneRef.current    = scene
    rendererRef.current = renderer
    cameraRef.current   = camera
  }, [])

  // ── Build watch mesh from PNGs ───────────────────────────────
  const buildWatchMesh = useCallback(async () => {
    const loader = new THREE.TextureLoader()
    loader.crossOrigin = 'anonymous'
    const scene  = sceneRef.current
    const group  = new THREE.Group()
    group.visible = false

    const loadTex = (url) => new Promise((resolve, reject) => {
      loader.load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        resolve(tex)
      }, undefined, reject)
    })

    const [faceTex, strapTex] = await Promise.all([
      loadTex(faceImageUrl),
      loadTex(strapImageUrl),
    ])

    // 1. strap BOTTOM — gets hidden by the occluder when behind the wrist
    const strapBot = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 1.4),
      new THREE.MeshBasicMaterial({
        map: strapTex,
        transparent: true,
        alphaTest: 0.01,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    )
    strapBot.position.z = -0.01
    strapBot.renderOrder = 1
    group.add(strapBot)

    // 2. OCCLUDER — invisible cylinder writing depth to mask the back strap
    const occluderGeo = new THREE.CylinderGeometry(0.38, 0.38, 1.0, 32)
    // Rotate so the cylinder lies along the forearm (X-axis in local space)
    occluderGeo.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2))
    const occluder = new THREE.Mesh(
      occluderGeo,
      new THREE.MeshBasicMaterial({
        colorWrite: false,   // invisible to the eye
        depthWrite: true,    // but writes depth → hides anything behind
      })
    )
    occluder.position.z = 0
    occluder.renderOrder = 2
    group.add(occluder)
    occluderRef.current = occluder

    // 3. strap TOP — drawn in front of the wrist
    const strapTop = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 1.4),
      new THREE.MeshBasicMaterial({
        map: strapTex,
        transparent: true,
        alphaTest: 0.01,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    )
    strapTop.position.z = 0.01
    strapTop.renderOrder = 3
    group.add(strapTop)

    // 4. WATCH FACE — on top of everything
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.7),
      new THREE.MeshBasicMaterial({
        map: faceTex,
        transparent: true,
        alphaTest: 0.01,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    )
    face.position.z = 0.02
    face.renderOrder = 4
    group.add(face)

    scene.add(group)
    watchGroupRef.current = group
  }, [faceImageUrl, strapImageUrl])

  // ── Convert a normalized landmark to world space at the watch plane ──
  const toWorld = useCallback((lm, cam) => {
    const v = new THREE.Vector3(lm.x * 2 - 1, -(lm.y * 2 - 1), 0.5)
    v.unproject(cam)
    const d = v.sub(cam.position).normalize()
    const t = -cam.position.z / d.z
    const p = cam.position.clone().add(d.multiplyScalar(t))
    p.z = -(lm.z ?? 0) * 3
    return p
  }, [])

  // ── Main loop ────────────────────────────────────────────────
  const loop = useCallback(async () => {
    if (!activeRef.current) return

    const video    = videoRef.current
    const detector = detectorRef.current
    const bg       = bgRef.current
    const bgCtx    = bg?.getContext('2d')
    const cam      = cameraRef.current

    if (!video || !detector || !bgCtx || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop)
      return
    }

    // Paint the video frame as the AR background, honouring the mirror flag.
    bgCtx.save()
    bgCtx.clearRect(0, 0, bg.width, bg.height)
    if (mirroredRef.current) {
      bgCtx.translate(bg.width, 0)
      bgCtx.scale(-1, 1)
    }
    bgCtx.drawImage(video, 0, 0, bg.width, bg.height)
    bgCtx.restore()

    let hands = []
    try {
      hands = await detector.estimateHands(video, { flipHorizontal: mirroredRef.current })
    } catch (_) {}

    if (hands.length > 0) {
      const vw = video.videoWidth  || 1280
      const vh = video.videoHeight || 720
      const normalize = (kp) => ({
        x: kp.x / vw,
        y: kp.y / vh,
        z: kp.z ?? 0,
      })
      const kp = hands[0].keypoints.map(normalize)

      const iMCP = kp[INDEX_MCP]
      const pMCP = kp[PINKY_MCP]
      const mid  = {
        x: (iMCP.x + pMCP.x) / 2,
        y: (iMCP.y + pMCP.y) / 2 + 0.025,
        z: (iMCP.z + pMCP.z) / 2,
      }
      const midWorld   = toWorld(mid, cam)
      const wristWorld = toWorld(kp[WRIST], cam)

      // Slide toward the wrist so the watch sits on the wrist crease, not on the knuckles.
      const offsetVec = new THREE.Vector3()
        .subVectors(wristWorld, midWorld)
        .multiplyScalar(0.3)
      midWorld.add(offsetVec)

      const sx = kf.current.x.filter(midWorld.x)
      const sy = kf.current.y.filter(midWorld.y)
      const sz = kf.current.z.filter(midWorld.z)
      const smoothPos = new THREE.Vector3(sx, sy, sz)

      // Dead-zone lock: ignore tiny jitter, only move once it crosses a threshold.
      const dist = lockedPos.current.distanceTo(smoothPos)
      if (!isLocked.current || dist > 0.06) {
        lockedPos.current.copy(smoothPos)
        isLocked.current = true
      }

      // In-plane rotation from the forearm direction.
      const armDx = kp[WRIST].x - kp[MIDDLE_MCP].x
      const armDy = kp[WRIST].y - kp[MIDDLE_MCP].y
      const smoothAngle = kf.current.angle.filter(Math.atan2(armDy, armDx))

      // Wrist roll from the index/pinky depth differential.
      const distXY  = Math.sqrt((iMCP.x - pMCP.x) ** 2 + (iMCP.y - pMCP.y) ** 2)
      const rawRoll = Math.atan2(iMCP.z - pMCP.z, distXY * 0.5)
      const smoothRoll = kf.current.roll.filter(rawRoll)

      const iWorld = toWorld(iMCP, cam)
      const pWorld = toWorld(pMCP, cam)
      const wristW = iWorld.distanceTo(pWorld)
      const rawScale = wristW * 1.8
      const smoothScale = kf.current.scale.filter(rawScale)
      const clampedScale = Math.max(0.05, Math.min(0.6, smoothScale))

      const watch = watchGroupRef.current
      if (watch) {
        watch.visible = true
        watch.position.copy(lockedPos.current)
        watch.scale.setScalar(clampedScale)
        watch.rotation.set(0, 0, smoothAngle)
        // Apply roll only to the visible meshes — never to the occluder,
        // otherwise the cylinder rolls off the wrist and stops occluding.
        watch.children.forEach((child) => {
          if (child === occluderRef.current) return
          child.rotation.z = smoothRoll
        })
      }

      if (!status.detected) setStatus((s) => ({ ...s, detected: true }))
    } else {
      if (watchGroupRef.current) watchGroupRef.current.visible = false
      isLocked.current = false
      Object.values(kf.current).forEach((f) => f.reset())
      if (status.detected) setStatus((s) => ({ ...s, detected: false }))
    }

    rendererRef.current?.render(sceneRef.current, cameraRef.current)

    fpsRef.current.count++
    const now = performance.now()
    if (now - fpsRef.current.last >= 1000) {
      setStatus((s) => ({ ...s, fps: fpsRef.current.count }))
      fpsRef.current.count = 0
      fpsRef.current.last  = now
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [toWorld, status.detected])

  // ── Camera lifecycle (re-runs on facingMode change) ──────────
  const startCamera = useCallback(async () => {
    setStatus((s) => ({ ...s, step: 'Kết nối camera...' }))

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facingMode },
        width:  { ideal: isMobile.current ? 960 : 1280 },
        height: { ideal: isMobile.current ? 540 : 720 },
        frameRate: { ideal: 60 },
      },
      audio: false,
    })
    streamRef.current = stream

    const video = videoRef.current
    video.srcObject = stream
    video.playsInline = true
    video.muted = true
    await video.play()

    const w = video.videoWidth  || 1280
    const h = video.videoHeight || 720
    const bg = bgRef.current
    const gl = glRef.current
    bg.width  = w
    bg.height = h
    gl.width  = w
    gl.height = h
    if (cameraRef.current && rendererRef.current) {
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(w, h, false)
    }

    setIsMirrored(facingMode === 'user')
  }, [facingMode])

  // ── One-time setup ───────────────────────────────────────────
  useEffect(() => {
    const bg = bgRef.current
    bg.width  = 1280
    bg.height = 720

    let cancelled = false
    const run = async () => {
      try {
        initThree()
        setStatus((s) => ({ ...s, step: 'Tải hình ảnh đồng hồ...' }))
        await buildWatchMesh()
        if (cancelled) return

        setStatus((s) => ({ ...s, step: 'Khởi động AI detector...' }))
        detectorRef.current = await loadDetector()
        if (cancelled) return

        await startCamera()
        if (cancelled) return

        activeRef.current = true
        fpsRef.current.last = performance.now()
        setStatus({ loading: false, step: '', detected: false, error: null, fps: 0 })
        rafRef.current = requestAnimationFrame(loop)
      } catch (err) {
        console.error('[ARTryOnPNG]', err)
        setStatus((s) => ({ ...s, loading: false, error: err?.message || 'Không khởi động được AR' }))
      }
    }
    run()

    return () => {
      cancelled = true
      activeRef.current = false
      cancelAnimationFrame(rafRef.current)
      try { streamRef.current?.getTracks().forEach((t) => t.stop()) } catch {}
      try { rendererRef.current?.dispose() } catch {}
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Camera re-acquire on facingMode change ───────────────────
  useEffect(() => {
    if (status.loading) return
    let cancelled = false
    ;(async () => {
      try {
        await startCamera()
        if (!cancelled) {
          Object.values(kf.current).forEach((f) => f.reset())
          isLocked.current = false
        }
      } catch (err) {
        console.error('[ARTryOnPNG] switch camera:', err)
        if (!cancelled) {
          setStatus((s) => ({ ...s, error: 'Không đổi được camera.' }))
        }
      }
    })()
    return () => { cancelled = true }
  }, [facingMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCapture = useCallback(() => {
    const bg = bgRef.current
    const gl = glRef.current
    if (!bg || !gl) return
    const merge = document.createElement('canvas')
    merge.width  = bg.width
    merge.height = bg.height
    const ctx = merge.getContext('2d')
    ctx.drawImage(bg, 0, 0)
    ctx.drawImage(gl, 0, 0)
    merge.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dong-ho-ar-${Date.now()}.png`
      a.click()
      onScreenshot?.(url)
    }, 'image/png', 0.95)
  }, [onScreenshot])

  const handleSwitchCamera = () => {
    setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />

      <canvas ref={bgRef} className="absolute inset-0 w-full h-full object-cover" />
      <canvas ref={glRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />

      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent flex items-start justify-between">
        <div>
          <p className="text-white/50 text-xs">
            AR · PNG · {facingMode === 'user' ? 'Cam trước' : 'Cam sau'}
            {status.fps > 0 ? ` · ${status.fps} fps` : ''}
          </p>
          <h2 className="text-white font-bold text-lg mt-0.5">{watchName}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>

      {status.loading && (
        <div className="absolute inset-0 z-20 bg-black/85 flex flex-col items-center justify-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-yellow-400/25" />
            <div className="absolute inset-0 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center text-2xl">⌚</span>
          </div>
          <p className="text-white text-sm">{status.step}</p>
        </div>
      )}

      {status.error && (
        <div className="absolute inset-0 z-20 bg-black/85 flex items-center justify-center p-6">
          <div className="bg-red-950/90 rounded-2xl p-6 text-center max-w-xs">
            <p className="text-3xl mb-3">⚠️</p>
            <p className="text-white font-semibold mb-2">Lỗi khởi động AR</p>
            <p className="text-red-300 text-sm mb-5">{status.error}</p>
            <button onClick={onClose} className="bg-white text-black px-6 py-2 rounded-full text-sm">
              Đóng
            </button>
          </div>
        </div>
      )}

      {!status.loading && !status.error && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          {status.detected ? (
            <div className="bg-green-500/90 text-white px-5 py-2.5 rounded-full text-sm font-medium backdrop-blur flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Đã nhận diện cổ tay
            </div>
          ) : (
            <div className="bg-black/60 text-white/90 px-5 py-2.5 rounded-full text-sm backdrop-blur">
              ✋ Đưa cổ tay vào khung hình
            </div>
          )}
        </div>
      )}

      {!status.loading && !status.error && (
        <div className="absolute bottom-0 left-0 right-0 z-10 p-5 pb-8 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <button
              onClick={handleSwitchCamera}
              className="bg-white/15 text-white px-3 sm:px-4 py-2.5 rounded-full backdrop-blur hover:bg-white/25 text-xs sm:text-sm"
            >
              🔄 Đổi cam
            </button>
            <button
              onClick={() => setIsMirrored((m) => !m)}
              className="bg-white/15 text-white px-3 sm:px-4 py-2.5 rounded-full backdrop-blur hover:bg-white/25 text-xs sm:text-sm"
            >
              🪞 Lật gương
            </button>
            <button
              onClick={handleCapture}
              disabled={!status.detected}
              className={`text-sm px-7 py-3 rounded-full font-semibold transition ${
                status.detected
                  ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              📸 Chụp
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
