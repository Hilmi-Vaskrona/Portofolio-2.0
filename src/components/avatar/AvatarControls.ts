import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface AvatarControlsConfig {
  minDistance: number;
  maxDistance: number;
  minPolarAngle: number;
  maxPolarAngle: number;
  minAzimuthAngle: number;
  maxAzimuthAngle: number;
  target: [number, number, number];
  dampingFactor: number;
}

export const DEFAULT_CONTROLS_CONFIG: AvatarControlsConfig = {
  minDistance: 2.3,
  maxDistance: 6.2,
  minPolarAngle: Math.PI * 0.2,
  maxPolarAngle: Math.PI * 0.54,
  minAzimuthAngle: -Math.PI * 0.65,
  maxAzimuthAngle: Math.PI * 0.65,
  target: [0, 1.05, 0],
  dampingFactor: 0.07,
};

export interface AvatarControlsHandle {
  controls: OrbitControls;
  isDragging: () => boolean;
  resetView: () => void;
  dispose: () => void;
}

export function createAvatarControls(
  camera: THREE.PerspectiveCamera,
  domElement: HTMLElement,
  config: Partial<AvatarControlsConfig> = {}
): AvatarControlsHandle {
  const merged: AvatarControlsConfig = { ...DEFAULT_CONTROLS_CONFIG, ...config };
  const controls = new OrbitControls(camera, domElement);

  // FR-05: Orbit/drag enabled, pan disabled, vertical angle clamped
  controls.enableDamping = true;
  controls.dampingFactor = merged.dampingFactor;
  controls.enablePan = false;
  controls.enableRotate = true;
  controls.rotateSpeed = 0.75;

  // FR-06: Zoom enabled with safe min/max distance bounds
  controls.enableZoom = true;
  controls.zoomSpeed = 0.85;
  controls.minDistance = merged.minDistance;
  controls.maxDistance = merged.maxDistance;

  // Prevent flipping upside-down or looking from beneath the cavern floor
  controls.minPolarAngle = merged.minPolarAngle;
  controls.maxPolarAngle = merged.maxPolarAngle;
  controls.minAzimuthAngle = merged.minAzimuthAngle;
  controls.maxAzimuthAngle = merged.maxAzimuthAngle;

  controls.target.set(merged.target[0], merged.target[1], merged.target[2]);
  controls.update();

  const initialPosition = camera.position.clone();
  const initialTarget = controls.target.clone();

  let dragging = false;
  const onStart = () => {
    dragging = true;
  };
  const onEnd = () => {
    dragging = false;
  };

  controls.addEventListener('start', onStart);
  controls.addEventListener('end', onEnd);

  return {
    controls,
    isDragging: () => dragging,
    resetView: () => {
      camera.position.copy(initialPosition);
      controls.target.copy(initialTarget);
      controls.update();
    },
    dispose: () => {
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
      controls.dispose();
    },
  };
}

