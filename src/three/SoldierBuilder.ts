import * as THREE from 'three';
import { PieceSymbol, Color } from 'chess.js';
import { CountryConfig } from '../data/countries';
import { getContactShadowTexture } from './proceduralTextures';

export interface SoldierRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  rightArm: THREE.Group;
  leftArm: THREE.Group;
  weaponGroup: THREE.Group;
  gunGroup: THREE.Group;
  muzzleFlash: THREE.Mesh;
  type: PieceSymbol;
  color: Color;
}

// 100% Shared Geometries across all 32 pieces — zero per-piece geometry allocation
const sharedGeos = {
  shadowPlane: new THREE.PlaneGeometry(1.02, 1.02),
  baseGoldBottom: new THREE.CylinderGeometry(0.45, 0.47, 0.045, 24),
  baseMainBand: new THREE.CylinderGeometry(0.42, 0.44, 0.12, 24),
  baseGoldTop: new THREE.CylinderGeometry(0.39, 0.43, 0.04, 24),
  baseInnerStep: new THREE.CylinderGeometry(0.34, 0.38, 0.035, 20),
  baseMedallion: new THREE.CylinderGeometry(0.068, 0.068, 0.025, 16),
  baseMedallionRim: new THREE.TorusGeometry(0.068, 0.012, 8, 16),

  // Chibi Character Head & Facial Features
  chibiHead: new THREE.SphereGeometry(0.22, 18, 16),
  earSphere: new THREE.SphereGeometry(0.045, 8, 8),
  eyeSocket: new THREE.SphereGeometry(0.042, 10, 10),
  irisSphere: new THREE.SphereGeometry(0.032, 10, 10),
  pupilSphere: new THREE.SphereGeometry(0.018, 8, 8),
  catchlightSphere: new THREE.SphereGeometry(0.009, 6, 6),
  noseSphere: new THREE.SphereGeometry(0.022, 8, 8),
  browBox: new THREE.BoxGeometry(0.085, 0.022, 0.025),
  mustacheBox: new THREE.BoxGeometry(0.18, 0.038, 0.06),
  fullBeardSphere: new THREE.SphereGeometry(
    0.215,
    14,
    12,
    0,
    Math.PI * 2,
    Math.PI * 0.42,
    Math.PI * 0.55
  ),
  chinTuftBox: new THREE.BoxGeometry(0.14, 0.08, 0.1),
  queenHairBack: new THREE.SphereGeometry(0.245, 16, 14),
  queenHairWave: new THREE.CapsuleGeometry(0.075, 0.22, 8, 10),
  earringSphere: new THREE.SphereGeometry(0.026, 8, 8),

  // Limbs
  legCyl: new THREE.CylinderGeometry(0.072, 0.064, 0.22, 12),
  bootSphere: new THREE.BoxGeometry(0.11, 0.08, 0.16),
  armCyl: new THREE.CylinderGeometry(0.058, 0.05, 0.23, 10),
  cuffCyl: new THREE.CylinderGeometry(0.056, 0.056, 0.04, 10),
  handSphere: new THREE.SphereGeometry(0.055, 10, 10),

  // Pawn Geometries
  pawnTorso: new THREE.CylinderGeometry(0.16, 0.19, 0.34, 16),
  pawnBelt: new THREE.CylinderGeometry(0.195, 0.195, 0.05, 16),
  pawnBuckle: new THREE.BoxGeometry(0.07, 0.055, 0.03),
  pawnCape: new THREE.BoxGeometry(0.32, 0.36, 0.03),
  pawnHelmDome: new THREE.SphereGeometry(0.245, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.56),
  pawnHelmRim: new THREE.TorusGeometry(0.24, 0.018, 8, 20),
  smallBadgeCyl: new THREE.CylinderGeometry(0.065, 0.065, 0.02, 16),
  rifleReceiver: new THREE.BoxGeometry(0.32, 0.075, 0.05),
  rifleStock: new THREE.BoxGeometry(0.18, 0.065, 0.045),
  rifleHandguard: new THREE.BoxGeometry(0.14, 0.055, 0.045),
  rifleBarrel: new THREE.CylinderGeometry(0.014, 0.014, 0.22, 8),
  rifleMag: new THREE.BoxGeometry(0.05, 0.13, 0.038),
  muzzleFlashCone: new THREE.ConeGeometry(0.065, 0.19, 8),

  // Rook Geometries
  rookBaseRing: new THREE.CylinderGeometry(0.31, 0.35, 0.14, 20),
  rookCollar1: new THREE.TorusGeometry(0.31, 0.025, 8, 20),
  rookShaft: new THREE.CylinderGeometry(0.26, 0.3, 0.62, 20),
  rookCollar2: new THREE.TorusGeometry(0.28, 0.028, 8, 20),
  rookTurretHead: new THREE.CylinderGeometry(0.33, 0.28, 0.18, 20),
  rookMerlon: new THREE.BoxGeometry(0.11, 0.11, 0.08),
  rookMerlonGold: new THREE.BoxGeometry(0.115, 0.025, 0.085),
  rookCrossbar: new THREE.CylinderGeometry(0.018, 0.018, 0.38, 8),
  rookBannerCloth: new THREE.BoxGeometry(0.3, 0.44, 0.02),
  rookBannerTip: new THREE.ConeGeometry(0.16, 0.12, 4),

  // Knight Geometries
  knightCloak: new THREE.CylinderGeometry(0.24, 0.34, 0.48, 20),
  knightCloakRim: new THREE.TorusGeometry(0.33, 0.025, 8, 20),
  knightNeck: new THREE.CylinderGeometry(0.16, 0.24, 0.56, 16),
  knightCranium: new THREE.SphereGeometry(0.17, 14, 14),
  knightMuzzle: new THREE.CylinderGeometry(0.095, 0.145, 0.3, 14),
  knightMuzzleTip: new THREE.SphereGeometry(0.095, 12, 10),
  knightEar: new THREE.ConeGeometry(0.045, 0.14, 8),
  knightEye: new THREE.SphereGeometry(0.028, 8, 8),
  knightNoseBand: new THREE.TorusGeometry(0.105, 0.015, 8, 16),
  knightBitRing: new THREE.TorusGeometry(0.028, 0.008, 6, 10),
  knightManeLock: new THREE.ConeGeometry(0.075, 0.22, 8),

  // Bishop Geometries
  bishopRobe: new THREE.CylinderGeometry(0.16, 0.26, 0.5, 16),
  bishopMantle: new THREE.CylinderGeometry(0.17, 0.22, 0.28, 16),
  bishopBelt: new THREE.CylinderGeometry(0.205, 0.205, 0.045, 16),
  mitreBase: new THREE.CylinderGeometry(0.22, 0.21, 0.08, 16),
  mitrePeak: new THREE.ConeGeometry(0.22, 0.36, 16),
  mitreStripe: new THREE.BoxGeometry(0.035, 0.32, 0.02),
  staffShaft: new THREE.CylinderGeometry(0.022, 0.02, 0.88, 10),
  staffHalo: new THREE.TorusGeometry(0.085, 0.018, 8, 16),
  staffCrossV: new THREE.BoxGeometry(0.028, 0.16, 0.025),
  staffCrossH: new THREE.BoxGeometry(0.14, 0.028, 0.025),

  // Queen Geometries
  queenSkirt: new THREE.ConeGeometry(0.34, 0.56, 20),
  queenBodice: new THREE.CylinderGeometry(0.15, 0.13, 0.24, 16),
  queenBelt: new THREE.TorusGeometry(0.145, 0.02, 8, 16),
  queenSkirtEmblem: new THREE.CylinderGeometry(0.095, 0.095, 0.02, 18),
  queenCape: new THREE.ConeGeometry(0.36, 0.58, 14, 1, true, Math.PI * 0.65, Math.PI * 0.7),
  queenCrownBand: new THREE.CylinderGeometry(0.16, 0.15, 0.08, 16),
  queenCrownPoint: new THREE.ConeGeometry(0.032, 0.11, 6),
  queenCrownTip: new THREE.SphereGeometry(0.018, 6, 6),
  gemOcta: new THREE.OctahedronGeometry(0.034, 0),

  // King Geometries
  kingCoat: new THREE.CylinderGeometry(0.18, 0.24, 0.44, 16),
  kingBelt: new THREE.CylinderGeometry(0.215, 0.215, 0.05, 16),
  kingChestEmblem: new THREE.CylinderGeometry(0.085, 0.085, 0.025, 18),
  kingCape: new THREE.ConeGeometry(0.38, 0.58, 16, 1, true, Math.PI * 0.55, Math.PI * 0.9),
  kingCapeCollar: new THREE.TorusGeometry(0.19, 0.035, 8, 16),
  kingCrownBase: new THREE.CylinderGeometry(0.2, 0.175, 0.12, 16),
  kingCrownSpire: new THREE.ConeGeometry(0.038, 0.13, 6),
  kingCrossV: new THREE.BoxGeometry(0.04, 0.15, 0.04),
  kingCrossH: new THREE.BoxGeometry(0.12, 0.04, 0.04),
  scepterShaft: new THREE.CylinderGeometry(0.024, 0.02, 0.92, 10),
  scepterCrossV: new THREE.BoxGeometry(0.03, 0.18, 0.03),
  scepterCrossH: new THREE.BoxGeometry(0.14, 0.03, 0.03),
};

