export type GraphicsQuality = 'low' | 'medium' | 'high';
export type AnimationQuality = 'fast' | 'normal' | 'cinematic';
export type AppLanguage = 'en' | 'bn' | 'hi' | 'es';
export type BoardThemeId =
  | 'classic_bw'
  | 'classic_wood'
  | 'emerald_tourney'
  | 'royal_marble'
  | 'sapphire_ice'
  | 'crimson_royal';

export interface BoardThemeConfig {
  id: BoardThemeId;
  name: string;
  lightSquare: string;
  darkSquare: string;
  borderColor: string;
  frameColor: number;
  isWoodGrain?: boolean;
}

export const BOARD_THEMES: BoardThemeConfig[] = [
  {
    id: 'classic_bw',
    name: 'Black & White',
    lightSquare: '#ffffff',
    darkSquare: '#1c1c1c',
    borderColor: '#262626',
    frameColor: 0x171717,
  },
  {
    id: 'classic_wood',
    name: 'Classic Wood',
    lightSquare: '#dcc68e',
    darkSquare: '#7e411c',
    borderColor: '#80421e',
    frameColor: 0x7a3e1a,
    isWoodGrain: true,
  },
  {
    id: 'emerald_tourney',
    name: 'Green & White',
    lightSquare: '#eeeed2',
    darkSquare: '#769656',
    borderColor: '#4b6433',
    frameColor: 0x2d3d1e,
  },
  {
    id: 'royal_marble',
    name: 'Marble Slate',
    lightSquare: '#f1f5f9',
    darkSquare: '#334155',
    borderColor: '#64748b',
    frameColor: 0x1e293b,
  },
  {
    id: 'sapphire_ice',
    name: 'Blue & White',
    lightSquare: '#e0f2fe',
    darkSquare: '#1e3a8a',
    borderColor: '#38bdf8',
    frameColor: 0x172554,
  },
  {
    id: 'crimson_royal',
    name: 'Red & Ivory',
    lightSquare: '#fef2f2',
    darkSquare: '#7f1d1d',
    borderColor: '#b91c1c',
    frameColor: 0x450a0a,
  },
];

export interface GameSettings {
  graphicsQuality: GraphicsQuality;
  boardTheme: BoardThemeId;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  volume: number;
  cameraSensitivity: number;
  cameraSpeed: number;
  animationQuality: AnimationQuality;
  showMoveHints: boolean;
  language: AppLanguage;
}

export const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: 'high',
  boardTheme: 'classic_bw',
  musicEnabled: true,
  sfxEnabled: true,
  volume: 0.8,
  cameraSensitivity: 1.0,
  cameraSpeed: 1.0,
  animationQuality: 'normal',
  showMoveHints: true,
  language: 'en',
};

const STORAGE_KEY = 'chess_legends_3d_settings_v3';

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

export const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: {
    playGame: 'PLAY',
    countrySelect: 'COUNTRIES',
    gameModes: 'MODES',
    howToPlay: 'RULES',
    settings: 'SETTINGS',
    about: 'ABOUT',
    victory: 'VICTORY!',
    defeat: 'DEFEAT!',
    draw: 'DRAW!',
    turn: 'TURN',
    check: 'CHECK!',
    checkmate: 'CHECKMATE!',
  },
  bn: {
    playGame: 'খেলুন',
    countrySelect: 'দেশ',
    gameModes: 'মোড',
    howToPlay: 'নিয়ম',
    settings: 'সেটিংস',
    about: 'তথ্য',
    victory: 'বিজয়!',
    defeat: 'পরাজয়!',
    draw: 'ড্র!',
    turn: 'চাল',
    check: 'চেক!',
    checkmate: 'চেকমেট!',
  },
  hi: {
    playGame: 'खेलें',
    countrySelect: 'देश',
    gameModes: 'मोड',
    howToPlay: 'नियम',
    settings: 'सेटिंग्स',
    about: 'जानकारी',
    victory: 'विजय!',
    defeat: 'पराजय!',
    draw: 'ड्रॉ!',
    turn: 'बारी',
    check: 'शह!',
    checkmate: 'शह और मात!',
  },
  es: {
    playGame: 'JUGAR',
    countrySelect: 'PAÍSES',
    gameModes: 'MODOS',
    howToPlay: 'REGLAS',
    settings: 'AJUSTES',
    about: 'INFO',
    victory: '¡VICTORIA!',
    defeat: '¡DERROTA!',
    draw: '¡EMPATE!',
    turn: 'TURNO',
    check: '¡JAQUE!',
    checkmate: '¡JAQUE MATE!',
  },
};
