import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface AvatarModelConfig {
  candidatePaths: string[];
  targetHeight: number;
  position: [number, number, number];
  baseRotationY: number;
  maxPointerYaw: number;
  maxPointerPitch: number;
}

/**
 * Default configuration:
 * - Avatar & workstation local forward axis is `-Z` (matching `vaskrona.gltf` natively).
 * - `baseRotationY: 0.68` (~39 deg) rotates `-Z` to `(-X, -Z)`, so the avatar faces
 *   BACK-LEFT ("ngadap ke belakang kiri") toward the big screen and surrounding small screens.
 */
export const DEFAULT_AVATAR_CONFIG: AvatarModelConfig = {
  candidatePaths: [
    '/models/vaskrona.gltf',
    '/models/vaskrona.glb',
    '/vaskrona.gltf',
    '/vaskrona.glb',
  ],
  targetHeight: 1.72,
  position: [0.12, 0, 0.18],
  baseRotationY: 0.68,
  maxPointerYaw: 0.42,
  maxPointerPitch: 0.22,
};

export type AvatarLoadStatus =
  | { state: 'loading'; message: string }
  | { state: 'loaded'; sourcePath: string; hasWaveClip: boolean; clipNames: string[] }
  | { state: 'standin'; reason: string }
  | { state: 'error'; reason: string };

export interface AvatarRigParts {
  head: THREE.Object3D | null;
  torso: THREE.Object3D | null;
  leftArm: THREE.Object3D | null;
  rightArm: THREE.Object3D | null;
  leftForearm: THREE.Object3D | null;
  rightForearm: THREE.Object3D | null;
}

export interface AvatarStationHandle {
  rootGroup: THREE.Group;
  avatarHitbox: THREE.Object3D;
  update: (delta: number, elapsed: number, reducedMotion: boolean) => void;
  setPointerTarget: (ndcX: number, ndcY: number, isInside: boolean) => void;
  triggerClickReaction: () => { playedWaveClip: boolean };
  loadCustomModelUrl: (url: string, label?: string) => Promise<void>;
  retryDefaultPaths: () => Promise<void>;
  dispose: () => void;
}

/**
 * Probes whether a static model path exists on the server.
 */
async function findAvailableModelPath(paths: string[]): Promise<string | null> {
  for (const path of paths) {
    try {
      const response = await fetch(path, { method: 'HEAD', cache: 'no-cache' });
      if (!response.ok) continue;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) continue;
      return path;
    } catch {
      // Continue checking next candidate path
    }
  }
  return null;
}

/**
 * Builds Vaskrona's complete Head & Head-Mounted Accessories in Roblox R6 stud coordinates
 * (center of head at `[0, 4.5, 0]`, facing `-Z`):
 * 1. Half-Glitched Faceless Head (Monochrome white with black/white bandages)
 * 2. Hiachi Grin Mask (White horned Oni mask with hollow black eyes & grin on front-left)
 * 3. Black&White Messy Bandaged Hair (Spiky black hair locks + white bandage strips)
 * 4. Black White Halo Aura (Spiked gothic monochrome halo behind the head)
 * 5. All-Seeking Antlers (Tall curved dark-crimson/black branching antlers with glowing eyes)
 * 6. A Bandit's Bandana (Dark neck bandana)
 */