// Shared static materials (created once for the entire app)
let staticMats: {
  shadowMat: THREE.MeshBasicMaterial;
  whiteClothMat: THREE.MeshStandardMaterial;
  indiaGreenMat: THREE.MeshStandardMaterial;
  goldArmorMat: THREE.MeshStandardMaterial;
  skinMat: THREE.MeshStandardMaterial;
  hairDarkMat: THREE.MeshStandardMaterial;
  queenHairMat: THREE.MeshStandardMaterial;
  darkBootMat: THREE.MeshStandardMaterial;
  gunMetalMat: THREE.MeshStandardMaterial;
  woodStockMat: THREE.MeshStandardMaterial;
  eyeWhiteMat: THREE.MeshBasicMaterial;
  irisMat: THREE.MeshBasicMaterial;
  pupilMat: THREE.MeshBasicMaterial;
  sapphireMat: THREE.MeshBasicMaterial;
  emeraldMat: THREE.MeshBasicMaterial;
  muzzleFlashMat: THREE.MeshBasicMaterial;
} | null = null;

function getStaticMats() {
  if (staticMats) return staticMats;
  staticMats = {
    shadowMat: new THREE.MeshBasicMaterial({
      map: getContactShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    }),
    whiteClothMat: new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35,
      metalness: 0.08,
    }),
    indiaGreenMat: new THREE.MeshStandardMaterial({
      color: 0x138808,
      roughness: 0.32,
      metalness: 0.15,
    }),
    goldArmorMat: new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.2,
      metalness: 0.85,
    }),
    skinMat: new THREE.MeshStandardMaterial({
      color: 0xf6c39d,
      roughness: 0.45,
      metalness: 0.04,
    }),
    hairDarkMat: new THREE.MeshStandardMaterial({
      color: 0x1c1411,
      roughness: 0.55,
      metalness: 0.08,
    }),
    queenHairMat: new THREE.MeshStandardMaterial({
      color: 0x2c1810,
      roughness: 0.4,
      metalness: 0.12,
    }),
    darkBootMat: new THREE.MeshStandardMaterial({
      color: 0x2a1a12,
      roughness: 0.55,
      metalness: 0.15,
    }),
    gunMetalMat: new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.28,
      metalness: 0.78,
    }),
    woodStockMat: new THREE.MeshStandardMaterial({
      color: 0x7c3f16,
      roughness: 0.5,
      metalness: 0.1,
    }),
    eyeWhiteMat: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    irisMat: new THREE.MeshBasicMaterial({ color: 0x3b1e0e }),
    pupilMat: new THREE.MeshBasicMaterial({ color: 0x09080d }),
    sapphireMat: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
    emeraldMat: new THREE.MeshBasicMaterial({ color: 0x10b981 }),
    muzzleFlashMat: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
  };
  return staticMats;
}

