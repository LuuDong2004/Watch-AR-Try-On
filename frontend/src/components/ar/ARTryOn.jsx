import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'

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
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const WRIST = 0
const INDEX_MCP = 5
const PINKY_MCP = 17

const DEFAULT_CONFIG = {
  arScale: 2.5,
  arPositionX: 0,
  arPositionY: 0,
  arRotationOffset: 0
}

export default function ARTryOn({ watchModelUrl, watchConfig, watchName, onClose }) {
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

  const [isLoading, setIsLoading] = useState(true)
  const [loadingStep, setLoadingStep] = useState('Khởi động camera...')
  const [errorMsg, setErrorMsg] = useState('')
  const [handDetected, setHandDetected] = useState(false)
  const [isMirrored, setIsMirrored] = useState(true)

  useEffect(() => { mirroredRef.current = isMirrored }, [isMirrored])
  useEffect(() => { configRef.current = { ...DEFAULT_CONFIG, ...(watchConfig || {}) } }, [watchConfig])

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
    renderer.setSize(canvas.width, canvas.height, false)
    renderer.setPixelRatio(window.devicePixelRatio)
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

    const pointLight = new THREE.PointLight(0xffffff, 0.8, 12)
    pointLight.position.set(0, 3, 3)
    scene.add(pointLight)

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
        (gltf) => {
          const model = gltf.scene

          const box = new THREE.Box3().setFromObject(model)
          const center = box.getCenter(new THREE.Vector3())
          model.position.sub(center)

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

      const nx = mirrored ? 1 - wrist.x : wrist.x
      const x = (nx * 2 - 1) * 3.5
      const y = -(wrist.y * 2 - 1) * 2.2
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

  const initMediaPipe = useCallback(async () => {
    setLoadingStep('Đang xin quyền camera...')

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false
    })
    streamRef.current = stream

    const video = videoRef.current
    video.srcObject = stream
    video.playsInline = true
    video.muted = true
    await video.play()

    setLoadingStep('Đang tải MediaPipe Hands...')
    const Hands = await loadMediaPipeHands()

    setLoadingStep('Đang khởi động nhận diện tay...')

    const hands = new Hands({
      locateFile: (file) => `${MEDIAPIPE_CDN}/${file}`
    })

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.6
    })

    hands.onResults(onHandResults)
    handsRef.current = hands

    runningRef.current = true
    const loop = async () => {
      if (!runningRef.current) return
      if (handsRef.current && video.readyState >= 2) {
        try {
          await handsRef.current.send({ image: video })
        } catch (e) {
          // MediaPipe may throw briefly while still warming up; ignore transient errors
        }
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    loop()

    setIsLoading(false)
  }, [onHandResults])

  useEffect(() => {
    let mounted = true
    const setup = async () => {
      try {
        const canvas = canvasRef.current
        const glCanvas = glCanvasRef.current
        if (!canvas || !glCanvas) return

        canvas.width = 1280
        canvas.height = 720
        glCanvas.width = 1280
        glCanvas.height = 720

        initThreeJS(glCanvas)
        await loadWatchModel(sceneRef.current)
        if (!mounted) return
        await initMediaPipe()
      } catch (err) {
        console.error('AR setup error:', err)
        setErrorMsg(
          err?.message?.includes('Permission')
            ? 'Bạn cần cấp quyền truy cập camera để dùng tính năng AR.'
            : 'Không khởi động được AR. Vui lòng kiểm tra camera và thử lại.'
        )
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
  }, [initThreeJS, loadWatchModel, initMediaPipe])

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

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div>
          <p className="text-white/70 text-xs">Đang thử AR</p>
          <h2 className="text-white font-semibold text-lg font-display">{watchName || 'Thử Đồng Hồ AR'}</h2>
        </div>
        <button
          onClick={onClose}
          className="text-white bg-white/15 hover:bg-white/25 rounded-full w-10 h-10 flex items-center justify-center text-xl"
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

      {isLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85">
          <div className="animate-spin w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full mb-4" />
          <p className="text-white text-center px-6">{loadingStep}</p>
        </div>
      )}

      {!isLoading && errorMsg && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 px-6">
          <p className="text-red-400 text-2xl mb-3">⚠️</p>
          <p className="text-white text-center max-w-sm">{errorMsg}</p>
          <button
            onClick={onClose}
            className="mt-6 bg-white text-black px-5 py-2 rounded-full font-semibold"
          >
            Quay lại
          </button>
        </div>
      )}

      {!isLoading && !errorMsg && (
        <div className="absolute inset-x-0 bottom-28 flex justify-center pointer-events-none">
          <div
            className={`px-5 py-2.5 rounded-full text-sm backdrop-blur transition-all ${
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
        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-center gap-3 bg-gradient-to-t from-black/70 to-transparent">
          <button
            onClick={() => setIsMirrored((m) => !m)}
            className="bg-white/15 text-white px-4 py-2.5 rounded-full backdrop-blur hover:bg-white/25 text-sm"
          >
            🔄 Lật gương
          </button>
          <button
            onClick={handleScreenshot}
            className="bg-yellow-400 text-black px-6 py-3 rounded-full font-semibold hover:bg-yellow-300 flex items-center gap-2 shadow-lg"
          >
            📸 Chụp ảnh
          </button>
        </div>
      )}
    </div>
  )
}
