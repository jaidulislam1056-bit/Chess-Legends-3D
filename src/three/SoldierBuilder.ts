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
  type: PieceSymbol;
  color: Color;
}

// Shared geometries for high performance & low draw overhead
const sharedGeos = {
  basePedestal: new THREE.CylinderGeometry(0.38, 0.44, 0.12, 24),
  baseTrim: new THREE.TorusGeometry(0.4, 0.03, 10, 24),
  shadowPlane: new THREE.PlaneGeometry(0.95, 0.95),
  headSphere: new THREE.SphereGeometry(0.19, 20, 16),
  eyeSphere: new THREE.SphereGeometry(0.032, 10, 10),
  pupilSphere: new THREE.SphereGeometry(0.018, 8, 8),
  browBox: new THREE.BoxGeometry(0.07, 0.018, 0.02),
  legCyl: new THREE.CylinderGeometry(0.075, 0.065, 0.24, 12),
  bootBox: new THREE.BoxGeometry(0.11, 0.08, 0.17),
  armCyl: new THREE.CylinderGeometry(0.06, 0.05, 0.26, 12),
  handSphere: new THREE.SphereGeometry(0.06, 10, 10),
  pauldronSphere: new THREE.SphereGeometry(0.095, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.65),
};

// Create painted country emblem texture for shields & breastplates (no flag emoji text that renders as BD)
const emblemCache = new Map<string, THREE.CanvasTexture>();
function getCountryEmblemTexture(country: CountryConfig): THREE.CanvasTexture {
  if (emblemCache.has(country.id)) return emblemCache.get(country.id)!;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Background shield pattern
  ctx.fillStyle = country.primaryColor;
  ctx.fillRect(0, 0, 128, 128);

  if (country.id === 'bangladesh') {
    // Authentic Bangladesh Flag Emblem (Green field with Red sun disc)
    ctx.fillStyle = '#f42a41';
    ctx.beginPath();
    ctx.arc(64, 64, 32, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Center stripe and inner emblem disc in secondary & accent colors
    ctx.fillStyle = country.secondaryColor;
    ctx.fillRect(0, 44, 128, 40);

    ctx.fillStyle = country.accentColor;
    ctx.beginPath();
    ctx.arc(64, 64, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  // Gold ring
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(64, 64, 56, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  emblemCache.set(country.id, tex);
  return tex;
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

  // Contact shadow flush at y = 0.01
  const shadowMat = new THREE.MeshBasicMaterial({
    map: getContactShadowTexture(),
    transparent: true,
    depthWrite: false,
    opacity: 0.55,
  });
  const shadowMesh = new THREE.Mesh(sharedGeos.shadowPlane, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.01;
  root.add(shadowMesh);

  // Materials calibrated with PBR contrast (roughness & metalness variance >= 0.25)
  const primaryMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(country.primaryColor),
    roughness: 0.45,
    metalness: 0.2,
  });

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(country.secondaryColor),
    roughness: 0.5,
    metalness: 0.15,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(country.accentColor),
    emissive: new THREE.Color(country.accentColor),
    emissiveIntensity: 0.22,
    roughness: 0.25,
    metalness: 0.6,
  });

  // Team base ring differentiates White (Alabaster/Gold) vs Black (Obsidian/Bronze) clearly
  const teamBaseMat = new THREE.MeshStandardMaterial({
    color: teamColor === 'w' ? 0xf8fafc : 0x1e1b2e,
    roughness: 0.3,
    metalness: 0.4,
  });

  const goldArmorMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(country.metalColor),
    roughness: 0.2,
    metalness: 0.85,
  });

  const steelMat = new THREE.MeshStandardMaterial({
    color: teamColor === 'w' ? 0xe2e8f0 : 0x64748b,
    roughness: 0.18,
    metalness: 0.9,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf4c29f,
    roughness: 0.65,
    metalness: 0.05,
  });

  const darkBootMat = new THREE.MeshStandardMaterial({
    color: 0x271c19,
    roughness: 0.75,
    metalness: 0.1,
  });

  const emblemMat = new THREE.MeshStandardMaterial({
    map: getCountryEmblemTexture(country),
    roughness: 0.35,
    metalness: 0.25,
  });

  // 1. Base Pedestal with team indicator ring & country trim
  const pedestal = new THREE.Mesh(sharedGeos.basePedestal, teamBaseMat);
  pedestal.position.y = 0.06;
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  root.add(pedestal);

  const trimRing = new THREE.Mesh(sharedGeos.baseTrim, primaryMat);
  trimRing.rotation.x = Math.PI / 2;
  trimRing.position.y = 0.11;
  root.add(trimRing);

  // Scale hierarchy based on piece importance
  const scaleMap: Record<PieceSymbol, number> = {
    p: 0.88,
    r: 1.0,
    n: 1.02,
    b: 1.04,
    q: 1.12,
    k: 1.2,
  };
  const unitScale = scaleMap[type];
  bodyGroup.scale.setScalar(unitScale);
  bodyGroup.position.y = 0.12;
  root.add(bodyGroup);

  // Common Legs & Boots (except Knight which rides a sculpted warhorse mount, and Queen/Bishop who wear long royal robes)
  if (type === 'p' || type === 'r' || type === 'k') {
    const leftLeg = new THREE.Mesh(sharedGeos.legCyl, secondaryMat);
    leftLeg.position.set(-0.1, 0.18, 0);
    leftLeg.castShadow = true;
    bodyGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(sharedGeos.legCyl, secondaryMat);
    rightLeg.position.set(0.1, 0.18, 0);
    rightLeg.castShadow = true;
    bodyGroup.add(rightLeg);

    const leftBoot = new THREE.Mesh(sharedGeos.bootBox, darkBootMat);
    leftBoot.position.set(-0.1, 0.04, 0.03);
    bodyGroup.add(leftBoot);

    const rightBoot = new THREE.Mesh(sharedGeos.bootBox, darkBootMat);
    rightBoot.position.set(0.1, 0.04, 0.03);
    bodyGroup.add(rightBoot);
  }

  // Helper to build expressive cartoon face inside headGroup
  const buildCartoonHead = (headY: number, angryBrows = false) => {
    headGroup.position.set(0, headY, 0);
    bodyGroup.add(headGroup);

    const headMesh = new THREE.Mesh(sharedGeos.headSphere, skinMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111827 });

    const leftEye = new THREE.Mesh(sharedGeos.eyeSphere, eyeWhiteMat);
    leftEye.position.set(-0.065, 0.02, 0.165);
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(sharedGeos.eyeSphere, eyeWhiteMat);
    rightEye.position.set(0.065, 0.02, 0.165);
    headGroup.add(rightEye);

    const leftPupil = new THREE.Mesh(sharedGeos.pupilSphere, pupilMat);
    leftPupil.position.set(-0.065, 0.02, 0.188);
    headGroup.add(leftPupil);

    const rightPupil = new THREE.Mesh(sharedGeos.pupilSphere, pupilMat);
    rightPupil.position.set(0.065, 0.02, 0.188);
    headGroup.add(rightPupil);

    const browL = new THREE.Mesh(sharedGeos.browBox, darkBootMat);
    browL.position.set(-0.065, 0.075, 0.175);
    browL.rotation.z = angryBrows ? -0.22 : -0.08;
    headGroup.add(browL);

    const browR = new THREE.Mesh(sharedGeos.browBox, darkBootMat);
    browR.position.set(0.065, 0.075, 0.175);
    browR.rotation.z = angryBrows ? 0.22 : 0.08;
    headGroup.add(browR);
  };

  // Helper to attach arms
  const attachArms = (shoulderY: number, shoulderSpread = 0.25) => {
    rightArm.position.set(shoulderSpread, shoulderY, 0);
    leftArm.position.set(-shoulderSpread, shoulderY, 0);
    bodyGroup.add(rightArm);
    bodyGroup.add(leftArm);

    const rPauldron = new THREE.Mesh(sharedGeos.pauldronSphere, goldArmorMat);
    rPauldron.position.set(0, 0.03, 0);
    rightArm.add(rPauldron);

    const lPauldron = new THREE.Mesh(sharedGeos.pauldronSphere, goldArmorMat);
    lPauldron.position.set(0, 0.03, 0);
    leftArm.add(lPauldron);

    const rArmMesh = new THREE.Mesh(sharedGeos.armCyl, primaryMat);
    rArmMesh.position.set(0, -0.11, 0);
    rArmMesh.castShadow = true;
    rightArm.add(rArmMesh);

    const lArmMesh = new THREE.Mesh(sharedGeos.armCyl, primaryMat);
    lArmMesh.position.set(0, -0.11, 0);
    lArmMesh.castShadow = true;
    leftArm.add(lArmMesh);

    const rHand = new THREE.Mesh(sharedGeos.handSphere, skinMat);
    rHand.position.set(0, -0.24, 0.02);
    rightArm.add(rHand);

    const lHand = new THREE.Mesh(sharedGeos.handSphere, skinMat);
    lHand.position.set(0, -0.24, 0.02);
    leftArm.add(lHand);

    weaponGroup.position.set(0, -0.24, 0.05);
    rightArm.add(weaponGroup);
  };

  // =========================================================================
  // ROLE-SPECIFIC SILHOUETTES (6 DISTINCT CARTOON SOLDIER ARCHETYPES)
  // =========================================================================
  if (type === 'p') {
    // PAWN: Cute Vanguard Foot Soldier with Dome Helmet, Country Shield & Short Sword
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.21, 0.38, 16), primaryMat);
    torso.position.y = 0.45;
    torso.castShadow = true;
    bodyGroup.add(torso);

    // Belt & buckle
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.06, 16), darkBootMat);
    belt.position.y = 0.32;
    bodyGroup.add(belt);

    buildCartoonHead(0.8, false);

    // Infantry dome helmet + plume
    const helm = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
      goldArmorMat
    );
    helm.position.y = 0.02;
    helm.castShadow = true;
    headGroup.add(helm);

    const helmBrim = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.022, 8, 20), steelMat);
    helmBrim.rotation.x = Math.PI / 2;
    helmBrim.position.y = 0.02;
    headGroup.add(helmBrim);

    const helmSpike = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 10), secondaryMat);
    helmSpike.position.y = 0.24;
    headGroup.add(helmSpike);

    attachArms(0.58, 0.23);

    // Round Country Shield on Left Arm
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 20), emblemMat);
    shield.rotation.z = Math.PI / 2;
    shield.rotation.y = 0.35;
    shield.position.set(-0.07, -0.14, 0.12);
    shield.castShadow = true;
    leftArm.add(shield);

    // Short Broadsword in Right Hand
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 8), goldArmorMat);
    hilt.rotation.x = Math.PI / 2;
    weaponGroup.add(hilt);

    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.03), goldArmorMat);
    guard.position.set(0, 0, 0.06);
    weaponGroup.add(guard);

    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.015, 0.42), steelMat);
    blade.position.set(0, 0, 0.27);
    blade.castShadow = true;
    weaponGroup.add(blade);
    rightArm.rotation.x = -0.35;
  } else if (type === 'r') {
    // ROOK: Heavy Armored Fortress Juggernaut with Castle-Turret Crown, Tower Shield & Warhammer
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.3), primaryMat);
    torso.position.y = 0.48;
    torso.castShadow = true;
    bodyGroup.add(torso);

    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.3, 0.33), goldArmorMat);
    chestPlate.position.y = 0.52;
    bodyGroup.add(chestPlate);

    buildCartoonHead(0.86, true);

    // Castle Crenellated Turret Helmet
    const turretHelm = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.21, 0.22, 16), steelMat);
    turretHelm.position.y = 0.1;
    turretHelm.castShadow = true;
    headGroup.add(turretHelm);

    // 6 Castle Battlement Merlons around top of helmet
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.06), goldArmorMat);
      merlon.position.set(Math.cos(angle) * 0.18, 0.23, Math.sin(angle) * 0.18);
      merlon.rotation.y = -angle;
      headGroup.add(merlon);
    }

    attachArms(0.64, 0.28);

    // Heavy Tower Pavise Shield on Left Arm
    const towerShield = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.52, 0.05), emblemMat);
    towerShield.position.set(-0.08, -0.14, 0.16);
    towerShield.rotation.y = 0.3;
    towerShield.castShadow = true;
    leftArm.add(towerShield);

    const shieldBorder = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.55, 0.03), goldArmorMat);
    shieldBorder.position.set(-0.08, -0.14, 0.14);
    shieldBorder.rotation.y = 0.3;
    leftArm.add(shieldBorder);

    // Heavy Siege Warhammer in Right Hand
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.62, 10), darkBootMat);
    shaft.rotation.x = Math.PI / 3;
    shaft.position.set(0, 0.1, 0.18);
    weaponGroup.add(shaft);

    const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.14), steelMat);
    hammerHead.position.set(0, 0.25, 0.42);
    hammerHead.castShadow = true;
    weaponGroup.add(hammerHead);
  } else if (type === 'n') {
    // KNIGHT: Mounted Heroic Cavalry Warrior riding an Armored Cartoon Warhorse
    // Sculpted Warhorse Body
    const horseBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.32, 12, 16), secondaryMat);
    horseBody.rotation.x = Math.PI / 2;
    horseBody.position.set(0, 0.28, 0);
    horseBody.castShadow = true;
    bodyGroup.add(horseBody);

    // Horse Barding (Armored Caparison blanket with Country Emblem)
    const barding = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.26, 16), primaryMat);
    barding.position.set(0, 0.2, 0);
    barding.castShadow = true;
    bodyGroup.add(barding);

    // Horse Neck & Sculpted Head facing forward (+Z)
    const horseNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.34, 12), goldArmorMat);
    horseNeck.position.set(0, 0.48, 0.22);
    horseNeck.rotation.x = 0.42;
    horseNeck.castShadow = true;
    bodyGroup.add(horseNeck);

    const horseSnout = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 12), steelMat);
    horseSnout.position.set(0, 0.6, 0.38);
    horseSnout.rotation.x = Math.PI / 2 + 0.25;
    bodyGroup.add(horseSnout);

    // Horse Mane Plume
    const mane = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.08), accentMat);
    mane.position.set(0, 0.54, 0.14);
    mane.rotation.x = 0.42;
    bodyGroup.add(mane);

    // Rider Torso seated on horse
    const riderTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.34, 14), primaryMat);
    riderTorso.position.set(0, 0.56, -0.05);
    riderTorso.castShadow = true;
    bodyGroup.add(riderTorso);

    buildCartoonHead(0.88, true);
    headGroup.position.z = -0.05;

    // Cavalry Plumed Visor Helmet
    const cavHelm = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6),
      goldArmorMat
    );
    cavHelm.position.y = 0.03;
    headGroup.add(cavHelm);

    const plume = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.26, 12), secondaryMat);
    plume.position.set(0, 0.24, -0.06);
    plume.rotation.x = -0.4;
    headGroup.add(plume);

    attachArms(0.68, 0.22);
    rightArm.position.z = -0.05;
    leftArm.position.z = -0.05;

    // Cavalry Lance / Saber in Right Hand
    const lance = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.78, 12), steelMat);
    lance.rotation.x = Math.PI / 2 - 0.25;
    lance.position.set(0, 0.08, 0.34);
    lance.castShadow = true;
    weaponGroup.add(lance);

    const lanceGuard = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.03, 0.1, 12), goldArmorMat);
    lanceGuard.rotation.x = Math.PI / 2 - 0.25;
    lanceGuard.position.set(0, 0.02, 0.12);
    weaponGroup.add(lanceGuard);

    // Heater Shield on Left Arm
    const knightShield = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.08, 0.32, 6), emblemMat);
    knightShield.position.set(-0.08, -0.1, 0.12);
    knightShield.rotation.z = 0.2;
    leftArm.add(knightShield);
  } else if (type === 'b') {
    // BISHOP: Magical Royal Priest-Warrior with Layered Robe, Tall Mitre & Glowing Arcane Orb Staff
    const robeBottom = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.68, 20), primaryMat);
    robeBottom.position.y = 0.34;
    robeBottom.castShadow = true;
    bodyGroup.add(robeBottom);

    const robeTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.26, 0.45, 16), secondaryMat);
    robeTrim.position.y = 0.42;
    bodyGroup.add(robeTrim);

    const stole = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.28), goldArmorMat);
    stole.position.y = 0.38;
    bodyGroup.add(stole);

    buildCartoonHead(0.84, false);

    // Tall Royal Mitre Hat with Glowing Gem
    const mitre = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.38, 16), primaryMat);
    mitre.position.y = 0.22;
    mitre.castShadow = true;
    headGroup.add(mitre);

    const mitreBand = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.025, 8, 20), goldArmorMat);
    mitreBand.rotation.x = Math.PI / 2;
    mitreBand.position.y = 0.06;
    headGroup.add(mitreBand);

    const mitreOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), accentMat);
    mitreOrb.position.set(0, 0.42, 0);
    headGroup.add(mitreOrb);

    attachArms(0.62, 0.24);

    // Glowing Magical Staff in Right Hand
    const staffPole = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.02, 0.88, 10), goldArmorMat);
    staffPole.position.set(0, 0.18, 0.08);
    staffPole.castShadow = true;
    weaponGroup.add(staffPole);

    const staffRing = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 8, 16), goldArmorMat);
    staffRing.position.set(0, 0.64, 0.08);
    weaponGroup.add(staffRing);

    const manaCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 1), accentMat);
    manaCrystal.position.set(0, 0.64, 0.08);
    weaponGroup.add(manaCrystal);

    // Arcane Spell Tome in Left Hand
    const tome = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.05), secondaryMat);
    tome.position.set(-0.04, -0.22, 0.12);
    tome.rotation.x = -0.5;
    leftArm.add(tome);
  } else if (type === 'q') {
    // QUEEN: Powerful Female Warrior Queen with Multi-Spired Royal Crown, Gilded Gown & Rune-Blade
    const gown = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.72, 24), primaryMat);
    gown.position.y = 0.36;
    gown.castShadow = true;
    bodyGroup.add(gown);

    const bodice = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.32, 16), goldArmorMat);
    bodice.position.y = 0.56;
    bodice.castShadow = true;
    bodyGroup.add(bodice);

    // Royal Cape behind Queen
    const queenCape = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.62, 0.04), secondaryMat);
    queenCape.position.set(0, 0.4, -0.18);
    queenCape.rotation.x = 0.18;
    queenCape.castShadow = true;
    bodyGroup.add(queenCape);

    buildCartoonHead(0.88, false);

    // Multi-Spired Royal Queen Tiara Crown
    const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.1, 20), goldArmorMat);
    crownBase.position.y = 0.15;
    headGroup.add(crownBase);

    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.14, 8), goldArmorMat);
      spire.position.set(Math.cos(a) * 0.16, 0.24, Math.sin(a) * 0.16);
      headGroup.add(spire);

      const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), accentMat);
      pearl.position.set(Math.cos(a) * 0.16, 0.31, Math.sin(a) * 0.16);
      headGroup.add(pearl);
    }

    attachArms(0.66, 0.24);

    // Elegant Royal Rune-Sword in Right Hand
    const qGuard = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.04), goldArmorMat);
    qGuard.position.set(0, 0, 0.06);
    weaponGroup.add(qGuard);

    const qBlade = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.015, 0.58), steelMat);
    qBlade.position.set(0, 0, 0.35);
    qBlade.castShadow = true;
    weaponGroup.add(qBlade);

    // Royal Scepter Orb in Left Hand
    const scepter = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.48, 8), goldArmorMat);
    scepter.position.set(-0.02, -0.1, 0.12);
    scepter.rotation.x = 0.4;
    leftArm.add(scepter);

    const scepterGem = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), accentMat);
    scepterGem.position.set(-0.02, 0.11, 0.21);
    leftArm.add(scepterGem);
    rightArm.rotation.x = -0.45;
  } else {
    // KING: Legendary Supreme Monarch Warrior with Imperial Crown, Sweeping Cape & Greatsword
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.46, 18), primaryMat);
    torso.position.y = 0.5;
    torso.castShadow = true;
    bodyGroup.add(torso);

    // Gilded Breastplate with Country Emblem
    const breastPlate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.3), emblemMat);
    breastPlate.position.y = 0.52;
    bodyGroup.add(breastPlate);

    // Sweeping Royal Mantle Cape
    const kingCape = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.68, 0.05), secondaryMat);
    kingCape.position.set(0, 0.42, -0.2);
    kingCape.rotation.x = 0.2;
    kingCape.castShadow = true;
    bodyGroup.add(kingCape);

    buildCartoonHead(0.9, true);

    // Royal Beard / Chin Guard
    const beard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.12), darkBootMat);
    beard.position.set(0, -0.1, 0.12);
    headGroup.add(beard);

    // Grand Imperial Crown + Royal Cross
    const impCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.18, 0.15, 20), goldArmorMat);
    impCrown.position.y = 0.17;
    impCrown.castShadow = true;
    headGroup.add(impCrown);

    const crownVelvet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), secondaryMat);
    crownVelvet.position.y = 0.2;
    headGroup.add(crownVelvet);

    const crossVert = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.18, 0.045), goldArmorMat);
    crossVert.position.y = 0.38;
    headGroup.add(crossVert);

    const crossHoriz = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.045, 0.045), goldArmorMat);
    crossHoriz.position.y = 0.4;
    headGroup.add(crossHoriz);

    attachArms(0.68, 0.28);

    // Legendary Two-Handed Broadsword in Right Hand
    const kGuard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.05), goldArmorMat);
    kGuard.position.set(0, 0, 0.07);
    weaponGroup.add(kGuard);

    const kGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.04, 0), accentMat);
    kGem.position.set(0, 0, 0.07);
    weaponGroup.add(kGem);

    const kBlade = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.02, 0.68), steelMat);
    kBlade.position.set(0, 0, 0.41);
    kBlade.castShadow = true;
    weaponGroup.add(kBlade);

    // Royal Crest Shield on Left Arm
    const kShield = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.12, 0.38, 6), emblemMat);
    kShield.position.set(-0.08, -0.12, 0.14);
    kShield.rotation.y = 0.25;
    kShield.castShadow = true;
    leftArm.add(kShield);
    rightArm.rotation.x = -0.5;
  }

  // Face White pieces toward Black (-Z) and Black pieces toward White (+Z)
  root.rotation.y = teamColor === 'w' ? Math.PI : 0;

  return {
    root,
    bodyGroup,
    headGroup,
    rightArm,
    leftArm,
    weaponGroup,
    type,
    color: teamColor,
  };
}
