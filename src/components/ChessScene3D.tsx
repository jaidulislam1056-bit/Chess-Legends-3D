import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Square, Move, PieceSymbol, Color } from 'chess.js';
import { CountryConfig } from '../data/countries';
import { GameSettings, BoardThemeId, BOARD_THEMES } from '../data/settings';
import { buildMysteriousRoom, rowColToWorld, SQUARE_SIZE } from '../three/MysteriousRoom';
import { buildCartoonSoldier, SoldierRig, drawCountrySymbol } from '../three/SoldierBuilder';
import { squareToCoords, coordsToSquare } from '../engine/chessAI';
import { soundEngine } from '../audio/soundEngine';

export type CameraPreset =
  | 'default'
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'top'
  | 'cinematic'
  | 'free'
  | 'reset';

export interface BoardCell {
  square: Square;
  type: PieceSymbol;
  color: Color;
}

export interface LastMoveAnimation {
  id: number;
  from: Square;
  to: Square;
  captured?: PieceSymbol;
  capturedColor?: Color;
  piece: PieceSymbol;
  color: Color;
}

export interface HintSuggestion {
  from: Square;
  to: Square;
  san: string;
  promotion?: PieceSymbol;
}

interface ChessScene3DProps {
  boardCells: BoardCell[];
  whiteCountry: CountryConfig;
  blackCountry: CountryConfig;
  selectedSquare: Square | null;
  legalMoves: Move[];
  lastMove: { from: Square; to: Square } | null;
  hintMove: HintSuggestion | null;
  inCheckKingSquare: Square | null;
  cameraPreset: CameraPreset;
  cameraPresetTrigger: number;
  isMenuBackground: boolean;
  settings: GameSettings;
  lastMoveAnim: LastMoveAnimation | null;
  onSquareClick: (square: Square) => void;
}

const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();

const CAMERA_PRESETS: Record<
  CameraPreset,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  default: { pos: [0, 10.5, 11.8], target: [0, 0.2, 0] },
  front: { pos: [0, 7.6, 12.6], target: [0, 0.3, 0] },
  back: { pos: [0, 7.6, -12.6], target: [0, 0.3, 0] },
  left: { pos: [-12.6, 7.8, 0], target: [0, 0.3, 0] },
  right: { pos: [12.6, 7.8, 0], target: [0, 0.3, 0] },
  top: { pos: [0, 15.8, 0.01], target: [0, 0, 0] },
  cinematic: { pos: [9.6, 6.8, 9.6], target: [0, 0.4, 0] },
  free: { pos: [6.2, 9.2, 11.2], target: [0, 0.3, 0] },
  reset: { pos: [0, 10.5, 11.8], target: [0, 0.2, 0] },
};

function getAspectZoomFactor(width: number, height: number): number {
  const aspect = width / Math.max(1, height);
  if (aspect >= 1.05) {
    return 1.0;
  }
  return Math.min(1.62, Math.max(1.08, 0.96 / Math.max(0.45, aspect)));
}

interface ActivePieceAnim {
  rig: SoldierRig;
  defenderRig: SoldierRig | null;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  elapsed: number;
  duration: number;
  isCapture: boolean;
  hasClashed: boolean;
  shotsFired: number;
  hasCelebrated: boolean;
  celebrationStyle: number;
}

interface BurstParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

interface BulletProjectile {
  mesh: THREE.Mesh;
  startX: number;
  startY: number;
  startZ: number;
  endX: number;
  endY: number;
  endZ: number;
  elapsed: number;
  duration: number;
}

const sharedSparkGeo = new THREE.OctahedronGeometry(0.08, 0);
const sharedSparkMatGold = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
const sharedSparkMatRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });
const sharedSparkMatCyan = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
const sharedSparkMatEmerald = new THREE.MeshBasicMaterial({ color: 0x10b981 });
const sharedBulletGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.36, 8);
sharedBulletGeo.rotateX(Math.PI / 2);
const sharedBulletMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

function resetRigPose(rig: SoldierRig) {
  rig.bodyGroup.position.set(0, 0.22, 0);
  rig.bodyGroup.rotation.set(0, 0, 0);
  rig.headGroup.rotation.set(0, 0, 0);
  rig.muzzleFlash.visible = false;

  if (rig.type === 'p') {
    rig.rightArm.rotation.set(-0.75, 0, -0.35);
    rig.leftArm.rotation.set(-0.85, 0, 0.4);
    rig.gunGroup.position.set(0, 0.38, 0.23);
    rig.gunGroup.rotation.set(0, 0, -0.42);
    rig.gunGroup.visible = true;
  } else if (rig.type === 'q') {
    rig.rightArm.rotation.set(0, 0, -0.22);
    rig.leftArm.rotation.set(0, 0, 0.22);
    rig.gunGroup.position.set(0, -0.22, 0.12);
    rig.gunGroup.rotation.set(0, -Math.PI / 2, 0);
    rig.gunGroup.visible = true;
  } else if (rig.type === 'r' || rig.type === 'n') {
    rig.rightArm.rotation.set(0, 0, 0);
    rig.leftArm.rotation.set(0, 0, 0);
    rig.gunGroup.position.set(0, 0, 0.14);
    rig.gunGroup.rotation.set(0, -Math.PI / 2, 0);
    rig.gunGroup.visible = false;
  } else {
    rig.rightArm.rotation.set(0, 0, 0);
    rig.leftArm.rotation.set(0, 0, 0);
    rig.gunGroup.position.set(0, -0.22, 0.12);
    rig.gunGroup.rotation.set(0, -Math.PI / 2, 0);
    rig.gunGroup.visible = true;
  }
  rig.root.rotation.set(0, rig.color === 'w' ? Math.PI : 0, 0);
}