function createVaskronaHeadAndAccessories(): THREE.Group {
  const headGroup = new THREE.Group();
  headGroup.name = 'Head';
  headGroup.position.set(0, 4.5, 0);

  const whiteSkinMat = new THREE.MeshStandardMaterial({
    color: 0xf2f2f2,
    roughness: 0.45,
    metalness: 0.05,
  });
  const darkBandageMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.7,
    metalness: 0.05,
  });
  const whiteBandageMat = new THREE.MeshStandardMaterial({
    color: 0xe5e5e5,
    roughness: 0.6,
    metalness: 0.05,
  });
  const blackHairMat = new THREE.MeshStandardMaterial({
    color: 0x0d0d0d,
    roughness: 0.65,
    metalness: 0.1,
  });
  const maskWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xededed,
    roughness: 0.35,
    metalness: 0.15,
  });
  const pitchBlackMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
  const antlerMat = new THREE.MeshStandardMaterial({
    color: 0x1c080a,
    roughness: 0.4,
    metalness: 0.25,
  });
  const eyeRedMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // 1. Base Roblox R6 Beveled Cylindrical Head (Half-Glitched Monochrome White + Bandages)
  const headCyl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.58, 0.96, 24),
    whiteSkinMat
  );
  headCyl.castShadow = true;
  headGroup.add(headCyl);

  const topBevel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.58, 0.12, 24),
    whiteSkinMat
  );
  topBevel.position.y = 0.52;
  headGroup.add(topBevel);

  // Bandage wraps around head
  const bandage1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.605, 0.605, 0.14, 20),
    whiteBandageMat
  );
  bandage1.position.y = -0.12;
  bandage1.rotation.z = 0.12;
  const bandage2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.61, 0.61, 0.1, 20),
    darkBandageMat
  );
  bandage2.position.y = -0.28;
  bandage2.rotation.z = -0.08;
  headGroup.add(bandage1, bandage2);

  // 2. Hiachi Grin Mask (Positioned on front-left `-Z, -X` of the face)
  const maskGroup = new THREE.Group();
  maskGroup.position.set(-0.22, 0.04, -0.52);
  maskGroup.rotation.y = 0.32;
  maskGroup.rotation.z = -0.08;

  // Mask sculpted face plate
  const maskPlate = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 18, 16, 0, Math.PI, 0, Math.PI),
    maskWhiteMat
  );
  maskPlate.scale.set(0.95, 1.15, 0.45);
  maskPlate.rotation.x = Math.PI;
  maskGroup.add(maskPlate);

  // Mask Dark Forehead Cap & Two Oni Horns
  const maskForehead = new THREE.Mesh(
    new THREE.SphereGeometry(0.44, 16, 12, 0, Math.PI, 0, Math.PI * 0.55),
    blackHairMat
  );
  maskForehead.scale.set(0.96, 0.65, 0.48);
  maskForehead.position.set(0, 0.16, -0.02);
  maskForehead.rotation.x = -Math.PI * 0.5;
  maskGroup.add(maskForehead);

  const hornGeo = new THREE.ConeGeometry(0.065, 0.32, 10);
  const leftMaskHorn = new THREE.Mesh(hornGeo, blackHairMat);
  leftMaskHorn.position.set(-0.18, 0.42, -0.12);
  leftMaskHorn.rotation.z = 0.22;
  leftMaskHorn.rotation.x = -0.25;
  const rightMaskHorn = new THREE.Mesh(hornGeo, blackHairMat);
  rightMaskHorn.position.set(0.18, 0.42, -0.12);
  rightMaskHorn.rotation.z = -0.22;
  rightMaskHorn.rotation.x = -0.25;
  maskGroup.add(leftMaskHorn, rightMaskHorn);

  // Mask Hollow Black Eye Sockets & Creepy Grin
  const eyeSocketGeo = new THREE.SphereGeometry(0.11, 12, 10);
  const leftSocket = new THREE.Mesh(eyeSocketGeo, pitchBlackMat);
  leftSocket.scale.set(1.1, 0.85, 0.5);
  leftSocket.position.set(-0.15, 0.04, -0.18);
  const rightSocket = new THREE.Mesh(eyeSocketGeo, pitchBlackMat);
  rightSocket.scale.set(1.1, 0.85, 0.5);
  rightSocket.position.set(0.15, 0.04, -0.18);
  maskGroup.add(leftSocket, rightSocket);

  // Grin Mouth Arc
  const grinArc = new THREE.Mesh(
    new THREE.TorusGeometry(0.19, 0.035, 8, 16, Math.PI * 0.85),
    pitchBlackMat
  );
  grinArc.position.set(0, -0.14, -0.18);
  grinArc.rotation.z = Math.PI * 1.08;
  maskGroup.add(grinArc);

  headGroup.add(maskGroup);

  // 3. Black & White Messy Bandaged Hair
  const hairGroup = new THREE.Group();
  hairGroup.position.set(0, 0.28, 0.04);

  const hairCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.68, 16, 14),
    blackHairMat
  );
  hairCrown.scale.set(1.08, 0.82, 1.12);
  hairGroup.add(hairCrown);

  // Spiky messy hair tufts around the crown, sides, and back
  const spikeConfigs: Array<{ pos: [number, number, number]; rot: [number, number, number]; s: [number, number, number]; white?: boolean }> = [
    { pos: [0.48, -0.05, -0.25], rot: [0.2, 0, -0.65], s: [0.18, 0.55, 0.18] },
    { pos: [0.56, -0.18, 0.05], rot: [0, 0, -0.82], s: [0.2, 0.62, 0.22] },
    { pos: [0.35, 0.12, -0.45], rot: [0.55, 0, -0.35], s: [0.16, 0.48, 0.16], white: true },
    { pos: [-0.52, -0.12, 0.08], rot: [0, 0, 0.78], s: [0.2, 0.58, 0.2] },
    { pos: [-0.42, 0.15, 0.35], rot: [-0.45, 0, 0.55], s: [0.18, 0.52, 0.18], white: true },
    { pos: [0, -0.12, 0.58], rot: [-0.65, 0, 0], s: [0.32, 0.65, 0.2] },
    { pos: [-0.28, -0.15, 0.52], rot: [-0.55, 0, 0.3], s: [0.22, 0.6, 0.18] },
    { pos: [0.28, -0.15, 0.52], rot: [-0.55, 0, -0.3], s: [0.22, 0.6, 0.18] },
    { pos: [0.15, 0.38, -0.15], rot: [0.25, 0, -0.4], s: [0.16, 0.45, 0.16], white: true },
  ];

  const spikeConeGeo = new THREE.ConeGeometry(1, 1, 7);
  spikeConfigs.forEach((sc) => {
    const spike = new THREE.Mesh(
      spikeConeGeo,
      sc.white ? whiteBandageMat : blackHairMat
    );
    spike.position.set(sc.pos[0], sc.pos[1], sc.pos[2]);
    spike.rotation.set(sc.rot[0], sc.rot[1], sc.rot[2]);
    spike.scale.set(sc.s[0], sc.s[1], sc.s[2]);
    hairGroup.add(spike);
  });

  headGroup.add(hairGroup);

  // 4. Black White Halo Aura (Spiked Gothic Halo Ring behind the head at `+Z`)
  const haloGroup = new THREE.Group();
  haloGroup.position.set(0, 0.48, 0.48);

  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.88, 0.032, 10, 36),
    blackHairMat
  );
  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.02, 8, 32),
    whiteBandageMat
  );
  haloGroup.add(outerRing, innerRing);

  // Gothic radial spikes on the halo
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const isMajor = i % 3 === 0;
    const len = isMajor ? 0.42 : 0.22;
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(isMajor ? 0.04 : 0.025, len, 6),
      i % 2 === 0 ? blackHairMat : whiteBandageMat
    );
    const r = 0.88 + len * 0.45;
    spike.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0);
    spike.rotation.z = angle - Math.PI / 2;
    haloGroup.add(spike);
  }
  headGroup.add(haloGroup);

  // 5. All-Seeking Antlers (Large Curved Branching Antlers with Embedded Eyes)
  function buildAntlerSide(sign: number): THREE.Group {
    const sideGroup = new THREE.Group();
    // Main curved antler beam built from segments curving outward then inward at the top
    const segPoints: Array<[number, number, number, number]> = [
      [sign * 0.42, 0.55, -0.05, 0.11],
      [sign * 0.82, 0.92, -0.08, 0.1],
      [sign * 1.12, 1.38, -0.06, 0.095],
      [sign * 1.18, 1.88, -0.04, 0.09],
      [sign * 0.96, 2.35, -0.02, 0.085],
      [sign * 0.58, 2.68, 0.0, 0.12], // Clawed tip
    ];

    for (let i = 0; i < segPoints.length - 1; i++) {
      const p1 = new THREE.Vector3(segPoints[i][0], segPoints[i][1], segPoints[i][2]);
      const p2 = new THREE.Vector3(segPoints[i + 1][0], segPoints[i + 1][1], segPoints[i + 1][2]);
      const dist = p1.distanceTo(p2);
      const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(segPoints[i + 1][3], segPoints[i][3], dist, 10),
        antlerMat
      );
      cyl.position.copy(p1).add(p2).multiplyScalar(0.5);
      cyl.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        p2.clone().sub(p1).normalize()
      );
      sideGroup.add(cyl);

      // Add eerie white/red eye node on each segment front (`-Z`)
      const eyeBall = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), eyeWhiteMat);
      eyeBall.position.copy(cyl.position);
      eyeBall.position.z -= 0.085;
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), eyeRedMat);
      pupil.position.copy(eyeBall.position);
      pupil.position.z -= 0.035;
      sideGroup.add(eyeBall, pupil);
    }

    // Outer sharp tines branching off the antler
    const tine1 = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.55, 8), antlerMat);
    tine1.position.set(sign * 1.38, 1.55, -0.06);
    tine1.rotation.z = -sign * 0.65;

    const tine2 = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.45, 8), antlerMat);
    tine2.position.set(sign * 1.28, 2.08, -0.04);
    tine2.rotation.z = -sign * 0.45;

    // Inner small jagged brow tine
    const innerTine = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.48, 8), antlerMat);
    innerTine.position.set(sign * 0.38, 0.95, -0.12);
    innerTine.rotation.z = sign * 0.25;

    sideGroup.add(tine1, tine2, innerTine);
    return sideGroup;
  }

  headGroup.add(buildAntlerSide(1), buildAntlerSide(-1));

  return headGroup;
}

