import React from 'react';
import {
  Pause,
  Music,
  Lightbulb,
  Play,
  Save,
  Check,
  FolderOpen,
  Swords,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieceSymbol, Color } from 'chess.js';
import { CountryConfig } from '../data/countries';
import { HintSuggestion } from './ChessScene3D';
import { GameSettings, TRANSLATIONS } from '../data/settings';

export interface CaptureEventInfo {
  id: number;
  attackerCountry: string;
  victimCountry: string;
  attackerPiece: PieceSymbol;
  capturedPiece: PieceSymbol;
  attackerColor: Color;
}

interface GameInterfaceProps {
  whiteCountry: CountryConfig;
  blackCountry: CountryConfig;
  turn: Color;
  isAIThinking: boolean;
  inCheck: boolean;
  isCheckmate: boolean;
  capturedByWhite: PieceSymbol[];
  capturedByBlack: PieceSymbol[];
  captureEvent: CaptureEventInfo | null;
  isPaused: boolean;
  settings: GameSettings;
  hintMove: HintSuggestion | null;
  pendingPromotion: { from: string; to: string; color: Color } | null;
  tournamentRoundLabel?: string;
  hasSavedGame: boolean;
  canUndo: boolean;
  saveStatusMessage: string | null;
  onRequestHint: () => void;
  onExecuteHintMove: () => void;
  onSaveGame: () => void;
  onLoadSavedGame: () => void;
  onUndo: () => void;
  onRestart: () => void;
  onTogglePause: () => void;
  onToggleMusic: () => void;
  onOpenMainMenu: () => void;
  onOpenCountrySelect: () => void;
  onOpenSettings: () => void;
  onSelectPromotionPiece: (piece: PieceSymbol) => void;
}

const PIECE_ICONS: Record<PieceSymbol, string> = {
  p: '♟',
  n: '♞',
  b: '♝',
  r: '♜',
  q: '♛',
  k: '♚',
};

const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: 'Pawn',
  r: 'Rook',
  n: 'Knight',
  b: 'Bishop',
  q: 'Queen',
  k: 'King',
};

