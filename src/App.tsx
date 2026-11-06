/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Chess, Square, Move, PieceSymbol, Color } from 'chess.js';
import { COUNTRIES, CountryConfig, getCountryById } from './data/countries';
import {
  GameSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from './data/settings';
import {
  AIDifficulty,
  computeBestAIMove,
  coordsToSquare,
} from './engine/chessAI';
import { soundEngine } from './audio/soundEngine';
import {
  ChessScene3D,
  CameraPreset,
  BoardCell,
  LastMoveAnimation,
  HintSuggestion,
} from './components/ChessScene3D';
import { MainMenu, GameMode } from './components/MainMenu';
import { CountrySelector } from './components/CountrySelector';
import { GameModesModal, TournamentMatch } from './components/GameModesModal';
import { GameInterface } from './components/GameInterface';
import { VictoryScreen, GameOverState } from './components/VictoryScreen';
import { SettingsModal, HowToPlayModal, AboutModal } from './components/Modals';
import { LoadingScreen } from './components/LoadingScreen';
import { DeveloperCredit } from './components/DeveloperCredit';

type ActiveModal = 'none' | 'country' | 'modes' | 'howto' | 'settings' | 'about';

const SAVED_GAME_STORAGE_KEY = 'chess_legends_3d_saved_match_v1';

interface SavedMatchData {
  pgn: string;
  fen: string;
  whiteCountryId: string;
  blackCountryId: string;
  gameMode: GameMode;
  aiDifficulty: AIDifficulty;
  whiteTimeSec: number;
  blackTimeSec: number;
  savedAt: number;
}

function extractBoardCells(game: Chess): BoardCell[] {
  const raw = game.board();
  const cells: BoardCell[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const item = raw[r][c];
      if (item) {
        cells.push({
          square: item.square as Square,
          type: item.type,
          color: item.color,
        });
      }
    }
  }
  return cells;
}

function findInCheckKingSquare(game: Chess): Square | null {
  if (!game.inCheck()) return null;
  const turn = game.turn();
  const raw = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = raw[r][c];
      if (p && p.type === 'k' && p.color === turn) {
        return coordsToSquare(r, c);
      }
    }
  }
  return null;
}

function evaluateGameOverState(game: Chess): GameOverState | null {
  if (!game.isGameOver()) return null;

  if (game.isCheckmate()) {
    const winner = game.turn() === 'w' ? 'black_win' : 'white_win';
    return {
      outcome: winner,
      reason: 'Checkmate',
    };
  }

  if (game.isStalemate()) {
    return { outcome: 'draw', reason: 'Stalemate' };
  }
  if (game.isThreefoldRepetition()) {
    return { outcome: 'draw', reason: 'Repetition' };
  }
  if (game.isInsufficientMaterial()) {
    return { outcome: 'draw', reason: 'Insufficient Material' };
  }
  return { outcome: 'draw', reason: '50-Move Rule' };
}

function createInitialTournament(playerCountry: CountryConfig): TournamentMatch[] {
  const pool = COUNTRIES.filter((c) => c.id !== playerCountry.id);
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 7);
  return [
    {
      id: 'qf1',
      round: 'Quarterfinal',
      team1: playerCountry,
      team2: shuffled[0],
      isPlayerMatch: true,
    },
    {
      id: 'qf2',
      round: 'Quarterfinal',
      team1: shuffled[1],
      team2: shuffled[2],
      isPlayerMatch: false,
    },
    {
      id: 'qf3',
      round: 'Quarterfinal',
      team1: shuffled[3],
      team2: shuffled[4],
      isPlayerMatch: false,
    },
    {
      id: 'qf4',
      round: 'Quarterfinal',
      team1: shuffled[5],
      team2: shuffled[6],
      isPlayerMatch: false,
    },
  ];
}