/**
 * Builds Vaskrona's Torso/Body-Mounted Accessories in Roblox R6 stud coordinates
 * (attached to `Rig`, where `Torso` is at `[0, 3, 0]`):
 * 1. Wings of Corrupted Jerry (Dark feathered wings on back `+Z`)
 * 2. Reeling Petal Garland & Bandana (Blue/Green/Yellow dripping collar around neck `[0, 4, 0]`)
 * 3. Boo & Bub (White ghost on right shoulder `[+1.4, 4.2, 0]` & dark imp on left shoulder `[-1.4, 4.2, 0]`)
 * 4. Fuwatty Side Satchel (Purple monster bag & strap on front-left waist `[-0.55, 2.0, -0.58]`)
 * 5. Substance Survival Belt (Green/Pink/Orange potion vials on front-right waist `[+0.55, 2.0, -0.55]`)
 */
function createVaskronaBodyAccessories(): THREE.Group {
  const accGroup = new THREE.Group();
  accGroup.name = 'VaskronaBodyAccessories';

  const wingBlackMat = new THREE.MeshStandardMaterial({
    color: 0x080808,
    roughness: 0.55,
    metalness: 0.15,
  });

  // 1. Wings of Corrupted Jerry (Upper & Lower Feathered Wings on Back `+Z`)
  function buildWingSide(sign: number): THREE.Group {
    const wingSide = new THREE.Group();
    wingSide.position.set(sign * 0.35, 3.15, 0.56);

    // Upper & lower feather fans
    const featherAngles = [0.25, 0.08, -0.1, -0.28, -0.52, -0.72, -0.92];
    featherAngles.forEach((ang, idx) => {
      const len = idx < 4 ? 1.85 - idx * 0.14 : 1.55 - (idx - 4) * 0.18;
      const feather = new THREE.Mesh(
        new THREE.BoxGeometry(len, 0.22, 0.06),
        wingBlackMat
      );
      feather.position.set(
        sign * (Math.cos(ang) * len * 0.5 + 0.2),
        Math.sin(ang) * len * 0.5 + (idx >= 4 ? -0.45 : 0.15),
        idx * 0.015
      );
      feather.rotation.z = sign * ang;
      wingSide.add(feather);
    });

    return wingSide;
  }
  accGroup.add(buildWingSide(1), buildWingSide(-1));

  // 2. Reeling Petal Garland & Dripping Collar (`[0, 3.9, -0.45]`)
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4 });
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.4 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
  const dripBlackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.35 });

  // Blue Right Shoulder Petal + Black Drip
  const bluePetal = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.28, 0.45), blueMat);
  bluePetal.position.set(0.85, 3.92, -0.38);
  bluePetal.rotation.z = -0.25;
  const blueDrip = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.06, 0.42, 8), dripBlackMat);
  blueDrip.position.set(1.02, 3.62, -0.52);

  // Green Center Petal + Black Drip
  const greenPetal = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.28, 0.35), greenMat);
  greenPetal.position.set(-0.08, 3.72, -0.48);
  greenPetal.rotation.z = 0.12;
  const greenDrip = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.06, 0.45, 8), dripBlackMat);
  greenDrip.position.set(-0.22, 3.38, -0.58);

  // Yellow Left Shoulder Petal + Black Drip
  const yellowPetal = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.28, 0.45), yellowMat);
  yellowPetal.position.set(-0.82, 3.92, -0.38);
  yellowPetal.rotation.z = 0.25;
  const yellowDrip = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.06, 0.42, 8), dripBlackMat);
  yellowDrip.position.set(-0.92, 3.58, -0.52);

  accGroup.add(bluePetal, blueDrip, greenPetal, greenDrip, yellowPetal, yellowDrip);

  // 3. Boo & Bub Shoulder Companions
  // Boo (White Ghost on Right Shoulder `+X`)
  const booMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.4 });
  const booGroup = new THREE.Group();
  booGroup.position.set(1.38, 4.35, -0.05);
  const booBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.35, 8, 12), booMat);
  booBody.rotation.z = -0.2;
  booGroup.add(booBody);
  accGroup.add(booGroup);

  // Bub (Dark Imp on Left Shoulder `-X`)
  const bubGroup = new THREE.Group();
  bubGroup.position.set(-1.32, 4.28, -0.05);
  const bubBody = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.48, 0.32), dripBlackMat);
  const bubHead = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), dripBlackMat);
  bubHead.position.y = 0.36;
  bubGroup.add(bubBody, bubHead);
  accGroup.add(bubGroup);

  // 4. Fuwatty Side Satchel (Purple Monster Bag & Strap on Front-Left Waist)
  const satchelMat = new THREE.MeshStandardMaterial({ color: 0x5b46b3, roughness: 0.5 });
  const strapMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.95, 0.12), satchelMat);
  strapMesh.position.set(-0.32, 2.95, -0.52);
  strapMesh.rotation.z = -0.22;

  const bagGroup = new THREE.Group();
  bagGroup.position.set(-0.52, 1.85, -0.58);
  bagGroup.rotation.z = 0.06;
  const bagBox = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.86, 0.36), satchelMat);
  bagGroup.add(bagBox);

  // Fuwatty eyes & teeth on bag front (`-Z`)
  const bagEyeGeo = new THREE.SphereGeometry(0.055, 8, 8);
  const bagEyeL = new THREE.Mesh(bagEyeGeo, dripBlackMat);
  bagEyeL.position.set(-0.14, 0.14, -0.19);
  const bagEyeR = new THREE.Mesh(bagEyeGeo, dripBlackMat);
  bagEyeR.position.set(0.14, 0.14, -0.19);
  const bagMouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.2, 0.04),
    new THREE.MeshBasicMaterial({ color: 0xd4d4d4 })
  );
  bagMouth.position.set(0, -0.12, -0.19);
  bagGroup.add(bagEyeL, bagEyeR, bagMouth);
  accGroup.add(strapMesh, bagGroup);

  // 5. Substance Survival Belt (Potion Vials on Front-Right Waist)
  const vialGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.62, 10);
  const greenVial = new THREE.Mesh(vialGeo, greenMat);
  greenVial.position.set(0.78, 2.02, -0.56);
  greenVial.rotation.z = 0.24;

  const pinkVial = new THREE.Mesh(
    vialGeo,
    new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.35 })
  );
  pinkVial.position.set(0.55, 1.98, -0.58);
  pinkVial.rotation.z = 0.12;

  const orangeVial = new THREE.Mesh(
    vialGeo,
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35 })
  );
  orangeVial.position.set(0.38, 1.95, -0.58);
  orangeVial.rotation.z = 0.06;

  accGroup.add(greenVial, pinkVial, orangeVial);

  return accGroup;
}

