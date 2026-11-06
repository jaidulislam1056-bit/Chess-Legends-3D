import * as THREE from 'three';
import { CountryConfig } from '../data/countries';
import { BOARD_THEMES, BoardThemeId } from '../data/settings';
import {
  createBoardSquareTexture,
  createWoodFrameTexture,
  createStoneWallTexture,
  createRuneCircleTexture,
  createCountryBannerTexture,
  createBangladeshWallMuralTexture,
  createBangladeshPillarBannerTexture,
} from './proceduralTextures';
import { coordsToSquare } from '../engine/chessAI';

export const SQUARE_SIZE = 1.25;
export const BOARD_OFFSET = (8 * SQUARE_SIZE) / 2 - SQUARE_SIZE / 2; // 4.375

export function rowColToWorld(row: number, col: number): { x: number; z: number } {
  const x = col * SQUARE_SIZE - BOARD_OFFSET;
  const z = row * SQUARE_SIZE - BOARD_OFFSET;
  return { x, z };
}

export interface RoomHandles {
  roomGroup: THREE.Group;
  boardGroup: THREE.Group;
  squareMeshes: THREE.Mesh[];
  highlightGroup: THREE.Group;
  torchFlames: THREE.Mesh[];
  torchLights: THREE.PointLight[];
  runeCircles: THREE.Mesh[];
  particles: THREE.Points;
  chandelierGroup: THREE.Group;
  updateCountryBanners: (whiteCountry: CountryConfig, blackCountry: CountryConfig) => void;
  updateBoardTheme: (themeId: BoardThemeId) => void;
}