export const ChessScene3D: React.FC<ChessScene3DProps> = ({
  boardCells,
  whiteCountry,
  blackCountry,
  selectedSquare,
  legalMoves,
  lastMove,
  hintMove,
  inCheckKingSquare,
  cameraPreset,
  cameraPresetTrigger,
  isMenuBackground,
  settings,
  lastMoveAnim,
  onSquareClick,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  const onSquareClickRef = useRef(onSquareClick);
  onSquareClickRef.current = onSquareClick;

  const legalMovesRef = useRef<Move[]>(legalMoves);
  legalMovesRef.current = legalMoves;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const isMenuRef = useRef(isMenuBackground);
  isMenuRef.current = isMenuBackground;

  const presetRef = useRef<CameraPreset>(cameraPreset);
  presetRef.current = cameraPreset;

  const sceneHandlesRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    piecesGroup: THREE.Group;
    highlightGroup: THREE.Group;
    effectsGroup: THREE.Group;
    squareMeshes: THREE.Mesh[];
    pieceMap: Map<Square, SoldierRig>;
    updateCountryBanners: (w: CountryConfig, b: CountryConfig) => void;
    updateBoardTheme: (themeId: BoardThemeId) => void;
    desiredCamPos: THREE.Vector3;
    desiredCamTarget: THREE.Vector3;
    isTransitioningCam: boolean;
    activeAnim: ActivePieceAnim | null;
    burstParticles: BurstParticle[];
    bulletProjectiles: BulletProjectile[];
    shakeIntensity: number;
    aspectFactor: number;
  } | null>(null);

  const prevCountriesRef = useRef<{ w: string; b: string }>({
    w: whiteCountry.id,
    b: blackCountry.id,
  });
  const lastProcessedAnimIdRef = useRef<number>(0);
  const celebrationStyleCounterRef = useRef<number>(0);

  // 1. Initialize WebGLRenderer safely without calling loseContext()
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: settingsRef.current.graphicsQuality === 'high',
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      });
    } catch {
      // If WebGL context creation is blocked or unavailable, switch cleanly to the 2.5D Canvas Fallback
      setWebglUnavailable(true);
      return;
    }

    const gl = renderer.getContext();
    if (!gl) {
      setWebglUnavailable(true);
      return;
    }

    const isSoftwareGl = (() => {
      try {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param) || '');
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const maxDpr =
      isSoftwareGl || settingsRef.current.graphicsQuality === 'low'
        ? 1
        : settingsRef.current.graphicsQuality === 'medium'
        ? 1.25
        : 1.5;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isSoftwareGl && settingsRef.current.graphicsQuality !== 'low';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.touchAction = 'none';

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglUnavailable(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09080d);
    scene.fog = new THREE.FogExp2(0x09080d, 0.016);

    const initAspectFactor = getAspectZoomFactor(container.clientWidth, container.clientHeight);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      120
    );
    camera.position.set(0, 10.5 * initAspectFactor, 11.8 * initAspectFactor);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.minDistance = 5.0;
    controls.maxDistance = 30.0;
    controls.minPolarAngle = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.target.set(0, 0.2, 0);

    // Lightweight Studio Lighting (Hemisphere + 2 Directional Lights, zero PointLights)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x262638, 1.25);
    hemiLight.position.set(0, 25, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(9, 18, 11);
    keyLight.castShadow = !isSoftwareGl && settingsRef.current.graphicsQuality !== 'low';
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    const d = 7.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 38;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.85);
    rimLight.position.set(-10, 12, -12);
    scene.add(rimLight);

    const maxAnisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const roomHandles = buildMysteriousRoom(
      scene,
      maxAnisotropy,
      whiteCountry,
      blackCountry,
      settingsRef.current.boardTheme
    );

    const piecesGroup = new THREE.Group();
    const effectsGroup = new THREE.Group();
    scene.add(piecesGroup);
    scene.add(effectsGroup);

    const desiredCamPos = new THREE.Vector3(0, 10.5 * initAspectFactor, 11.8 * initAspectFactor);
    const desiredCamTarget = new THREE.Vector3(0, 0.2, 0);

    const handles = {
      scene,
      camera,
      renderer,
      controls,
      piecesGroup,
      highlightGroup: roomHandles.highlightGroup,
      effectsGroup,
      squareMeshes: roomHandles.squareMeshes,
      pieceMap: new Map<Square, SoldierRig>(),
      updateCountryBanners: roomHandles.updateCountryBanners,
      updateBoardTheme: roomHandles.updateBoardTheme,
      desiredCamPos,
      desiredCamTarget,
      isTransitioningCam: false,
      activeAnim: null as ActivePieceAnim | null,
      burstParticles: [] as BurstParticle[],
      bulletProjectiles: [] as BulletProjectile[],
      shakeIntensity: 0,
      aspectFactor: initAspectFactor,
    };
    sceneHandlesRef.current = handles;

    const onControlStart = () => {
      handles.isTransitioningCam = false;
    };
    controls.addEventListener('start', onControlStart);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };
    let isPointerDown = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      isPointerDown = true;
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      if (isMenuRef.current) return;

      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      const dist = Math.hypot(dx, dy);
      const maxDrag = e.pointerType === 'touch' ? 16 : 8;
      if (dist > maxDrag) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const squareHits = raycaster.intersectObjects(handles.squareMeshes, false);
      const clickedSquare =
        squareHits.length > 0
          ? (squareHits[0].object.userData?.square as Square | undefined)
          : undefined;

      if (
        clickedSquare &&
        legalMovesRef.current.some((m) => (m.to as Square) === clickedSquare)
      ) {
        onSquareClickRef.current(clickedSquare);
        return;
      }

      const pieceRoots = Array.from(handles.pieceMap.values()).map((r) => r.root);
      const pieceHits = raycaster.intersectObjects(pieceRoots, true);
      if (pieceHits.length > 0) {
        let obj: THREE.Object3D | null = pieceHits[0].object;
        while (obj && !obj.userData?.square) {
          obj = obj.parent;
        }
        if (obj?.userData?.square) {
          onSquareClickRef.current(obj.userData.square as Square);
          return;
        }
      }

      if (clickedSquare) {
        onSquareClickRef.current(clickedSquare);
      }
    };

    const onDoubleClick = () => {
      const af = handles.aspectFactor;
      handles.desiredCamPos.set(0, 10.5 * af, 11.8 * af);
      handles.desiredCamTarget.set(0, 0.2, 0);
      handles.isTransitioningCam = true;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', onPointerDown);
    domElem.addEventListener('pointerup', onPointerUp);
    domElem.addEventListener('dblclick', onDoubleClick);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      const newAf = getAspectZoomFactor(w, h);
      handles.aspectFactor = newAf;
      const presetConfig = CAMERA_PRESETS[presetRef.current] || CAMERA_PRESETS.default;
      handles.desiredCamPos.set(
        presetConfig.pos[0] * newAf,
        presetConfig.pos[1] * newAf,
        presetConfig.pos[2] * newAf
      );
      handles.desiredCamTarget.set(...presetConfig.target);
      handles.isTransitioningCam = true;
    };
    window.addEventListener('resize', onResize);

    let frameId = 0;
    let isDisposed = false;
    let lastTime = performance.now();

    function tick() {
      if (isDisposed) return;
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);
      const elapsed = now * 0.001;

      controls.rotateSpeed = 0.85 * settingsRef.current.cameraSensitivity;
      controls.zoomSpeed = 1.0 * settingsRef.current.cameraSensitivity;

      roomHandles.torchFlames.forEach((flame, idx) => {
        const s = 0.9 + Math.sin(elapsed * 7 + idx * 1.7) * 0.16;
        flame.scale.set(s, s * 1.25, s);
        flame.rotation.y += dt * 2.2;
      });
      roomHandles.runeCircles.forEach((rune, idx) => {
        rune.rotation.z += dt * (idx % 2 === 0 ? 0.12 : -0.15);
      });
      roomHandles.chandelierGroup.rotation.y = Math.sin(elapsed * 0.4) * 0.08;
      roomHandles.particles.rotation.y += dt * 0.04;

      const af = handles.aspectFactor;
      if (isMenuRef.current || presetRef.current === 'cinematic') {
        const orbitSpeed = 0.22 * settingsRef.current.cameraSpeed;
        const angle = elapsed * orbitSpeed;
        const radius = (isMenuRef.current ? 14.0 : 12.8) * af;
        camera.position.x = Math.sin(angle) * radius;
        camera.position.z = Math.cos(angle) * radius;
        camera.position.y = (8.2 + Math.sin(elapsed * 0.5) * 1.1) * af;
        controls.target.set(0, 0.3, 0);
      } else if (handles.isTransitioningCam) {
        const lambda = 6.5 * settingsRef.current.cameraSpeed;
        camera.position.x = THREE.MathUtils.damp(
          camera.position.x,
          handles.desiredCamPos.x,
          lambda,
          dt
        );
        camera.position.y = THREE.MathUtils.damp(
          camera.position.y,
          handles.desiredCamPos.y,
          lambda,
          dt
        );
        camera.position.z = THREE.MathUtils.damp(
          camera.position.z,
          handles.desiredCamPos.z,
          lambda,
          dt
        );

        controls.target.x = THREE.MathUtils.damp(
          controls.target.x,
          handles.desiredCamTarget.x,
          lambda,
          dt
        );
        controls.target.y = THREE.MathUtils.damp(
          controls.target.y,
          handles.desiredCamTarget.y,
          lambda,
          dt
        );
        controls.target.z = THREE.MathUtils.damp(
          controls.target.z,
          handles.desiredCamTarget.z,
          lambda,
          dt
        );

        if (
          camera.position.distanceTo(handles.desiredCamPos) < 0.05 &&
          controls.target.distanceTo(handles.desiredCamTarget) < 0.05
        ) {
          handles.isTransitioningCam = false;
        }
      }

      if (handles.shakeIntensity > 0.002) {
        camera.position.x += (Math.random() - 0.5) * handles.shakeIntensity;
        camera.position.y += (Math.random() - 0.5) * handles.shakeIntensity;
        handles.shakeIntensity *= Math.exp(-12 * dt);
      }

      controls.update();

      handles.pieceMap.forEach((rig) => {
        if (handles.activeAnim && handles.activeAnim.rig === rig) return;
        const phase = rig.root.position.x * 1.3 + rig.root.position.z * 2.1;
        rig.bodyGroup.position.y = 0.22 + Math.sin(elapsed * 2.6 + phase) * 0.015;
        if (rig.type === 'p') {
          rig.rightArm.rotation.z = -0.35 + Math.sin(elapsed * 2.0 + phase) * 0.025;
        } else {
          rig.rightArm.rotation.z = Math.sin(elapsed * 2.0 + phase) * 0.035;
        }
      });

      if (handles.activeAnim) {
        const anim = handles.activeAnim;
        anim.elapsed += dt;
        const t = Math.min(1, anim.elapsed / anim.duration);

        if (!anim.isCapture) {
          const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          anim.rig.root.position.x = THREE.MathUtils.lerp(anim.startX, anim.endX, ease);
          anim.rig.root.position.z = THREE.MathUtils.lerp(anim.startZ, anim.endZ, ease);

          const jumpHeight = anim.rig.type === 'n' ? 0.85 : 0.22;
          anim.rig.bodyGroup.position.y = 0.22 + Math.sin(t * Math.PI) * jumpHeight;
          if (anim.rig.type !== 'p') {
            anim.rig.rightArm.rotation.x = -0.4 + Math.sin(t * Math.PI * 6) * 0.45;
            anim.rig.leftArm.rotation.x = -Math.sin(t * Math.PI * 6) * 0.35;
          }

          const dx = anim.endX - anim.startX;
          const dz = anim.endZ - anim.startZ;
          if (Math.hypot(dx, dz) > 0.01) {
            anim.rig.root.rotation.y = Math.atan2(dx, dz);
          }

          if (t >= 1) {
            anim.rig.root.position.set(anim.endX, 0, anim.endZ);
            resetRigPose(anim.rig);
            handles.activeAnim = null;
          }
        } else {
          // ===================================================================
          // CAPTURE SEQUENCE:
          // Phase 1 (0.00 -> 0.16): Step Forward & Aim Tactical Gun at Enemy
          // Phase 2 (0.16 -> 0.48): Fire 3-Round Bullet Burst & Kill Enemy
          // Phase 3 (0.48 -> 1.00): Claim Square & Perform Varied Celebration!
          // ===================================================================
          const dx = anim.endX - anim.startX;
          const dz = anim.endZ - anim.startZ;
          const attackAngle =
            Math.hypot(dx, dz) > 0.01
              ? Math.atan2(dx, dz)
              : anim.rig.color === 'w'
              ? Math.PI
              : 0;

          const fireStandX = anim.startX + dx * 0.42;
          const fireStandZ = anim.startZ + dz * 0.42;

          // Helper to aim the piece's gun straight forward (+Z) with optional recoil kick
          const applyGunAimPose = (recoilKick: number) => {
            anim.rig.gunGroup.visible = true;
            if (anim.rig.type === 'p') {
              // Rotate Pawn's chest rifle forward (+Z) to point barrel straight at the enemy
              anim.rig.gunGroup.position.set(0.06, 0.44, 0.28 - recoilKick * 0.08);
              anim.rig.gunGroup.rotation.set(-recoilKick * 0.35, -Math.PI / 2, 0);
              anim.rig.rightArm.rotation.set(-1.35 - recoilKick * 0.3, 0, -0.2);
              anim.rig.leftArm.rotation.set(-1.45 - recoilKick * 0.3, 0, 0.25);
            } else if (anim.rig.type === 'r' || anim.rig.type === 'n') {
              anim.rig.leftArm.rotation.set(-recoilKick * 0.35, 0, 0);
              anim.rig.gunGroup.position.set(0, 0.05, 0.28 - recoilKick * 0.08);
              anim.rig.gunGroup.rotation.set(0, -Math.PI / 2, 0);
            } else {
              // Bishop, Queen, King raise their left hand gun straight toward the enemy
              anim.rig.leftArm.rotation.set(-Math.PI / 2 - recoilKick * 0.4, 0, 0);
              anim.rig.rightArm.rotation.set(-0.6, 0, -0.25);
              anim.rig.gunGroup.position.set(0, -0.22, 0.16);
              anim.rig.gunGroup.rotation.set(Math.PI / 2, -Math.PI / 2, 0);
            }
          };

          if (t < 0.16) {
            // PHASE 1: Step into Firing Stance & Aim Gun
            const p = t / 0.16;
            anim.rig.root.rotation.y = attackAngle;
            anim.rig.root.position.x = THREE.MathUtils.lerp(anim.startX, fireStandX, p);
            anim.rig.root.position.z = THREE.MathUtils.lerp(anim.startZ, fireStandZ, p);
            anim.rig.bodyGroup.position.y = 0.22 + Math.sin(p * Math.PI) * 0.14;
            applyGunAimPose(0);
          } else if (t < 0.48) {
            // PHASE 2: Fire 3 Rapid Gunshots & Eliminate Defender
            anim.rig.root.rotation.y = attackAngle;
            anim.rig.root.position.set(fireStandX, 0, fireStandZ);

            const shotThresholds = [0.17, 0.27, 0.37];
            if (
              anim.shotsFired < shotThresholds.length &&
              t >= shotThresholds[anim.shotsFired]
            ) {
              anim.shotsFired++;
              soundEngine.playGunshot();
              handles.shakeIntensity = 0.18;

              // Spawn 3D Glowing Bullet Tracer from Attacker's Muzzle to Defender's Chest
              const bulletMesh = new THREE.Mesh(sharedBulletGeo, sharedBulletMat);
              const muzzleStartX = fireStandX + Math.sin(attackAngle) * 0.55;
              const muzzleStartZ = fireStandZ + Math.cos(attackAngle) * 0.55;
              bulletMesh.position.set(muzzleStartX, 0.68, muzzleStartZ);
              bulletMesh.rotation.y = attackAngle;
              handles.effectsGroup.add(bulletMesh);

              handles.bulletProjectiles.push({
                mesh: bulletMesh,
                startX: muzzleStartX,
                startY: 0.68,
                startZ: muzzleStartZ,
                endX: anim.endX,
                endY: 0.62,
                endZ: anim.endZ,
                elapsed: 0,
                duration: 0.085,
              });

              // Spawn Blood/Fire Impact Sparks on Defender
              for (let s = 0; s < 10; s++) {
                const sparkMesh = new THREE.Mesh(
                  sharedSparkGeo,
                  s % 2 === 0 ? sharedSparkMatGold : sharedSparkMatRed
                );
                sparkMesh.position.set(anim.endX, 0.65, anim.endZ);
                handles.effectsGroup.add(sparkMesh);
                const angle = Math.random() * Math.PI * 2;
                const speed = 1.6 + Math.random() * 3.4;
                handles.burstParticles.push({
                  mesh: sparkMesh,
                  vx: Math.cos(angle) * speed,
                  vy: 1.8 + Math.random() * 2.8,
                  vz: Math.sin(angle) * speed,
                  life: 0,
                  maxLife: 0.38 + Math.random() * 0.18,
                });
              }
            }

            // Muzzle flash + gun recoil oscillation during the 3-shot burst
            const burstProgress = (t - 0.16) / 0.32;
            const recoilWave = Math.abs(Math.sin(burstProgress * Math.PI * 3));
            anim.rig.muzzleFlash.visible = recoilWave > 0.55;
            const flashScale = 0.85 + recoilWave * 0.5;
            anim.rig.muzzleFlash.scale.set(flashScale, flashScale, flashScale);
            applyGunAimPose(recoilWave);

            // Defender hit reaction: jolts back on first 2 shots, collapses flat on 3rd shot
            if (anim.defenderRig) {
              if (t < 0.36) {
                const hitJolt = Math.sin(burstProgress * Math.PI * 6) * 0.25;
                anim.defenderRig.bodyGroup.rotation.x = -Math.abs(hitJolt);
                anim.defenderRig.bodyGroup.position.y = 0.22 + Math.abs(hitJolt) * 0.2;
              } else {
                const fallP = Math.min(1, (t - 0.36) / 0.12);
                anim.defenderRig.root.rotation.x = fallP * (Math.PI / 2.05);
                anim.defenderRig.root.rotation.y += dt * 8;
                anim.defenderRig.root.scale.setScalar(Math.max(0.01, 1 - fallP * 0.85));
              }
            }
          } else {
            // PHASE 3: Defender Eliminated -> Attacker Claims Square & Celebrates!
            anim.rig.muzzleFlash.visible = false;
            if (anim.defenderRig && anim.defenderRig.root.parent) {
              handles.piecesGroup.remove(anim.defenderRig.root);
            }

            if (t < 0.6) {
              // Step onto the captured square
              const moveP = (t - 0.48) / 0.12;
              anim.rig.root.position.x = THREE.MathUtils.lerp(fireStandX, anim.endX, moveP);
              anim.rig.root.position.z = THREE.MathUtils.lerp(fireStandZ, anim.endZ, moveP);
              anim.rig.bodyGroup.position.y = 0.22 + Math.sin(moveP * Math.PI) * 0.2;
            } else {
              // ===============================================================
              // VICTORY CELEBRATION ON CAPTURED SQUARE (6 Distinct Styles!)
              // ===============================================================
              anim.rig.root.position.set(anim.endX, 0, anim.endZ);

              if (!anim.hasCelebrated) {
                anim.hasCelebrated = true;
                soundEngine.playCelebrateChime(anim.celebrationStyle);

                // Pop golden/emerald/cyan celebration confetti sparks around the winner
                const confettiMats = [
                  sharedSparkMatGold,
                  sharedSparkMatEmerald,
                  sharedSparkMatCyan,
                ];
                for (let c = 0; c < 18; c++) {
                  const sparkMesh = new THREE.Mesh(
                    sharedSparkGeo,
                    confettiMats[c % confettiMats.length]
                  );
                  sparkMesh.position.set(anim.endX, 0.85, anim.endZ);
                  handles.effectsGroup.add(sparkMesh);
                  const angle = (c / 18) * Math.PI * 2;
                  const speed = 1.4 + Math.random() * 2.4;
                  handles.burstParticles.push({
                    mesh: sparkMesh,
                    vx: Math.cos(angle) * speed,
                    vy: 2.8 + Math.random() * 2.5,
                    vz: Math.sin(angle) * speed,
                    life: 0,
                    maxLife: 0.55 + Math.random() * 0.2,
                  });
                }
              }

              const ct = (t - 0.6) / 0.4; // 0 -> 1 celebration progress
              const baseFacing = anim.rig.color === 'w' ? Math.PI : 0;
              const style = anim.celebrationStyle % 6;

              if (style === 0) {
                // Style 0: 360° High Jump-Spin Salute with Arms & Gun Raised High
                anim.rig.bodyGroup.position.y = 0.22 + Math.sin(ct * Math.PI) * 0.95;
                anim.rig.root.rotation.y = baseFacing + ct * Math.PI * 2;
                anim.rig.rightArm.rotation.set(-2.5, 0, -0.35);
                anim.rig.leftArm.rotation.set(-2.5, 0, 0.35);
              } else if (style === 1) {
                // Style 1: Bhangra / Victory Dance Sway (Side-to-side body tilt + alternating arm pumps)
                anim.rig.root.rotation.y = baseFacing + Math.sin(ct * Math.PI * 4) * 0.45;
                anim.rig.bodyGroup.position.y =
                  0.22 + Math.abs(Math.sin(ct * Math.PI * 3)) * 0.42;
                anim.rig.bodyGroup.rotation.z = Math.sin(ct * Math.PI * 6) * 0.28;
                anim.rig.rightArm.rotation.set(
                  -2.1 + Math.sin(ct * Math.PI * 6) * 0.65,
                  0,
                  -0.4
                );
                anim.rig.leftArm.rotation.set(
                  -2.1 - Math.sin(ct * Math.PI * 6) * 0.65,
                  0,
                  0.4
                );
              } else if (style === 2) {
                // Style 2: Heroic Acrobatic Backflip Sommersault in Mid-Air!
                anim.rig.root.rotation.y = baseFacing;
                anim.rig.bodyGroup.position.y = 0.22 + Math.sin(ct * Math.PI) * 1.15;
                anim.rig.bodyGroup.rotation.x = -ct * Math.PI * 2;
                anim.rig.rightArm.rotation.set(-2.2, 0, -0.3);
                anim.rig.leftArm.rotation.set(-2.2, 0, 0.3);
              } else if (style === 3) {
                // Style 3: Champion Double Fist-Pump & Overhead Gun Twirl
                anim.rig.root.rotation.y = baseFacing;
                anim.rig.bodyGroup.position.y =
                  0.22 + Math.abs(Math.sin(ct * Math.PI * 2)) * 0.55;
                anim.rig.rightArm.rotation.set(-2.6, 0, 0);
                anim.rig.leftArm.rotation.set(-2.4, 0, 0);
                anim.rig.gunGroup.rotation.z = ct * Math.PI * 6;
                anim.rig.headGroup.rotation.x = Math.sin(ct * Math.PI * 6) * 0.25;
              } else if (style === 4) {
                // Style 4: 720° Tornado Breakdance Spin with Outstretched Arms
                anim.rig.root.rotation.y = baseFacing + ct * Math.PI * 4;
                anim.rig.bodyGroup.position.y = 0.22 + Math.sin(ct * Math.PI) * 0.5;
                anim.rig.rightArm.rotation.set(0, 0, -1.35);
                anim.rig.leftArm.rotation.set(0, 0, 1.35);
              } else {
                // Style 5: Joyful Sideways Cartwheel Flip & Victory Salute
                anim.rig.root.rotation.y = baseFacing;
                anim.rig.bodyGroup.position.y = 0.22 + Math.sin(ct * Math.PI) * 0.95;
                anim.rig.bodyGroup.rotation.z = ct * Math.PI * 2;
                anim.rig.rightArm.rotation.set(-2.4, 0, -0.5);
                anim.rig.leftArm.rotation.set(-2.4, 0, 0.5);
              }
            }
          }

          if (t >= 1) {
            if (anim.defenderRig && anim.defenderRig.root.parent) {
              handles.piecesGroup.remove(anim.defenderRig.root);
            }
            anim.rig.root.position.set(anim.endX, 0, anim.endZ);
            resetRigPose(anim.rig);
            handles.activeAnim = null;
          }
        }
      }

      // Update flying 3D Bullet Tracers
      for (let i = handles.bulletProjectiles.length - 1; i >= 0; i--) {
        const b = handles.bulletProjectiles[i];
        b.elapsed += dt;
        const bt = Math.min(1, b.elapsed / b.duration);
        b.mesh.position.x = THREE.MathUtils.lerp(b.startX, b.endX, bt);
        b.mesh.position.y = THREE.MathUtils.lerp(b.startY, b.endY, bt);
        b.mesh.position.z = THREE.MathUtils.lerp(b.startZ, b.endZ, bt);
        if (bt >= 1) {
          handles.effectsGroup.remove(b.mesh);
          handles.bulletProjectiles.splice(i, 1);
        }
      }

      for (let i = handles.burstParticles.length - 1; i >= 0; i--) {
        const bp = handles.burstParticles[i];
        bp.life += dt;
        bp.mesh.position.x += bp.vx * dt;
        bp.mesh.position.y += bp.vy * dt;
        bp.mesh.position.z += bp.vz * dt;
        bp.vy -= 9.8 * dt;
        const scale = Math.max(0.01, 1 - bp.life / bp.maxLife);
        bp.mesh.scale.setScalar(scale);
        if (bp.life >= bp.maxLife) {
          handles.effectsGroup.remove(bp.mesh);
          handles.burstParticles.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
      frameId = isSoftwareGl
        ? window.setTimeout(tick, 33)
        : requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      domElem.removeEventListener('webglcontextlost', onContextLost);
      domElem.removeEventListener('pointerdown', onPointerDown);
      domElem.removeEventListener('pointerup', onPointerUp);
      domElem.removeEventListener('dblclick', onDoubleClick);
      controls.dispose();
      renderer.dispose();
      sceneHandlesRef.current = null;
    };
  }, []);

  // 2. Respond to Camera Preset Changes
  useEffect(() => {
    const handles = sceneHandlesRef.current;
    if (!handles) return;
    const af = handles.aspectFactor;
    const presetConfig = CAMERA_PRESETS[cameraPreset] || CAMERA_PRESETS.default;
    _targetPos.set(
      presetConfig.pos[0] * af,
      presetConfig.pos[1] * af,
      presetConfig.pos[2] * af
    );
    _targetLook.set(...presetConfig.target);
    handles.desiredCamPos.copy(_targetPos);
    handles.desiredCamTarget.copy(_targetLook);
    handles.isTransitioningCam = true;
  }, [cameraPreset, cameraPresetTrigger]);

  // 3. Respond to Board Theme & Graphics Quality Changes Immediately
  useEffect(() => {
    const handles = sceneHandlesRef.current;
    if (!handles) return;
    handles.updateBoardTheme(settings.boardTheme);
  }, [settings.boardTheme]);

  useEffect(() => {
    const handles = sceneHandlesRef.current;
    if (!handles) return;
    const maxDpr =
      settings.graphicsQuality === 'low'
        ? 1
        : settings.graphicsQuality === 'medium'
        ? 1.25
        : 1.5;
    handles.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    handles.renderer.shadowMap.enabled = settings.graphicsQuality !== 'low';
  }, [settings.graphicsQuality]);

  // 4. Sync 3D Country Banners & Rebuild Soldiers if Country Changes
  useEffect(() => {
    const handles = sceneHandlesRef.current;
    if (!handles) return;

    const countryChanged =
      prevCountriesRef.current.w !== whiteCountry.id ||
      prevCountriesRef.current.b !== blackCountry.id;

    if (countryChanged) {
      prevCountriesRef.current = { w: whiteCountry.id, b: blackCountry.id };
      handles.updateCountryBanners(whiteCountry, blackCountry);
      if (handles.activeAnim?.defenderRig?.root.parent) {
        handles.piecesGroup.remove(handles.activeAnim.defenderRig.root);
      }
      handles.pieceMap.forEach((rig) => {
        handles.piecesGroup.remove(rig.root);
      });
      handles.pieceMap.clear();
      handles.activeAnim = null;
    }
  }, [whiteCountry, blackCountry]);

  // 5. Sync 32 3D Cartoon Soldiers & Trigger Walking / Capture Animations
  useEffect(() => {
    const handles = sceneHandlesRef.current;
    if (!handles) return;

    if (handles.activeAnim) {
      const prev = handles.activeAnim;
      if (prev.defenderRig && prev.defenderRig.root.parent) {
        handles.piecesGroup.remove(prev.defenderRig.root);
      }
      prev.rig.root.position.set(prev.endX, 0, prev.endZ);
      resetRigPose(prev.rig);
      handles.activeAnim = null;
    }

    const speedMultiplier =
      settings.animationQuality === 'fast'
        ? 0.55
        : settings.animationQuality === 'cinematic'
        ? 1.35
        : 0.9;

    let animMovedRig: SoldierRig | null = null;
    let animDefenderRig: SoldierRig | null = null;

    if (lastMoveAnim && lastMoveAnim.id !== lastProcessedAnimIdRef.current) {
      lastProcessedAnimIdRef.current = lastMoveAnim.id;

      const existingMover = handles.pieceMap.get(lastMoveAnim.from);
      let existingDefender = handles.pieceMap.get(lastMoveAnim.to) || null;

      if (!existingDefender && lastMoveAnim.captured && lastMoveAnim.piece === 'p') {
        const epSquare = `${lastMoveAnim.to[0]}${lastMoveAnim.from[1]}` as Square;
        const epCandidate = handles.pieceMap.get(epSquare);
        if (epCandidate && epCandidate.color !== lastMoveAnim.color) {
          existingDefender = epCandidate;
          handles.pieceMap.delete(epSquare);
        }
      }

      if (existingMover && existingMover.type === lastMoveAnim.piece) {
        const fromCoords = squareToCoords(lastMoveAnim.from);
        const toCoords = squareToCoords(lastMoveAnim.to);
        const startWorld = rowColToWorld(fromCoords.row, fromCoords.col);
        const endWorld = rowColToWorld(toCoords.row, toCoords.col);

        handles.pieceMap.delete(lastMoveAnim.from);
        if (existingDefender) {
          handles.pieceMap.delete(lastMoveAnim.to);
        }

        existingMover.root.userData.square = lastMoveAnim.to;
        handles.pieceMap.set(lastMoveAnim.to, existingMover);
        animMovedRig = existingMover;
        animDefenderRig = existingDefender;

        const isCapture = Boolean(lastMoveAnim.captured && existingDefender);
        const nextStyle = celebrationStyleCounterRef.current % 6;
        if (isCapture) {
          celebrationStyleCounterRef.current++;
        }

        handles.activeAnim = {
          rig: existingMover,
          defenderRig: existingDefender,
          startX: startWorld.x,
          startZ: startWorld.z,
          endX: endWorld.x,
          endZ: endWorld.z,
          elapsed: 0,
          duration: (isCapture ? 1.55 : 0.42) * speedMultiplier,
          isCapture,
          hasClashed: false,
          shotsFired: 0,
          hasCelebrated: false,
          celebrationStyle: nextStyle,
        };
      }
    }

    const targetSquares = new Set<Square>();
    boardCells.forEach((cell) => {
      targetSquares.add(cell.square);
      const existing = handles.pieceMap.get(cell.square);

      if (existing && existing.type === cell.type && existing.color === cell.color) {
        if (
          existing !== animMovedRig &&
          (!handles.activeAnim || handles.activeAnim.rig !== existing)
        ) {
          const { row, col } = squareToCoords(cell.square);
          const { x, z } = rowColToWorld(row, col);
          existing.root.position.set(x, 0, z);
          existing.root.userData.square = cell.square;
        }
      } else {
        if (existing && existing !== animDefenderRig) {
          handles.piecesGroup.remove(existing.root);
          handles.pieceMap.delete(cell.square);
        }
        const country = cell.color === 'w' ? whiteCountry : blackCountry;
        const newRig = buildCartoonSoldier(cell.type, cell.color, country);
        const { row, col } = squareToCoords(cell.square);
        const { x, z } = rowColToWorld(row, col);
        newRig.root.position.set(x, 0, z);
        newRig.root.userData.square = cell.square;
        handles.piecesGroup.add(newRig.root);
        handles.pieceMap.set(cell.square, newRig);
      }
    });

    Array.from(handles.pieceMap.entries()).forEach(([sq, rig]) => {
      if (!targetSquares.has(sq)) {
        if (rig !== animDefenderRig) {
          handles.piecesGroup.remove(rig.root);
        }
        handles.pieceMap.delete(sq);
      }
    });
  }, [boardCells, whiteCountry, blackCountry, lastMoveAnim, settings.animationQuality]);

  // 6. Render Board Highlights & Interactive Best-Move Hint Arc
  useEffect(() => {
    const handles = sceneHandlesRef.current;
    if (!handles) return;

    while (handles.highlightGroup.children.length > 0) {
      const child = handles.highlightGroup.children[0] as THREE.Mesh;
      handles.highlightGroup.remove(child);
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    }

    const placeSquareMarker = (
      sq: Square,
      colorHex: number,
      opacity: number,
      isRing = false,
      isCapture = false
    ) => {
      const { row, col } = squareToCoords(sq);
      const { x, z } = rowColToWorld(row, col);

      if (isCapture) {
        const ringGeo = new THREE.RingGeometry(SQUARE_SIZE * 0.34, SQUARE_SIZE * 0.45, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: colorHex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.position.set(x, 0.025, z);
        handles.highlightGroup.add(ringMesh);
      } else if (isRing) {
        const ringGeo = new THREE.RingGeometry(SQUARE_SIZE * 0.35, SQUARE_SIZE * 0.46, 28);
        const ringMat = new THREE.MeshBasicMaterial({
          color: colorHex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity,
          depthWrite: false,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.position.set(x, 0.022, z);
        handles.highlightGroup.add(ringMesh);
      } else {
        const planeGeo = new THREE.PlaneGeometry(SQUARE_SIZE * 0.92, SQUARE_SIZE * 0.92);
        const planeMat = new THREE.MeshBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity,
          depthWrite: false,
        });
        const planeMesh = new THREE.Mesh(planeGeo, planeMat);
        planeMesh.rotation.x = -Math.PI / 2;
        planeMesh.position.set(x, 0.018, z);
        handles.highlightGroup.add(planeMesh);
      }
    };

    if (lastMove) {
      placeSquareMarker(lastMove.from, 0xf59e0b, 0.32, false);
      placeSquareMarker(lastMove.to, 0xf59e0b, 0.4, false);
    }

    if (hintMove) {
      placeSquareMarker(hintMove.from, 0x38bdf8, 0.55, false);
      placeSquareMarker(hintMove.from, 0x38bdf8, 0.95, true);
      placeSquareMarker(hintMove.to, 0x22c55e, 0.55, false);
      placeSquareMarker(hintMove.to, 0x22c55e, 0.95, true);

      const fromC = squareToCoords(hintMove.from);
      const toC = squareToCoords(hintMove.to);
      const startW = rowColToWorld(fromC.row, fromC.col);
      const endW = rowColToWorld(toC.row, toC.col);

      const midX = (startW.x + endW.x) / 2;
      const midZ = (startW.z + endW.z) / 2;
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(startW.x, 0.35, startW.z),
        new THREE.Vector3(midX, 1.85, midZ),
        new THREE.Vector3(endW.x, 0.35, endW.z)
      );
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.065, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.9,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      handles.highlightGroup.add(tubeMesh);

      const arrowCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.45, 12),
        new THREE.MeshBasicMaterial({ color: 0x22c55e })
      );
      arrowCone.position.set(endW.x, 0.32, endW.z);
      arrowCone.rotation.x = Math.PI;
      handles.highlightGroup.add(arrowCone);
    }

    if (selectedSquare) {
      placeSquareMarker(selectedSquare, 0xfbbf24, 0.9, true);
      placeSquareMarker(selectedSquare, 0xfbbf24, 0.35, false);
    }

    if (settings.showMoveHints && legalMoves.length > 0) {
      legalMoves.forEach((m) => {
        const isCap = Boolean(m.captured || m.flags.includes('e'));
        if (isCap) {
          placeSquareMarker(m.to as Square, 0xef4444, 0.92, true, true);
        } else {
          const { row, col } = squareToCoords(m.to as Square);
          const { x, z } = rowColToWorld(row, col);
          const discGeo = new THREE.CircleGeometry(SQUARE_SIZE * 0.18, 20);
          const discMat = new THREE.MeshBasicMaterial({
            color: 0x10b981,
            transparent: true,
            opacity: 0.88,
            depthWrite: false,
          });
          const disc = new THREE.Mesh(discGeo, discMat);
          disc.rotation.x = -Math.PI / 2;
          disc.position.set(x, 0.025, z);
          handles.highlightGroup.add(disc);
        }
      });
    }

    if (inCheckKingSquare) {
      placeSquareMarker(inCheckKingSquare, 0xdc2626, 0.65, false);
      placeSquareMarker(inCheckKingSquare, 0xfef08a, 0.95, true);
    }
  }, [selectedSquare, legalMoves, lastMove, hintMove, inCheckKingSquare, settings.showMoveHints]);

  // 7. Interactive 2.5D Canvas Fallback Renderer (if WebGL is blocked by browser context loss)
  useEffect(() => {
    if (!webglUnavailable) return;
    const canvas = fallbackCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. Mysterious Room Background + Bangladesh Flag & "Developed by Jaidul" Wall Mural
    const bgGrad = ctx.createRadialGradient(
      width / 2,
      height * 0.45,
      40,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.75
    );
    bgGrad.addColorStop(0, '#1c1632');
    bgGrad.addColorStop(0.55, '#0e0b1a');
    bgGrad.addColorStop(1, '#06050a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Bangladesh Flag + "Developed by Jaidul" Wall Mural on the back chamber wall
    const muralW = Math.min(340, width * 0.72);
    const muralH = 56;
    const muralX = (width - muralW) / 2;
    const muralY = Math.max(88, height * 0.14);
    ctx.fillStyle = '#072b1f';
    ctx.fillRect(muralX, muralY, muralW, muralH);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.strokeRect(muralX, muralY, muralW, muralH);

    // Mini Bangladesh Flags on left and right of wall mural
    for (const fx of [muralX + 12, muralX + muralW - 56]) {
      ctx.fillStyle = '#006a4e';
      ctx.fillRect(fx, muralY + 12, 44, 28);
      ctx.fillStyle = '#f42a41';
      ctx.beginPath();
      ctx.arc(fx + 20, muralY + 26, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1;
      ctx.strokeRect(fx, muralY + 12, 44, 28);
    }

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 12px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText('BANGLADESH', width / 2, muralY + 21);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 14px Cinzel, serif';
    ctx.fillText('Developed by Jaidul', width / 2, muralY + 41);

    // 2. Compute Chessboard Geometry
    const boardPixels = Math.min(width * 0.88, height * 0.62, 540);
    const sqSize = boardPixels / 8;
    const boardX = (width - boardPixels) / 2;
    const boardY = (height - boardPixels) / 2 + 28;

    const theme = BOARD_THEMES.find((t) => t.id === settings.boardTheme) || BOARD_THEMES[0];
    const framePad = Math.max(12, sqSize * 0.28);

    // Outer 3D Pedestal & Frame
    ctx.fillStyle = '#09080d';
    ctx.fillRect(
      boardX - framePad - 4,
      boardY - framePad + 8,
      boardPixels + (framePad + 4) * 2,
      boardPixels + (framePad + 4) * 2
    );

    ctx.fillStyle = theme.isWoodGrain ? '#80421e' : `#${theme.frameColor.toString(16).padStart(6, '0')}`;
    ctx.fillRect(
      boardX - framePad,
      boardY - framePad,
      boardPixels + framePad * 2,
      boardPixels + framePad * 2
    );
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      boardX - framePad,
      boardY - framePad,
      boardPixels + framePad * 2,
      boardPixels + framePad * 2
    );

    // 3. Draw 8x8 Squares & Highlights
    const cellMap = new Map<Square, BoardCell>();
    boardCells.forEach((c) => cellMap.set(c.square, c));

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const isLight = (r + c) % 2 === 0;
        const sx = boardX + c * sqSize;
        const sy = boardY + r * sqSize;
        const sq = coordsToSquare(r, c);

        ctx.fillStyle = isLight ? theme.lightSquare : theme.darkSquare;
        ctx.fillRect(sx, sy, sqSize, sqSize);

        if (lastMove && (lastMove.from === sq || lastMove.to === sq)) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.38)';
          ctx.fillRect(sx, sy, sqSize, sqSize);
        }

        if (selectedSquare === sq) {
          ctx.fillStyle = 'rgba(251, 191, 36, 0.45)';
          ctx.fillRect(sx, sy, sqSize, sqSize);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 3;
          ctx.strokeRect(sx + 2, sy + 2, sqSize - 4, sqSize - 4);
        }

        if (inCheckKingSquare === sq) {
          ctx.fillStyle = 'rgba(220, 38, 38, 0.6)';
          ctx.fillRect(sx, sy, sqSize, sqSize);
        }

        if (hintMove && (hintMove.from === sq || hintMove.to === sq)) {
          ctx.fillStyle =
            hintMove.from === sq ? 'rgba(56, 189, 248, 0.45)' : 'rgba(34, 197, 94, 0.45)';
          ctx.fillRect(sx, sy, sqSize, sqSize);
        }

        if (settings.showMoveHints) {
          const lm = legalMoves.find((m) => (m.to as Square) === sq);
          if (lm) {
            if (lm.captured || lm.flags.includes('e')) {
              ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
              ctx.lineWidth = 3.5;
              ctx.beginPath();
              ctx.arc(sx + sqSize / 2, sy + sqSize / 2, sqSize * 0.38, 0, Math.PI * 2);
              ctx.stroke();
            } else {
              ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
              ctx.beginPath();
              ctx.arc(sx + sqSize / 2, sy + sqSize / 2, sqSize * 0.16, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    }

    // 4. Draw Cartoon Country Soldiers on Each Occupied Square
    const PIECE_GLYPHS: Record<PieceSymbol, string> = {
      p: '♟',
      r: '♜',
      n: '♞',
      b: '♝',
      q: '♛',
      k: '♚',
    };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = coordsToSquare(r, c);
        const cell = cellMap.get(sq);
        if (!cell) continue;

        const country = cell.color === 'w' ? whiteCountry : blackCountry;
        const cx = boardX + c * sqSize + sqSize / 2;
        const cy = boardY + r * sqSize + sqSize / 2;

        // Multi-tiered Pedestal Base with Gold Ring + Country Color
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + sqSize * 0.3, sqSize * 0.36, sqSize * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = country.primaryColor;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy + sqSize * 0.04, sqSize * 0.34, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Country Emblem Medallion at bottom of pedestal
        drawCountrySymbol(ctx, country, cx, cy + sqSize * 0.26, sqSize * 0.11);

        // Piece Glyph with Gold/White Contrast
        ctx.fillStyle = cell.color === 'w' ? '#ffffff' : '#fef08a';
        ctx.font = `bold ${Math.round(sqSize * 0.52)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 4;
        ctx.fillText(PIECE_GLYPHS[cell.type], cx, cy - sqSize * 0.04);
        ctx.shadowBlur = 0;
      }
    }

    // 5. Draw Hint Trajectory Arrow if Active
    if (hintMove) {
      const f = squareToCoords(hintMove.from);
      const t = squareToCoords(hintMove.to);
      const fx = boardX + f.col * sqSize + sqSize / 2;
      const fy = boardY + f.row * sqSize + sqSize / 2;
      const tx = boardX + t.col * sqSize + sqSize / 2;
      const ty = boardY + t.row * sqSize + sqSize / 2;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.quadraticCurveTo((fx + tx) / 2, Math.min(fy, ty) - 28, tx, ty);
      ctx.stroke();
    }
  }, [
    webglUnavailable,
    boardCells,
    whiteCountry,
    blackCountry,
    selectedSquare,
    legalMoves,
    lastMove,
    hintMove,
    inCheckKingSquare,
    settings.boardTheme,
    settings.showMoveHints,
  ]);

  const handleFallbackCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMenuBackground) return;
    const canvas = fallbackCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const boardPixels = Math.min(width * 0.88, height * 0.62, 540);
    const sqSize = boardPixels / 8;
    const boardX = (width - boardPixels) / 2;
    const boardY = (height - boardPixels) / 2 + 28;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const col = Math.floor((clickX - boardX) / sqSize);
    const row = Math.floor((clickY - boardY) / sqSize);
    if (row >= 0 && row < 8 && col >= 0 && col < 8) {
      onSquareClick(coordsToSquare(row, col));
    }
  };

  if (webglUnavailable) {
    return (
      <canvas
        ref={fallbackCanvasRef}
        onClick={handleFallbackCanvasClick}
        className="fixed inset-0 w-screen h-screen overflow-hidden z-0 cursor-pointer touch-none"
        aria-label="Chess Viewport"
      />
    );
  }

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 w-screen h-screen overflow-hidden z-0 cursor-grab active:cursor-grabbing touch-none"
      aria-label="3D Chess Viewport"
    />
  );
};