/**
 * Prepares a loaded Roblox GLTF scene:
 * 1. Hides Roblox Studio debug attachment spheres (`*_Att`, `*_attachments`) and empty untextured decals.
 * 2. Recovers white monochrome skin tone on un-textured limb faces if vertex colors darkened them.
 * 3. Attaches Vaskrona's complete Head & Signature Accessories if the `.gltf` export omitted `SpecialMesh` nodes.
 * 4. Wraps R6 `Left Arm` and `Right Arm` in unscaled shoulder pivot groups.
 */
function prepareRobloxGltfScene(model: THREE.Object3D): {
  parts: AvatarRigParts;
  bodyBox: THREE.Box3;
} {
  const parts: AvatarRigParts = {
    head: null,
    torso: null,
    leftArm: null,
    rightArm: null,
    leftForearm: null,
    rightForearm: null,
  };

  let rigNode: THREE.Object3D | null = null;
  let hasHeadAttachments = false;
  let rawLeftArm: THREE.Object3D | null = null;
  let rawRightArm: THREE.Object3D | null = null;

  model.traverse((child) => {
    const name = child.name;
    const lower = name.toLowerCase();

    if (name === 'Rig') {
      rigNode = child;
    }

    // Hide Roblox Studio exported debug attachment balls (`*_Att`)
    if (name.endsWith('_Att') || lower.includes('_attachments')) {
      child.visible = false;
      if (name.includes('Head_attachments') || name === 'FaceCenter_Att') {
        hasHeadAttachments = true;
      }
      return;
    }

    // Hide empty Roblox decal plane (`mesh: "roblox"`, `material.alphaMode: "BLEND"` without texture)
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (
        (lower === 'roblox' || child.userData?.RobloxInstanceType === 'Decal') &&
        !mat?.map
      ) {
        child.visible = false;
        return;
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }

    if (!parts.head && (lower === 'head' || lower === 'neck')) {
      parts.head = child;
    } else if (!parts.torso && (lower === 'uppertorso' || lower === 'torso')) {
      parts.torso = child;
    } else if (
      !rawLeftArm &&
      (lower === 'leftupperarm' || lower === 'left arm' || lower === 'left_arm' || lower === 'leftarm')
    ) {
      rawLeftArm = child;
    } else if (
      !rawRightArm &&
      (lower === 'rightupperarm' || lower === 'right arm' || lower === 'right_arm' || lower === 'rightarm')
    ) {
      rawRightArm = child;
    } else if (!parts.leftForearm && (lower.includes('leftlowerarm') || lower.includes('lefthand'))) {
      parts.leftForearm = child;
    } else if (!parts.rightForearm && (lower.includes('rightlowerarm') || lower.includes('righthand'))) {
      parts.rightForearm = child;
    }
  });

  // Reset root `Rig` translation offset if Roblox exported it far from origin
  if (rigNode) {
    (rigNode as THREE.Object3D).position.set(0, 0, 0);
  }

  // Compute the base R6 body bounding box BEFORE adding tall antlers/wings so body scale stays 1:1
  const bodyBox = computeVisibleMeshBoundingBox(model);
  // Include standard head top (`y = 5.1`) in bodyBox so scaling is anchored to standard character height
  bodyBox.expandByPoint(new THREE.Vector3(0, 5.1, 0));

  // If the Roblox R6 export has `Head_attachments` but no `Head` & `Accessory` meshes, mount them now!
  if (!parts.head && hasHeadAttachments) {
    const targetParent = rigNode || model;
    const vaskronaHead = createVaskronaHeadAndAccessories();
    const vaskronaBodyAcc = createVaskronaBodyAccessories();
    targetParent.add(vaskronaHead, vaskronaBodyAcc);
    parts.head = vaskronaHead;
  }

  // Wrap Left Arm and Right Arm in unscaled shoulder pivot groups at the shoulder joint
  if (rawLeftArm) {
    const armObj = rawLeftArm as THREE.Object3D;
    const parent = armObj.parent;
    if (parent) {
      const shoulderPivot = new THREE.Group();
      shoulderPivot.name = 'LeftShoulderPivot';
      shoulderPivot.position.set(armObj.position.x, armObj.position.y + 0.85, armObj.position.z);
      parent.add(shoulderPivot);
      armObj.position.set(0, -0.85, 0);
      shoulderPivot.add(armObj);
      parts.leftArm = shoulderPivot;
    } else {
      parts.leftArm = armObj;
    }
  }

  if (rawRightArm) {
    const armObj = rawRightArm as THREE.Object3D;
    const parent = armObj.parent;
    if (parent) {
      const shoulderPivot = new THREE.Group();
      shoulderPivot.name = 'RightShoulderPivot';
      shoulderPivot.position.set(armObj.position.x, armObj.position.y + 0.85, armObj.position.z);
      parent.add(shoulderPivot);
      armObj.position.set(0, -0.85, 0);
      shoulderPivot.add(armObj);
      parts.rightArm = shoulderPivot;
    } else {
      parts.rightArm = armObj;
    }
  }

  return { parts, bodyBox };
}

/**
 * Computes the world bounding box strictly from visible Mesh nodes.
 */
