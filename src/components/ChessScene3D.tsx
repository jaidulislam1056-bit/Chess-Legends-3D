import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Square, Move, PieceSymbol, Color } from 'chess.js';
import { CountryConfig } from '../data/countries';
import { GameSettings, BoardThemeId } from '../data/settings';
import { buildMysteriousRoom, rowColToWorld, SQUARE_SIZE } from '../three/MysteriousRoom';
import { buildCartoonSoldier, SoldierRig } from '../three/SoldierBuilder';
import { squareToCoords } from '../engine/chessAI';

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
}

interface BurstParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
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
    shakeIntensity: number;
    aspectFactor: number;
  } | null>(null);

  const prevCountriesRef = useRef<{ w: string; b: string }>({
    w: whiteCountry.id,
    b: blackCountry.id,
  });
  const lastProcessedAnimIdRef = useRef<number>(0);

  // 1. Initialize WebGLRenderer, Mysterious Room, Studio PBR Lighting & 60fps Loop ONCE
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl && settingsRef.current.graphicsQuality !== 'low',
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const maxDpr =
      settingsRef.current.graphicsQuality === 'low'
        ? 1
        : settingsRef.current.graphicsQuality === 'medium'
        ? 1.5
        : 2;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, maxDpr));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isSoftwareGl && settingsRef.current.graphicsQuality !== 'low';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.touchAction = 'none';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09080d);
    scene.fog = new THREE.FogExp2(0x09080d, 0.016);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

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

    // Balanced White Studio Lighting so Black & White and Classic Wood colors look true to life
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x262638, 1.05);
    hemiLight.position.set(0, 25, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    keyLight.position.set(9, 18, 11);
    keyLight.castShadow = !isSoftwareGl;
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

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.7);
    rimLight.position.set(-10, 12, -12);
    scene.add(rimLight);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
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

      // 1. First check if the user clicked a legal destination square (so tall foreground pieces don't block legal move squares behind them)
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

      // 2. Next check 3D soldier meshes
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

      // 3. Fallback to any chessboard square hit
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

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
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
        rig.bodyGroup.position.y = 0.12 + Math.sin(elapsed * 2.6 + phase) * 0.018;
        rig.rightArm.rotation.z = Math.sin(elapsed * 2.0 + phase) * 0.04;
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
          anim.rig.bodyGroup.position.y = 0.12 + Math.sin(t * Math.PI) * jumpHeight;
          anim.rig.rightArm.rotation.x = -0.4 + Math.sin(t * Math.PI * 6) * 0.45;
          anim.rig.leftArm.rotation.x = -Math.sin(t * Math.PI * 6) * 0.35;

          const dx = anim.endX - anim.startX;
          const dz = anim.endZ - anim.startZ;
          if (Math.hypot(dx, dz) > 0.01) {
            anim.rig.root.rotation.y = Math.atan2(dx, dz);
          }

          if (t >= 1) {
            anim.rig.root.position.set(anim.endX, 0, anim.endZ);
            anim.rig.bodyGroup.position.y = 0.12;
            anim.rig.rightArm.rotation.x = -0.4;
            anim.rig.leftArm.rotation.x = 0;
            anim.rig.root.rotation.y = anim.rig.color === 'w' ? Math.PI : 0;
            handles.activeAnim = null;
          }
        } else {
          const dx = anim.endX - anim.startX;
          const dz = anim.endZ - anim.startZ;
          if (Math.hypot(dx, dz) > 0.01) {
            anim.rig.root.rotation.y = Math.atan2(dx, dz);
          }

          if (t < 0.45) {
            const p = t / 0.45;
            anim.rig.root.position.x = THREE.MathUtils.lerp(
              anim.startX,
              anim.startX + dx * 0.72,
              p
            );
            anim.rig.root.position.z = THREE.MathUtils.lerp(
              anim.startZ,
              anim.startZ + dz * 0.72,
              p
            );
            anim.rig.bodyGroup.position.y = 0.12 + Math.abs(Math.sin(p * Math.PI * 3)) * 0.18;
            anim.rig.rightArm.rotation.x = -1.8 * p;
          } else if (t < 0.78) {
            const p = (t - 0.45) / 0.33;
            anim.rig.rightArm.rotation.x = -1.8 + p * 2.6;

            if (!anim.hasClashed) {
              anim.hasClashed = true;
              handles.shakeIntensity = 0.22;
              const sparkGeo = new THREE.OctahedronGeometry(0.08, 0);
              for (let s = 0; s < 18; s++) {
                const sparkMat = new THREE.MeshBasicMaterial({
                  color: s % 2 === 0 ? 0xfbbf24 : 0xef4444,
                });
                const sparkMesh = new THREE.Mesh(sparkGeo, sparkMat);
                sparkMesh.position.set(anim.endX, 0.65, anim.endZ);
                handles.effectsGroup.add(sparkMesh);
                const angle = Math.random() * Math.PI * 2;
                const speed = 1.5 + Math.random() * 3.5;
                handles.burstParticles.push({
                  mesh: sparkMesh,
                  vx: Math.cos(angle) * speed,
                  vy: 2.0 + Math.random() * 3.0,
                  vz: Math.sin(angle) * speed,
                  life: 0,
                  maxLife: 0.45 + Math.random() * 0.2,
                });
              }
            }

            if (anim.defenderRig) {
              anim.defenderRig.root.rotation.x = p * (Math.PI / 2.2);
              anim.defenderRig.root.scale.setScalar(Math.max(0.01, 1 - p * 0.7));
            }
          } else {
            const p = (t - 0.78) / 0.22;
            if (anim.defenderRig && anim.defenderRig.root.parent) {
              handles.piecesGroup.remove(anim.defenderRig.root);
            }
            anim.rig.root.position.x = THREE.MathUtils.lerp(
              anim.startX + dx * 0.72,
              anim.endX,
              p
            );
            anim.rig.root.position.z = THREE.MathUtils.lerp(
              anim.startZ + dz * 0.72,
              anim.endZ,
              p
            );
            anim.rig.rightArm.rotation.x = THREE.MathUtils.lerp(0.8, -0.4, p);
          }

          if (t >= 1) {
            if (anim.defenderRig && anim.defenderRig.root.parent) {
              handles.piecesGroup.remove(anim.defenderRig.root);
            }
            anim.rig.root.position.set(anim.endX, 0, anim.endZ);
            anim.rig.bodyGroup.position.y = 0.12;
            anim.rig.rightArm.rotation.x = -0.4;
            anim.rig.root.rotation.y = anim.rig.color === 'w' ? Math.PI : 0;
            handles.activeAnim = null;
          }
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
          bp.mesh.geometry.dispose();
          (bp.mesh.material as THREE.Material).dispose();
          handles.burstParticles.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      domElem.removeEventListener('pointerdown', onPointerDown);
      domElem.removeEventListener('pointerup', onPointerUp);
      domElem.removeEventListener('dblclick', onDoubleClick);
      controls.dispose();
      renderer.dispose();
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
        ? 1.5
        : 2;
    handles.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
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

    // If a previous animation was still running when a new move or reset arrived, finalize it cleanly
    if (handles.activeAnim) {
      const prev = handles.activeAnim;
      if (prev.defenderRig && prev.defenderRig.root.parent) {
        handles.piecesGroup.remove(prev.defenderRig.root);
      }
      prev.rig.root.position.set(prev.endX, 0, prev.endZ);
      prev.rig.bodyGroup.position.y = 0.12;
      prev.rig.rightArm.rotation.x = -0.4;
      prev.rig.leftArm.rotation.x = 0;
      prev.rig.root.rotation.y = prev.rig.color === 'w' ? Math.PI : 0;
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

      // Support En Passant capture where the captured pawn sits on (to.file + from.rank)
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
        handles.activeAnim = {
          rig: existingMover,
          defenderRig: existingDefender,
          startX: startWorld.x,
          startZ: startWorld.z,
          endX: endWorld.x,
          endZ: endWorld.z,
          elapsed: 0,
          duration: (isCapture ? 0.72 : 0.42) * speedMultiplier,
          isCapture,
          hasClashed: false,
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

    // Best Move Hint Visualization (From Square + To Square + 3D Glowing Arc Trajectory)
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
      const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.065, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.9,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      handles.highlightGroup.add(tubeMesh);

      // Glowing target beacon cone at destination square
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

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 w-screen h-screen overflow-hidden z-0 cursor-grab active:cursor-grabbing touch-none"
      aria-label="3D Chess Viewport"
    />
  );
};