const emblemCache = new Map<string, THREE.CanvasTexture>();
const flagBannerCache = new Map<string, THREE.CanvasTexture>();
const countryMatCache = new Map<
  string,
  {
    primaryMat: THREE.MeshStandardMaterial;
    secondaryMat: THREE.MeshStandardMaterial;
    emblemMat: THREE.MeshStandardMaterial;
    bannerMat: THREE.MeshStandardMaterial;
  }
>();

export function drawCountrySymbol(
  ctx: CanvasRenderingContext2D,
  country: CountryConfig,
  cx: number,
  cy: number,
  radius: number
) {
  if (country.id === 'bangladesh') {
    ctx.fillStyle = '#006a4e';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f42a41';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.68, 0, Math.PI * 2);
    ctx.fill();
  } else if (country.id === 'india') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    const chakraR = radius * 0.76;
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = Math.max(2, radius * 0.1);
    ctx.beginPath();
    ctx.arc(cx, cy, chakraR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(cx, cy, chakraR * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = Math.max(1.2, radius * 0.045);
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI * 2) / 24;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * chakraR, cy + Math.sin(a) * chakraR);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = country.primaryColor;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = country.secondaryColor;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.68, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = country.accentColor;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.36, 0, Math.PI * 2);
    ctx.fill();
  }
}

function getCountryEmblemTexture(country: CountryConfig): THREE.CanvasTexture {
  if (emblemCache.has(country.id)) return emblemCache.get(country.id)!;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  drawCountrySymbol(ctx, country, 64, 64, 56);

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(64, 64, 58, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  emblemCache.set(country.id, tex);
  return tex;
}

function getCountryBannerTexture(country: CountryConfig): THREE.CanvasTexture {
  if (flagBannerCache.has(country.id)) return flagBannerCache.get(country.id)!;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  if (country.id === 'bangladesh') {
    ctx.fillStyle = '#006a4e';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#f42a41';
    ctx.beginPath();
    ctx.arc(64, 64, 31, 0, Math.PI * 2);
    ctx.fill();
  } else if (country.id === 'india') {
    ctx.fillStyle = '#ff7722';
    ctx.fillRect(0, 0, 128, 42);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 42, 128, 44);
    ctx.fillStyle = '#138808';
    ctx.fillRect(0, 86, 128, 42);
    drawCountrySymbol(ctx, country, 64, 64, 21);
  } else {
    ctx.fillStyle = country.primaryColor;
    ctx.fillRect(0, 0, 128, 42);
    ctx.fillStyle = country.secondaryColor;
    ctx.fillRect(0, 42, 128, 44);
    ctx.fillStyle = country.primaryColor;
    ctx.fillRect(0, 86, 128, 42);
    drawCountrySymbol(ctx, country, 64, 64, 23);
  }

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 122, 122);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  flagBannerCache.set(country.id, tex);
  return tex;
}

function getCountryMats(country: CountryConfig) {
  if (countryMatCache.has(country.id)) return countryMatCache.get(country.id)!;
  const mats = {
    primaryMat: new THREE.MeshStandardMaterial({
      color: new THREE.Color(country.primaryColor),
      roughness: 0.32,
      metalness: 0.15,
    }),
    secondaryMat: new THREE.MeshStandardMaterial({
      color: new THREE.Color(country.secondaryColor),
      roughness: 0.35,
      metalness: 0.12,
    }),
    emblemMat: new THREE.MeshStandardMaterial({
      map: getCountryEmblemTexture(country),
      roughness: 0.25,
      metalness: 0.15,
    }),
    bannerMat: new THREE.MeshStandardMaterial({
      map: getCountryBannerTexture(country),
      roughness: 0.3,
      metalness: 0.12,
      side: THREE.DoubleSide,
    }),
  };
  countryMatCache.set(country.id, mats);
  return mats;
}