function computeVisibleMeshBoundingBox(root: THREE.Object3D): THREE.Box3 {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  let hasMesh = false;

  root.traverse((node) => {
    if (!node.visible) return;
    let curr: THREE.Object3D | null = node.parent;
    while (curr) {
      if (!curr.visible) return;
      curr = curr.parent;
    }

    if ((node as THREE.Mesh).isMesh) {
      const mesh = node as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.computeBoundingBox();
        if (mesh.geometry.boundingBox) {
          const meshBox = mesh.geometry.boundingBox.clone();
          meshBox.applyMatrix4(mesh.matrixWorld);
          box.union(meshBox);
          hasMesh = true;
        }
      }
    }
  });

  if (!hasMesh) {
    box.setFromObject(root);
  }
  return box;
}

/**
 * Builds the procedural Roblox stand-in avatar.
 */
function buildProceduralRobloxAvatar(): { group: THREE.Group; parts: AvatarRigParts } {
  const group = new THREE.Group();
  group.name = 'VaskronaProceduralRobloxRig';

  const darkSuitMat = new THREE.MeshStandardMaterial({
    color: 0x161616,
    roughness: 0.45,
    metalness: 0.3,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 0.5,
    metalness: 0.1,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x121212,
    roughness: 0.6,
    metalness: 0.2,
  });

  const legGeo = new THREE.BoxGeometry(0.24, 0.58, 0.25);
  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.set(-0.14, 0.29, 0);
  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.set(0.14, 0.29, 0);
  group.add(leftLeg, rightLeg);

  const torso = new THREE.Group();
  torso.position.set(0, 0.88, 0);
  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.6, 0.28), darkSuitMat);
  torso.add(torsoMesh);

  const head = new THREE.Group();
  head.position.set(0, 0.5, 0);
  const headMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.36, 20), skinMat);
  head.add(headMesh);
  torso.add(head);

  const upperArmGeo = new THREE.BoxGeometry(0.22, 0.56, 0.22);
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.38, 0.22, 0);
  const leftArmMesh = new THREE.Mesh(upperArmGeo, darkSuitMat);
  leftArmMesh.position.set(0, -0.22, 0);
  leftArm.add(leftArmMesh);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.38, 0.22, 0);
  const rightArmMesh = new THREE.Mesh(upperArmGeo, darkSuitMat);
  rightArmMesh.position.set(0, -0.22, 0);
  rightArm.add(rightArmMesh);

  torso.add(leftArm, rightArm);
  group.add(torso);

  return {
    group,
    parts: {
      head,
      torso,
      leftArm,
      rightArm,
      leftForearm: null,
      rightForearm: null,
    },
  };
}

/**
 * Creates the Multi-Monitor Portfolio Workstation arranged in front of the avatar (`-Z` local direction).
 */
