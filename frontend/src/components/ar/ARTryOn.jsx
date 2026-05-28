import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import * as tf from '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection'
import { applyGltfVariant } from '../../utils/gltfVariants.js'
import { detectMobile } from '../../utils/device.js'
import { KalmanFilter, KF_PRESETS } from '../../utils/KalmanFilter.js'

const WRIST = 0
const INDEX_MCP = 5
const MIDDLE_MCP = 9
const PINKY_MCP = 17

const FOV_DEG = 45
const CAMERA_Z = 5
const FRUST_HALF_H = CAMERA_Z * Math.tan((FOV_DEG * Math.PI) / 180 / 2)

const DEFAULT_CONFIG = {
  arScale: 1.5,
  arPositionX: 0,
  arPositionY: 0,
  arRotationOffset: 0,
  arRotationX: 0,
  arRotationY: 0
}

// Scratch THREE objects — reused every frame to avoid GC pressure
const _W2 = new THREE.Vector3()
const _I2 = new THREE.Vector3()
const _P2 = new THREE.Vector3()
const _M2 = new THREE.Vector3()
const _W3 = new THREE.Vector3()
const _I3 = new THREE.Vector3()
const _P3 = new THREE.Vector3()
const _M3 = new THREE.Vector3()
const _yAxis = new THREE.Vector3()
const _xAxis = new THREE.Vector3()
const _zAxis = new THREE.Vector3()
const _yAxis2D = new THREE.Vector3()
const _xAxis2D = new THREE.Vector3()
const _midMcp = new THREE.Vector3()
const _targetPos = new THREE.Vector3()
const _basis = new THREE.Matrix4()
const _targetQuat = new THREE.Quaternion()
const _Z_UP = new THREE.Vector3(0, 0, 1)

const DEBUG = typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('debug') === '1'

let detectorPromise = null
function loadDetector(modelType) {
  if (detectorPromise) return detectorPromise
  detectorPromise = (async () => {
    try { await tf.setBackend('webgl') } catch {}
    await tf.ready()
    return handPoseDetection.createDetector(
      handPoseDetection.SupportedModels.MediaPipeHands,
      { runtime: 'tfjs', modelType, maxHands: 1 }
    )
  })()
  return detectorPromise
}

