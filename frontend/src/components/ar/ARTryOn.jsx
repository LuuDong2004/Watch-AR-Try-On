import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { applyGltfVariant } from '../../utils/gltfVariants.js'

const MEDIAPIPE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240'

function loadMediaPipeHands() {
  if (window.Hands) return Promise.resolve(window.Hands)
  if (window.__mediapipeHandsPromise) return window.__mediapipeHandsPromise

  window.__mediapipeHandsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `${MEDIAPIPE_CDN}/hands.js`
    script.crossOrigin = 'anonymous'
    script.onload = () => {
      if (window.Hands) resolve(window.Hands)
      else reject(new Error('Tải MediaPipe Hands thất bại: thiếu window.Hands'))
    }
    script.onerror = () => reject(new Error('Không tải được script MediaPipe Hands từ CDN'))
    document.head.appendChild(script)
  })

  return window.__mediapipeHandsPromise
}

function detectMobile() {
  if (typeof navigator === 'undefined') return false
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return true
  if (typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches) return true
  return false
}

const WRIST = 0
const INDEX_MCP = 5
const PINKY_MCP = 17

const FOV_DEG = 45
const CAMERA_Z = 5
const FRUST_HALF_H = CAMERA_Z * Math.tan((FOV_DEG * Math.PI) / 180 / 2)

const DEFAULT_CONFIG = {
  arScale: 2.5,
  arPositionX: 0,
  arPositionY: 0,
  arRotationOffset: 0,
  arRotationX: 0,
  arRotationY: 0
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
  const handsRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const runningRef = useRef(false)
  const mirroredRef = useRef(true)
  const configRef = useRef({ ...DEFAULT_CONFIG, ...(watchConfig || {}) })

  const [facingMode, setFacingMode] = useState(isMobile.current ? 'environment' : 'user')
  const [isLoading, setIsLoading] = useState(true)
  const [loadingStep, setLoadingStep] = useState('Khởi động AR...')
  const [errorMsg, setErrorMsg] = useState('')
  const [handDetected, setHandDetected] = useState(false)
  const [isMirrored, setIsMirrored] = useState(!isMobile.current)
  const [isReady, setIsReady] = useState(false)
  const [isSwitchingCam, setIsSwitchingCam] = useState(false)

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile.current ? 1.5 : 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15

    scene.add(new THREE.AmbientLight(0xffffff, 0.55))

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4)
    dirLight1.position.set(5, 10, 5)
    scene.add(dirLight1)

    const dirLight2 = new THREE.DirectionalLight(0xffd9a0, 0.45)
    dirLight2.position.set(-5, -3, -5)
    scene.add(dirLight2)

    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture

    sceneRef.current = scene
    rendererRef.current = renderer
    cameraThreeRef.current = camera

    return { scene, camera, renderer }
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

            const box = new THREE.Box3().setFromObject(model)
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            const maxDim = Math.max(size.x, size.y, size.z) || 1

            model.position.sub(center)
            model.scale.multiplyScalar(1 / maxDim)

            model.rotation.x = cfg.arRotationX || 0
            model.rotation.y = cfg.arRotationY || 0

            const wrapper = new THREE.Group()
            wrapper.add(model)

            wrapper.traverse((child) => {
              if (child.isMesh && child.material) {
                child.material.envMapIntensity = 1.4
              }
            })

            scene.add(wrapper)
            watchModelRef.current = wrapper
            watchModelRef.current.visible = false
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

  const onHandResults = useCallback((results) => {
    const canvas = canvasRef.current
    const glCanvas = glCanvasRef.current
    if (!canvas || !glCanvas || !sceneRef.current) return

    const ctx = canvas.getContext('2d')
    const mirrored = mirroredRef.current

    ctx.save()
    if (mirrored) {
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

      const wristWidth = Math.sqrt(
        Math.pow(indexMCP.x - pinkyMCP.x, 2) +
        Math.pow(indexMCP.y - pinkyMCP.y, 2)
      )

      const aspect = canvas.width / canvas.height || 1
      const nx = mirrored ? 1 - wrist.x : wrist.x
      const x = (nx * 2 - 1) * FRUST_HALF_H * aspect
      const y = -(wrist.y * 2 - 1) * FRUST_HALF_H
      const z = -wrist.z * 3

      const cfg = configRef.current

      if (watchModelRef.current) {
        watchModelRef.current.position.set(
          x + (cfg.arPositionX || 0),
          y + (cfg.arPositionY || 0),
          z
        )

        const angle = Math.atan2(
          indexMCP.y - pinkyMCP.y,
          mirrored ? pinkyMCP.x - indexMCP.x : indexMCP.x - pinkyMCP.x
        )
        watchModelRef.current.rotation.z = angle + (cfg.arRotationOffset || 0)
        watchModelRef.current.rotation.x = -wrist.z * 0.6

        const dynamicScale = Math.max(0.05, wristWidth * (cfg.arScale || 2.5))
        watchModelRef.current.scale.setScalar(dynamicScale)
        watchModelRef.current.visible = true
      }
    } else {
      setHandDetected(false)
      if (watchModelRef.current) watchModelRef.current.visible = false
    }

    if (rendererRef.current && sceneRef.current && cameraThreeRef.current) {
      rendererRef.current.render(sceneRef.current, cameraThreeRef.current)
    }
  }, [])

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

        initThreeJS(glCanvas)
        await loadWatchModel(sceneRef.current)
        if (!mounted) return

        setLoadingStep('Đang tải MediaPipe Hands...')
        const Hands = await loadMediaPipeHands()

        const hands = new Hands({
          locateFile: (file) => `${MEDIAPIPE_CDN}/${file}`
        })
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: isMobile.current ? 0 : 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.5
        })
        hands.onResults(onHandResults)
        handsRef.current = hands

        runningRef.current = true
        const loop = async () => {
          if (!runningRef.current) return
          const video = videoRef.current
          if (handsRef.current && video && video.readyState >= 2 && !video.paused) {
            try {
              await handsRef.current.send({ image: video })
            } catch (e) {
              // transient warmup errors — ignore
            }
          }
          rafRef.current = requestAnimationFrame(loop)
        }
        loop()

        if (mounted) setIsReady(true)
      } catch (err) {
        console.error('AR setup error:', err)
        setErrorMsg('Không khởi động được AR. Vui lòng tải lại trang và thử lại.')
        setIsLoading(false)
      }
    }

    setup()

    return () => {
      mounted = false
      runningRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      try {
        streamRef.current?.getTracks?.().forEach((t) => t.stop())
      } catch {}
      try { handsRef.current?.close?.() } catch {}
      try { rendererRef.current?.dispose?.() } catch {}
    }
  }, [initThreeJS, loadWatchModel, onHandResults])

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

        const constraints = {
          video: isMobile.current
            ? {
                facingMode: { ideal: facingMode },
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
            : {
                facingMode: { ideal: facingMode },
                width: { ideal: 1280 },
                height: { ideal: 720 }
              },
          audio: false
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
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

        setIsMirrored(facingMode === 'user')
        setIsLoading(false)
        setIsSwitchingCam(false)
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
  }, [isReady, facingMode])

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
          <p className="text-white/70 text-xs">Đang thử AR · {facingMode === 'user' ? 'Cam trước' : 'Cam sau'}</p>
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
