import { Camera, Matrix4, Quaternion, Vector3 } from 'three';
import { HandFrame, LM } from './HandTracker';

/**
 * Wrist Anchor System.
 *
 * Turns a frame of 2D/2.5D hand landmarks into a stable 3D pose (position,
 * orientation, scale) for the watch, expressed in Three.js world space.
 *
 * Design:
 *  - POSITION & SCALE are solved on a screen-aligned plane (z = 0) by
 *    unprojecting landmark image coordinates through the live camera. This keeps
 *    the watch glued to the wrist pixel-for-pixel and makes scale a real
 *    world-space wrist width — no manual depth calibration needed.
 *  - ORIENTATION is solved from the relative 3D geometry of three landmarks
 *    (wrist, index-MCP, pinky-MCP, middle-MCP) using cross products to build an
 *    orthonormal basis, then converted to a quaternion. Quaternions avoid gimbal
 *    flips; a "dial faces the camera" constraint removes the left/right-hand and
 *    palm-up/down ambiguity so the watch never turns inside-out.
 */

export interface WristPose {
  position: Vector3;
  quaternion: Quaternion;
  /** World-space wrist width — drives dynamic scaling. */
  scale: number;
  valid: boolean;
}

export function createWristPose(): WristPose {
  return {
    position: new Vector3(),
    quaternion: new Quaternion(),
    scale: 1,
    valid: false,
  };
}

export interface AnchorOptions {
  /** True when the video is mirrored (front/selfie camera). */
  mirrored: boolean;
  /** How far down the forearm to seat the watch, in wrist-widths. */
  forearmOffset: number;
  /** Flip the dial to the other side of the wrist (corrects the sign if needed). */
  flipDial: boolean;
}

export class WristAnchor {
  // Scratch objects — reused every frame to avoid per-frame allocations.
  private readonly w3 = new Vector3();
  private readonly m3 = new Vector3();
  private readonly toHand = new Vector3();
  private readonly xAxis = new Vector3();
  private readonly yAxis = new Vector3();
  private readonly zAxis = new Vector3();
  private readonly basis = new Matrix4();

  private readonly wristPlane = new Vector3();
  private readonly indexPlane = new Vector3();
  private readonly pinkyPlane = new Vector3();
  private readonly middlePlane = new Vector3();
  private readonly forearmDir = new Vector3();

  private readonly ray = new Vector3();
  private readonly camPos = new Vector3();

  /**
   * Convert a normalized image coordinate to a world point on the z = 0 plane
   * by unprojecting through the active camera.
   */
  private screenToPlane(nx: number, ny: number, camera: Camera, mirrored: boolean, out: Vector3) {
    const ndcX = (mirrored ? 1 - nx : nx) * 2 - 1;
    const ndcY = 1 - ny * 2; // image y is top-down; NDC y is bottom-up
    this.ray.set(ndcX, ndcY, 0.5).unproject(camera);
    camera.getWorldPosition(this.camPos);
    this.ray.sub(this.camPos); // ray direction from camera
    // Intersect the plane z = 0:  camPos + t * dir, solve dir.z * t = -camPos.z
    const denom = Math.abs(this.ray.z) < 1e-6 ? 1e-6 : this.ray.z;
    const t = -this.camPos.z / denom;
    out.copy(this.ray).multiplyScalar(t).add(this.camPos);
    out.z = 0;
  }

  /** Convert a landmark to a sign-corrected 3D vector for orientation math. */
  private to3D(lm: { x: number; y: number; z: number }, mirrored: boolean, out: Vector3) {
    out.set(mirrored ? -lm.x : lm.x, -lm.y, -lm.z);
  }

  /**
   * Solve the wrist pose. Returns false (and leaves out.valid = false) when the
   * frame is unusable.
   */
  compute(frame: HandFrame, camera: Camera, options: AnchorOptions, out: WristPose): boolean {
    out.valid = false;
    if (!frame.present || frame.landmarks.length < 21) return false;

    const wrist = frame.landmarks[LM.WRIST];
    const index = frame.landmarks[LM.INDEX_MCP];
    const pinky = frame.landmarks[LM.PINKY_MCP];
    const middle = frame.landmarks[LM.MIDDLE_MCP];
    if (!wrist || !index || !pinky || !middle) return false;

    const { mirrored, forearmOffset, flipDial } = options;

    // ---- Orientation (relative 3D geometry) ------------------------------
    this.to3D(wrist, mirrored, this.w3);
    this.to3D(middle, mirrored, this.m3);

    this.toHand.copy(this.m3).sub(this.w3); // wrist -> knuckles : along the forearm
    if (this.toHand.lengthSq() < 1e-8) return false;
    this.zAxis.copy(this.toHand).normalize(); // 12–6 axis runs along the forearm

    // Dial-up faces the CAMERA, kept perpendicular to the forearm. The watch
    // therefore always presents its face toward the viewer while still tilting
    // and moving with the arm (12–6 stays glued along the forearm). This is the
    // readable "product try-on" behaviour, and — unlike a binary dorsal flip —
    // it is fully continuous, so there is no snapping/swivel. The camera looks
    // down -Z, so the direction "toward camera" ≈ world +Z = (0, 0, 1):
    //   yAxis = camDir - zAxis (camDir · zAxis),  camDir = (0,0,1)
    const zz = this.zAxis.z;
    this.yAxis.set(-this.zAxis.x * zz, -this.zAxis.y * zz, 1 - zz * zz);
    if (this.yAxis.lengthSq() < 1e-6) {
      // Forearm points (almost) straight at/away from camera — fall back to up.
      const zy = this.zAxis.y;
      this.yAxis.set(-this.zAxis.x * zy, 1 - zy * zy, -this.zAxis.z * zy);
    }
    this.yAxis.normalize();
    if (flipDial) this.yAxis.negate(); // show the caseback / underside instead

    // Across-wrist axis completes a right-handed basis: x = y × z.
    this.xAxis.copy(this.yAxis).cross(this.zAxis).normalize();
    this.basis.makeBasis(this.xAxis, this.yAxis, this.zAxis);
    out.quaternion.setFromRotationMatrix(this.basis);

    // ---- Position & scale (screen plane) ---------------------------------
    this.screenToPlane(wrist.x, wrist.y, camera, mirrored, this.wristPlane);
    this.screenToPlane(index.x, index.y, camera, mirrored, this.indexPlane);
    this.screenToPlane(pinky.x, pinky.y, camera, mirrored, this.pinkyPlane);
    this.screenToPlane(middle.x, middle.y, camera, mirrored, this.middlePlane);

    const wristWidth = this.indexPlane.distanceTo(this.pinkyPlane);
    if (!Number.isFinite(wristWidth) || wristWidth < 1e-5) return false;

    // Seat the watch a little down the forearm (away from the knuckles).
    this.forearmDir.copy(this.wristPlane).sub(this.middlePlane);
    this.forearmDir.z = 0;
    if (this.forearmDir.lengthSq() > 1e-8) this.forearmDir.normalize();
    else this.forearmDir.set(0, 0, 0);

    out.position
      .copy(this.wristPlane)
      .addScaledVector(this.forearmDir, wristWidth * forearmOffset);
    out.position.z = 0;

    out.scale = wristWidth;
    out.valid = true;
    return true;
  }
}
