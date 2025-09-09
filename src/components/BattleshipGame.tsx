import { useState, useEffect } from 'react';
import { GameState, SHIP_SIZES } from '@/types/game';
import { createEmptyBoard, placeShipsRandomly, attack, isGameOver, getAIMove, updateAIState, resetAIState, placeShip, canPlaceShip } from '@/utils/gameLogic';
import GameBoard from './GameBoard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const BattleshipGame = () => {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameState>({
    playerBoard: createEmptyBoard(),
    aiBoard: createEmptyBoard(),
    currentPlayer: 'player',
    phase: 'setup',
    difficulty: 'medium',
    winner: null,
    gameMessage: 'Place your ships on the board!'
  });

  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [shipOrientation, setShipOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  // Initialize AI board with ships when game starts
  useEffect(() => {
    const aiBoard = placeShipsRandomly(createEmptyBoard());
    setGameState(prev => ({
      ...prev,
      aiBoard
    }));
  }, []);

  const handlePlayerBoardClick = (row: number, col: number) => {
    if (gameState.phase !== 'setup' || currentShipIndex >= SHIP_SIZES.length) return;

    const shipSize = SHIP_SIZES[currentShipIndex];
    
    if (canPlaceShip(gameState.playerBoard, row, col, shipSize, shipOrientation)) {
      const newBoard = placeShip(gameState.playerBoard, row, col, shipSize, shipOrientation);
      
      setGameState(prev => ({
        ...prev,
        playerBoard: newBoard
      }));
      
      setCurrentShipIndex(prev => prev + 1);
      
      if (currentShipIndex + 1 >= SHIP_SIZES.length) {
        setGameState(prev => ({
          ...prev,
          phase: 'playing',
          gameMessage: 'Battle begins! Attack the enemy fleet!'
        }));
        toast({
          title: "Ships deployed!",
          description: "Begin your attack on the enemy fleet!"
        });
      }
    } else {
      toast({
        title: "Invalid placement",
        description: "Cannot place ship here. Try a different position.",
        variant: "destructive"
      });
    }
  };

  const handleAIBoardClick = (row: number, col: number) => {
    if (gameState.phase !== 'playing' || gameState.currentPlayer !== 'player') return;

    const { board: newAIBoard, hit, sunk } = attack(gameState.aiBoard, row, col);
    
    let message = hit ? (sunk ? '💥 Ship sunk!' : '🎯 Direct hit!') : '💧 Miss!';
    
    setGameState(prev => ({
      ...prev,
      aiBoard: newAIBoard,
      currentPlayer: 'ai',
      gameMessage: message
    }));

    // Check if player won
    if (isGameOver(newAIBoard)) {
      setGameState(prev => ({
        ...prev,
        phase: 'ended',
        winner: 'player',
        gameMessage: '🎉 Victory! You sank all enemy ships!'
      }));
      toast({
        title: "Victory!",
        description: "You have successfully sunk all enemy ships!"
      });
      return;
    }

    // AI turn after short delay
    setTimeout(() => {
      const aiMove = getAIMove(gameState.playerBoard, gameState.difficulty);
      const { board: newPlayerBoard, hit: aiHit, sunk: aiSunk } = attack(gameState.playerBoard, aiMove.row, aiMove.col);
      
      updateAIState(aiMove.row, aiMove.col, aiHit, newPlayerBoard);
      
      let aiMessage = aiHit ? (aiSunk ? '💥 AI sunk your ship!' : '🎯 AI hit your ship!') : '💧 AI missed!';
      
      setGameState(prev => ({
        ...prev,
        playerBoard: newPlayerBoard,
        currentPlayer: 'player',
        gameMessage: aiMessage
      }));

      // Check if AI won
      if (isGameOver(newPlayerBoard)) {
        setGameState(prev => ({
          ...prev,
          phase: 'ended',
          winner: 'ai',
          gameMessage: '💀 Defeat! The AI sunk all your ships!'
        }));
        toast({
          title: "Defeat!",
          description: "The AI has sunk all your ships!",
          variant: "destructive"
        });
      }
    }, 1000);
  };

  const resetGame = () => {
    resetAIState();
    setGameState({
      playerBoard: createEmptyBoard(),
      aiBoard: placeShipsRandomly(createEmptyBoard()),
      currentPlayer: 'player',
      phase: 'setup',
      difficulty: gameState.difficulty,
      winner: null,
      gameMessage: 'Place your ships on the board!'
    });
    setCurrentShipIndex(0);
    setShipOrientation('horizontal');
  };

  const changeDifficulty = (difficulty: 'easy' | 'medium' | 'hard') => {
    setGameState(prev => ({ ...prev, difficulty }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-ocean-secondary/20 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-navy mb-2">⚓ Battleship</h1>
          <p className="text-muted-foreground">Sink the enemy fleet before they sink yours!</p>
        </div>

        {/* Game Controls */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{gameState.phase}</Badge>
              <Badge variant={gameState.currentPlayer === 'player' ? 'default' : 'secondary'}>
                {gameState.currentPlayer === 'player' ? 'Your Turn' : 'AI Turn'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Difficulty:</span>
              {(['easy', 'medium', 'hard'] as const).map(diff => (
                <Button
                  key={diff}
                  variant={gameState.difficulty === diff ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => changeDifficulty(diff)}
                  className="capitalize"
                >
                  {diff}
                </Button>
              ))}
            </div>
            
            <Button onClick={resetGame} variant="outline">
              New Game
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-lg font-medium">{gameState.gameMessage}</p>
            {gameState.phase === 'setup' && currentShipIndex < SHIP_SIZES.length && (
              <div className="mt-2 flex items-center justify-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Placing ship {currentShipIndex + 1} of {SHIP_SIZES.length} (Length: {SHIP_SIZES[currentShipIndex]})
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShipOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')}
                >
                  {shipOrientation === 'horizontal' ? '↔️ Horizontal' : '↕️ Vertical'}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Game Boards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 justify-items-center">
          <GameBoard
            board={gameState.playerBoard}
            isPlayerBoard={true}
            phase={gameState.phase}
            onCellClick={handlePlayerBoardClick}
            title="🚢 Your Fleet"
          />
          
          <GameBoard
            board={gameState.aiBoard}
            isPlayerBoard={false}
            phase={gameState.phase}
            onCellClick={handleAIBoardClick}
            title="🎯 Enemy Waters"
          />
        </div>

        {/* Game Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Your Fleet Status</h3>
            <div className="space-y-1">
              {gameState.playerBoard.ships.map((ship, index) => (
                <div key={ship.id} className="flex justify-between text-sm">
                  <span>{ship.name}</span>
                  <Badge variant={ship.sunk ? 'destructive' : 'default'}>
                    {ship.sunk ? 'Sunk' : `${ship.hits}/${ship.length} hits`}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
          
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Enemy Fleet Status</h3>
            <div className="space-y-1">
              {gameState.aiBoard.ships.map((ship, index) => (
                <div key={ship.id} className="flex justify-between text-sm">
                  <span>{ship.name}</span>
                  <Badge variant={ship.sunk ? 'destructive' : 'secondary'}>
                    {ship.sunk ? 'Sunk' : 'Unknown'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BattleshipGame;