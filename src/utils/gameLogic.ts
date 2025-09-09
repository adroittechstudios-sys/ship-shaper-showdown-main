import { GameBoard, Ship, Cell, SHIP_SIZES, BOARD_SIZE, Difficulty, SHIP_NAMES } from '@/types/game';

export const createEmptyBoard = (): GameBoard => {
  const cells: Cell[][] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    cells[row] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      cells[row][col] = {
        state: 'empty',
        hasShip: false,
        row,
        col
      };
    }
  }
  return { cells, ships: [] };
};

export const canPlaceShip = (
  board: GameBoard,
  row: number,
  col: number,
  length: number,
  orientation: 'horizontal' | 'vertical'
): boolean => {
  if (orientation === 'horizontal') {
    if (col + length > BOARD_SIZE) return false;
    for (let i = 0; i < length; i++) {
      if (board.cells[row][col + i].hasShip) return false;
    }
  } else {
    if (row + length > BOARD_SIZE) return false;
    for (let i = 0; i < length; i++) {
      if (board.cells[row + i][col].hasShip) return false;
    }
  }
  return true;
};

export const placeShip = (
  board: GameBoard,
  row: number,
  col: number,
  length: number,
  orientation: 'horizontal' | 'vertical'
): GameBoard => {
  const newBoard = { ...board };
  const positions: { row: number; col: number }[] = [];
  
  const ship: Ship = {
    id: `ship-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: SHIP_NAMES[length],
    length,
    positions,
    hits: 0,
    sunk: false,
    orientation
  };

  if (orientation === 'horizontal') {
    for (let i = 0; i < length; i++) {
      newBoard.cells[row][col + i].hasShip = true;
      positions.push({ row, col: col + i });
    }
  } else {
    for (let i = 0; i < length; i++) {
      newBoard.cells[row + i][col].hasShip = true;
      positions.push({ row: row + i, col });
    }
  }

  newBoard.ships.push(ship);
  return newBoard;
};

export const placeShipsRandomly = (board: GameBoard): GameBoard => {
  let newBoard = { ...board };
  
  for (const shipSize of SHIP_SIZES) {
    let placed = false;
    let attempts = 0;
    
    while (!placed && attempts < 100) {
      const row = Math.floor(Math.random() * BOARD_SIZE);
      const col = Math.floor(Math.random() * BOARD_SIZE);
      const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      
      if (canPlaceShip(newBoard, row, col, shipSize, orientation)) {
        newBoard = placeShip(newBoard, row, col, shipSize, orientation);
        placed = true;
      }
      attempts++;
    }
  }
  
  return newBoard;
};

export const attack = (board: GameBoard, row: number, col: number): { board: GameBoard; hit: boolean; sunk: boolean } => {
  const newBoard = { ...board };
  const cell = newBoard.cells[row][col];
  
  if (cell.hasShip) {
    cell.state = 'hit';
    
    // Find the ship and update its hit count
    const ship = newBoard.ships.find(s => 
      s.positions.some(pos => pos.row === row && pos.col === col)
    );
    
    if (ship) {
      ship.hits++;
      if (ship.hits >= ship.length) {
        ship.sunk = true;
        return { board: newBoard, hit: true, sunk: true };
      }
    }
    
    return { board: newBoard, hit: true, sunk: false };
  } else {
    cell.state = 'miss';
    return { board: newBoard, hit: false, sunk: false };
  }
};

export const isGameOver = (board: GameBoard): boolean => {
  return board.ships.every(ship => ship.sunk);
};

// AI Logic
let lastHit: { row: number; col: number } | null = null;
let targetQueue: { row: number; col: number }[] = [];

export const getAIMove = (board: GameBoard, difficulty: Difficulty): { row: number; col: number } => {
  const availableCells = [];
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board.cells[row][col].state === 'empty') {
        availableCells.push({ row, col });
      }
    }
  }
  
  if (availableCells.length === 0) {
    return { row: 0, col: 0 }; // Fallback
  }
  
  switch (difficulty) {
    case 'easy':
      return availableCells[Math.floor(Math.random() * availableCells.length)];
      
    case 'medium':
      // If we have targets in queue (from previous hits), attack those first
      if (targetQueue.length > 0) {
        const target = targetQueue.shift()!;
        // Make sure target is still valid
        if (board.cells[target.row][target.col].state === 'empty') {
          return target;
        }
        // If not valid, try next in queue
        return getAIMove(board, difficulty);
      }
      
      // Random attack
      return availableCells[Math.floor(Math.random() * availableCells.length)];
      
    case 'hard':
      // Checkerboard pattern + hunt mode
      const checkerboardCells = availableCells.filter(
        cell => (cell.row + cell.col) % 2 === 0
      );
      
      if (checkerboardCells.length > 0) {
        return checkerboardCells[Math.floor(Math.random() * checkerboardCells.length)];
      }
      
      return availableCells[Math.floor(Math.random() * availableCells.length)];
      
    default:
      return availableCells[Math.floor(Math.random() * availableCells.length)];
  }
};

export const updateAIState = (row: number, col: number, hit: boolean, board: GameBoard) => {
  if (hit) {
    lastHit = { row, col };
    
    // Add adjacent cells to target queue
    const adjacentCells = [
      { row: row - 1, col },
      { row: row + 1, col },
      { row, col: col - 1 },
      { row, col: col + 1 }
    ];
    
    adjacentCells.forEach(cell => {
      if (
        cell.row >= 0 && cell.row < BOARD_SIZE &&
        cell.col >= 0 && cell.col < BOARD_SIZE &&
        board.cells[cell.row][cell.col].state === 'empty'
      ) {
        targetQueue.push(cell);
      }
    });
  }
};

export const resetAIState = () => {
  lastHit = null;
  targetQueue = [];
};