export function buildCartoonSoldier(
  type: PieceSymbol,
  teamColor: Color,
  country: CountryConfig
): SoldierRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  const headGroup = new THREE.Group();
  const rightArm = new THREE.Group();
  const leftArm = new THREE.Group();
  const weaponGroup = new THREE.Group();
  const gunGroup = new THREE.Group();

  const sm = getStaticMats();
  const cm = getCountryMats(country);
  const { primaryMat, secondaryMat, emblemMat, bannerMat } = cm;
  const {
    whiteClothMat,
    indiaGreenMat,
    goldArmorMat,
    skinMat,
    hairDarkMat,
    queenHairMat,
    darkBootMat,
    gunMetalMat,
    woodStockMat,
    eyeWhiteMat,
    irisMat,
    pupilMat,
    sapphireMat,
    emeraldMat,
    muzzleFlashMat,
  } = sm;

  // Build 3D Tactical Gun + Muzzle Flash inside gunGroup (used by all pieces to shoot & kill enemies)
  const receiver = new THREE.Mesh(sharedGeos.rifleReceiver, gunMetalMat);
  gunGroup.add(receiver);

  const stock = new THREE.Mesh(sharedGeos.rifleStock, woodStockMat);
  stock.position.set(-0.22, -0.01, 0);
  gunGroup.add(stock);

  const handguard = new THREE.Mesh(sharedGeos.rifleHandguard, woodStockMat);
  handguard.position.set(0.2, 0.005, 0);
  gunGroup.add(handguard);

  const barrel = new THREE.Mesh(sharedGeos.rifleBarrel, gunMetalMat);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(0.34, 0.015, 0);
  gunGroup.add(barrel);

  const magazine = new THREE.Mesh(sharedGeos.rifleMag, gunMetalMat);
  magazine.position.set(0.04, -0.08, 0);
  magazine.rotation.z = 0.25;
  gunGroup.add(magazine);

  const muzzleFlash = new THREE.Mesh(sharedGeos.muzzleFlashCone, muzzleFlashMat);
  muzzleFlash.rotation.z = -Math.PI / 2;
  muzzleFlash.position.set(0.52, 0.015, 0);
  muzzleFlash.visible = false;
  gunGroup.add(muzzleFlash);

  const uniformSecondaryMat = country.id === 'india' ? whiteClothMat : secondaryMat;

  // Contact shadow flush on the board
  const shadowMesh = new THREE.Mesh(sharedGeos.shadowPlane, sm.shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.01;
  root.add(shadowMesh);

  // =========================================================================
  // 1. MULTI-TIERED PEDESTAL BASE WITH FRONT COUNTRY EMBLEM MEDALLION
  // =========================================================================
  const baseBottomGold = new THREE.Mesh(sharedGeos.baseGoldBottom, goldArmorMat);
  baseBottomGold.position.y = 0.022;
  baseBottomGold.receiveShadow = true;
  root.add(baseBottomGold);

  const baseMainBand = new THREE.Mesh(
    sharedGeos.baseMainBand,
    country.id === 'india' ? indiaGreenMat : primaryMat
  );
  baseMainBand.position.y = 0.1;
  baseMainBand.castShadow = true;
  baseMainBand.receiveShadow = true;
  root.add(baseMainBand);

  const baseTopGold = new THREE.Mesh(sharedGeos.baseGoldTop, goldArmorMat);
  baseTopGold.position.y = 0.175;
  root.add(baseTopGold);

  const baseInnerStep = new THREE.Mesh(
    sharedGeos.baseInnerStep,
    teamColor === 'w' ? whiteClothMat : primaryMat
  );
  baseInnerStep.position.y = 0.205;
  root.add(baseInnerStep);

  for (const zDir of [1, -1]) {
    const med = new THREE.Mesh(sharedGeos.baseMedallion, emblemMat);
    med.rotation.x = Math.PI / 2;
    med.position.set(0, 0.1, zDir * 0.43);
    root.add(med);

    const medRim = new THREE.Mesh(sharedGeos.baseMedallionRim, goldArmorMat);
    medRim.position.set(0, 0.1, zDir * 0.435);
    root.add(medRim);
  }

  const scaleMap: Record<PieceSymbol, number> = {
    p: 0.92,
    r: 1.0,
    n: 1.02,
    b: 1.04,
    q: 1.1,
    k: 1.16,
  };
  bodyGroup.scale.setScalar(scaleMap[type]);
  bodyGroup.position.y = 0.22;
  root.add(bodyGroup);

  const buildChibiHead = (
    headY: number,
    options: { isFemale?: boolean; hasBeard?: boolean; fierceBrows?: boolean } = {}
  ) => {
    headGroup.position.set(0, headY, 0);
    bodyGroup.add(headGroup);

    const headMesh = new THREE.Mesh(sharedGeos.chibiHead, skinMat);
    headMesh.scale.set(1.06, 0.98, 1.02);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    const leftEar = new THREE.Mesh(sharedGeos.earSphere, skinMat);
    leftEar.position.set(-0.22, -0.01, 0);
    headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(sharedGeos.earSphere, skinMat);
    rightEar.position.set(0.22, -0.01, 0);
    headGroup.add(rightEar);

    for (const side of [-1, 1]) {
      const ex = side * 0.082;
      const eyeWhite = new THREE.Mesh(sharedGeos.eyeSocket, eyeWhiteMat);
      eyeWhite.scale.set(1.0, 1.15, 0.6);
      eyeWhite.position.set(ex, 0.015, 0.195);
      headGroup.add(eyeWhite);

      const iris = new THREE.Mesh(sharedGeos.irisSphere, irisMat);
      iris.scale.set(1.0, 1.1, 0.5);
      iris.position.set(ex, 0.015, 0.212);
      headGroup.add(iris);

      const pupil = new THREE.Mesh(sharedGeos.pupilSphere, pupilMat);
      pupil.position.set(ex, 0.015, 0.224);
      headGroup.add(pupil);

      const catchlight = new THREE.Mesh(sharedGeos.catchlightSphere, eyeWhiteMat);
      catchlight.position.set(ex - 0.012, 0.032, 0.232);
      headGroup.add(catchlight);

      const brow = new THREE.Mesh(sharedGeos.browBox, hairDarkMat);
      brow.position.set(ex, 0.085, 0.205);
      brow.rotation.z = options.fierceBrows ? side * 0.22 : side * 0.06;
      headGroup.add(brow);
    }

    const nose = new THREE.Mesh(sharedGeos.noseSphere, skinMat);
    nose.position.set(0, -0.02, 0.225);
    headGroup.add(nose);

    if (options.hasBeard) {
      const mustache = new THREE.Mesh(sharedGeos.mustacheBox, hairDarkMat);
      mustache.position.set(0, -0.065, 0.21);
      headGroup.add(mustache);

      const fullBeard = new THREE.Mesh(sharedGeos.fullBeardSphere, hairDarkMat);
      fullBeard.scale.set(1.04, 1.05, 1.08);
      fullBeard.position.set(0, -0.01, 0.02);
      headGroup.add(fullBeard);

      const chinTuft = new THREE.Mesh(sharedGeos.chinTuftBox, hairDarkMat);
      chinTuft.position.set(0, -0.17, 0.14);
      headGroup.add(chinTuft);
    }

    if (options.isFemale) {
      const hairBack = new THREE.Mesh(sharedGeos.queenHairBack, queenHairMat);
      hairBack.position.set(0, 0.02, -0.04);
      headGroup.add(hairBack);

      for (const side of [-1, 1]) {
        const sideWave = new THREE.Mesh(sharedGeos.queenHairWave, queenHairMat);
        sideWave.position.set(side * 0.19, -0.06, 0.04);
        sideWave.rotation.z = side * 0.2;
        headGroup.add(sideWave);

        const earring = new THREE.Mesh(sharedGeos.earringSphere, goldArmorMat);
        earring.position.set(side * 0.225, -0.06, 0.02);
        headGroup.add(earring);
      }
    }
  };

  const addChibiLegs = (legMat: THREE.Material) => {
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(sharedGeos.legCyl, legMat);
      leg.position.set(side * 0.095, 0.15, 0);
      leg.castShadow = true;
      bodyGroup.add(leg);

      const boot = new THREE.Mesh(sharedGeos.bootSphere, darkBootMat);
      boot.position.set(side * 0.095, 0.04, 0.025);
      bodyGroup.add(boot);
    }
  };

  const attachChibiArms = (shoulderY: number, spread: number, sleeveMat: THREE.Material) => {
    rightArm.position.set(spread, shoulderY, 0);
    leftArm.position.set(-spread, shoulderY, 0);
    bodyGroup.add(rightArm);
    bodyGroup.add(leftArm);

    for (const arm of [rightArm, leftArm]) {
      const sleeve = new THREE.Mesh(sharedGeos.armCyl, sleeveMat);
      sleeve.position.set(0, -0.1, 0);
      sleeve.castShadow = true;
      arm.add(sleeve);

      const cuff = new THREE.Mesh(sharedGeos.cuffCyl, goldArmorMat);
      cuff.position.set(0, -0.19, 0);
      arm.add(cuff);

      const hand = new THREE.Mesh(sharedGeos.handSphere, skinMat);
      hand.position.set(0, -0.23, 0.02);
      arm.add(hand);
    }

    weaponGroup.position.set(0, -0.22, 0.04);
    rightArm.add(weaponGroup);
  };

  if (type === 'p') {
    // PAWN: Chibi Commando / Infantry Soldier with Rounded Flag Helmet & Rifle
    addChibiLegs(primaryMat);

    const torso = new THREE.Mesh(sharedGeos.pawnTorso, primaryMat);
    torso.position.y = 0.4;
    torso.castShadow = true;
    bodyGroup.add(torso);

    const belt = new THREE.Mesh(sharedGeos.pawnBelt, darkBootMat);
    belt.position.y = 0.28;
    bodyGroup.add(belt);

    const buckle = new THREE.Mesh(sharedGeos.pawnBuckle, goldArmorMat);
    buckle.position.set(0, 0.28, 0.19);
    bodyGroup.add(buckle);

    const pawnCape = new THREE.Mesh(sharedGeos.pawnCape, secondaryMat);
    pawnCape.position.set(0, 0.36, -0.16);
    pawnCape.rotation.x = 0.15;
    bodyGroup.add(pawnCape);

    buildChibiHead(0.74, { fierceBrows: true });

    const domeHelm = new THREE.Mesh(sharedGeos.pawnHelmDome, primaryMat);
    domeHelm.position.y = 0.02;
    domeHelm.castShadow = true;
    headGroup.add(domeHelm);

    const helmRim = new THREE.Mesh(sharedGeos.pawnHelmRim, uniformSecondaryMat);
    helmRim.rotation.x = Math.PI / 2;
    helmRim.position.y = 0.01;
    headGroup.add(helmRim);

    const helmBadge = new THREE.Mesh(sharedGeos.smallBadgeCyl, emblemMat);
    helmBadge.rotation.x = Math.PI / 2 - 0.25;
    helmBadge.position.set(0, 0.13, 0.225);
    headGroup.add(helmBadge);

    attachChibiArms(0.52, 0.21, primaryMat);

    rightArm.rotation.x = -0.75;
    rightArm.rotation.z = -0.35;
    leftArm.rotation.x = -0.85;
    leftArm.rotation.z = 0.4;

    gunGroup.position.set(0, 0.38, 0.23);
    gunGroup.rotation.z = -0.42;
    bodyGroup.add(gunGroup);
  } else if (type === 'r') {
    // ROOK: 3D Castle Tower with Crenellated Battlements & Hanging Flag Banner
    const towerBaseRing = new THREE.Mesh(sharedGeos.rookBaseRing, secondaryMat);
    towerBaseRing.position.y = 0.07;
    towerBaseRing.castShadow = true;
    bodyGroup.add(towerBaseRing);

    const towerGoldCollar1 = new THREE.Mesh(sharedGeos.rookCollar1, goldArmorMat);
    towerGoldCollar1.rotation.x = Math.PI / 2;
    towerGoldCollar1.position.y = 0.14;
    bodyGroup.add(towerGoldCollar1);

    const towerShaft = new THREE.Mesh(sharedGeos.rookShaft, uniformSecondaryMat);
    towerShaft.position.y = 0.45;
    towerShaft.castShadow = true;
    towerShaft.receiveShadow = true;
    bodyGroup.add(towerShaft);

    const towerGoldCollar2 = new THREE.Mesh(sharedGeos.rookCollar2, goldArmorMat);
    towerGoldCollar2.rotation.x = Math.PI / 2;
    towerGoldCollar2.position.y = 0.76;
    bodyGroup.add(towerGoldCollar2);

    const turretHead = new THREE.Mesh(sharedGeos.rookTurretHead, primaryMat);
    turretHead.position.y = 0.85;
    turretHead.castShadow = true;
    bodyGroup.add(turretHead);

    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      const merlon = new THREE.Mesh(sharedGeos.rookMerlon, primaryMat);
      merlon.position.set(Math.cos(a) * 0.28, 0.98, Math.sin(a) * 0.28);
      merlon.rotation.y = -a;
      bodyGroup.add(merlon);

      const merlonGold = new THREE.Mesh(sharedGeos.rookMerlonGold, goldArmorMat);
      merlonGold.position.set(Math.cos(a) * 0.28, 1.04, Math.sin(a) * 0.28);
      merlonGold.rotation.y = -a;
      bodyGroup.add(merlonGold);
    }

    const crossbar = new THREE.Mesh(sharedGeos.rookCrossbar, goldArmorMat);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, 0.68, 0.29);
    bodyGroup.add(crossbar);

    const bannerCloth = new THREE.Mesh(sharedGeos.rookBannerCloth, bannerMat);
    bannerCloth.position.set(0, 0.45, 0.29);
    bannerCloth.castShadow = true;
    bodyGroup.add(bannerCloth);

    const bannerTip = new THREE.Mesh(sharedGeos.rookBannerTip, goldArmorMat);
    bannerTip.rotation.x = Math.PI;
    bannerTip.rotation.y = Math.PI / 4;
    bannerTip.position.set(0, 0.19, 0.29);
    bodyGroup.add(bannerTip);

    headGroup.position.set(0, 0.85, 0);
    bodyGroup.add(headGroup);
    bodyGroup.add(rightArm);
    bodyGroup.add(leftArm);
  } else if (type === 'n') {
    // KNIGHT: 3D Chess Warhorse Bust with Country-Colored Mane & Flag Cloak
    const horseCloak = new THREE.Mesh(sharedGeos.knightCloak, bannerMat);
    horseCloak.position.set(0, 0.24, 0);
    horseCloak.castShadow = true;
    bodyGroup.add(horseCloak);

    const cloakRim = new THREE.Mesh(sharedGeos.knightCloakRim, goldArmorMat);
    cloakRim.rotation.x = Math.PI / 2;
    cloakRim.position.y = 0.02;
    bodyGroup.add(cloakRim);

    const horseNeck = new THREE.Mesh(sharedGeos.knightNeck, whiteClothMat);
    horseNeck.position.set(0, 0.58, -0.02);
    horseNeck.rotation.x = 0.22;
    horseNeck.castShadow = true;
    bodyGroup.add(horseNeck);

    headGroup.position.set(0, 0.84, 0.06);
    bodyGroup.add(headGroup);

    const horseCranium = new THREE.Mesh(sharedGeos.knightCranium, whiteClothMat);
    horseCranium.scale.set(0.92, 1.0, 1.15);
    horseCranium.castShadow = true;
    headGroup.add(horseCranium);

    const horseMuzzle = new THREE.Mesh(sharedGeos.knightMuzzle, whiteClothMat);
    horseMuzzle.rotation.x = Math.PI / 2 + 0.38;
    horseMuzzle.position.set(0, -0.06, 0.18);
    horseMuzzle.castShadow = true;
    headGroup.add(horseMuzzle);

    const muzzleTip = new THREE.Mesh(sharedGeos.knightMuzzleTip, whiteClothMat);
    muzzleTip.position.set(0, -0.12, 0.3);
    headGroup.add(muzzleTip);

    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(sharedGeos.knightEar, whiteClothMat);
      ear.position.set(side * 0.09, 0.19, -0.02);
      ear.rotation.z = -side * 0.18;
      ear.rotation.x = 0.2;
      headGroup.add(ear);

      const eye = new THREE.Mesh(sharedGeos.knightEye, hairDarkMat);
      eye.position.set(side * 0.135, 0.04, 0.08);
      headGroup.add(eye);
    }

    const noseBand = new THREE.Mesh(sharedGeos.knightNoseBand, primaryMat);
    noseBand.rotation.x = 0.38;
    noseBand.position.set(0, -0.09, 0.24);
    headGroup.add(noseBand);

    for (const side of [-1, 1]) {
      const bitRing = new THREE.Mesh(sharedGeos.knightBitRing, goldArmorMat);
      bitRing.rotation.y = Math.PI / 2;
      bitRing.position.set(side * 0.11, -0.11, 0.24);
      headGroup.add(bitRing);
    }

    for (let i = 0; i < 6; i++) {
      const lock = new THREE.Mesh(sharedGeos.knightManeLock, primaryMat);
      lock.position.set(0, 0.88 - i * 0.1, -0.12 - i * 0.02);
      lock.rotation.x = -0.65;
      bodyGroup.add(lock);
    }

    bodyGroup.add(rightArm);
    bodyGroup.add(leftArm);
  } else if (type === 'b') {
    // BISHOP: Chibi Royal Cleric with Tall Mitre Hat, Tunic Robe & Golden Cross-Ring Staff
    addChibiLegs(primaryMat);

    const robeSkirt = new THREE.Mesh(sharedGeos.bishopRobe, uniformSecondaryMat);
    robeSkirt.position.y = 0.3;
    robeSkirt.castShadow = true;
    bodyGroup.add(robeSkirt);

    const mantle = new THREE.Mesh(sharedGeos.bishopMantle, primaryMat);
    mantle.position.y = 0.44;
    bodyGroup.add(mantle);

    const belt = new THREE.Mesh(sharedGeos.bishopBelt, goldArmorMat);
    belt.position.y = 0.32;
    bodyGroup.add(belt);

    const chestEmblem = new THREE.Mesh(sharedGeos.baseMedallion, emblemMat);
    chestEmblem.rotation.x = Math.PI / 2;
    chestEmblem.position.set(0, 0.44, 0.195);
    bodyGroup.add(chestEmblem);

    buildChibiHead(0.75, { fierceBrows: false });

    const mitreBase = new THREE.Mesh(sharedGeos.mitreBase, goldArmorMat);
    mitreBase.position.y = 0.14;
    headGroup.add(mitreBase);

    const mitrePeak = new THREE.Mesh(sharedGeos.mitrePeak, uniformSecondaryMat);
    mitrePeak.scale.set(1.0, 1.0, 0.78);
    mitrePeak.position.y = 0.34;
    mitrePeak.castShadow = true;
    headGroup.add(mitrePeak);

    const mitreStripe = new THREE.Mesh(sharedGeos.mitreStripe, goldArmorMat);
    mitreStripe.position.set(0, 0.31, 0.14);
    mitreStripe.rotation.x = -0.32;
    headGroup.add(mitreStripe);

    const mitreEmblem = new THREE.Mesh(sharedGeos.smallBadgeCyl, emblemMat);
    mitreEmblem.rotation.x = Math.PI / 2 - 0.3;
    mitreEmblem.position.set(0, 0.28, 0.155);
    headGroup.add(mitreEmblem);

    attachChibiArms(0.52, 0.22, primaryMat);

    const staffShaft = new THREE.Mesh(sharedGeos.staffShaft, goldArmorMat);
    staffShaft.position.set(0, 0.2, 0.06);
    staffShaft.castShadow = true;
    weaponGroup.add(staffShaft);

    const staffHalo = new THREE.Mesh(sharedGeos.staffHalo, goldArmorMat);
    staffHalo.position.set(0, 0.68, 0.06);
    weaponGroup.add(staffHalo);

    const crossV = new THREE.Mesh(sharedGeos.staffCrossV, goldArmorMat);
    crossV.position.set(0, 0.68, 0.06);
    weaponGroup.add(crossV);

    const crossH = new THREE.Mesh(sharedGeos.staffCrossH, goldArmorMat);
    crossH.position.set(0, 0.68, 0.06);
    weaponGroup.add(crossH);
  } else if (type === 'q') {
    // QUEEN: Chibi Royal Queen with Wavy Hair, Crown, Gown & Country Emblem
    const gownSkirt = new THREE.Mesh(sharedGeos.queenSkirt, uniformSecondaryMat);
    gownSkirt.position.y = 0.28;
    gownSkirt.castShadow = true;
    bodyGroup.add(gownSkirt);

    const gownHem = new THREE.Mesh(sharedGeos.knightCloakRim, goldArmorMat);
    gownHem.rotation.x = Math.PI / 2;
    gownHem.position.y = 0.025;
    bodyGroup.add(gownHem);

    const bodice = new THREE.Mesh(sharedGeos.queenBodice, primaryMat);
    bodice.position.y = 0.48;
    bodice.castShadow = true;
    bodyGroup.add(bodice);

    const waistBelt = new THREE.Mesh(sharedGeos.queenBelt, goldArmorMat);
    waistBelt.rotation.x = Math.PI / 2;
    waistBelt.position.y = 0.38;
    bodyGroup.add(waistBelt);

    const skirtEmblem = new THREE.Mesh(sharedGeos.queenSkirtEmblem, emblemMat);
    skirtEmblem.rotation.x = Math.PI / 2 - 0.42;
    skirtEmblem.position.set(0, 0.22, 0.22);
    bodyGroup.add(skirtEmblem);

    const queenCape = new THREE.Mesh(sharedGeos.queenCape, secondaryMat);
    queenCape.position.set(0, 0.29, -0.02);
    bodyGroup.add(queenCape);

    buildChibiHead(0.76, { isFemale: true, fierceBrows: false });

    const crownBand = new THREE.Mesh(sharedGeos.queenCrownBand, goldArmorMat);
    crownBand.position.y = 0.19;
    headGroup.add(crownBand);

    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      const point = new THREE.Mesh(sharedGeos.queenCrownPoint, goldArmorMat);
      point.position.set(Math.cos(a) * 0.145, 0.27, Math.sin(a) * 0.145);
      headGroup.add(point);

      const tipBall = new THREE.Mesh(sharedGeos.queenCrownTip, goldArmorMat);
      tipBall.position.set(Math.cos(a) * 0.145, 0.33, Math.sin(a) * 0.145);
      headGroup.add(tipBall);
    }

    const crownGem = new THREE.Mesh(sharedGeos.gemOcta, sapphireMat);
    crownGem.position.set(0, 0.21, 0.155);
    headGroup.add(crownGem);

    attachChibiArms(0.52, 0.19, primaryMat);
    rightArm.rotation.z = -0.22;
    leftArm.rotation.z = 0.22;
  } else {
    // KING: Heroic Chibi Bearded Monarch with Grand Crown, Mantle Cape & Golden Scepter
    addChibiLegs(primaryMat);

    const kingCoat = new THREE.Mesh(sharedGeos.kingCoat, uniformSecondaryMat);
    kingCoat.position.y = 0.35;
    kingCoat.castShadow = true;
    bodyGroup.add(kingCoat);

    const kingBelt = new THREE.Mesh(sharedGeos.kingBelt, goldArmorMat);
    kingBelt.position.y = 0.32;
    bodyGroup.add(kingBelt);

    const kingChestEmblem = new THREE.Mesh(sharedGeos.kingChestEmblem, emblemMat);
    kingChestEmblem.rotation.x = Math.PI / 2;
    kingChestEmblem.position.set(0, 0.45, 0.2);
    bodyGroup.add(kingChestEmblem);

    const kingCape = new THREE.Mesh(sharedGeos.kingCape, secondaryMat);
    kingCape.position.set(0, 0.31, -0.04);
    kingCape.castShadow = true;
    bodyGroup.add(kingCape);

    const capeCollar = new THREE.Mesh(sharedGeos.kingCapeCollar, secondaryMat);
    capeCollar.rotation.x = Math.PI / 2;
    capeCollar.position.y = 0.57;
    bodyGroup.add(capeCollar);

    buildChibiHead(0.78, { hasBeard: true, fierceBrows: true });

    const impCrownBase = new THREE.Mesh(sharedGeos.kingCrownBase, goldArmorMat);
    impCrownBase.position.y = 0.18;
    impCrownBase.castShadow = true;
    headGroup.add(impCrownBase);

    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      const spire = new THREE.Mesh(sharedGeos.kingCrownSpire, goldArmorMat);
      spire.position.set(Math.cos(a) * 0.18, 0.28, Math.sin(a) * 0.18);
      headGroup.add(spire);
    }

    const crossVert = new THREE.Mesh(sharedGeos.kingCrossV, goldArmorMat);
    crossVert.position.y = 0.38;
    headGroup.add(crossVert);

    const crossHoriz = new THREE.Mesh(sharedGeos.kingCrossH, goldArmorMat);
    crossHoriz.position.y = 0.39;
    headGroup.add(crossHoriz);

    const centerGem = new THREE.Mesh(sharedGeos.gemOcta, emeraldMat);
    centerGem.position.set(0, 0.19, 0.19);
    headGroup.add(centerGem);

    attachChibiArms(0.55, 0.23, uniformSecondaryMat);

    const scepterShaft = new THREE.Mesh(sharedGeos.scepterShaft, goldArmorMat);
    scepterShaft.position.set(0, 0.22, 0.06);
    scepterShaft.castShadow = true;
    weaponGroup.add(scepterShaft);

    const scepterOrb = new THREE.Mesh(sharedGeos.staffHalo, goldArmorMat);
    scepterOrb.position.set(0, 0.72, 0.06);
    weaponGroup.add(scepterOrb);

    const scepterCrossV = new THREE.Mesh(sharedGeos.scepterCrossV, goldArmorMat);
    scepterCrossV.position.set(0, 0.74, 0.06);
    weaponGroup.add(scepterCrossV);

    const scepterCrossH = new THREE.Mesh(sharedGeos.scepterCrossH, goldArmorMat);
    scepterCrossH.position.set(0, 0.74, 0.06);
    weaponGroup.add(scepterCrossH);
  }

  // For non-Pawn pieces, mount the tactical gun in their left hand (or side turret for Rook/Knight)
  // so every piece can raise their gun, aim straight at the enemy, and fire bullets during capture!
  if (type !== 'p') {
    if (type === 'r' || type === 'n') {
      leftArm.position.set(-0.24, 0.52, 0.08);
      gunGroup.scale.setScalar(0.85);
      gunGroup.position.set(0, 0, 0.14);
      gunGroup.rotation.y = -Math.PI / 2;
      gunGroup.visible = false; // Pops out when aiming & shooting
      leftArm.add(gunGroup);
    } else {
      // Bishop, Queen, King hold a sleek tactical sidearm/carbine in their left hand
      gunGroup.scale.setScalar(0.78);
      gunGroup.position.set(0, -0.22, 0.12);
      gunGroup.rotation.y = -Math.PI / 2;
      leftArm.add(gunGroup);
    }
  }

  root.rotation.y = teamColor === 'w' ? Math.PI : 0;

  return {
    root,
    bodyGroup,
    headGroup,
    rightArm,
    leftArm,
    weaponGroup,
    gunGroup,
    muzzleFlash,
    type,
    color: teamColor,
  };
}