function createPortfolioWorkstation() {
  const stationGroup = new THREE.Group();
  stationGroup.name = 'VaskronaWorkstation';

  // 1. Cyber Desk & Glowing Mechanical Keyboard in front of Avatar (`z = -0.14`)
  const deskGroup = new THREE.Group();
  deskGroup.position.set(0, 0.68, -0.14);

  const deskMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.3,
    metalness: 0.7,
  });
  const borderMat = new THREE.MeshBasicMaterial({
    color: 0xa3a3a3,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });

  const deskSlab = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.05, 0.44), deskMat);
  const deskWire = new THREE.Mesh(new THREE.BoxGeometry(1.33, 0.055, 0.45), borderMat);
  deskGroup.add(deskSlab, deskWire);

  const deskLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, 0.68, 8), deskMat);
  deskLeg.position.set(0, -0.34, 0);
  deskGroup.add(deskLeg);

  const kbCanvas = document.createElement('canvas');
  kbCanvas.width = 256;
  kbCanvas.height = 96;
  const kbCtx = kbCanvas.getContext('2d');
  const kbTexture = new THREE.CanvasTexture(kbCanvas);

  const kbMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.68, 0.24),
    new THREE.MeshBasicMaterial({ map: kbTexture })
  );
  kbMesh.rotation.x = -Math.PI / 2 + 0.14;
  kbMesh.position.set(0, 0.032, 0.02);
  deskGroup.add(kbMesh);

  stationGroup.add(deskGroup);

  // 2. LARGE MAIN PORTFOLIO SCREEN ("Layar Besar") in front of the avatar (`z = -0.88`)
  const mainScreenCanvas = document.createElement('canvas');
  mainScreenCanvas.width = 640;
  mainScreenCanvas.height = 360;
  const mainScreenCtx = mainScreenCanvas.getContext('2d');
  const mainScreenTex = new THREE.CanvasTexture(mainScreenCanvas);

  const mainScreenGroup = new THREE.Group();
  mainScreenGroup.position.set(0, 1.54, -0.88);

  const mainFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2.44, 1.38, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.4, metalness: 0.8 })
  );
  const mainBorder = new THREE.Mesh(
    new THREE.BoxGeometry(2.46, 1.4, 0.045),
    new THREE.MeshBasicMaterial({ color: 0xe5e5e5, wireframe: true, transparent: true, opacity: 0.38 })
  );
  const mainDisplay = new THREE.Mesh(
    new THREE.PlaneGeometry(2.34, 1.28),
    new THREE.MeshBasicMaterial({ map: mainScreenTex, side: THREE.DoubleSide })
  );
  mainDisplay.position.z = 0.024;
  mainScreenGroup.add(mainFrame, mainBorder, mainDisplay);
  stationGroup.add(mainScreenGroup);

  // 3. FOUR SURROUNDING SMALLER SCREENS ("Dikelilingi Beberapa Layar Kecil")
  interface SmallMonitor {
    group: THREE.Group;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D | null;
    texture: THREE.CanvasTexture;
    baseY: number;
    phase: number;
  }

  const smallMonitors: SmallMonitor[] = [];
  const smallConfigs = [
    { pos: [-1.52, 1.82, -0.42] as [number, number, number], rotY: 0.45, rotX: 0.06, phase: 0 },
    { pos: [-1.46, 1.04, -0.18] as [number, number, number], rotY: 0.48, rotX: -0.04, phase: 1.6 },
    { pos: [1.52, 1.82, -0.42] as [number, number, number], rotY: -0.45, rotX: 0.06, phase: 3.1 },
    { pos: [1.46, 1.04, -0.18] as [number, number, number], rotY: -0.48, rotX: -0.04, phase: 4.7 },
  ];

  smallConfigs.forEach((cfg) => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);

    const monGroup = new THREE.Group();
    monGroup.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    monGroup.rotation.y = cfg.rotY;
    monGroup.rotation.x = cfg.rotX;

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.94, 0.6, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.4, metalness: 0.7 })
    );
    const wire = new THREE.Mesh(
      new THREE.BoxGeometry(0.96, 0.62, 0.034),
      new THREE.MeshBasicMaterial({ color: 0xa3a3a3, wireframe: true, transparent: true, opacity: 0.4 })
    );
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.88, 0.54),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
    );
    screen.position.z = 0.018;

    monGroup.add(frame, wire, screen);
    stationGroup.add(monGroup);

    smallMonitors.push({
      group: monGroup,
      canvas,
      ctx,
      texture,
      baseY: cfg.pos[1],
      phase: cfg.phase,
    });
  });

  // 4. Holographic Floor Ring Platform under the Avatar (`z = +0.34`)
  const ringGeo = new THREE.RingGeometry(0.68, 0.73, 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xe5e5e5,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.4,
  });
  const floorRing = new THREE.Mesh(ringGeo, ringMat);
  floorRing.rotation.x = -Math.PI / 2;
  floorRing.position.set(0, 0.01, 0.34);
  stationGroup.add(floorRing);

  const codeSnippets = [
    'import Layout from "../layouts/Layout.astro";',
    'import { createAvatarStation } from "./AvatarModel";',
    'const portfolio = { owner: "Hilmi Zaki R", v: "2.0" };',
    'await vaskrona.load("/models/vaskrona.gltf");',
    'station.deploy({ target: "NIGHT_CITY_CORE" });',
    'export default defineConfig({ mode: "secret" });',
    '// Updating Hero, Projects & Secret Sector...',
    'status: "ONLINE // VASKRONA.GLTF LOADED"',
  ];

  let lastRedrawTime = -1;

  function updateScreens(elapsed: number, reactionPulse: number, reducedMotion: boolean) {
    if (!reducedMotion) {
      smallMonitors.forEach((mon) => {
        mon.group.position.y = mon.baseY + Math.sin(elapsed * 1.8 + mon.phase) * 0.035;
      });
    }

    const ringScale = 1 + reactionPulse * 0.45;
    floorRing.scale.set(ringScale, ringScale, 1);
    ringMat.opacity = 0.35 + reactionPulse * 0.55;

    if (elapsed - lastRedrawTime < 0.065) return;
    lastRedrawTime = elapsed;

    if (kbCtx) {
      kbCtx.fillStyle = '#080808';
      kbCtx.fillRect(0, 0, 256, 96);
      kbCtx.strokeStyle = '#525252';
      kbCtx.lineWidth = 2;
      kbCtx.strokeRect(2, 2, 252, 92);

      const cols = 12;
      const rows = 4;
      const activeKeyA = Math.floor(elapsed * 14) % (cols * rows);
      const activeKeyB = Math.floor(elapsed * 19 + 7) % (cols * rows);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const isPressed = idx === activeKeyA || idx === activeKeyB;
          kbCtx.fillStyle = isPressed ? '#ffffff' : '#1f1f1f';
          kbCtx.fillRect(10 + c * 20, 12 + r * 19, 15, 14);
        }
      }
      kbTexture.needsUpdate = true;
    }

    if (mainScreenCtx) {
      const ctx = mainScreenCtx;
      ctx.fillStyle = '#070707';
      ctx.fillRect(0, 0, 640, 360);

      ctx.fillStyle = '#141414';
      ctx.fillRect(0, 0, 640, 34);
      ctx.strokeStyle = '#404040';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(1, 1, 638, 358);

      ctx.fillStyle = '#e5e5e5';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('VASKRONA WORKSTATION // PORTOFOLIO 2.0 CONTROL CENTER', 16, 22);
      ctx.fillStyle = '#a3a3a3';
      ctx.font = '11px monospace';
      ctx.fillText('LIVE SYNC [ACTIVE]', 500, 22);

      ctx.strokeStyle = '#262626';
      ctx.strokeRect(14, 46, 360, 298);
      ctx.fillStyle = '#111111';
      ctx.fillRect(15, 47, 358, 24);
      ctx.fillStyle = '#a3a3a3';
      ctx.font = '11px monospace';
      ctx.fillText('EDITOR // src/pages/index.astro', 24, 63);

      const totalChars = Math.floor(elapsed * 28);
      ctx.font = '11px monospace';
      codeSnippets.forEach((line, idx) => {
        const y = 94 + idx * 28;
        ctx.fillStyle = '#525252';
        ctx.fillText(String(idx + 1).padStart(2, '0'), 24, y);

        const activeLineIdx = Math.floor(elapsed * 1.5) % codeSnippets.length;
        ctx.fillStyle = idx === activeLineIdx ? '#ffffff' : '#a3a3a3';
        const visibleText =
          idx === activeLineIdx
            ? line.slice(0, (totalChars % line.length) + 1)
            : line;
        ctx.fillText(visibleText, 48, y);

        if (idx === activeLineIdx) {
          const cursorX = 48 + ctx.measureText(visibleText).width + 3;
          ctx.fillStyle = '#e5e5e5';
          ctx.fillRect(cursorX, y - 10, 7, 13);
        }
      });

      ctx.strokeStyle = '#333333';
      ctx.strokeRect(388, 46, 238, 298);
      ctx.fillStyle = '#111111';
      ctx.fillRect(389, 47, 236, 24);
      ctx.fillStyle = '#e5e5e5';
      ctx.fillText('PREVIEW // HILMI PORTO', 400, 63);

      ctx.strokeStyle = '#525252';
      ctx.strokeRect(402, 84, 210, 82);
      ctx.fillStyle = '#e5e5e5';
      ctx.font = 'bold 14px monospace';
      ctx.fillText("Hi, I'm Hilmi.", 414, 114);
      ctx.fillStyle = '#737373';
      ctx.font = '10px monospace';
      ctx.fillText('Software Engineer & UI/UX', 414, 134);

      ctx.beginPath();
      ctx.arc(582, 124, 20, 0, Math.PI * 2);
      ctx.strokeStyle = '#d4d4d4';
      ctx.stroke();

      for (let i = 0; i < 3; i++) {
        const bx = 402 + i * 72;
        ctx.strokeStyle = i === Math.floor(elapsed * 2) % 3 ? '#ffffff' : '#333333';
        ctx.strokeRect(bx, 180, 64, 52);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(bx + 2, 182, 60, 48);
      }

      ctx.fillStyle = '#a3a3a3';
      ctx.font = '10px monospace';
      ctx.fillText('PORTFOLIO DEPLOY STATUS:', 402, 262);
      ctx.strokeStyle = '#404040';
      ctx.strokeRect(402, 272, 210, 14);
      const barWidth = 40 + ((Math.sin(elapsed * 1.4) + 1) * 0.5) * 164;
      ctx.fillStyle = '#e5e5e5';
      ctx.fillRect(405, 275, barWidth, 8);

      ctx.fillStyle = '#d4d4d4';
      ctx.fillText('AVATAR: VASKRONA.GLTF [ONLINE]', 402, 316);

      mainScreenTex.needsUpdate = true;
    }

    smallMonitors.forEach((mon, idx) => {
      const ctx = mon.ctx;
      if (!ctx) return;

      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, 320, 200);
      ctx.strokeStyle = '#404040';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(1, 1, 318, 198);

      ctx.fillStyle = '#141414';
      ctx.fillRect(2, 2, 316, 24);
      ctx.fillStyle = '#e5e5e5';
      ctx.font = 'bold 11px monospace';

      if (idx === 0) {
        ctx.fillText('TERM // ASTRO BUILD', 12, 18);
        ctx.fillStyle = '#a3a3a3';
        ctx.font = '11px monospace';
        ctx.fillText('$ astro dev --background', 14, 52);
        ctx.fillText('> Loaded: vaskrona.gltf', 14, 76);
        ctx.fillText('> Head & 10 Accessories: OK', 14, 100);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`> Keystrokes: ${Math.floor(elapsed * 12) + 1024}/min`, 14, 128);
        ctx.fillStyle = '#737373';
        ctx.fillText('STATUS: COMPILING ✓', 14, 162);
      } else if (idx === 1) {
        ctx.fillText('NODES // ARCHITECTURE', 12, 18);
        ctx.strokeStyle = '#737373';
        ctx.strokeRect(24, 48, 76, 34);
        ctx.strokeRect(122, 48, 76, 34);
        ctx.strokeRect(220, 48, 76, 34);
        ctx.strokeRect(110, 124, 100, 40);

        ctx.beginPath();
        ctx.moveTo(62, 82);
        ctx.lineTo(160, 124);
        ctx.moveTo(160, 82);
        ctx.lineTo(160, 124);
        ctx.moveTo(258, 82);
        ctx.lineTo(160, 124);
        ctx.strokeStyle = '#a3a3a3';
        ctx.stroke();

        ctx.fillStyle = '#e5e5e5';
        ctx.font = '10px monospace';
        ctx.fillText('HERO', 46, 69);
        ctx.fillText('FOOTER', 140, 69);
        ctx.fillText('AVATAR', 238, 69);
        ctx.fillText('SECRET.ASTRO', 124, 148);
      } else if (idx === 2) {
        ctx.fillText('RADAR // SECTOR 00', 12, 18);
        const cx = 160;
        const cy = 112;
        ctx.strokeStyle = '#404040';
        ctx.beginPath();
        ctx.arc(cx, cy, 58, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, 34, 0, Math.PI * 2);
        ctx.stroke();

        const angle = elapsed * 2.4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * 58, cy + Math.sin(angle) * 58);
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.fillStyle = '#e5e5e5';
        ctx.beginPath();
        ctx.arc(cx + 18, cy - 14, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillText('SYS // TYPING METRICS', 12, 18);
        const barCount = 12;
        for (let b = 0; b < barCount; b++) {
          const h = 16 + Math.abs(Math.sin(elapsed * 7 + b * 0.9)) * 110;
          ctx.fillStyle = b % 2 === 0 ? '#e5e5e5' : '#737373';
          ctx.fillRect(20 + b * 24, 174 - h, 16, h);
        }
      }

      mon.texture.needsUpdate = true;
    });
  }

  function dispose() {
    kbTexture.dispose();
    mainScreenTex.dispose();
    smallMonitors.forEach((m) => m.texture.dispose());
  }

  return {
    stationGroup,
    updateScreens,
    dispose,
  };
}

