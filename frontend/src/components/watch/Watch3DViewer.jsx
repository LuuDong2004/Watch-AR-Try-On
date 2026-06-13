import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, useGLTF, Html, Environment, Lightformer } from '@react-three/drei'
import { applyGltfVariant } from '../../utils/gltfVariants.js'

function WatchModel({ url, variant }) {
  const gltf = useGLTF(url)
  useEffect(() => {
    if (variant) applyGltfVariant(gltf, variant).catch(() => {})
  }, [gltf, variant])
  return <primitive object={gltf.scene} />
}

function Loader() {
  return (
    <Html center>
      <div className="flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-xs text-gray-600 shadow-sm backdrop-blur">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#B8924A]/30 border-t-[#B8924A]" />
        Đang tải mô hình 3D…
      </div>
    </Html>
  )
}

export default function Watch3DViewer({
  modelUrl,
  variant,
  height = 320,
  // When true: spins continuously, no pause button, no zoom/drag hint, no border.
  hideControls = false,
  // Initial camera position. An elevated 3/4 angle reads diagonal & more dynamic
  // than a flat front view.
  camera = [2.1, 1.45, 2.3],
}) {
  const [hovered, setHovered] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)

  const showControls = !hideControls

  // Warm the cache so the model is ready as soon as the canvas mounts.
  useEffect(() => {
    if (modelUrl) {
      try { useGLTF.preload(modelUrl) } catch { /* ignore */ }
    }
  }, [modelUrl])

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl ${
        hideControls ? '' : 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100'
      }`}
      style={{ height }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Canvas camera={{ position: camera, fov: 45 }} dpr={[1, 2]}>
        <Suspense fallback={<Loader />}>
          <Stage environment={null} preset="rembrandt" intensity={0.5} adjustCamera={1.3} shadows="contact">
            <WatchModel url={modelUrl} variant={variant} />
          </Stage>
          {/* Procedural studio environment (no network HDRI → fast) so the metal
              reflects something instead of rendering black. */}
          <Environment resolution={256} frames={1}>
            <Lightformer form="rect" intensity={4} position={[0, 3, 3]} scale={[8, 4, 1]} color="#ffffff" />
            <Lightformer form="rect" intensity={2} position={[3, 1, 2]} scale={[5, 5, 1]} color="#fff3df" />
            <Lightformer form="rect" intensity={2} position={[-3, 1, 2]} scale={[5, 5, 1]} color="#ffffff" />
            <Lightformer form="ring" intensity={1.2} position={[0, -1, -4]} scale={[6, 6, 1]} color="#ffe9c7" />
          </Environment>
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={showControls && hovered}
          enableRotate={showControls}
          autoRotate={hideControls ? true : autoRotate}
          autoRotateSpeed={1.2}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
        />
      </Canvas>

      {showControls && (
        <>
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={() => setAutoRotate((r) => !r)}
              className={`text-xs px-3 py-1.5 rounded-full backdrop-blur transition shadow-sm ${
                autoRotate ? 'bg-[#1A1A2E] text-white' : 'bg-white/80 text-gray-700 hover:bg-white'
              }`}
            >
              {autoRotate ? '⏸ Dừng xoay' : '↻ Tự xoay'}
            </button>
          </div>

          <p className="absolute bottom-2 inset-x-0 text-center text-[11px] text-gray-400 pointer-events-none">
            🖱️ Kéo để xoay · Cuộn (khi trỏ chuột trên ảnh) để zoom
          </p>
        </>
      )}
    </div>
  )
}
