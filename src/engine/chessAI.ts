import { Chess, Move, Square, PieceSymbol, Color } from 'chess.js';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Positional piece-square tables (from White's perspective, rank 8 down to rank 1)
const PAWN_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_PST = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_PST = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0]
];

const QUEEN_PST = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

const KING_PST = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20]
];

function getPositionalBonus(type: PieceSymbol, color: Color, row: number, col: number): number {
  const r = color === 'w' ? row : 7 - row;
  const c = col;
  switch (type) {
    case 'p': return PAWN_PST[r][c];
    case 'n': return KNIGHT_PST[r][c];
    case 'b': return BISHOP_PST[r][c];
    case 'r': return ROOK_PST[r][c];
    case 'q': return QUEEN_PST[r][c];
    case 'k': return KING_PST[r][c];
    default: return 0;
  }
}

export function evaluateBoard(game: Chess): number {
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -99999 : 99999;
  }
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial()) {
    return 0;
  }

  const board = game.board();
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const val = PIECE_VALUES[piece.type] + getPositionalBonus(piece.type, piece.color, r, c);
      if (piece.color === 'w') {
        score += val;
      } else {
        score -= val;
      }
    }
  }

  if (game.inCheck()) {
    score += game.turn() === 'w' ? -35 : 35;
  }

  return score;
}

function orderMoves(moves: Move[]): Move[] {
  return moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    if (a.captured) scoreA += 10 * PIECE_VALUES[a.captured] - PIECE_VALUES[a.piece];
    if (a.promotion) scoreA += PIECE_VALUES[a.promotion];
    if (a.san.includes('+')) scoreA += 50;

    if (b.captured) scoreB += 10 * PIECE_VALUES[b.captured] - PIECE_VALUES[b.piece];
    if (b.promotion) scoreB += PIECE_VALUES[b.promotion];
    if (b.san.includes('+')) scoreB += 50;

    return scoreB - scoreA;
  });
}

function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || game.isGameOver()) {
    return evaluateBoard(game);
  }

  const moves = orderMoves(game.moves({ verbose: true }));

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      if (evaluation > maxEval) maxEval = evaluation;
      if (evaluation > alpha) alpha = evaluation;
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      if (evaluation < minEval) minEval = evaluation;
      if (evaluation < beta) beta = evaluation;
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function computeBestAIMove(fen: string, difficulty: AIDifficulty): Move | null {
  const game = new Chess(fen);
  const legalMoves = game.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  const isWhite = game.turn() === 'w';

  if (difficulty === 'easy') {
    // Easy: 1-ply lookahead with slight noise so beginners can beat it while it still captures hanging pieces
    const scored = legalMoves.map((m) => {
      game.move(m);
      const base = evaluateBoard(game);
      game.undo();
      const directional = isWhite ? base : -base;
      const noise = (Math.random() - 0.5) * 140;
      return { move: m, score: directional + noise };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0].move;
  }

  const depth = difficulty === 'medium' ? 2 : 3;
  const ordered = orderMoves(legalMoves);

  let bestMove = ordered[0];
  let bestVal = isWhite ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  for (const move of ordered) {
    game.move(move);
    const val = minimax(game, depth - 1, alpha, beta, !isWhite);
    game.undo();

    // Small tie-breaking jitter so openings vary naturally
    const jitter = (Math.random() - 0.5) * 6;
    const adjusted = val + jitter;

    if (isWhite) {
      if (adjusted > bestVal) {
        bestVal = adjusted;
        bestMove = move;
      }
      if (val > alpha) alpha = val;
    } else {
      if (adjusted < bestVal) {
        bestVal = adjusted;
        bestMove = move;
      }
      if (val < beta) beta = val;
    }
  }

  return bestMove;
}

export function squareToCoords(square: Square): { row: number; col: number } {
  const col = square.charCodeAt(0) - 97; // 'a' -> 0 .. 'h' -> 7
  const rank = parseInt(square[1], 10);  // '1' -> 1 .. '8' -> 8
  const row = 8 - rank;                  // rank 8 -> row 0 (top), rank 1 -> row 7 (bottom)
  return { row, col };
}

export function coordsToSquare(row: number, col: number): Square {
  const file = String.fromCharCode(97 + col);
  const rank = 8 - row;
  return `${file}${rank}` as Square;
}
