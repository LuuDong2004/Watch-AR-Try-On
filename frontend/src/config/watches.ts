/**
 * Watch catalogue.
 *
 * Each entry renders one of two ways:
 *  1. From a real GLB in /public/models (downloaded test models, see README).
 *  2. From a built-in *procedural* watch when `model` is empty — so the whole
 *     AR pipeline works even with no assets.
 *
 * `scale`, `offset`, `rotation` and `autoOrient` fine-tune any imported GLB
 * without code changes.
 */

export type ProceduralStyle = 'dive' | 'steel-sport' | 'smart' | 'g-shock' | 'dress';

export interface WatchConfig {
  id: string;
  name: string;
  brand: string;
  /** GLB path in /public/models, or '' to use the procedural fallback. */
  model: string;
  /** Whether this model is offered for AR wrist try-on (needs a quality GLB). */
  hasAR?: boolean;
  /** Auto-rotate the GLB so its thinnest axis (dial normal) points up. */
  autoOrient?: boolean;
  /** Attribution shown in the UI (required by CC-BY licences). */
  credit?: string;
  /** Procedural look (also drives the catalogue thumbnail tint). */
  style: ProceduralStyle;
  /** Multiplier applied to the auto wrist-fit scale. ~1.0 is a normal fit. */
  scale: number;
  /** Local offset in watch units [x, y, z] (y = up out of wrist). */
  offset: [number, number, number];
  /** Extra local rotation in radians [x, y, z] to align an imported GLB. */
  rotation: [number, number, number];
  /**
   * Dial spin in radians [x, y, z], applied in the model's native frame BEFORE
   * `rotation`. Use the z component to spin the dial so 12 o'clock points at the
   * hand (the debug "Z" button maps to exactly this).
   */
  spin?: [number, number, number];
  /** Accent / case colors used by the procedural renderer + UI thumbnail. */
  metal: string;
  dial: string;
  accent: string;
}

// Sample AR watches wired for the wrist try-on demo. Each `model` is a real GLB
// under /public/models; `scale` is a multiplier on the auto wrist-fit so 1.0 just
// works, and the dial is tilted up with rotation [-90° about X] (shared by all
// three). The carousel in WatchSelector appears once more than one is `hasAR`.
export const WATCHES: WatchConfig[] = [
  {
    // Realistic PBR chronograph, authored by DGG for AR wrist try-on.
    id: 'chrono',
    name: 'Chronograph',
    brand: 'DGG · 3D Commerce',
    model: '/models/chronograph_watch.glb',
    hasAR: true,
    // Dial faces +Z (standard glTF view) → tilt -90° about X so the dial points
    // up (+Y) and the 12–6 axis runs along the forearm. Same as the Poly watches.
    autoOrient: false,
    credit: '© Darmstadt Graphics Group — CC BY 4.0',
    style: 'steel-sport',
    scale: 1.0,
    offset: [0, 0.0, 0],
    rotation: [-Math.PI / 2, 0, 0],
    // Spin 270° so the dial reads horizontally — the real wearing orientation.
    spin: [0, 0, (3 * Math.PI) / 2],
    metal: '#d2d6db',
    dial: '#15171c',
    accent: '#c8a24a',
  },
  {
    // Low-poly classic watch (Poly by Google). Same up-tilt as the chronograph;
    // scale is the auto-fit multiplier, fine-tune with the AR debug controls.
    id: 'poly-classic',
    name: 'Classic',
    brand: 'Poly · Google',
    model: '/models/poly_watch.glb',
    hasAR: true,
    autoOrient: false,
    credit: '© Poly by Google — CC BY 3.0',
    style: 'dress',
    scale: 1.0,
    offset: [0, 0, 0],
    rotation: [-Math.PI / 2, 0, 0],
    spin: [0, 0, 0],
    metal: '#e6c98a',
    dial: '#3a2f1c',
    accent: '#b8924a',
  },
  {
    // Low-poly slim wristwatch (Poly by Google).
    id: 'poly-slim',
    name: 'Wrist Watch',
    brand: 'Poly · Google',
    model: '/models/poly_wristwatch.glb',
    hasAR: true,
    autoOrient: false,
    credit: '© Poly by Google — CC BY 3.0',
    style: 'steel-sport',
    scale: 1.0,
    offset: [0, 0, 0],
    rotation: [-Math.PI / 2, 0, 0],
    spin: [0, 0, 0],
    metal: '#cfd4da',
    dial: '#1b1f26',
    accent: '#8aa0b8',
  },

  // --- Procedural demo watches (no GLB) -------------------------------------
  // `model: ''` → rendered by ProceduralWatch from Three.js primitives, so they
  // need no asset and work in AR immediately. Procedural meshes are authored in
  // the wrist frame already (dial up), so rotation/offset stay zero and scale is
  // the auto wrist-fit (1.0). Ids match the backend product rows of the same id.
  {
    id: 'classic',
    name: 'Submariner Deep Blue',
    brand: 'Rolex',
    model: '',
    hasAR: true,
    style: 'dive',
    scale: 1.0,
    offset: [0, 0, 0],
    rotation: [0, 0, 0],
    metal: '#cfd3d8',
    dial: '#0b2a4a',
    accent: '#B8924A',
  },
  {
    id: 'gshock',
    name: 'Tactical Sport Resilient',
    brand: 'G-Shock',
    model: '',
    hasAR: true,
    style: 'g-shock',
    scale: 1.0,
    offset: [0, 0, 0],
    rotation: [0, 0, 0],
    metal: '#1c1c1f',
    dial: '#101216',
    accent: '#ff3333',
  },
  {
    id: 'smart',
    name: 'Smart Titanium Ultra',
    brand: 'Aventus Smart',
    model: '',
    hasAR: true,
    style: 'smart',
    scale: 1.0,
    offset: [0, 0, 0],
    rotation: [0, 0, 0],
    metal: '#b9a78c',
    dial: '#050505',
    accent: '#ff7a1a',
  },
  {
    id: 'wrist',
    name: 'Classic Heritage Gold 39mm',
    brand: 'Omega',
    model: '',
    hasAR: true,
    style: 'dress',
    scale: 1.0,
    offset: [0, 0, 0],
    rotation: [0, 0, 0],
    metal: '#d7c08a',
    dial: '#0a0a0c',
    accent: '#B8924A',
  },
];

export const DEFAULT_WATCH_ID = WATCHES[0].id;

export function getWatch(id: string): WatchConfig {
  return WATCHES.find((w) => w.id === id) ?? WATCHES[0];
}
