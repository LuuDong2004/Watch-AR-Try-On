import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, useGLTF, Html } from '@react-three/drei'
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
      <div className="text-xs text-gray-500 bg-white/80 px-3 py-1.5 rounded-full">
        Đang tải mô hình 3D…
      </div>
    </Html>
  )
}

export default function Watch3DViewer({ modelUrl, variant, height = 320 }) {
  const [hovered, setHovered] = useState(false)
  const [autoRotate, setAutoRotate] = useState(false)

  return (
    <div
      className="relative w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden border border-gray-100"
      style={{ height }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }} dpr={[1, 2]}>
        <Suspense fallback={<Loader />}>
          <Stage environment="city" intensity={0.5}>
            <WatchModel url={modelUrl} variant={variant} />
          </Stage>
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={hovered}
          enableRotate
          autoRotate={autoRotate}
          autoRotateSpeed={1.2}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
        />
      </Canvas>

      <div className="absolute top-3 right-3 flex gap-2">
        <button
          onClick={() => setAutoRotate((r) => !r)}
          className={`text-xs px-3 py-1.5 rounded-full backdrop-blur transition shadow-sm ${
            autoRotate
              ? 'bg-[#1A1A2E] text-white'
              : 'bg-white/80 text-gray-700 hover:bg-white'
          }`}
        >
          {autoRotate ? '⏸ Dừng xoay' : '↻ Tự xoay'}
        </button>
      </div>

      <p className="absolute bottom-2 inset-x-0 text-center text-[11px] text-gray-400 pointer-events-none">
        🖱️ Kéo để xoay · Cuộn (khi trỏ chuột trên ảnh) để zoom
      </p>
    </div>
  )
}
