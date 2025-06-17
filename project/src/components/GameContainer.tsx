import React, { useState, useCallback } from 'react';
import GameCanvas from './GameCanvas';
import GameUI from './GameUI';
import MainMenu from './MainMenu';
import LoadingScreen from './LoadingScreen';
import { GameState, PlayerStats } from '../types/game';

const GameContainer: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [isLoading, setIsLoading] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    health: 100,
    armor: 100,
    ammo: 30,
    score: 0,
    kills: 0,
    level: 1
  });

  const startGame = useCallback(async () => {
    setIsLoading(true);
    setGameState('loading');
    
    // Simulate loading time for 3D assets
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setGameState('playing');
    setIsLoading(false);
    setPlayerStats({
      health: 100,
      armor: 100,
      ammo: 30,
      score: 0,
      kills: 0,
      level: 1
    });
  }, []);

  const endGame = useCallback(() => {
    setGameState('gameOver');
  }, []);

  const returnToMenu = useCallback(() => {
    setGameState('menu');
  }, []);

  const updateStats = useCallback((newStats: Partial<PlayerStats>) => {
    setPlayerStats(prev => ({ ...prev, ...newStats }));
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <GameCanvas 
        gameState={gameState}
        playerStats={playerStats}
        onGameEnd={endGame}
        onStatsUpdate={updateStats}
      />
      
      {gameState === 'menu' && (
        <MainMenu onStartGame={startGame} />
      )}
      
      {gameState === 'loading' && (
        <LoadingScreen />
      )}
      
      {gameState === 'playing' && (
        <GameUI playerStats={playerStats} />
      )}
    </div>
  );
};

export default GameContainer;