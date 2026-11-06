import * as THREE from 'three';
import { CountryConfig } from '../data/countries';
import { BOARD_THEMES, BoardThemeId } from '../data/settings';

export function createBoardSquareTexture(
  isLight: boolean,
  themeId: BoardThemeId = 'classic_bw',
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const theme = BOARD_THEMES.find((t) => t.id === themeId) || BOARD_THEMES[0];
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const baseColor = isLight ? theme.lightSquare : theme.darkSquare;
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 256, 256);

  if (theme.isWoodGrain) {
    for (let y = 0; y < 256; y += 3) {
      const wave = Math.sin(y * 0.12) * 4;
      ctx.fillStyle = isLight
        ? y % 6 === 0
          ? 'rgba(180, 145, 85, 0.28)'
          : 'rgba(255, 245, 215, 0.18)'
        : y % 6 === 0
        ? 'rgba(55, 24, 8, 0.38)'
        : 'rgba(160, 88, 42, 0.2)';
      ctx.fillRect(0, y + wave * 0.15, 256, 2);
    }

    ctx.strokeStyle = isLight ? 'rgba(165, 130, 72, 0.25)' : 'rgba(48, 20, 6, 0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const yPos = 18 + i * 30;
      ctx.beginPath();
      ctx.moveTo(0, yPos);
      ctx.bezierCurveTo(
        85,
        yPos + (i % 2 === 0 ? 5 : -5),
        170,
        yPos + (i % 2 === 0 ? -4 : 4),
        256,
        yPos
      );
      ctx.stroke();
    }
  } else if (themeId === 'royal_marble') {
    ctx.strokeStyle = isLight ? 'rgba(148, 163, 184, 0.25)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 65, 0);
      ctx.bezierCurveTo(i * 60 + 25, 90, i * 60 - 20, 170, i * 65 + 10, 256);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createWoodFrameTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#80421e';
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 3) {
    ctx.fillStyle = y % 6 === 0 ? 'rgba(52, 22, 6, 0.38)' : 'rgba(158, 86, 40, 0.22)';
    ctx.fillRect(0, y, 512, 2);
  }

  ctx.strokeStyle = 'rgba(45, 18, 5, 0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(96, 96);
  ctx.moveTo(512, 0);
  ctx.lineTo(416, 96);
  ctx.moveTo(0, 512);
  ctx.lineTo(96, 416);
  ctx.moveTo(512, 512);
  ctx.lineTo(416, 416);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createStoneWallTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#151320';
  ctx.fillRect(0, 0, 512, 512);

  const rows = 8;
  const cols = 4;
  const rowH = 512 / rows;
  const colW = 512 / cols;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (colW / 2);
    for (let c = -1; c <= cols; c++) {
      const x = c * colW + offset;
      const y = r * rowH;

      const shade = 22 + ((r * 7 + c * 13) % 16);
      ctx.fillStyle = `rgb(${shade}, ${shade - 2}, ${shade + 12})`;
      ctx.fillRect(x + 3, y + 3, colW - 6, rowH - 6);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 4, y + 4, colW - 8, rowH - 8);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createRuneCircleTexture(colorHex = '#60a5fa'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 512);
  const cx = 256;
  const cy = 256;

  ctx.strokeStyle = colorHex;
  ctx.shadowColor = colorHex;
  ctx.shadowBlur = 16;

  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, 230, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 195, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 8; i++) {
    const a1 = (i * Math.PI) / 4;
    const a2 = ((i + 3) * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a1) * 195, cy + Math.sin(a1) * 195);
    ctx.lineTo(cx + Math.cos(a2) * 195, cy + Math.sin(a2) * 195);
    ctx.stroke();
  }

  const runes = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ'];
  ctx.fillStyle = colorHex;
  ctx.font = 'bold 24px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI * 2) / 16;
    const rx = cx + Math.cos(angle) * 212;
    const ry = cy + Math.sin(angle) * 212;
    ctx.fillText(runes[i % runes.length], rx, ry);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createCountryBannerTexture(country: CountryConfig): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, country.primaryColor);
  grad.addColorStop(0.75, country.secondaryColor);
  grad.addColorStop(1, '#09080d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 512);

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 12;
  ctx.strokeRect(10, 10, 236, 492);

  ctx.strokeStyle = country.accentColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, 208, 464);

  // Painted Emblem Circle (No emoji or ISO code text like BD)
  ctx.fillStyle = country.primaryColor;
  ctx.beginPath();
  ctx.arc(128, 175, 58, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = country.secondaryColor;
  ctx.beginPath();
  ctx.arc(128, 175, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(128, 175, 58, 0, Math.PI * 2);
  ctx.stroke();

  // Only Country Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(country.name.toUpperCase().slice(0, 13), 128, 320);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// High-Resolution Bangladesh Flag + "Developed by Jaidul" Wall Mural Texture for the Mysterious Room Walls
export function createBangladeshWallMuralTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep royal obsidian-emerald backdrop
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
  bgGrad.addColorStop(0, '#0a1914');
  bgGrad.addColorStop(0.5, '#072b1f');
  bgGrad.addColorStop(1, '#08121a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // Outer Ornate Gold Border
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 18;
  ctx.strokeRect(14, 14, 996, 484);

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 5;
  ctx.strokeRect(34, 34, 956, 444);

  // Draw Bangladesh Flag (Bottle Green Field + Red Circle)
  const drawBDFlag = (fx: number, fy: number, fw: number, fh: number) => {
    // Bottle Green Field (#006a4e)
    ctx.fillStyle = '#006a4e';
    ctx.fillRect(fx, fy, fw, fh);

    // Subtle fabric highlights
    const sheen = ctx.createLinearGradient(fx, fy, fx + fw, fy + fh);
    sheen.addColorStop(0, 'rgba(255,255,255,0.12)');
    sheen.addColorStop(0.5, 'rgba(0,0,0,0)');
    sheen.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = sheen;
    ctx.fillRect(fx, fy, fw, fh);

    // Red Sun Disc (#f42a41)
    ctx.fillStyle = '#f42a41';
    ctx.beginPath();
    ctx.arc(fx + fw * 0.46, fy + fh * 0.5, fh * 0.33, 0, Math.PI * 2);
    ctx.fill();

    // Gold Frame around Flag
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 6;
    ctx.strokeRect(fx, fy, fw, fh);
  };

  // Left, Center-Top, and Right Bangladesh Flags
  drawBDFlag(65, 65, 240, 150);
  drawBDFlag(372, 52, 280, 172);
  drawBDFlag(719, 65, 240, 150);

  // Glowing Golden "BANGLADESH" Ribbon Header (Pure Country Name Only)
  ctx.save();
  ctx.shadowColor = 'rgba(251, 191, 36, 0.85)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#fef08a';
  ctx.font = '900 44px Cinzel, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B A N G L A D E S H', 512, 278);
  ctx.restore();

  // Divider Line
  const lineGrad = ctx.createLinearGradient(140, 0, 884, 0);
  lineGrad.addColorStop(0, 'rgba(251, 191, 36, 0)');
  lineGrad.addColorStop(0.5, '#fbbf24');
  lineGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(140, 322);
  ctx.lineTo(884, 322);
  ctx.stroke();

  // Prominent Glowing "Developed by Jaidul" Inscription on the Wall
  ctx.save();
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 24;
  const textGrad = ctx.createLinearGradient(0, 350, 0, 445);
  textGrad.addColorStop(0, '#ffffff');
  textGrad.addColorStop(0.45, '#fde047');
  textGrad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = textGrad;
  ctx.font = 'bold 68px Cinzel, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Developed by Jaidul', 512, 398);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

// Vertical Pillar Banner with Bangladesh Flag + "Developed by Jaidul"
export function createBangladeshPillarBannerTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep Bottle Green background (#006a4e)
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#006a4e');
  grad.addColorStop(0.7, '#004d38');
  grad.addColorStop(1, '#071c15');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 512);

  // Gold Border
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 12;
  ctx.strokeRect(10, 10, 236, 492);

  // Red Sun Disc of Bangladesh Flag (#f42a41)
  ctx.fillStyle = '#f42a41';
  ctx.beginPath();
  ctx.arc(128, 155, 68, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(128, 155, 72, 0, Math.PI * 2);
  ctx.stroke();

  // "BANGLADESH" text
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 26px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.fillText('BANGLADESH', 128, 275);

  // "Developed by Jaidul" text
  ctx.save();
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Cinzel, serif';
  ctx.fillText('Developed by', 128, 355);
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 38px Cinzel, serif';
  ctx.fillText('Jaidul', 128, 405);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

let cachedShadowTexture: THREE.CanvasTexture | null = null;
export function getContactShadowTexture(): THREE.CanvasTexture {
  if (cachedShadowTexture) return cachedShadowTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  cachedShadowTexture = new THREE.CanvasTexture(canvas);
  return cachedShadowTexture;
}