const PIECE_POINTS: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export const GameInterface: React.FC<GameInterfaceProps> = ({
  whiteCountry,
  blackCountry,
  turn,
  isAIThinking,
  inCheck,
  isCheckmate,
  capturedByWhite,
  capturedByBlack,
  captureEvent,
  isPaused,
  settings,
  hintMove,
  pendingPromotion,
  tournamentRoundLabel,
  hasSavedGame,
  canUndo,
  saveStatusMessage,
  onRequestHint,
  onExecuteHintMove,
  onSaveGame,
  onLoadSavedGame,
  onUndo,
  onRestart,
  onTogglePause,
  onToggleMusic,
  onOpenMainMenu,
  onOpenCountrySelect,
  onOpenSettings,
  onSelectPromotionPiece,
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;

  const whiteCapturedScore = capturedByWhite.reduce((acc, p) => acc + PIECE_POINTS[p], 0);
  const blackCapturedScore = capturedByBlack.reduce((acc, p) => acc + PIECE_POINTS[p], 0);
  const whiteAdvantage = whiteCapturedScore - blackCapturedScore;
  const blackAdvantage = blackCapturedScore - whiteCapturedScore;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
      {/* ===================================================================== */}
      {/* TOP BAR: NO BANNER — STYLISH FLOATING COUNTRY NAMES + CAPTURED PIECES */}
      {/* + ONLY HINT, PAUSE, SAVE, AND MUSIC OPTIONS                           */}
      {/* ===================================================================== */}
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-2 pointer-events-auto">
        {/* Stylish Floating Country Names & Live Captured Pieces ("Ke Kake Khailo") */}
        <div className="flex flex-col items-center text-center select-none">
          <div className="flex items-start justify-center gap-3 sm:gap-7">
            {/* White Country Column */}
            <div className="flex flex-col items-center min-w-[125px] sm:min-w-[175px]">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <span
                  className={`font-display font-black tracking-[0.12em] text-lg sm:text-2xl md:text-3xl uppercase transition-all ${
                    turn === 'w'
                      ? 'bg-gradient-to-b from-[#fffbeb] via-[#fbbf24] to-[#d97706] bg-clip-text text-transparent scale-105'
                      : 'text-slate-300/80'
                  }`}
                  style={{
                    filter:
                      turn === 'w'
                        ? 'drop-shadow(0 2px 0 #451a03) drop-shadow(0 4px 14px rgba(251, 191, 36, 0.7))'
                        : 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.95))',
                  }}
                >
                  {whiteCountry.name}
                </span>

                {/* Live Captured Piece Count Badge ("Ke Koyta Daba Khailo") */}
                <motion.span
                  key={`w-count-${capturedByWhite.length}`}
                  initial={{ scale: 1.45, y: -4 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 16 }}
                  title={`${whiteCountry.name} captured ${capturedByWhite.length} piece(s)`}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#1a1308]/90 border border-amber-400/70 text-amber-300 font-mono-tabular font-extrabold text-xs sm:text-sm shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
                >
                  <span className="text-[11px] sm:text-xs text-amber-400">♟</span>
                  <span>{capturedByWhite.length}</span>
                </motion.span>
              </div>

              {/* Pieces Captured by White Country (Animated) */}
              <div className="min-h-[20px] flex items-center justify-center flex-wrap gap-0.5 mt-0.5">
                <AnimatePresence initial={false}>
                  {capturedByWhite.map((p, idx) => (
                    <motion.span
                      key={`w-cap-${idx}-${p}`}
                      initial={{ scale: 0, y: -10, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                      className="text-sm sm:text-base text-amber-300"
                      style={{ textShadow: '0 2px 6px rgba(0,0,0,0.95)' }}
                      title={`${whiteCountry.name} captured ${blackCountry.name}'s ${PIECE_NAMES[p]}`}
                    >
                      {PIECE_ICONS[p]}
                    </motion.span>
                  ))}
                </AnimatePresence>
                {whiteAdvantage > 0 && (
                  <span
                    className="ml-1 text-[10px] sm:text-xs font-mono-tabular font-bold text-emerald-300"
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.95)' }}
                  >
                    +{whiteAdvantage}
                  </span>
                )}
              </div>
            </div>

            {/* VS Divider */}
            <span
              className="font-display font-extrabold text-xs sm:text-sm tracking-[0.25em] text-amber-400 mt-1.5 sm:mt-2"
              style={{
                textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 0 12px rgba(245,158,11,0.6)',
              }}
            >
              VS
            </span>

            {/* Black Country Column */}
            <div className="flex flex-col items-center min-w-[125px] sm:min-w-[175px]">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                {/* Live Captured Piece Count Badge ("Ke Koyta Daba Khailo") */}
                <motion.span
                  key={`b-count-${capturedByBlack.length}`}
                  initial={{ scale: 1.45, y: -4 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 16 }}
                  title={`${blackCountry.name} captured ${capturedByBlack.length} piece(s)`}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#1a1308]/90 border border-amber-400/70 text-amber-300 font-mono-tabular font-extrabold text-xs sm:text-sm shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
                >
                  <span className="text-[11px] sm:text-xs text-amber-400">♟</span>
                  <span>{capturedByBlack.length}</span>
                </motion.span>

                <span
                  className={`font-display font-black tracking-[0.12em] text-lg sm:text-2xl md:text-3xl uppercase transition-all ${
                    turn === 'b'
                      ? 'bg-gradient-to-b from-[#fffbeb] via-[#fbbf24] to-[#d97706] bg-clip-text text-transparent scale-105'
                      : 'text-slate-300/80'
                  }`}
                  style={{
                    filter:
                      turn === 'b'
                        ? 'drop-shadow(0 2px 0 #451a03) drop-shadow(0 4px 14px rgba(251, 191, 36, 0.7))'
                        : 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.95))',
                  }}
                >
                  {blackCountry.name}
                </span>
              </div>

              {/* Pieces Captured by Black Country (Animated) */}
              <div className="min-h-[20px] flex items-center justify-center flex-wrap gap-0.5 mt-0.5">
                <AnimatePresence initial={false}>
                  {capturedByBlack.map((p, idx) => (
                    <motion.span
                      key={`b-cap-${idx}-${p}`}
                      initial={{ scale: 0, y: -10, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                      className="text-sm sm:text-base text-purple-300"
                      style={{ textShadow: '0 2px 6px rgba(0,0,0,0.95)' }}
                      title={`${blackCountry.name} captured ${whiteCountry.name}'s ${PIECE_NAMES[p]}`}
                    >
                      {PIECE_ICONS[p]}
                    </motion.span>
                  ))}
                </AnimatePresence>
                {blackAdvantage > 0 && (
                  <span
                    className="ml-1 text-[10px] sm:text-xs font-mono-tabular font-bold text-emerald-300"
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.95)' }}
                  >
                    +{blackAdvantage}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Subtle Floating Turn / Status Text */}
          <div
            className="font-display font-bold text-[11px] sm:text-xs tracking-[0.2em] uppercase text-amber-300"
            style={{ textShadow: '0 2px 6px rgba(0,0,0,0.95)' }}
          >
            {tournamentRoundLabel ? `${tournamentRoundLabel} · ` : ''}
            {isCheckmate
              ? t.checkmate
              : inCheck
              ? `⚔️ ${t.check}`
              : isAIThinking
              ? `${blackCountry.name} AI Thinking...`
              : `${turn === 'w' ? whiteCountry.name : blackCountry.name} ${t.turn}`}
          </div>
        </div>

        {/* ONLY 4 Top Action Buttons: HINT, PAUSE, SAVE, MUSIC */}
        <div className="flex items-center justify-center gap-2 sm:gap-2.5">
          <button
            onClick={onRequestHint}
            disabled={isAIThinking}
            title="Show Best Move Hint"
            className="px-3 py-1.5 rounded-lg bg-[#0d1f1a]/90 hover:bg-[#132e26] border border-emerald-400/60 text-emerald-200 font-display font-bold text-xs tracking-wider flex items-center gap-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.75)] transition-all cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-emerald-300" />
            <span>HINT</span>
          </button>

          <button
            onClick={onTogglePause}
            title="Pause Game"
            className="px-3 py-1.5 rounded-lg bg-[#241b0d]/90 hover:bg-[#362813] border border-amber-400/60 text-amber-200 font-display font-bold text-xs tracking-wider flex items-center gap-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.75)] transition-all cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5 text-amber-300" />
            <span>PAUSE</span>
          </button>

          <button
            onClick={onSaveGame}
            title="Save Game"
            className="px-3 py-1.5 rounded-lg bg-[#0d1c29]/90 hover:bg-[#13293d] border border-sky-400/60 text-sky-200 font-display font-bold text-xs tracking-wider flex items-center gap-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.75)] transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-sky-300" />
            <span>SAVE</span>
          </button>

          <button
            onClick={onToggleMusic}
            title="Toggle Music"
            className={`px-3 py-1.5 rounded-lg border font-display font-bold text-xs tracking-wider flex items-center gap-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.75)] transition-all cursor-pointer ${
              settings.musicEnabled
                ? 'bg-[#241b0d]/90 border-amber-400 text-amber-200'
                : 'bg-[#120f1d]/90 border-white/20 text-slate-400'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>MUSIC</span>
          </button>
        </div>

        {/* Animated Capture Feed Alert ("Ke Kake Khailo" with Animation) */}
        <AnimatePresence mode="wait">
          {captureEvent && (
            <motion.div
              key={captureEvent.id}
              initial={{ opacity: 0, y: -14, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#170f1e]/90 border border-amber-400/60 shadow-[0_4px_20px_rgba(245,158,11,0.35)] select-none"
            >
              <span className="font-display font-bold text-xs text-amber-300">
                {captureEvent.attackerCountry}
              </span>
              <span className="text-base text-white">
                {PIECE_ICONS[captureEvent.attackerPiece]}
              </span>
              <span className="text-xs font-semibold text-amber-100">
                {PIECE_NAMES[captureEvent.attackerPiece]}
              </span>

              <motion.span
                initial={{ rotate: -35, scale: 1.4 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="text-red-400 flex items-center px-0.5"
              >
                <Swords className="w-3.5 h-3.5" />
              </motion.span>

              <span className="font-display font-bold text-xs text-red-300">
                {captureEvent.victimCountry}
              </span>
              <span className="text-base text-red-300">
                {PIECE_ICONS[captureEvent.capturedPiece]}
              </span>
              <span className="text-xs font-semibold text-red-200">
                {PIECE_NAMES[captureEvent.capturedPiece]}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Status Toast Notification */}
        {saveStatusMessage && (
          <div className="px-4 py-1 rounded-xl bg-emerald-950/95 border border-emerald-400 text-emerald-200 font-display font-bold text-xs flex items-center gap-1.5 shadow-[0_4px_20px_rgba(16,185,129,0.4)]">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{saveStatusMessage}</span>
          </div>
        )}

        {/* Active Best Move Hint Banner */}
        {hintMove && (
          <div className="px-4 py-1.5 rounded-xl bg-[#0e1b2a]/95 border border-sky-400/70 text-sky-100 text-xs font-semibold flex items-center gap-3 shadow-[0_4px_20px_rgba(56,189,248,0.35)]">
            <span>
              💡 Best Move: <strong className="text-amber-300 uppercase">{hintMove.from}</strong> →{' '}
              <strong className="text-emerald-300 uppercase">{hintMove.to}</strong> ({hintMove.san})
            </span>
            <button
              onClick={onExecuteHintMove}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#09080d] font-display font-bold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Play Move</span>
            </button>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* PAWN PROMOTION MODAL                                                  */}
      {/* ===================================================================== */}
      {pendingPromotion && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 pointer-events-auto p-4">
          <div className="bg-[#110e1d] border-2 border-amber-400 rounded-2xl p-5 max-w-sm w-full shadow-[0_20px_60px_rgba(0,0,0,0.95)] text-center">
            <h3 className="font-display font-bold text-base sm:text-lg text-amber-300 tracking-wider mb-3">
              PROMOTE PAWN
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map((p) => (
                <button
                  key={p}
                  onClick={() => onSelectPromotionPiece(p)}
                  className="p-3 rounded-xl bg-[#1b162e] hover:bg-[#2a2248] border border-amber-500/40 hover:border-amber-300 flex flex-col items-center gap-1 transition-all cursor-pointer"
                >
                  <span className="text-3xl text-amber-300">{PIECE_ICONS[p]}</span>
                  <span className="font-display font-bold text-xs text-white">
                    {PIECE_NAMES[p]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PAUSE MODAL (Resume, Save Game, Load Game, Settings, Exit & Reset)    */}
      {/* ===================================================================== */}
      {isPaused && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 pointer-events-auto p-4">
          <div className="bg-[#110e1d] border border-amber-500/45 rounded-2xl p-6 max-w-xs w-full text-center shadow-[0_20px_60px_rgba(0,0,0,0.95)] space-y-3">
            <h3 className="font-display font-bold text-xl text-amber-300 tracking-wider">
              GAME PAUSED
            </h3>
            <div className="text-xs text-slate-300 font-semibold">
              {whiteCountry.name} vs {blackCountry.name}
            </div>

            {saveStatusMessage && (
              <div className="py-1.5 px-3 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-bold">
                ✓ {saveStatusMessage}
              </div>
            )}

            <div className="pt-1 flex flex-col gap-2">
              <button
                onClick={onTogglePause}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#09080d] font-display font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>RESUME GAME</span>
              </button>

              {canUndo && (
                <button
                  onClick={() => {
                    onUndo();
                    onTogglePause();
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#1b162e] hover:bg-[#261f40] border border-amber-500/30 text-amber-100 font-display font-semibold text-xs tracking-wider cursor-pointer"
                >
                  UNDO LAST MOVE
                </button>
              )}

              <button
                onClick={onSaveGame}
                className="w-full py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 font-display font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>SAVE GAME</span>
              </button>

              {hasSavedGame && (
                <button
                  onClick={onLoadSavedGame}
                  className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 font-display font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>LOAD SAVED GAME</span>
                </button>
              )}

              <button
                onClick={() => {
                  onTogglePause();
                  onOpenSettings();
                }}
                className="w-full py-2.5 rounded-xl bg-[#1b162e] hover:bg-[#261f40] border border-amber-500/30 text-amber-100 font-display font-semibold text-xs tracking-wider cursor-pointer"
              >
                SETTINGS & BOARD
              </button>

              <button
                onClick={() => {
                  onTogglePause();
                  onOpenCountrySelect();
                }}
                className="w-full py-2.5 rounded-xl bg-[#1b162e] hover:bg-[#261f40] border border-amber-500/30 text-amber-100 font-display font-semibold text-xs tracking-wider cursor-pointer"
              >
                COUNTRIES
              </button>

              <button
                onClick={onRestart}
                className="w-full py-2.5 rounded-xl bg-[#1b162e] hover:bg-[#261f40] border border-amber-500/30 text-amber-100 font-display font-semibold text-xs tracking-wider cursor-pointer"
              >
                RESTART NEW GAME
              </button>

              <button
                onClick={onOpenMainMenu}
                className="w-full py-2.5 rounded-xl bg-[#161224] hover:bg-red-950/60 border border-white/10 text-slate-300 hover:text-red-200 font-display font-semibold text-xs tracking-wider cursor-pointer"
              >
                EXIT TO MENU (RESET)
              </button>
            </div>
          </div>
        </div>
      )}

      <div />
    </div>
  );
};