export default function ARTryOn({ watchModelUrl, watchConfig, watchName, onClose }) {
  const isMobile = useRef(detectMobile())

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const glCanvasRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraThreeRef = useRef(null)
  const watchModelRef = useRef(null)
  const detectorRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const runningRef = useRef(false)
  const inferenceRunningRef = useRef(false)
  const latestHandRef = useRef(null)        // last detection result
  const inputCanvasRef = useRef(null)        // small canvas for inference
  const handDetectedRef = useRef(false)      // synced with state; used inside loop closures
  const mirroredRef = useRef(true)
  const configRef = useRef({ ...DEFAULT_CONFIG, ...(watchConfig || {}) })

  const kfRef = useRef({
    x: new KalmanFilter(KF_PRESETS.position.R, KF_PRESETS.position.Q),
    y: new KalmanFilter(KF_PRESETS.position.R, KF_PRESETS.position.Q),
    z: new KalmanFilter(KF_PRESETS.position.R, KF_PRESETS.position.Q),
    scale: new KalmanFilter(KF_PRESETS.scale.R, KF_PRESETS.scale.Q),
    angle: new KalmanFilter(KF_PRESETS.angle.R, KF_PRESETS.angle.Q),
    tilt: new KalmanFilter(KF_PRESETS.angle.R, KF_PRESETS.angle.Q)
  })

  const [facingMode, setFacingMode] = useState(isMobile.current ? 'environment' : 'user')
  const [isLoading, setIsLoading] = useState(true)
  const [loadingStep, setLoadingStep] = useState('Khởi động AR...')
  const [errorMsg, setErrorMsg] = useState('')
  const [handDetected, setHandDetected] = useState(false)
  const [isMirrored, setIsMirrored] = useState(!isMobile.current)
  const [isReady, setIsReady] = useState(false)
  const [isSwitchingCam, setIsSwitchingCam] = useState(false)
  const [fps, setFps] = useState(0)
  const [inferFps, setInferFps] = useState(0)

  useEffect(() => { mirroredRef.current = isMirrored }, [isMirrored])
  useEffect(() => { configRef.current = { ...DEFAULT_CONFIG, ...(watchConfig || {}) } }, [watchConfig])

  const initThreeJS = useCallback((canvas) => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(FOV_DEG, canvas.width / canvas.height || 1, 0.1, 1000)
    camera.position.z = CAMERA_Z

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !isMobile.current,
      premultipliedAlpha: false,
      powerPreference: isMobile.current ? 'low-power' : 'high-performance'
    })
    renderer.setSize(canvas.width, canvas.height, false)
    renderer.setPixelRatio(isMobile.current ? 1 : Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2

    scene.add(new THREE.AmbientLight(0xffffff, 0.5))

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0)
    keyLight.position.set(3, 8, 5)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xffe8c0, 0.6)
    fillLight.position.set(-4, 2, 3)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xadd8e6, 0.4)
    rimLight.position.set(0, -3, -5)
    scene.add(rimLight)

    if (!isMobile.current) {
      const pmrem = new THREE.PMREMGenerator(renderer)
      scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture
    }

    sceneRef.current = scene
    rendererRef.current = renderer
    cameraThreeRef.current = camera
  }, [])

  const loadWatchModel = useCallback(async (scene) => {
    setLoadingStep('Đang tải mô hình 3D đồng hồ...')
    const loader = new GLTFLoader()

    return new Promise((resolve, reject) => {
      loader.load(
        watchModelUrl,
        async (gltf) => {
          try {
            const cfg = configRef.current
            if (cfg.variant) {
              setLoadingStep('Đang áp phối màu...')
              await applyGltfVariant(gltf, cfg.variant)
            }

            const model = gltf.scene

            // Normalize size first, THEN center.
            // (If you center first then scale, the offset gets scaled too and the
            //  model ends up off-pivot — when the wrapper rotates, it swings.)
            const initialBox = new THREE.Box3().setFromObject(model)
            const size = initialBox.getSize(new THREE.Vector3())
            const maxDim = Math.max(size.x, size.y, size.z) || 1
            model.scale.multiplyScalar(1 / maxDim)

            const scaledBox = new THREE.Box3().setFromObject(model)
            const scaledCenter = scaledBox.getCenter(new THREE.Vector3())
            model.position.sub(scaledCenter)

            model.rotation.x = cfg.arRotationX || 0
            model.rotation.y = cfg.arRotationY || 0
            model.rotation.z = cfg.arRotationOffset || 0

            const wrapper = new THREE.Group()
            wrapper.add(model)
            wrapper.traverse((child) => {
              if (child.isMesh && child.material) {
                child.material.envMapIntensity = 1.4
              }
            })

            scene.add(wrapper)
            watchModelRef.current = wrapper
            wrapper.visible = false
            resolve(wrapper)
          } catch (e) {
            reject(e)
          }
        },
        (progress) => {
          if (progress.total > 0) {
            const pct = Math.round((progress.loaded / progress.total) * 100)
            setLoadingStep(`Đang tải mô hình 3D... ${pct}%`)
          }
        },
        (err) => reject(err)
      )
    })
  }, [watchModelUrl])

  // Inference loop — runs as fast as the model allows, INDEPENDENT of RAF
  const startInferenceLoop = useCallback(() => {
    if (inferenceRunningRef.current) return
    inferenceRunningRef.current = true

    let lastFpsAt = performance.now()
    let frames = 0

    const tick = async () => {
      if (!runningRef.current) {
        inferenceRunningRef.current = false
        return
      }
      const detector = detectorRef.current
      const video = videoRef.current
      const inputCanvas = inputCanvasRef.current

      if (detector && video && video.readyState >= 2 && inputCanvas) {
        try {
          // Downscale video to small canvas for faster inference
          const ictx = inputCanvas.getContext('2d')
          ictx.drawImage(video, 0, 0, inputCanvas.width, inputCanvas.height)

          const hands = await detector.estimateHands(inputCanvas, {
            flipHorizontal: mirroredRef.current
          })
          latestHandRef.current = hands.length > 0 ? hands[0] : null

          frames++
          const now = performance.now()
          if (now - lastFpsAt >= 1000) {
            setInferFps(frames)
            frames = 0
            lastFpsAt = now
          }
        } catch (e) {
          // ignore transient frames
        }
      }
      // Yield to UI thread
      setTimeout(tick, 0)
    }
    tick()
  }, [])

  // Render loop — pure RAF, fast, never blocks on inference
  const startRenderLoop = useCallback(() => {
    let lastFpsAt = performance.now()
    let frames = 0

    const render = () => {
      if (!runningRef.current) return
      const canvas = canvasRef.current
      const glCanvas = glCanvasRef.current
      const video = videoRef.current
      const obj = watchModelRef.current

      if (canvas && video && video.readyState >= 2) {
        const ctx = canvas.getContext('2d')
        ctx.save()
        if (mirroredRef.current) {
          ctx.translate(canvas.width, 0)
          ctx.scale(-1, 1)
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        ctx.restore()

        const hand = latestHandRef.current
        if (hand && obj && canvas) {
          applyHandToModel(hand, canvas, obj)
          if (DEBUG) drawDebugOverlay(hand, canvas)
          if (!handDetectedRef.current) {
            handDetectedRef.current = true
            setHandDetected(true)
          }
        } else if (obj && obj.visible) {
          obj.visible = false
          if (handDetectedRef.current) {
            handDetectedRef.current = false
            setHandDetected(false)
          }
        }
      }

      if (rendererRef.current && sceneRef.current && cameraThreeRef.current) {
        rendererRef.current.render(sceneRef.current, cameraThreeRef.current)
      }

      frames++
      const now = performance.now()
      if (now - lastFpsAt >= 1000) {
        setFps(frames)
        frames = 0
        lastFpsAt = now
      }

      rafRef.current = requestAnimationFrame(render)
    }
    render()
  }, [])

  // DEBUG: paint MediaPipe landmarks back onto the bg canvas to verify mapping.
  // Toggle with ?debug=1 in the URL.
  const drawDebugOverlay = (hand, canvas) => {
    const kp2d = hand.keypoints
    const inputW = inputCanvasRef.current?.width || canvas.width
    const inputH = inputCanvasRef.current?.height || canvas.height
    const sx = canvas.width / inputW
    const sy = canvas.height / inputH
    const ctx = canvas.getContext('2d')

    ctx.save()
    kp2d.forEach((kp, i) => {
      const x = kp.x * sx
      const y = kp.y * sy
      const r = i === WRIST ? 10 : (i === INDEX_MCP || i === PINKY_MCP || i === MIDDLE_MCP ? 7 : 4)
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle =
        i === WRIST ? '#ff3b30' :
        i === INDEX_MCP ? '#ffcc00' :
        i === PINKY_MCP ? '#0a84ff' :
        i === MIDDLE_MCP ? '#ff9500' :
        'rgba(0,255,255,0.7)'
      ctx.fill()
    })

    // Wrist-axis line (index→pinky)
    const iX = kp2d[INDEX_MCP].x * sx
    const iY = kp2d[INDEX_MCP].y * sy
    const pX = kp2d[PINKY_MCP].x * sx
    const pY = kp2d[PINKY_MCP].y * sy
    ctx.beginPath()
    ctx.moveTo(iX, iY)
    ctx.lineTo(pX, pY)
    ctx.strokeStyle = '#34c759'
    ctx.lineWidth = 3
    ctx.stroke()

    // Wrist→middle line (forearm proxy)
    const wX = kp2d[WRIST].x * sx
    const wY = kp2d[WRIST].y * sy
    const mX = kp2d[MIDDLE_MCP].x * sx
    const mY = kp2d[MIDDLE_MCP].y * sy
    ctx.beginPath()
    ctx.moveTo(wX, wY)
    ctx.lineTo(mX, mY)
    ctx.strokeStyle = '#af52de'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.restore()
  }

  // Apply the latest detected hand to the 3D model — pure math, no React state
  const applyHandToModel = (hand, canvas, obj) => {
    const kp2d = hand.keypoints
    const kp3d = hand.keypoints3D
    const inputW = inputCanvasRef.current?.width || canvas.width
    const inputH = inputCanvasRef.current?.height || canvas.height

    const aspect = canvas.width / canvas.height || 1
    const halfW = FRUST_HALF_H * aspect
    const halfH = FRUST_HALF_H

    // No extra horizontal flip here — TF.js already flipped landmarks
    // via flipHorizontal=mirrored when running estimateHands.
    const toWorld2D = (px, py, target) => {
      const nx = px / inputW
      const ny = py / inputH
      target.set(
        (nx * 2 - 1) * halfW,
        -(ny * 2 - 1) * halfH,
        0
      )
      return target
    }

    toWorld2D(kp2d[WRIST].x, kp2d[WRIST].y, _W2)
    toWorld2D(kp2d[INDEX_MCP].x, kp2d[INDEX_MCP].y, _I2)
    toWorld2D(kp2d[PINKY_MCP].x, kp2d[PINKY_MCP].y, _P2)
    toWorld2D(kp2d[MIDDLE_MCP].x, kp2d[MIDDLE_MCP].y, _M2)

    _midMcp.addVectors(_I2, _P2).multiplyScalar(0.5)

    // Offset 18% from MCP midpoint back toward WRIST so the watch sits
    // closer to the wrist crease instead of on the knuckles.
    const offsetVec = new THREE.Vector3()
      .subVectors(_W2, _midMcp)
      .multiplyScalar(1.0)
    _midMcp.add(offsetVec)

    // Angle 1: in-plane rotation from forearm direction (WRIST → MIDDLE_MCP).
    const armDx = kp2d[WRIST].x - kp2d[MIDDLE_MCP].x
    const armDy = kp2d[WRIST].y - kp2d[MIDDLE_MCP].y
    const rawAngle = Math.atan2(armDy, armDx)
    const smoothAngle = kfRef.current.angle.filter(rawAngle)

    // Angle 2: wrist roll (twist around forearm axis) from depth difference
    // between INDEX_MCP and PINKY_MCP. Scaled by the 2D distance between
    // those landmarks so the roll feels right at any hand size on screen.
    const dxIP = kp2d[INDEX_MCP].x - kp2d[PINKY_MCP].x
    const dyIP = kp2d[INDEX_MCP].y - kp2d[PINKY_MCP].y
    const distXY = Math.sqrt(dxIP * dxIP + dyIP * dyIP)
    const rawRoll = Math.atan2(
      (kp2d[INDEX_MCP].z ?? 0) - (kp2d[PINKY_MCP].z ?? 0),
      distXY * 0.5
    )
    const smoothRoll = kfRef.current.x.filter(rawRoll)

    // Angle 3: pitch (forearm leaning toward/away from camera) from depth
    // difference MIDDLE_MCP.z − WRIST.z. Clamped ±0.6 rad so unusual
    // landmark depth noise can't flip the watch.
    const rawPitch = ((kp2d[MIDDLE_MCP].z ?? 0) - (kp2d[WRIST].z ?? 0)) * 1.5
    const pitchClamped = Math.max(-0.6, Math.min(0.6, rawPitch))
    const smoothPitch = kfRef.current.tilt.filter(pitchClamped)

    const cfg = configRef.current
    const screenWristW = _I2.distanceTo(_P2)
    const rawScale = screenWristW * (cfg.arScale || 1.5)
    const smoothScale = Math.max(
      0.05,
      Math.min(1.5, kfRef.current.scale.filter(rawScale))
    )

    obj.position.copy(_midMcp)
    // XYZ Euler: X applied first (pitch toward/away camera), then Z (forearm angle).
    obj.rotation.set(smoothPitch, 0, smoothAngle)
    obj.scale.setScalar(smoothScale)
    const model = obj.children[0]
    if (model) {
      model.rotation.set(0, 0, smoothRoll)
    }
    obj.visible = true
  }

  // Mount-once: init Three + model + detector + small input canvas
  useEffect(() => {
    let mounted = true

    const setup = async () => {
      try {
        const canvas = canvasRef.current
        const glCanvas = glCanvasRef.current
        if (!canvas || !glCanvas) return

        canvas.width = 640
        canvas.height = 480
        glCanvas.width = 640
        glCanvas.height = 480

        // Small offscreen canvas for inference (much faster on mobile)
        const input = document.createElement('canvas')
        input.width = isMobile.current ? 256 : 320
        input.height = isMobile.current ? 192 : 240
        inputCanvasRef.current = input

        initThreeJS(glCanvas)
        await loadWatchModel(sceneRef.current)
        if (!mounted) return

        setLoadingStep('Đang khởi động AI nhận diện...')
        detectorRef.current = await loadDetector('lite')

        runningRef.current = true
        startRenderLoop()

        if (mounted) setIsReady(true)
      } catch (err) {
        console.error('AR setup error:', err)
        setErrorMsg('Không khởi động được AR: ' + (err?.message || 'lỗi không xác định'))
        setIsLoading(false)
      }
    }

    setup()

    return () => {
      mounted = false
      runningRef.current = false
      inferenceRunningRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      try { streamRef.current?.getTracks?.().forEach((t) => t.stop()) } catch {}
      try { rendererRef.current?.dispose?.() } catch {}
    }
  }, [initThreeJS, loadWatchModel, startRenderLoop])

  // Camera effect — start/restart on facingMode change
  useEffect(() => {
    if (!isReady) return
    let cancelled = false

    const startCamera = async () => {
      try {
        setIsSwitchingCam(true)
        setLoadingStep(facingMode === 'user' ? 'Mở camera trước...' : 'Mở camera sau...')

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: isMobile.current ? 960 : 1280 },
            height: { ideal: isMobile.current ? 540 : 720 }
          },
          audio: false
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream

        const video = videoRef.current
        video.srcObject = stream
        video.playsInline = true
        video.muted = true
        await video.play()

        const w = video.videoWidth || 640
        const h = video.videoHeight || 480

        if (canvasRef.current) {
          canvasRef.current.width = w
          canvasRef.current.height = h
        }
        if (glCanvasRef.current) {
          glCanvasRef.current.width = w
          glCanvasRef.current.height = h
        }
        if (cameraThreeRef.current && rendererRef.current) {
          cameraThreeRef.current.aspect = w / h
          cameraThreeRef.current.updateProjectionMatrix()
          rendererRef.current.setSize(w, h, false)
        }

        Object.values(kfRef.current).forEach((f) => f.reset(0))
        latestHandRef.current = null
        handDetectedRef.current = false
        setHandDetected(false)

        setIsMirrored(facingMode === 'user')
        setIsLoading(false)
        setIsSwitchingCam(false)

        // Start the inference loop once camera is live (idempotent)
        startInferenceLoop()
      } catch (err) {
        console.error('Camera error:', err)
        const isPerm = err?.name === 'NotAllowedError' || err?.message?.toLowerCase().includes('permission')
        const isNoCam = err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError'
        setErrorMsg(
          isPerm
            ? 'Bạn cần cấp quyền truy cập camera trong cài đặt trình duyệt.'
            : isNoCam
              ? `Không tìm thấy camera ${facingMode === 'user' ? 'trước' : 'sau'}. Hãy thử đổi camera.`
              : 'Không mở được camera. Vui lòng thử lại.'
        )
        setIsLoading(false)
        setIsSwitchingCam(false)
      }
    }

    startCamera()

    return () => { cancelled = true }
  }, [isReady, facingMode, startInferenceLoop])

  const handleScreenshot = () => {
    const canvas = canvasRef.current
    const glCanvas = glCanvasRef.current
    if (!canvas || !glCanvas) return

    const composite = document.createElement('canvas')
    composite.width = canvas.width
    composite.height = canvas.height
    const cctx = composite.getContext('2d')
    cctx.drawImage(canvas, 0, 0)
    cctx.drawImage(glCanvas, 0, 0)

    const link = document.createElement('a')
    link.download = `thu-dong-ho-ar-${Date.now()}.png`
    link.href = composite.toDataURL('image/png')
    link.click()
  }

  const handleSwitchCamera = () => {
    if (isSwitchingCam) return
    setErrorMsg('')
    setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="min-w-0 pr-3">
          <p className="text-white/70 text-xs">
            AR · {facingMode === 'user' ? 'Cam trước' : 'Cam sau'}
            {fps > 0 ? ` · ${fps} fps` : ''}
            {inferFps > 0 ? ` · AI ${inferFps}` : ''}
          </p>
          <h2 className="text-white font-semibold text-base sm:text-lg font-display truncate">
            {watchName || 'Thử Đồng Hồ AR'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-white bg-white/15 hover:bg-white/25 rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center text-xl"
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>

      <video ref={videoRef} className="hidden" playsInline muted />

      <div className="relative w-full h-full">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas
          ref={glCanvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      </div>

      {(isLoading || isSwitchingCam) && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85">
          <div className="animate-spin w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full mb-4" />
          <p className="text-white text-center px-6">{loadingStep}</p>
          <p className="text-white/40 text-xs mt-2">Lần đầu tải có thể mất vài giây</p>
        </div>
      )}

      {!isLoading && errorMsg && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 px-6 text-center">
          <p className="text-red-400 text-2xl mb-3">⚠️</p>
          <p className="text-white max-w-sm mb-5">{errorMsg}</p>
          <div className="flex gap-2">
            <button
              onClick={handleSwitchCamera}
              className="bg-white/15 text-white px-5 py-2 rounded-full font-semibold"
            >
              🔄 Đổi camera
            </button>
            <button
              onClick={onClose}
              className="bg-white text-black px-5 py-2 rounded-full font-semibold"
            >
              Quay lại
            </button>
          </div>
        </div>
      )}

      {!isLoading && !errorMsg && !isSwitchingCam && (
        <div className="absolute inset-x-0 bottom-28 flex justify-center pointer-events-none px-4">
          <div
            className={`px-4 py-2 rounded-full text-sm backdrop-blur transition-all text-center ${
              handDetected
                ? 'bg-green-500/85 text-white'
                : 'bg-black/60 text-white'
            }`}
          >
            {handDetected ? '✅ Đã nhận diện cổ tay' : '✋ Đưa cổ tay vào khung hình'}
          </div>
        </div>
      )}

      {!isLoading && !errorMsg && (
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-t from-black/70 to-transparent">
          <button
            onClick={handleSwitchCamera}
            disabled={isSwitchingCam}
            className="bg-white/15 text-white px-3 sm:px-4 py-2.5 rounded-full backdrop-blur hover:bg-white/25 text-xs sm:text-sm disabled:opacity-50"
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
            onClick={handleScreenshot}
            className="bg-yellow-400 text-black px-5 sm:px-6 py-3 rounded-full font-semibold hover:bg-yellow-300 text-sm shadow-lg"
          >
            📸 Chụp
          </button>
        </div>
      )}
    </div>
  )
}
