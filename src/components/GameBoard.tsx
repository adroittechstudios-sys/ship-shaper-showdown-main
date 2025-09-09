import { GameBoard as GameBoardType, Cell, GamePhase } from '@/types/game';
import { cn } from '@/lib/utils';

interface GameBoardProps {
  board: GameBoardType;
  isPlayerBoard: boolean;
  phase: GamePhase;
  onCellClick: (row: number, col: number) => void;
  title: string;
}

const GameBoard = ({ board, isPlayerBoard, phase, onCellClick, title }: GameBoardProps) => {
  const canClick = (cell: Cell) => {
    if (phase === 'setup') {
      return isPlayerBoard && cell.state === 'empty' && !cell.hasShip;
    }
    if (phase === 'playing') {
      return !isPlayerBoard && cell.state === 'empty';
    }
    return false;
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <h2 className="text-xl font-bold text-navy">{title}</h2>
      <div className="grid grid-cols-8 gap-1 p-4 bg-ocean-secondary/30 rounded-lg border-2 border-ocean-primary/20">
        {board.cells.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() => onCellClick(rowIndex, colIndex)}
              disabled={!canClick(cell)}
              className={cn(
                "w-8 h-8 border border-grid-line rounded-sm transition-all duration-200",
                "flex items-center justify-center text-sm font-bold",
                // Base cell styling
                "bg-grid-cell hover:bg-grid-hover",
                // Ship visibility (only on player board)
                isPlayerBoard && cell.hasShip && cell.state === 'empty' && "bg-ship border-ship",
                // Hit state
                cell.state === 'hit' && "bg-marker-hit text-white",
                // Miss state  
                cell.state === 'miss' && "bg-marker-miss",
                // Hover effects for enemy board
                !isPlayerBoard && canClick(cell) && "hover:bg-ocean-primary/20 cursor-pointer",
                // Disabled state
                !canClick(cell) && !isPlayerBoard && "cursor-not-allowed opacity-50"
              )}
            >
              {cell.state === 'hit' && '💥'}
              {cell.state === 'miss' && '○'}
              {isPlayerBoard && cell.hasShip && cell.state === 'empty' && '■'}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default GameBoard;