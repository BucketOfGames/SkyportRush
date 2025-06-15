import React from 'react';
import { Zap, Users, Target, Play, Skull, Waves } from 'lucide-react';

interface MainMenuProps {
  onStartGame: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-32 right-32 w-48 h-48 bg-cyan-500/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-green-500/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="text-center bg-black/30 backdrop-blur-md rounded-3xl p-12 border border-cyan-500/30 shadow-2xl max-w-2xl mx-4 relative">
        {/* Title with enhanced styling */}
        <div className="flex items-center justify-center mb-8">
          <Skull className="w-16 h-16 text-red-400 mr-4 animate-pulse" />
          <div>
            <h1 className="text-6xl font-bold text-white mb-2 tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              ALIEN
            </h1>
            <h2 className="text-4xl font-light text-cyan-300 tracking-wider">
              INVASION
            </h2>
          </div>
          <Waves className="w-16 h-16 text-purple-400 ml-4 animate-bounce" />
        </div>

        <p className="text-gray-300 mb-8 text-lg leading-relaxed">
          The alien mothership has arrived. Waves of hostile forces are overwhelming the planet. 
          As an elite Helldiver, you must survive the onslaught and eliminate the alien threat.
        </p>

        {/* Enhanced feature grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-b from-red-500/20 to-orange-500/20 rounded-xl p-4 border border-red-500/30 hover:border-red-400/50 transition-all duration-300">
            <Target className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-white font-semibold text-sm">Third Person</p>
            <p className="text-gray-400 text-xs">Tactical Combat</p>
          </div>
          <div className="bg-gradient-to-b from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
            <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-white font-semibold text-sm">Multiplayer</p>
            <p className="text-gray-400 text-xs">Cooperative</p>
          </div>
          <div className="bg-gradient-to-b from-cyan-500/20 to-blue-500/20 rounded-xl p-4 border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300">
            <Zap className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <p className="text-white font-semibold text-sm">Alien World</p>
            <p className="text-gray-400 text-xs">Procedural</p>
          </div>
        </div>

        {/* Mission briefing */}
        <div className="bg-black/40 rounded-2xl p-6 mb-8 border border-yellow-500/30">
          <h3 className="text-yellow-400 font-bold text-lg mb-3 flex items-center justify-center">
            <Waves className="w-5 h-5 mr-2" />
            MISSION BRIEFING
          </h3>
          <div className="text-left space-y-2 text-sm">
            <p className="text-gray-300">• <span className="text-cyan-400">Survive</span> endless waves of alien forces</p>
            <p className="text-gray-300">• <span className="text-red-400">Eliminate</span> scouts, warriors, heavies, and flyers</p>
            <p className="text-gray-300">• <span className="text-purple-400">Destroy</span> the alien mothership coordination</p>
            <p className="text-gray-300">• <span className="text-green-400">Explore</span> the procedurally generated alien world</p>
          </div>
        </div>

        <button
          onClick={onStartGame}
          className="group bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 hover:from-red-500 hover:via-orange-400 hover:to-yellow-400 text-white px-8 py-4 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center justify-center w-full mb-6 border border-orange-400/50"
        >
          <Play className="w-6 h-6 mr-3 group-hover:translate-x-1 transition-transform duration-300" />
          DEPLOY TO ALIEN WORLD
        </button>

        <div className="text-sm text-gray-400 space-y-2">
          <p><span className="text-white font-semibold">WASD</span> - Movement</p>
          <p><span className="text-white font-semibold">Mouse</span> - Look Around</p>
          <p><span className="text-white font-semibold">Left Click</span> - Fire Weapon</p>
          <p><span className="text-white font-semibold">Space</span> - Jump</p>
          <p className="text-cyan-400 mt-4">Click to lock mouse cursor for combat</p>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;