import React from 'react';
import { Heart, Shield, Zap, Target, Users, Map, Crosshair, Waves, Skull } from 'lucide-react';
import { PlayerStats } from '../types/game';

interface GameUIProps {
  playerStats: PlayerStats;
}

const GameUI: React.FC<GameUIProps> = ({ playerStats }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top HUD */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
        {/* Player Stats */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-cyan-500/30 shadow-2xl">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <Heart className="w-5 h-5 text-red-400 mr-2" />
              <div className="w-20 bg-gray-700/50 rounded-full h-3 border border-red-500/30">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-300 shadow-lg"
                  style={{ width: `${playerStats.health}%` }}
                />
              </div>
              <span className="text-white font-bold ml-2 text-sm">{playerStats.health}</span>
            </div>
            
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-blue-400 mr-2" />
              <div className="w-20 bg-gray-700/50 rounded-full h-3 border border-blue-500/30">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-300 shadow-lg"
                  style={{ width: `${playerStats.armor}%` }}
                />
              </div>
              <span className="text-white font-bold ml-2 text-sm">{playerStats.armor}</span>
            </div>
          </div>
        </div>

        {/* Mission Status */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-purple-500/30 shadow-2xl">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-purple-300 text-xs font-semibold">ALIEN INVASION</p>
              <p className="text-white text-lg font-bold">Wave {playerStats.level}</p>
            </div>
            <div className="w-px h-8 bg-purple-500/30"></div>
            <div className="text-center">
              <p className="text-cyan-300 text-xs font-semibold">Score</p>
              <p className="text-white text-lg font-bold">{playerStats.score.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
        {/* Weapon Info */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-cyan-500/30 shadow-2xl">
          <div className="flex items-center space-x-4">
            <Zap className="w-6 h-6 text-yellow-400" />
            <div>
              <p className="text-gray-300 text-sm font-semibold">Plasma Rifle</p>
              <div className="flex items-center space-x-2">
                <span className="text-white font-bold text-xl">{playerStats.ammo}</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-400">30</span>
                <div className="ml-2 w-16 bg-gray-700/50 rounded-full h-2">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full transition-all duration-300"
                    style={{ width: `${(playerStats.ammo / 30) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Display */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-green-500/30 shadow-2xl">
          <div className="flex items-center space-x-3 mb-2">
            <Map className="w-5 h-5 text-green-400" />
            <span className="text-white font-semibold text-sm">Tactical Display</span>
          </div>
          <div className="w-32 h-32 bg-gray-800/50 rounded-xl border border-green-500/30 relative overflow-hidden">
            {/* Radar sweep effect */}
            <div className="absolute inset-0 bg-gradient-conic from-green-500/20 via-transparent to-transparent animate-spin" 
                 style={{ animationDuration: '3s' }}></div>
            
            {/* Player dot */}
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-cyan-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="absolute inset-0 bg-cyan-400 rounded-full animate-ping"></div>
            </div>
            
            {/* Enemy dots */}
            <div className="absolute top-6 right-6 w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
            <div className="absolute bottom-8 left-8 w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
            <div className="absolute top-8 left-12 w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
            <div className="absolute bottom-6 right-10 w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
            
            {/* Mothership indicator */}
            <div className="absolute top-2 left-1/2 w-3 h-3 bg-purple-500 rounded-full transform -translate-x-1/2 animate-pulse">
              <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping"></div>
            </div>
          </div>
        </div>

        {/* Kill Counter */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-orange-500/30 shadow-2xl">
          <div className="flex items-center space-x-3">
            <Target className="w-6 h-6 text-orange-400" />
            <div>
              <p className="text-gray-300 text-sm font-semibold">Aliens Eliminated</p>
              <div className="flex items-center space-x-2">
                <Skull className="w-4 h-4 text-red-400" />
                <p className="text-white text-2xl font-bold">{playerStats.kills}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Crosshair */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Outer ring */}
          <div className="w-8 h-8 border-2 border-cyan-400/60 rounded-full animate-pulse">
            {/* Inner crosshair */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
            </div>
            
            {/* Crosshair lines */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-6 h-0.5 bg-cyan-400/80 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
              <div className="w-0.5 h-6 bg-cyan-400/80 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>
          
          {/* Hit indicator */}
          <div className="absolute inset-0 w-8 h-8 border-2 border-red-500/0 rounded-full transition-all duration-150" 
               id="hit-indicator"></div>
        </div>
      </div>

      {/* Network Status */}
      <div className="absolute top-6 right-6">
        <div className="bg-black/40 backdrop-blur-md rounded-xl p-3 border border-green-500/30 shadow-xl">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-semibold text-sm">Helldivers Online</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Mission Briefing */}
      <div className="absolute top-20 left-6">
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-yellow-500/30 shadow-xl max-w-sm">
          <div className="flex items-start space-x-3">
            <Waves className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-yellow-400 font-bold text-sm mb-1">MISSION OBJECTIVE</h3>
              <p className="text-gray-300 text-xs leading-relaxed">
                Eliminate alien forces and survive the invasion waves. 
                The mothership coordinates enemy attacks from above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameUI;