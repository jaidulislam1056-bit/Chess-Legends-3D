import React from 'react';
import { X, RotateCcw, Crown } from 'lucide-react';
import {
  BOARD_THEMES,
  GameSettings,
  GraphicsQuality,
  AnimationQuality,
  AppLanguage,
} from '../data/settings';
import { CameraPreset } from './ChessScene3D';

interface SettingsModalProps {
  settings: GameSettings;
  cameraPreset?: CameraPreset;
  onSelectCameraPreset?: (preset: CameraPreset) => void;
  onUpdateSettings: (partial: Partial<GameSettings>) => void;
  onResetSettings: () => void;
  onClose: () => void;
}

const CAMERA_PRESETS: { id: CameraPreset; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
  { id: 'top', label: 'Top' },
  { id: 'cinematic', label: 'Orbit' },
  { id: 'free', label: 'Free' },
  { id: 'reset', label: 'Reset' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  cameraPreset = 'default',
  onSelectCameraPreset,
  onUpdateSettings,
  onResetSettings,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-black/75">
      <div className="w-full max-w-lg max-h-[88vh] bg-[#0e0c18] border border-amber-500/40 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-500/25 bg-[#141122]">
          <h2 className="font-display font-bold text-base sm:text-lg text-amber-300 tracking-wider">
            SETTINGS
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1d1830] hover:bg-[#2a2344] text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs sm:text-sm">
          {/* Board Theme Selection (Moved here from front screens) */}
          <div className="py-2 border-b border-white/10">
            <div className="font-semibold text-white mb-2">Chessboard Theme</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BOARD_THEMES.map((b) => {
                const active = settings.boardTheme === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => onUpdateSettings({ boardTheme: b.id })}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      active
                        ? 'bg-amber-500/20 border-amber-400 text-white'
                        : 'bg-[#151224] border-white/10 text-slate-300 hover:border-amber-500/40'
                    }`}
                  >
                    <span className="flex shrink-0">
                      <span
                        className="w-3.5 h-3.5 rounded-l-xs border border-white/30"
                        style={{ backgroundColor: b.lightSquare }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-r-xs border border-white/30"
                        style={{ backgroundColor: b.darkSquare }}
                      />
                    </span>
                    <span className="text-xs font-medium truncate">{b.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 9 Camera View Presets */}
          {onSelectCameraPreset && (
            <div className="py-2 border-b border-white/10">
              <div className="font-semibold text-white mb-2">Camera View Angle</div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {CAMERA_PRESETS.map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => onSelectCameraPreset(btn.id)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      cameraPreset === btn.id
                        ? 'bg-amber-500 text-[#09080d] font-bold'
                        : 'bg-[#151224] hover:bg-[#1f1a33] text-slate-300 border border-white/10'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Music & Sound Effects */}
          <div className="grid grid-cols-2 gap-2.5 py-2 border-b border-white/10">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#151224] border border-white/5">
              <span className="font-semibold text-white">Music</span>
              <button
                onClick={() => onUpdateSettings({ musicEnabled: !settings.musicEnabled })}
                className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                  settings.musicEnabled
                    ? 'bg-emerald-500 text-[#09080d]'
                    : 'bg-[#221d38] text-slate-300'
                }`}
              >
                {settings.musicEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#151224] border border-white/5">
              <span className="font-semibold text-white">Sound FX</span>
              <button
                onClick={() => onUpdateSettings({ sfxEnabled: !settings.sfxEnabled })}
                className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                  settings.sfxEnabled
                    ? 'bg-emerald-500 text-[#09080d]'
                    : 'bg-[#221d38] text-slate-300'
                }`}
              >
                {settings.sfxEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center justify-between gap-4 py-1.5 border-b border-white/10">
            <span className="font-semibold text-white">
              Volume ({Math.round(settings.volume * 100)}%)
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={(e) => onUpdateSettings({ volume: parseFloat(e.target.value) })}
              className="w-40 accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Graphics Quality */}
          <div className="flex items-center justify-between gap-4 py-1.5 border-b border-white/10">
            <span className="font-semibold text-white">Graphics</span>
            <div className="flex items-center gap-1.5">
              {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                <button
                  key={q}
                  onClick={() => onUpdateSettings({ graphicsQuality: q })}
                  className={`px-2.5 py-1 rounded-lg font-display font-bold text-xs uppercase cursor-pointer ${
                    settings.graphicsQuality === q
                      ? 'bg-amber-500 text-[#09080d]'
                      : 'bg-[#171428] text-slate-300'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Animation Speed */}
          <div className="flex items-center justify-between gap-4 py-1.5 border-b border-white/10">
            <span className="font-semibold text-white">Animation</span>
            <div className="flex items-center gap-1.5">
              {(['fast', 'normal', 'cinematic'] as AnimationQuality[]).map((a) => (
                <button
                  key={a}
                  onClick={() => onUpdateSettings({ animationQuality: a })}
                  className={`px-2.5 py-1 rounded-lg font-display font-bold text-xs uppercase cursor-pointer ${
                    settings.animationQuality === a
                      ? 'bg-amber-500 text-[#09080d]'
                      : 'bg-[#171428] text-slate-300'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Camera Sensitivity */}
          <div className="flex items-center justify-between gap-4 py-1.5 border-b border-white/10">
            <span className="font-semibold text-white">Camera Speed</span>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.cameraSensitivity}
              onChange={(e) =>
                onUpdateSettings({
                  cameraSensitivity: parseFloat(e.target.value),
                  cameraSpeed: parseFloat(e.target.value),
                })
              }
              className="w-40 accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Move Hints */}
          <div className="flex items-center justify-between gap-4 py-1.5 border-b border-white/10">
            <span className="font-semibold text-white">Move Hints</span>
            <button
              onClick={() => onUpdateSettings({ showMoveHints: !settings.showMoveHints })}
              className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                settings.showMoveHints
                  ? 'bg-emerald-500 text-[#09080d]'
                  : 'bg-[#221d38] text-slate-300'
              }`}
            >
              {settings.showMoveHints ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between gap-4 py-1.5">
            <span className="font-semibold text-white">Language</span>
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'en', label: 'EN' },
                  { id: 'bn', label: 'বাংলা' },
                  { id: 'hi', label: 'हिन्दी' },
                  { id: 'es', label: 'ES' },
                ] as { id: AppLanguage; label: string }[]
              ).map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => onUpdateSettings({ language: lang.id })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    settings.language === lang.id
                      ? 'bg-amber-500 text-[#09080d]'
                      : 'bg-[#171428] text-slate-300'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#141122] border-t border-amber-500/25 flex items-center justify-between">
          <button
            onClick={onResetSettings}
            className="px-3 py-1.5 rounded-xl bg-[#1d1830] hover:bg-red-950/60 text-xs font-semibold text-slate-300 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#09080d] font-display font-bold text-xs tracking-wider cursor-pointer"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};

export const HowToPlayModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const soldiers = [
    { role: '♟ PAWN', desc: '1-2 squares forward, captures diagonally, promotes on 8th rank.' },
    { role: '♜ ROOK', desc: 'Moves horizontally or vertically any distance. Castles with King.' },
    { role: '♞ KNIGHT', desc: 'Moves in an L-shape and jumps over pieces.' },
    { role: '♝ BISHOP', desc: 'Moves diagonally any distance.' },
    { role: '♛ QUEEN', desc: 'Moves horizontally, vertically, or diagonally any distance.' },
    { role: '♚ KING', desc: 'Moves 1 square in any direction. Protect from Checkmate!' },
  ];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-black/75">
      <div className="w-full max-w-lg max-h-[85vh] bg-[#0e0c18] border border-amber-500/40 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-500/25 bg-[#141122]">
          <h2 className="font-display font-bold text-base sm:text-lg text-amber-300 tracking-wider">
            CHESS RULES
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1d1830] hover:bg-[#2a2344] text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {soldiers.map((s) => (
            <div key={s.role} className="p-3 rounded-xl bg-[#141122] border border-white/10">
              <div className="font-display font-bold text-amber-300 mb-1">{s.role}</div>
              <div className="text-slate-300">{s.desc}</div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 bg-[#141122] border-t border-amber-500/25 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#09080d] font-display font-bold text-xs tracking-wider cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export const AboutModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/75">
      <div className="w-full max-w-sm bg-[#0e0c18] border border-amber-500/40 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.95)] p-5 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300">
          <Crown className="w-7 h-7" />
        </div>
        <h2 className="font-display font-black text-xl text-amber-300 tracking-wider">
          CHESS LEGENDS 3D
        </h2>
        <div className="p-3 rounded-xl bg-[#161326] border border-amber-500/30">
          <div className="font-display font-bold text-sm text-amber-300">
            Developed by Jaidul
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#09080d] font-display font-bold text-xs tracking-wider cursor-pointer"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};
