const VARIANTS_EXT = 'KHR_materials_variants'

export async function applyGltfVariant(gltf, variantName) {
  if (!variantName || !gltf?.parser) return false
  const variants =
    gltf.parser.json?.extensions?.[VARIANTS_EXT]?.variants
  if (!variants) return false

  const idx = variants.findIndex((v) => v.name === variantName)
  if (idx === -1) return false

  const meshes = []
  gltf.scene.traverse((o) => { if (o.isMesh) meshes.push(o) })

  for (const mesh of meshes) {
    const ext = mesh.userData?.gltfExtensions?.[VARIANTS_EXT]
    if (!ext) continue
    const mapping = ext.mappings.find((m) => m.variants.includes(idx))
    if (!mapping) continue
    const material = await gltf.parser.getDependency('material', mapping.material)
    if (material) mesh.material = material
  }
  return true
}