export default function App() {
  const [whiteCountry, setWhiteCountry] = useState<CountryConfig>(() =>
    getCountryById('bangladesh')
  );
  const [blackCountry, setBlackCountry] = useState<CountryConfig>(() =>
    getCountryById('india')
  );

  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [screen, setScreen] = useState<'menu' | 'playing'>('menu');
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');

  // Loading Screen state (shown before game opens)
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(8);
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing 3D Castle Chamber...');

  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');

  const [tournamentMatches, setTournamentMatches] = useState<TournamentMatch[]>(() =>
    createInitialTournament(getCountryById('bangladesh'))
  );
  const [tournamentStage, setTournamentStage] = useState<number>(0);
  const [tournamentChampion, setTournamentChampion] = useState<CountryConfig | null>(null);

  const chessRef = useRef<Chess>(new Chess());
  const [fen, setFen] = useState<string>(() => chessRef.current.fen());
  const [boardCells, setBoardCells] = useState<BoardCell[]>(() =>
    extractBoardCells(chessRef.current)
  );
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [hintMove, setHintMove] = useState<HintSuggestion | null>(null);
  const [lastMoveAnim, setLastMoveAnim] = useState<LastMoveAnimation | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [capturedByWhite, setCapturedByWhite] = useState<PieceSymbol[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<PieceSymbol[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
    color: Color;
  } | null>(null);

  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState<GameOverState | null>(null);

  const [whiteTimeSec, setWhiteTimeSec] = useState(0);
  const [blackTimeSec, setBlackTimeSec] = useState(0);

  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('default');
  const [cameraPresetTrigger, setCameraPresetTrigger] = useState(0);

  // Saved game state
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(SAVED_GAME_STORAGE_KEY));
    } catch {
      return false;
    }
  });
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);

  // Run initial Loading Screen animation before opening the game
  useEffect(() => {
    let progress = 10;
    const interval = window.setInterval(() => {
      progress += 18;
      if (progress >= 100) {
        setLoadingProgress(100);
        setLoadingStatus('Ready for Battle!');
        clearInterval(interval);
        window.setTimeout(() => {
          setIsLoading(false);
        }, 260);
      } else {
        setLoadingProgress(progress);
        if (progress < 45) {
          setLoadingStatus('Loading Mysterious 3D Chamber...');
        } else if (progress < 80) {
          setLoadingStatus('Summoning Cartoon Soldier Armies...');
        } else {
          setLoadingStatus('Preparing Chessboard Arena...');
        }
      }
    }, 180);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    soundEngine.configure({
      musicEnabled: settings.musicEnabled,
      sfxEnabled: settings.sfxEnabled,
      volume: settings.volume,
    });
  }, [settings.musicEnabled, settings.sfxEnabled, settings.volume]);

  const handleUpdateSettings = useCallback((partial: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const handleResetSettings = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
    setSettings({ ...DEFAULT_SETTINGS });
  }, []);

  const syncEngineState = useCallback(
    (animatedMove?: Move) => {
      const game = chessRef.current;
      setFen(game.fen());
      setBoardCells(extractBoardCells(game));
      setHintMove(null);

      const historyVerbose = game.history({ verbose: true });
      setMoveHistory(historyVerbose.map((m) => m.san));

      const capW: PieceSymbol[] = [];
      const capB: PieceSymbol[] = [];
      historyVerbose.forEach((m) => {
        if (m.captured) {
          if (m.color === 'w') capW.push(m.captured);
          else capB.push(m.captured);
        }
      });
      setCapturedByWhite(capW);
      setCapturedByBlack(capB);

      if (animatedMove) {
        setLastMove({ from: animatedMove.from as Square, to: animatedMove.to as Square });
        setLastMoveAnim({
          id: Date.now() + Math.random(),
          from: animatedMove.from as Square,
          to: animatedMove.to as Square,
          captured: animatedMove.captured,
          piece: animatedMove.piece,
          color: animatedMove.color,
        });

        if (animatedMove.captured) {
          soundEngine.playSwordClash();
        } else {
          soundEngine.playFootsteps(3);
        }
      }

      const over = evaluateGameOverState(game);
      if (over) {
        setGameOver(over);
        if (over.outcome === 'white_win') {
          soundEngine.playVictory();
        } else if (over.outcome === 'black_win') {
          if (gameMode === 'ai') soundEngine.playDefeat();
          else soundEngine.playVictory();
        } else {
          soundEngine.playCheck();
        }
      } else if (game.inCheck()) {
        soundEngine.playCheck();
      }
    },
    [gameMode]
  );

  // Full board & match reset helper (used when exiting game or starting fresh)
  const resetMatchState = useCallback(() => {
    chessRef.current = new Chess();
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setHintMove(null);
    setLastMoveAnim(null);
    setMoveHistory([]);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setPendingPromotion(null);
    setGameOver(null);
    setIsPaused(false);
    setIsAIThinking(false);
    setWhiteTimeSec(0);
    setBlackTimeSec(0);
    setSaveStatusMessage(null);
    setFen(chessRef.current.fen());
    setBoardCells(extractBoardCells(chessRef.current));
    setCameraPreset('default');
    setCameraPresetTrigger((n) => n + 1);
  }, []);

  // Start a brand-new reset match
  const startNewMatch = useCallback(
    (customWhite?: CountryConfig, customBlack?: CountryConfig) => {
      const w = customWhite || whiteCountry;
      const b = customBlack || blackCountry;
      if (customWhite) setWhiteCountry(w);
      if (customBlack) setBlackCountry(b);

      resetMatchState();
      setActiveModal('none');
      setScreen('playing');
      soundEngine.playClick();
    },
    [whiteCountry, blackCountry, resetMatchState]
  );

  // Exit game to Main Menu -> resets the active match so next game starts fresh
  const handleExitToMainMenu = useCallback(() => {
    soundEngine.playClick();
    resetMatchState();
    setActiveModal('none');
    setScreen('menu');
  }, [resetMatchState]);

  // Save current match to localStorage
  const handleSaveGame = useCallback(() => {
    try {
      const game = chessRef.current;
      const payload: SavedMatchData = {
        pgn: game.pgn(),
        fen: game.fen(),
        whiteCountryId: whiteCountry.id,
        blackCountryId: blackCountry.id,
        gameMode,
        aiDifficulty,
        whiteTimeSec,
        blackTimeSec,
        savedAt: Date.now(),
      };
      localStorage.setItem(SAVED_GAME_STORAGE_KEY, JSON.stringify(payload));
      setHasSavedGame(true);
      setSaveStatusMessage('Game Saved!');
      soundEngine.playSelect();
      window.setTimeout(() => {
        setSaveStatusMessage(null);
      }, 2400);
    } catch {
      // ignore storage quota errors
    }
  }, [whiteCountry.id, blackCountry.id, gameMode, aiDifficulty, whiteTimeSec, blackTimeSec]);

  // Load saved match from localStorage
  const handleLoadSavedGame = useCallback(() => {
    try {
      const raw = localStorage.getItem(SAVED_GAME_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as SavedMatchData;
      const loadedChess = new Chess();
      if (saved.pgn) {
        loadedChess.loadPgn(saved.pgn);
      } else if (saved.fen) {
        loadedChess.load(saved.fen);
      }

      chessRef.current = loadedChess;
      setWhiteCountry(getCountryById(saved.whiteCountryId));
      setBlackCountry(getCountryById(saved.blackCountryId));
      setGameMode(saved.gameMode || 'ai');
      setAiDifficulty(saved.aiDifficulty || 'medium');
      setWhiteTimeSec(saved.whiteTimeSec || 0);
      setBlackTimeSec(saved.blackTimeSec || 0);
      setSelectedSquare(null);
      setLegalMoves([]);
      setHintMove(null);
      setPendingPromotion(null);
      setIsPaused(false);
      setIsAIThinking(false);
      setGameOver(evaluateGameOverState(loadedChess));
      syncEngineState();
      setActiveModal('none');
      setScreen('playing');
      setSaveStatusMessage('Saved Game Loaded!');
      soundEngine.playSelect();
      window.setTimeout(() => {
        setSaveStatusMessage(null);
      }, 2200);
    } catch {
      // fallback to new match if corrupted
      startNewMatch();
    }
  }, [syncEngineState, startNewMatch]);

  const executeChessMove = useCallback(
    (from: Square, to: Square, promotion?: PieceSymbol) => {
      const game = chessRef.current;
      try {
        const moveResult = game.move({
          from,
          to,
          promotion: promotion || 'q',
        });
        if (moveResult) {
          setSelectedSquare(null);
          setLegalMoves([]);
          setHintMove(null);
          setPendingPromotion(null);
          syncEngineState(moveResult);
          return true;
        }
      } catch {
        // Illegal move prevented by chess.js
      }
      return false;
    },
    [syncEngineState]
  );

  // Compute and show best move hint on the 3D chessboard when user clicks Hint!
  const handleRequestHint = useCallback(() => {
    if (screen !== 'playing' || isPaused || gameOver || isAIThinking) return;
    const game = chessRef.current;
    const bestMove = computeBestAIMove(game.fen(), 'hard');
    if (bestMove) {
      const fromSq = bestMove.from as Square;
      const toSq = bestMove.to as Square;
      setHintMove({
        from: fromSq,
        to: toSq,
        san: bestMove.san,
        promotion: bestMove.promotion as PieceSymbol | undefined,
      });
      setSelectedSquare(fromSq);
      setLegalMoves(game.moves({ square: fromSq, verbose: true }));
      soundEngine.playSelect();
    }
  }, [screen, isPaused, gameOver, isAIThinking]);

  const handleExecuteHintMove = useCallback(() => {
    if (!hintMove) return;
    executeChessMove(hintMove.from, hintMove.to, hintMove.promotion);
  }, [hintMove, executeChessMove]);

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (
        screen !== 'playing' ||
        isPaused ||
        activeModal !== 'none' ||
        gameOver ||
        isAIThinking ||
        pendingPromotion
      ) {
        return;
      }

      const game = chessRef.current;
      const currentTurn = game.turn();

      const isVsComputer =
        gameMode === 'ai' || gameMode === 'country' || gameMode === 'tournament';
      if (isVsComputer && currentTurn === 'b') {
        return;
      }

      if (selectedSquare) {
        const matchingMoves = legalMoves.filter((m) => m.to === square);
        if (matchingMoves.length > 0) {
          const isPromotion = matchingMoves.some((m) => Boolean(m.promotion));
          if (isPromotion) {
            setPendingPromotion({ from: selectedSquare, to: square, color: currentTurn });
            soundEngine.playSelect();
            return;
          }
          executeChessMove(selectedSquare, square);
          return;
        }
      }

      const pieceOnSquare = game.get(square);
      if (pieceOnSquare && pieceOnSquare.color === currentTurn) {
        if (selectedSquare === square) {
          setSelectedSquare(null);
          setLegalMoves([]);
        } else {
          setSelectedSquare(square);
          const movesForSquare = game.moves({ square, verbose: true });
          setLegalMoves(movesForSquare);
          soundEngine.playSelect();
        }
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    },
    [
      screen,
      isPaused,
      activeModal,
      gameOver,
      isAIThinking,
      pendingPromotion,
      gameMode,
      selectedSquare,
      legalMoves,
      executeChessMove,
    ]
  );

  useEffect(() => {
    if (screen !== 'playing' || isPaused || activeModal !== 'none' || gameOver) {
      setIsAIThinking(false);
      return;
    }
    const game = chessRef.current;
    const isComputerBlack =
      gameMode === 'ai' || gameMode === 'country' || gameMode === 'tournament';

    if (isComputerBlack && game.turn() === 'b' && !game.isGameOver()) {
      setIsAIThinking(true);
      const timer = window.setTimeout(() => {
        const currentFen = chessRef.current.fen();
        const aiMove = computeBestAIMove(currentFen, aiDifficulty);
        setIsAIThinking(false);
        if (aiMove) {
          executeChessMove(
            aiMove.from as Square,
            aiMove.to as Square,
            aiMove.promotion as PieceSymbol | undefined
          );
        }
      }, 550);

      return () => {
        clearTimeout(timer);
        setIsAIThinking(false);
      };
    }
  }, [fen, screen, isPaused, activeModal, gameOver, gameMode, aiDifficulty, executeChessMove]);

  useEffect(() => {
    if (screen !== 'playing' || isPaused || activeModal !== 'none' || gameOver) return;
    const interval = window.setInterval(() => {
      const turn = chessRef.current.turn();
      if (turn === 'w') {
        setWhiteTimeSec((t) => t + 1);
      } else {
        setBlackTimeSec((t) => t + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [screen, isPaused, activeModal, gameOver]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;
      if (screen === 'menu' && activeModal === 'none' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        startNewMatch();
      } else if (screen === 'playing' && e.key === 'Escape') {
        if (activeModal !== 'none') {
          setActiveModal('none');
        } else if (!gameOver) {
          setIsPaused((p) => !p);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLoading, screen, activeModal, gameOver, startNewMatch]);

  const handleUndo = useCallback(() => {
    const game = chessRef.current;
    if (game.history().length === 0 || isAIThinking) return;

    const isVsComputer =
      gameMode === 'ai' || gameMode === 'country' || gameMode === 'tournament';
    if (isVsComputer && game.turn() === 'w' && game.history().length >= 2) {
      game.undo();
      game.undo();
    } else {
      game.undo();
    }
    setSelectedSquare(null);
    setLegalMoves([]);
    setHintMove(null);
    setGameOver(null);
    syncEngineState();
    soundEngine.playClick();
  }, [gameMode, isAIThinking, syncEngineState]);

  const handleResetTournament = useCallback(() => {
    const bracket = createInitialTournament(whiteCountry);
    setTournamentMatches(bracket);
    setTournamentStage(0);
    setTournamentChampion(null);
    setBlackCountry(bracket[0].team2);
  }, [whiteCountry]);

  const handleNextTournamentMatch = useCallback(() => {
    if (tournamentStage === 0) {
      const qfWinners = tournamentMatches.map((m, idx) =>
        idx === 0 ? whiteCountry : Math.random() > 0.5 ? m.team1 : m.team2
      );
      const sfMatches: TournamentMatch[] = [
        {
          id: 'sf1',
          round: 'Semifinal',
          team1: qfWinners[0],
          team2: qfWinners[1],
          isPlayerMatch: true,
        },
        {
          id: 'sf2',
          round: 'Semifinal',
          team1: qfWinners[2],
          team2: qfWinners[3],
          isPlayerMatch: false,
        },
      ];
      setTournamentMatches(sfMatches);
      setTournamentStage(1);
      startNewMatch(whiteCountry, sfMatches[0].team2);
    } else if (tournamentStage === 1) {
      const otherFinalist =
        Math.random() > 0.5 ? tournamentMatches[1].team1 : tournamentMatches[1].team2;
      const finalMatch: TournamentMatch[] = [
        {
          id: 'final',
          round: 'Grand Final',
          team1: whiteCountry,
          team2: otherFinalist,
          isPlayerMatch: true,
        },
      ];
      setTournamentMatches(finalMatch);
      setTournamentStage(2);
      startNewMatch(whiteCountry, otherFinalist);
    } else {
      setTournamentChampion(whiteCountry);
      resetMatchState();
      setScreen('menu');
      setActiveModal('modes');
    }
  }, [tournamentStage, tournamentMatches, whiteCountry, startNewMatch, resetMatchState]);

  const inCheckKingSquare = useMemo(() => findInCheckKingSquare(chessRef.current), [fen]);
  const currentTurn = chessRef.current.turn();
  const inCheck = chessRef.current.inCheck();
  const isCheckmate = chessRef.current.isCheckmate();

  const tournamentRoundLabel =
    gameMode === 'tournament'
      ? tournamentStage === 0
        ? 'QF'
        : tournamentStage === 1
        ? 'SF'
        : 'FINAL'
      : undefined;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#09080d] select-none">
      {isLoading && (
        <LoadingScreen
          progress={loadingProgress}
          statusText={loadingStatus}
          whiteCountry={whiteCountry}
          blackCountry={blackCountry}
        />
      )}

      <ChessScene3D
        boardCells={boardCells}
        whiteCountry={whiteCountry}
        blackCountry={blackCountry}
        selectedSquare={selectedSquare}
        legalMoves={legalMoves}
        lastMove={lastMove}
        hintMove={hintMove}
        inCheckKingSquare={inCheckKingSquare}
        cameraPreset={cameraPreset}
        cameraPresetTrigger={cameraPresetTrigger}
        isMenuBackground={screen === 'menu'}
        settings={settings}
        lastMoveAnim={lastMoveAnim}
        onSquareClick={handleSquareClick}
      />

      {!isLoading && screen === 'menu' && activeModal === 'none' && (
        <MainMenu
          settings={settings}
          hasSavedGame={hasSavedGame}
          onStartGame={() => startNewMatch()}
          onContinueSavedGame={handleLoadSavedGame}
          onOpenCountrySelect={() => {
            soundEngine.playClick();
            setActiveModal('country');
          }}
          onOpenGameModes={() => {
            soundEngine.playClick();
            setActiveModal('modes');
          }}
          onOpenHowToPlay={() => {
            soundEngine.playClick();
            setActiveModal('howto');
          }}
          onOpenSettings={() => {
            soundEngine.playClick();
            setActiveModal('settings');
          }}
          onOpenAbout={() => {
            soundEngine.playClick();
            setActiveModal('about');
          }}
          onToggleMusic={() => {
            soundEngine.playClick();
            handleUpdateSettings({ musicEnabled: !settings.musicEnabled });
          }}
        />
      )}

      {!isLoading && screen === 'playing' && (
        <GameInterface
          whiteCountry={whiteCountry}
          blackCountry={blackCountry}
          turn={currentTurn}
          isAIThinking={isAIThinking}
          inCheck={inCheck}
          isCheckmate={isCheckmate}
          isPaused={isPaused}
          settings={settings}
          hintMove={hintMove}
          pendingPromotion={pendingPromotion}
          tournamentRoundLabel={tournamentRoundLabel}
          hasSavedGame={hasSavedGame}
          canUndo={moveHistory.length > 0 && !isAIThinking}
          saveStatusMessage={saveStatusMessage}
          onRequestHint={handleRequestHint}
          onExecuteHintMove={handleExecuteHintMove}
          onSaveGame={handleSaveGame}
          onLoadSavedGame={handleLoadSavedGame}
          onUndo={handleUndo}
          onRestart={() => startNewMatch()}
          onTogglePause={() => {
            soundEngine.playClick();
            setIsPaused((p) => !p);
          }}
          onToggleMusic={() => {
            soundEngine.playClick();
            handleUpdateSettings({ musicEnabled: !settings.musicEnabled });
          }}
          onOpenMainMenu={handleExitToMainMenu}
          onOpenCountrySelect={() => {
            soundEngine.playClick();
            setActiveModal('country');
          }}
          onOpenSettings={() => {
            soundEngine.playClick();
            setActiveModal('settings');
          }}
          onSelectPromotionPiece={(piece) => {
            if (pendingPromotion) {
              executeChessMove(pendingPromotion.from, pendingPromotion.to, piece);
            }
          }}
        />
      )}

      {!isLoading && screen === 'playing' && gameOver && (
        <VictoryScreen
          gameOver={gameOver}
          whiteCountry={whiteCountry}
          blackCountry={blackCountry}
          gameMode={gameMode}
          moveCount={moveHistory.length}
          settings={settings}
          hasNextTournamentMatch={gameMode === 'tournament' && tournamentStage < 2}
          onPlayAgain={() => startNewMatch()}
          onNextTournamentMatch={handleNextTournamentMatch}
          onChangeCountry={() => {
            setGameOver(null);
            setActiveModal('country');
          }}
          onMainMenu={handleExitToMainMenu}
        />
      )}

      {activeModal === 'country' && (
        <CountrySelector
          whiteCountry={whiteCountry}
          blackCountry={blackCountry}
          onSelectWhite={(c) => {
            soundEngine.playSelect();
            setWhiteCountry(c);
          }}
          onSelectBlack={(c) => {
            soundEngine.playSelect();
            setBlackCountry(c);
          }}
          onClose={() => {
            soundEngine.playClick();
            setActiveModal('none');
          }}
          onStartMatch={() => startNewMatch()}
        />
      )}

      {activeModal === 'modes' && (
        <GameModesModal
          gameMode={gameMode}
          aiDifficulty={aiDifficulty}
          whiteCountry={whiteCountry}
          blackCountry={blackCountry}
          tournamentMatches={tournamentMatches}
          tournamentStage={tournamentStage}
          tournamentChampion={tournamentChampion}
          onSelectMode={(m) => {
            soundEngine.playClick();
            setGameMode(m);
            if (m === 'tournament') {
              const bracket = createInitialTournament(whiteCountry);
              setTournamentMatches(bracket);
              setTournamentStage(0);
              setBlackCountry(bracket[0].team2);
            }
          }}
          onSelectDifficulty={(d) => {
            soundEngine.playClick();
            setAiDifficulty(d);
          }}
          onResetTournament={handleResetTournament}
          onStartSelectedMode={() => startNewMatch()}
          onOpenCountrySelect={() => setActiveModal('country')}
          onClose={() => {
            soundEngine.playClick();
            setActiveModal('none');
          }}
        />
      )}

      {activeModal === 'howto' && (
        <HowToPlayModal
          onClose={() => {
            soundEngine.playClick();
            setActiveModal('none');
          }}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          settings={settings}
          cameraPreset={cameraPreset}
          onSelectCameraPreset={(preset) => {
            soundEngine.playClick();
            setCameraPreset(preset);
            setCameraPresetTrigger((n) => n + 1);
          }}
          onUpdateSettings={handleUpdateSettings}
          onResetSettings={handleResetSettings}
          onClose={() => {
            soundEngine.playClick();
            setActiveModal('none');
          }}
        />
      )}

      {activeModal === 'about' && (
        <AboutModal
          onClose={() => {
            soundEngine.playClick();
            setActiveModal('none');
          }}
        />
      )}

      <DeveloperCredit />
    </div>
  );
}