/**
 * Main factory that initializes the Vaskrona 3D Avatar + Multi-Monitor Coding Station.
 */
export function createAvatarStation(
  scene: THREE.Scene,
  onStatusChange: (status: AvatarLoadStatus) => void,
  config: Partial<AvatarModelConfig> = {}
): AvatarStationHandle {
  const merged: AvatarModelConfig = { ...DEFAULT_AVATAR_CONFIG, ...config };

  const rootGroup = new THREE.Group();
  rootGroup.position.set(merged.position[0], merged.position[1], merged.position[2]);
  rootGroup.rotation.y = merged.baseRotationY;
  scene.add(rootGroup);

  const workstation = createPortfolioWorkstation();
  rootGroup.add(workstation.stationGroup);

  const avatarContainer = new THREE.Group();
  avatarContainer.name = 'VaskronaAvatarContainer';
  avatarContainer.position.set(0, 0, 0.34);
  rootGroup.add(avatarContainer);

  const avatarHitbox = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.65, 2.2, 12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  avatarHitbox.position.set(0, 1.1, 0.34);
  avatarHitbox.name = 'VaskronaClickHitbox';
  rootGroup.add(avatarHitbox);

  const standIn = buildProceduralRobloxAvatar();
  avatarContainer.add(standIn.group);

  let activeRigParts: AvatarRigParts = standIn.parts;
  let mixer: THREE.AnimationMixer | null = null;
  let waveAction: THREE.AnimationAction | null = null;
  let isCustomGltfLoaded = false;

  let pointerTargetYaw = 0;
  let pointerTargetPitch = 0;
  let currentPointerYaw = 0;
  let currentPointerPitch = 0;
  let reactionTimeLeft = 0;

  const gltfLoader = new GLTFLoader();

  function installLoadedGltf(gltf: GLTF, sourceLabel: string) {
    while (avatarContainer.children.length > 0) {
      const child = avatarContainer.children[0];
      avatarContainer.remove(child);
    }

    if (mixer) {
      mixer.stopAllAction();
      mixer = null;
      waveAction = null;
    }

    const model = gltf.scene;

    // Clean up Roblox debug attachments (`*_Att`), attach Vaskrona Head + Accessories, & wrap R6 arms
    const prepared = prepareRobloxGltfScene(model);
    activeRigParts = prepared.parts;

    // Scale based on base character body height (`bodyBox`) so tall antlers/wings don't shrink the body
    const size = new THREE.Vector3();
    prepared.bodyBox.getSize(size);

    const maxDim = Math.max(size.y, size.x, size.z, 0.001);
    const scaleFactor = merged.targetHeight / maxDim;
    model.scale.setScalar(scaleFactor);

    const scaledCenter = new THREE.Vector3();
    prepared.bodyBox.getCenter(scaledCenter);

    model.position.x = -scaledCenter.x * scaleFactor;
    model.position.z = -scaledCenter.z * scaleFactor;
    model.position.y = -prepared.bodyBox.min.y * scaleFactor;

    avatarContainer.add(model);
    isCustomGltfLoaded = true;

    const clipNames = (gltf.animations || []).map((c) => c.name);
    let hasWave = false;

    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);

      const idleClip = gltf.animations.find((c) =>
        /idle|type|typing|code|stand/i.test(c.name)
      );
      if (idleClip) {
        const idleAction = mixer.clipAction(idleClip);
        idleAction.play();
      }

      const waveClip = gltf.animations.find((c) => /wave/i.test(c.name));
      if (waveClip) {
        hasWave = true;
        waveAction = mixer.clipAction(waveClip);
        waveAction.setLoop(THREE.LoopOnce, 1);
        waveAction.clampWhenFinished = true;
      }
    }

    onStatusChange({
      state: 'loaded',
      sourcePath: sourceLabel,
      hasWaveClip: hasWave,
      clipNames,
    });
  }

  async function loadFromUrl(url: string, label = url): Promise<void> {
    onStatusChange({ state: 'loading', message: `Memuat ${label}...` });
    return new Promise((resolve) => {
      gltfLoader.load(
        url,
        (gltf) => {
          installLoadedGltf(gltf, label);
          resolve();
        },
        undefined,
        () => {
          onStatusChange({
            state: 'error',
            reason: `Gagal memuat ${label}. Menampilkan avatar stand-in interaktif.`,
          });
          resolve();
        }
      );
    });
  }

  async function retryDefaultPaths(): Promise<void> {
    onStatusChange({ state: 'loading', message: 'Memeriksa public/models/vaskrona.gltf...' });
    const foundPath = await findAvailableModelPath(merged.candidatePaths);
    if (foundPath) {
      await loadFromUrl(foundPath, foundPath);
    } else {
      onStatusChange({
        state: 'standin',
        reason: 'Menunggu file public/models/vaskrona.gltf (atau .glb)',
      });
    }
  }

  void retryDefaultPaths();

  return {
    rootGroup,
    avatarHitbox,

    setPointerTarget(ndcX: number, ndcY: number, isInside: boolean) {
      if (!isInside) {
        pointerTargetYaw = 0;
        pointerTargetPitch = 0;
        return;
      }
      pointerTargetYaw = THREE.MathUtils.clamp(
        ndcX * merged.maxPointerYaw,
        -merged.maxPointerYaw,
        merged.maxPointerYaw
      );
      pointerTargetPitch = THREE.MathUtils.clamp(
        -ndcY * merged.maxPointerPitch,
        -merged.maxPointerPitch,
        merged.maxPointerPitch
      );
    },

    triggerClickReaction() {
      reactionTimeLeft = 1.15;

      if (waveAction && mixer) {
        waveAction.reset().play();
        return { playedWaveClip: true };
      }
      return { playedWaveClip: false };
    },

    loadCustomModelUrl(url: string, label?: string) {
      return loadFromUrl(url, label);
    },

    retryDefaultPaths,

    update(delta: number, elapsed: number, reducedMotion: boolean) {
      const safeDelta = Math.min(delta, 0.1);

      if (mixer) {
        mixer.update(safeDelta);
      }

      const smoothing = 1 - Math.exp(-6 * safeDelta);
      currentPointerYaw = THREE.MathUtils.lerp(currentPointerYaw, pointerTargetYaw, smoothing);
      currentPointerPitch = THREE.MathUtils.lerp(currentPointerPitch, pointerTargetPitch, smoothing);

      if (reactionTimeLeft > 0) {
        reactionTimeLeft = Math.max(0, reactionTimeLeft - safeDelta);
      }
      const reactionProgress = reactionTimeLeft / 1.15;
      const reactionBounce =
        reactionTimeLeft > 0 ? Math.sin(reactionProgress * Math.PI) * 0.18 : 0;

      const idleBob = reducedMotion ? 0 : Math.sin(elapsed * 2.4) * 0.02;
      const codingGlance = reducedMotion
        ? 0
        : Math.sin(elapsed * 0.9) * 0.14 + Math.sin(elapsed * 2.1) * 0.04;

      avatarContainer.position.y = idleBob + reactionBounce;
      avatarContainer.rotation.y =
        currentPointerYaw * 0.45 +
        (reactionTimeLeft > 0 ? Math.sin(reactionProgress * Math.PI * 2) * 0.25 : 0);

      // Animate Head + Antlers + Mask + Hair looking at the Big Screen & 4 Small Screens
      if (activeRigParts.head) {
        activeRigParts.head.rotation.y = currentPointerYaw + codingGlance;
        activeRigParts.head.rotation.x = currentPointerPitch * 0.6;
      }

      // Animate Arms Typing Forward (`+X` rotation swings hanging `-Y` arms forward toward `-Z` keyboard)
      if (activeRigParts.leftArm && activeRigParts.rightArm) {
        if (reactionTimeLeft > 0 && !waveAction) {
          activeRigParts.rightArm.rotation.x = 2.45;
          activeRigParts.rightArm.rotation.z = 0.28 + Math.sin(elapsed * 18) * 0.25;
          activeRigParts.leftArm.rotation.x = 0.84 + Math.sin(elapsed * 15) * 0.08;
        } else if (!reducedMotion) {
          activeRigParts.leftArm.rotation.x = 0.84 + Math.sin(elapsed * 16) * 0.11;
          activeRigParts.leftArm.rotation.z = -0.08 + Math.cos(elapsed * 11) * 0.04;
          activeRigParts.rightArm.rotation.x = 0.84 + Math.cos(elapsed * 17) * 0.11;
          activeRigParts.rightArm.rotation.z = 0.08 + Math.sin(elapsed * 13) * 0.04;
        } else {
          activeRigParts.leftArm.rotation.x = 0.82;
          activeRigParts.rightArm.rotation.x = 0.82;
        }
      }

      if (isCustomGltfLoaded && !activeRigParts.leftArm && !reducedMotion) {
        avatarContainer.rotation.z = Math.sin(elapsed * 4) * 0.015;
      }

      workstation.updateScreens(elapsed, reactionProgress, reducedMotion);
    },

    dispose() {
      workstation.dispose();
    },
  };
}
