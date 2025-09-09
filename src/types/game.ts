export type CellState = 'empty' | 'ship' | 'hit' | 'miss';
export type GamePhase = 'setup' | 'playing' | 'ended';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Cell {
  state: CellState;
  hasShip: boolean;
  row: number;
  col: number;
}

export interface Ship {
  id: string;
  name: string;
  length: number;
  positions: { row: number; col: number }[];
  hits: number;
  sunk: boolean;
  orientation: 'horizontal' | 'vertical';
}

export interface GameBoard {
  cells: Cell[][];
  ships: Ship[];
}

export interface GameState {
  playerBoard: GameBoard;
  aiBoard: GameBoard;
  currentPlayer: 'player' | 'ai';
  phase: GamePhase;
  difficulty: Difficulty;
  winner: 'player' | 'ai' | null;
  gameMessage: string;
}

export const SHIP_SIZES = [5, 3, 2];
export const BOARD_SIZE = 8;

export const SHIP_NAMES: Record<number, string> = {
  5: 'Warship',
  3: 'Submarine', 
  2: 'Destroyer'
};