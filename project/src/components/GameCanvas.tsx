import React, { useEffect, useRef, useCallback } from 'react';
import { GameState, PlayerStats } from '../types/game';
import { Game3D } from '../game/Game3D';

interface GameCanvasProps {
  gameState: GameState;
  playerStats: PlayerStats;
  onGameEnd: () => void;
  onStatsUpdate: (stats: Partial<PlayerStats>) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  playerStats, 
  onGameEnd, 
  onStatsUpdate 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game3D | null>(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    if (gameRef.current) {
      gameRef.current.resize(window.innerWidth, window.innerHeight);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    resizeCanvas();
    
    gameRef.current = new Game3D(canvas, {
      onGameEnd,
      onStatsUpdate
    });

    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (gameRef.current) {
        gameRef.current.destroy();
      }
    };
  }, [resizeCanvas, onGameEnd, onStatsUpdate]);

  useEffect(() => {
    if (gameRef.current) {
      if (gameState === 'playing') {
        gameRef.current.start();
      } else {
        gameRef.current.stop();
      }
    }
  }, [gameState]);

  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.updateStats(playerStats);
    }
  }, [playerStats]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full cursor-none"
      style={{ background: 'linear-gradient(to bottom, #0f172a, #1e1b4b, #312e81)' }}
    />
  );
};

export default GameCanvas;