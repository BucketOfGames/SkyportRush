import React from 'react';
import { RotateCcw, Home, Trophy, Star } from 'lucide-react';
import { GameStats } from '../types/game';

interface GameOverScreenProps {
  gameStats: GameStats;
  onRestart: () => void;
  onMainMenu: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ 
  gameStats, 
  onRestart, 
  onMainMenu 
}) => {
  const isNewHighScore = gameStats.score === gameStats.highScore && gameStats.score > 0;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <div className="text-center bg-black/30 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl max-w-md mx-4">
        {isNewHighScore ? (
          <div className="mb-6">
            <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-3xl font-bold text-yellow-400 mb-2">New High Score!</h2>
            <p className="text-gray-300">Incredible flying skills!</p>
          </div>
        ) : (
          <div className="mb-6">
            <h2 className="text-4xl font-bold text-white mb-2">Flight Complete</h2>
            <p className="text-gray-300">Your aircraft has been grounded</p>
          </div>
        )}

        <div className="space-y-4 mb-8">
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl p-4 border border-blue-500/30">
            <p className="text-blue-400 font-semibold text-sm">Final Score</p>
            <p className="text-white text-3xl font-bold">{gameStats.score.toLocaleString()}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 rounded-xl p-3 border border-white/10">
              <p className="text-gray-400 text-xs">Level Reached</p>
              <p className="text-cyan-400 text-xl font-bold">{gameStats.level}</p>
            </div>
            <div className="bg-black/20 rounded-xl p-3 border border-white/10">
              <p className="text-gray-400 text-xs">Max Combo</p>
              <p className="text-orange-400 text-xl font-bold">×{gameStats.combo}</p>
            </div>
          </div>

          {gameStats.highScore > 0 && !isNewHighScore && (
            <div className="flex items-center justify-center bg-gradient-to-r from-gray-500/20 to-gray-600/20 rounded-2xl p-3 border border-gray-500/30">
              <Trophy className="w-5 h-5 text-gray-400 mr-2" />
              <div>
                <p className="text-gray-400 text-xs">Best Score</p>
                <p className="text-white text-lg font-bold">{gameStats.highScore.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={onRestart}
            className="group bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center w-full"
          >
            <RotateCcw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
            Fly Again
          </button>

          <button
            onClick={onMainMenu}
            className="bg-gray-600/50 hover:bg-gray-500/50 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center w-full"
          >
            <Home className="w-5 h-5 mr-2" />
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen;