import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing Combat Systems...');

  const loadingSteps = [
    'Initializing Combat Systems...',
    'Generating Procedural Terrain...',
    'Loading Weapon Systems...',
    'Establishing Network Connection...',
    'Spawning AI Enemies...',
    'Preparing Battlefield...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        
        const stepIndex = Math.floor((newProgress / 100) * loadingSteps.length);
        setLoadingText(loadingSteps[stepIndex] || loadingSteps[loadingSteps.length - 1]);
        
        return newProgress;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50 backdrop-blur-sm">
      <div className="text-center bg-black/40 backdrop-blur-md rounded-3xl p-12 border border-cyan-500/20 shadow-2xl max-w-md mx-4">
        <Loader2 className="w-16 h-16 text-cyan-400 mx-auto mb-6 animate-spin" />
        
        <h2 className="text-2xl font-bold text-white mb-4">Loading Combat Zone</h2>
        
        <div className="mb-6">
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden mb-3">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-cyan-400 font-semibold">{Math.round(progress)}%</p>
        </div>
        
        <p className="text-gray-300 text-sm animate-pulse">{loadingText}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;