export function buildMysteriousRoom(
  scene: THREE.Scene,
  maxAnisotropy: number,
  whiteCountry: CountryConfig,
  blackCountry: CountryConfig,
  initialThemeId: BoardThemeId = 'classic_bw'
): RoomHandles {
  const roomGroup = new THREE.Group();
  const boardGroup = new THREE.Group();
  const highlightGroup = new THREE.Group();
  const squareMeshes: THREE.Mesh[] = [];
  const torchFlames: THREE.Mesh[] = [];
  const torchLights: THREE.PointLight[] = [];
  const runeCircles: THREE.Mesh[] = [];

  scene.add(roomGroup);
  scene.add(boardGroup);
  scene.add(highlightGroup);

  const stoneTex = createStoneWallTexture(maxAnisotropy);
  const woodFrameTex = createWoodFrameTexture(maxAnisotropy);
  const lightSquareTex = createBoardSquareTexture(true, initialThemeId, maxAnisotropy);
  const darkSquareTex = createBoardSquareTexture(false, initialThemeId, maxAnisotropy);
  const bdWallMuralTex = createBangladeshWallMuralTexture(maxAnisotropy);
  const bdPillarBannerTex = createBangladeshPillarBannerTexture(maxAnisotropy);

  const stoneWallMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    roughness: 0.85,
    metalness: 0.1,
  });

  const darkStoneMat = new THREE.MeshStandardMaterial({
    color: 0x161422,
    roughness: 0.7,
    metalness: 0.2,
  });

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.22,
    metalness: 0.88,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.55,
    metalness: 0.2,
  });

  const magicBlueMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.85,
    roughness: 0.2,
    metalness: 0.5,
  });

  const magicPurpleMat = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    emissive: 0x7e22ce,
    emissiveIntensity: 0.85,
    roughness: 0.2,
    metalness: 0.5,
  });

  // Self-illuminated material for Bangladesh Flag + "Developed by Jaidul" Wall Murals so they glow clearly on the dark castle walls
  const bdWallMuralMat = new THREE.MeshBasicMaterial({
    map: bdWallMuralTex,
  });

  const bdPillarBannerMat = new THREE.MeshBasicMaterial({
    map: bdPillarBannerTex,
    side: THREE.DoubleSide,
  });

  // 1. ANCIENT STONE CHAMBER FLOOR, DAIS PLATFORM & WALLS
  const floorGeo = new THREE.CylinderGeometry(42, 42, 0.5, 48);
  const floorMesh = new THREE.Mesh(floorGeo, stoneWallMat);
  floorMesh.position.y = -1.15;
  floorMesh.receiveShadow = true;
  roomGroup.add(floorMesh);

  const floorRuneTex = createRuneCircleTexture('#8b5cf6');
  const floorRuneMat = new THREE.MeshBasicMaterial({
    map: floorRuneTex,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const floorRune = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), floorRuneMat);
  floorRune.rotation.x = -Math.PI / 2;
  floorRune.position.y = -0.88;
  roomGroup.add(floorRune);
  runeCircles.push(floorRune);

  for (let step = 0; step < 3; step++) {
    const radius = 10.5 - step * 1.1;
    const height = 0.28;
    const stepMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius + 0.25, height, 8),
      darkStoneMat
    );
    stepMesh.position.y = -0.76 + step * height;
    stepMesh.receiveShadow = true;
    stepMesh.castShadow = true;
    roomGroup.add(stepMesh);

    const stepGoldEdge = new THREE.Mesh(
      new THREE.CylinderGeometry(radius + 0.02, radius + 0.02, 0.05, 8),
      goldTrimMat
    );
    stepGoldEdge.position.y = -0.65 + step * height;
    roomGroup.add(stepGoldEdge);
  }

  // Outer Octagonal Castle Chamber Walls (Radius 36) with Giant BANGLADESH FLAGS & "Developed by Jaidul" Wall Murals!
  const wallDistance = 35;
  const wallHeight = 26;
  const wallWidth = 30;
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const wallPanel = new THREE.Group();
    wallPanel.position.set(
      Math.sin(angle) * wallDistance,
      wallHeight / 2 - 1,
      Math.cos(angle) * wallDistance
    );
    wallPanel.rotation.y = angle + Math.PI;

    const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(wallWidth, wallHeight, 1.5), stoneWallMat);
    wallMesh.receiveShadow = true;
    wallPanel.add(wallMesh);

    const baseMold = new THREE.Mesh(new THREE.BoxGeometry(wallWidth, 1.4, 1.8), darkStoneMat);
    baseMold.position.y = -wallHeight / 2 + 0.7;
    wallPanel.add(baseMold);

    const topCornice = new THREE.Mesh(new THREE.BoxGeometry(wallWidth, 1.2, 2.0), goldTrimMat);
    topCornice.position.y = wallHeight / 2 - 0.6;
    wallPanel.add(topCornice);

    // Mount Grand BANGLADESH FLAGS + "Developed by Jaidul" Wall Billboard on every wall!
    const muralFrame = new THREE.Mesh(new THREE.BoxGeometry(16.6, 8.6, 0.25), goldTrimMat);
    muralFrame.position.set(0, -1.5, 0.82);
    wallPanel.add(muralFrame);

    const muralPlane = new THREE.Mesh(new THREE.PlaneGeometry(16.0, 8.0), bdWallMuralMat);
    muralPlane.position.set(0, -1.5, 0.96);
    wallPanel.add(muralPlane);

    roomGroup.add(wallPanel);
  }

  // 2. TALL MEDIEVAL PILLARS WITH BANGLADESH FLAGS & "Developed by Jaidul" BANNERS
  const pillarGeo = new THREE.CylinderGeometry(1.1, 1.3, 25, 16);
  const capGeo = new THREE.BoxGeometry(3.0, 1.1, 3.0);

  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + Math.PI / 8;
    const dist = 23.5;
    const px = Math.sin(angle) * dist;
    const pz = Math.cos(angle) * dist;

    const pillar = new THREE.Group();
    pillar.position.set(px, -0.9, pz);
    pillar.rotation.y = angle + Math.PI;

    const shaft = new THREE.Mesh(pillarGeo, darkStoneMat);
    shaft.position.y = 12.5;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    pillar.add(shaft);

    const base = new THREE.Mesh(capGeo, goldTrimMat);
    base.position.y = 0.55;
    pillar.add(base);

    const capital = new THREE.Mesh(capGeo, goldTrimMat);
    capital.position.y = 24.2;
    pillar.add(capital);

    // Hanging Bangladesh Flag + "Developed by Jaidul" Banner on the front of each pillar
    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.0, 10), goldTrimMat);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, 7.6, 1.28);
    pillar.add(crossbar);

    const pillarBanner = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 5.2), bdPillarBannerMat);
    pillarBanner.position.set(0, 4.9, 1.3);
    pillar.add(pillarBanner);

    // Wall Torch Sconce mounted above the banner
    const sconceArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 1.4, 8), goldTrimMat);
    sconceArm.position.set(0, 8.2, 1.3);
    sconceArm.rotation.x = Math.PI / 4;
    pillar.add(sconceArm);

    const flameMat = new THREE.MeshStandardMaterial({
      color: i % 2 === 0 ? 0xf59e0b : 0x38bdf8,
      emissive: i % 2 === 0 ? 0xea580c : 0x0284c7,
      emissiveIntensity: 2.2,
      roughness: 0.1,
    });
    const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 1), flameMat);
    flame.position.set(0, 8.8, 1.85);
    pillar.add(flame);
    torchFlames.push(flame);

    if (i % 2 === 0) {
      const pLight = new THREE.PointLight(0xff9d3b, 18, 24, 1.5);
      pLight.position.set(0, 8.8, 2.1);
      pillar.add(pLight);
      torchLights.push(pLight);
    }

    roomGroup.add(pillar);
  }

  // 3. ANCIENT STATUES OF KINGS IN DIAGONAL ALCOVES
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const dist = 17.5;
    const statueGroup = new THREE.Group();
    statueGroup.position.set(Math.sin(angle) * dist, -0.9, Math.cos(angle) * dist);
    statueGroup.rotation.y = angle + Math.PI;

    const ped = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 2.8), darkStoneMat);
    ped.position.y = 1.1;
    ped.castShadow = true;
    statueGroup.add(ped);

    const pedTrim = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.3, 3.1), goldTrimMat);
    pedTrim.position.y = 2.25;
    statueGroup.add(pedTrim);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 3.8, 12), darkStoneMat);
    torso.position.y = 4.2;
    torso.castShadow = true;
    statueGroup.add(torso);

    const shoulders = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1.3), goldTrimMat);
    shoulders.position.y = 5.8;
    statueGroup.add(shoulders);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.68, 14, 14), darkStoneMat);
    head.position.y = 6.9;
    statueGroup.add(head);

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.65, 0.5, 8), goldTrimMat);
    crown.position.y = 7.5;
    statueGroup.add(crown);

    const greatSword = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 4.6, 0.12),
      i % 2 === 0 ? magicBlueMat : magicPurpleMat
    );
    greatSword.position.set(0, 4.5, 1.15);
    statueGroup.add(greatSword);

    roomGroup.add(statueGroup);
  }

  // 4. GRAND HANGING CHANDELIER ABOVE CHESSBOARD
  const chandelierGroup = new THREE.Group();
  chandelierGroup.position.set(0, 14.5, 0);

  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 10, 8), goldTrimMat);
  chain.position.y = 5;
  chandelierGroup.add(chain);

  const mainWheel = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.22, 12, 32), goldTrimMat);
  mainWheel.rotation.x = Math.PI / 2;
  chandelierGroup.add(mainWheel);

  const innerWheel = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.16, 10, 24), goldTrimMat);
  innerWheel.rotation.x = Math.PI / 2;
  innerWheel.position.y = 0.8;
  chandelierGroup.add(innerWheel);

  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const candleCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35, 0),
      i % 2 === 0 ? magicBlueMat : goldTrimMat
    );
    candleCrystal.position.set(Math.cos(a) * 4.2, 0.45, Math.sin(a) * 4.2);
    chandelierGroup.add(candleCrystal);
  }

  roomGroup.add(chandelierGroup);

  // =========================================================================
  // 5. 3D CHESSBOARD MATCHING REFERENCE IMAGES (SEAMLESS 8x8 + FRAME)
  // =========================================================================
  const boardFrameMat = new THREE.MeshStandardMaterial({
    color: 0x171717,
    roughness: 0.6,
    metalness: 0.1,
  });

  const boardBaseOuter = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.26, 11.6), boardFrameMat);
  boardBaseOuter.position.y = -0.14;
  boardBaseOuter.receiveShadow = true;
  boardBaseOuter.castShadow = true;
  boardGroup.add(boardBaseOuter);

  const borderLeft = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.16, 11.6), boardFrameMat);
  borderLeft.position.set(-5.4, -0.02, 0);
  borderLeft.receiveShadow = true;
  boardGroup.add(borderLeft);

  const borderRight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.16, 11.6), boardFrameMat);
  borderRight.position.set(5.4, -0.02, 0);
  borderRight.receiveShadow = true;
  boardGroup.add(borderRight);

  const borderTop = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.16, 0.8), boardFrameMat);
  borderTop.position.set(0, -0.02, -5.4);
  borderTop.receiveShadow = true;
  boardGroup.add(borderTop);

  const borderBottom = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.16, 0.8), boardFrameMat);
  borderBottom.position.set(0, -0.02, 5.4);
  borderBottom.receiveShadow = true;
  boardGroup.add(borderBottom);

  const squareGeo = new THREE.BoxGeometry(SQUARE_SIZE, 0.12, SQUARE_SIZE);
  const lightSquareMat = new THREE.MeshStandardMaterial({
    map: lightSquareTex,
    roughness: 0.78,
    metalness: 0.02,
  });
  const darkSquareMat = new THREE.MeshStandardMaterial({
    map: darkSquareTex,
    roughness: 0.82,
    metalness: 0.02,
  });

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isLight = (row + col) % 2 === 0;
      const squareMesh = new THREE.Mesh(squareGeo, isLight ? lightSquareMat : darkSquareMat);
      const { x, z } = rowColToWorld(row, col);
      squareMesh.position.set(x, -0.05, z);
      squareMesh.receiveShadow = true;

      const squareName = coordsToSquare(row, col);
      squareMesh.userData = {
        isSquare: true,
        square: squareName,
        row,
        col,
        isLight,
      };

      boardGroup.add(squareMesh);
      squareMeshes.push(squareMesh);
    }
  }

  const updateBoardTheme = (themeId: BoardThemeId) => {
    const themeObj = BOARD_THEMES.find((t) => t.id === themeId) || BOARD_THEMES[0];
    if (lightSquareMat.map) lightSquareMat.map.dispose();
    if (darkSquareMat.map) darkSquareMat.map.dispose();
    lightSquareMat.map = createBoardSquareTexture(true, themeId, maxAnisotropy);
    darkSquareMat.map = createBoardSquareTexture(false, themeId, maxAnisotropy);
    lightSquareMat.needsUpdate = true;
    darkSquareMat.needsUpdate = true;

    if (themeObj.isWoodGrain) {
      boardFrameMat.map = woodFrameTex;
      boardFrameMat.color.setHex(0xffffff);
    } else {
      boardFrameMat.map = null;
      boardFrameMat.color.setHex(themeObj.frameColor);
    }
    boardFrameMat.needsUpdate = true;
  };

  updateBoardTheme(initialThemeId);

  // 6. KEEP BATTLEFIELD UNOBSTRUCTED (NO STANDING POLE BANNERS AROUND BOARD)
  const updateCountryBanners = (_newWhite: CountryConfig, _newBlack: CountryConfig) => {
    // No standing banners around the chessboard
  };

  // 7. FLOATING MAGICAL PARTICLES IN THE CHAMBER
  const particleCount = 180;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < 8; i++) {
    // Also add warm lights near the wall murals so the walls have a rich golden glow
    if (i % 2 === 0) {
      const angle = (i * Math.PI) / 4;
      const wallLight = new THREE.PointLight(0xfbbf24, 15, 25, 1.5);
      wallLight.position.set(Math.sin(angle) * 31, 6.5, Math.cos(angle) * 31);
      roomGroup.add(wallLight);
    }
  }

  for (let i = 0; i < particleCount; i++) {
    const r = 4 + Math.random() * 24;
    const theta = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(theta) * r;
    positions[i * 3 + 1] = Math.random() * 14;
    positions[i * 3 + 2] = Math.sin(theta) * r;

    const choice = i % 3;
    if (choice === 0) {
      colors[i * 3] = 0.98;
      colors[i * 3 + 1] = 0.78;
      colors[i * 3 + 2] = 0.25;
    } else if (choice === 1) {
      colors[i * 3] = 0.25;
      colors[i * 3 + 1] = 0.75;
      colors[i * 3 + 2] = 0.98;
    } else {
      colors[i * 3] = 0.75;
      colors[i * 3 + 1] = 0.45;
      colors[i * 3 + 2] = 0.98;
    }
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMat = new THREE.PointsMaterial({
    size: 0.22,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  roomGroup.add(particles);

  return {
    roomGroup,
    boardGroup,
    squareMeshes,
    highlightGroup,
    torchFlames,
    torchLights,
    runeCircles,
    particles,
    chandelierGroup,
    updateCountryBanners,
    updateBoardTheme,
  };
}
