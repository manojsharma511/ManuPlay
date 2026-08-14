import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';
import type { GameDefinition } from '../../games/types';
import { storageService } from '../../services/StorageService';
import { audioService } from '../../services/AudioService';
import { analyticsService } from '../../services/AnalyticsService';
import { TouchOverlay } from '../game-ui/TouchOverlay';
import { OrientationPrompt } from '../game-ui/OrientationPrompt';
import { LoadingScreen } from '../game-ui/LoadingScreen';
import { PauseOverlay } from '../game-ui/PauseOverlay';
import { GameOverOverlay } from '../game-ui/GameOverOverlay';

// Game Module Imports
import { NeonDriftGame } from '../../games/neon-drift/NeonDriftGame';
import { SkyRunnerGame } from '../../games/sky-runner/SkyRunnerGame';
import { ZombieSurvivalGame } from '../../games/zombie-survival/ZombieSurvivalGame';
import { BlockPuzzleGame } from '../../games/block-puzzle/BlockPuzzleGame';
import { SpaceShooterGame } from '../../games/space-shooter/SpaceShooterGame';

interface GameShellProps {
  game: GameDefinition;
}

export const GameShell: React.FC<GameShellProps> = ({ game }) => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(10);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [muted, setMuted] = useState(() => storageService.getPreferences().muted);
  const [showOrientationWarning, setShowOrientationWarning] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const gameInstanceRef = useRef<any>(null);

  // Check touch & orientation
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    storageService.recordRecentPlay(game.id);
    analyticsService.trackGameStart(game.id);

    const checkOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      if (game.orientation === 'landscape' && isPortrait && window.innerWidth < 768) {
        setShowOrientationWarning(true);
      } else if (game.orientation === 'portrait' && !isPortrait && window.innerWidth < 768) {
        setShowOrientationWarning(true);
      } else {
        setShowOrientationWarning(false);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, [game]);

  // Handle Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Initialize Game Instance
  useEffect(() => {
    if (!canvasRef.current) return;

    setIsLoading(true);
    setLoadingProgress(30);

    const timer1 = setTimeout(() => setLoadingProgress(75), 200);
    const timer2 = setTimeout(() => {
      setLoadingProgress(100);
      setIsLoading(false);
      startGameEngine();
    }, 450);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy();
      }
    };
  }, [game.id]);

  const startGameEngine = () => {
    if (!canvasRef.current) return;

    const handleGameOver = (finalScore: number) => {
      setScore(finalScore);
      setIsGameOver(true);
      analyticsService.trackGameOver(game.id, finalScore);
    };

    const handleScoreUpdate = (currentScore: number) => {
      setScore(currentScore);
    };

    // Instantiate appropriate game module
    switch (game.id) {
      case 'neon-drift':
        gameInstanceRef.current = new NeonDriftGame(handleGameOver, handleScoreUpdate);
        break;
      case 'sky-runner':
        gameInstanceRef.current = new SkyRunnerGame(handleGameOver, handleScoreUpdate);
        break;
      case 'zombie-survival':
        gameInstanceRef.current = new ZombieSurvivalGame(handleGameOver, handleScoreUpdate);
        break;
      case 'block-puzzle':
        gameInstanceRef.current = new BlockPuzzleGame(handleGameOver, handleScoreUpdate);
        break;
      case 'space-shooter':
        gameInstanceRef.current = new SpaceShooterGame(handleGameOver, handleScoreUpdate);
        break;
      default:
        gameInstanceRef.current = new NeonDriftGame(handleGameOver, handleScoreUpdate);
        break;
    }

    gameInstanceRef.current.init(canvasRef.current);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleSound = () => {
    const updated = storageService.savePreferences({ muted: !muted });
    setMuted(updated.muted);
    audioService.updateVolumes();
  };

  const handlePause = () => {
    setIsPaused(true);
    if (gameInstanceRef.current) gameInstanceRef.current.pause();
  };

  const handleResume = () => {
    setIsPaused(false);
    if (gameInstanceRef.current) gameInstanceRef.current.resume();
  };

  const handleRestart = () => {
    setIsPaused(false);
    setIsGameOver(false);
    setScore(0);
    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy();
    }
    startGameEngine();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-svh bg-slate-950 flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Top Header Controls Overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent pointer-events-auto">
        <button
          onClick={() => navigate('/games')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-bold hover:text-white backdrop-blur-md active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>

        <div className="flex items-center gap-2">
          <span className="font-extrabold text-xs sm:text-sm text-white px-2 py-1 rounded-lg bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            {game.title}
          </span>
          <span className="font-mono font-bold text-xs text-cyan-400 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            {score.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 hover:text-white backdrop-blur-md active:scale-95 transition-all cursor-pointer"
            aria-label="Sound Toggle"
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 hover:text-white backdrop-blur-md active:scale-95 transition-all cursor-pointer"
            aria-label="Fullscreen Toggle"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Game Viewport Canvas */}
      <div className="relative w-full flex-1 flex items-center justify-center bg-slate-950 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full object-contain block touch-none" />

        {/* Loading Overlay */}
        {isLoading && <LoadingScreen progress={loadingProgress} gameTitle={game.title} />}

        {/* Orientation Rotation Prompt */}
        {showOrientationWarning && game.orientation !== 'any' && (
          <OrientationPrompt
            requiredOrientation={game.orientation}
            onDismiss={() => setShowOrientationWarning(false)}
          />
        )}

        {/* Mobile Touch Overlay */}
        {!isLoading && !isPaused && !isGameOver && isTouchDevice && (
          <TouchOverlay onPause={handlePause} orientation={game.orientation} />
        )}

        {/* Pause Menu Overlay */}
        {isPaused && (
          <PauseOverlay
            onResume={handleResume}
            onRestart={handleRestart}
            onExit={() => navigate('/')}
          />
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <GameOverOverlay
            score={score}
            gameId={game.id}
            onRestart={handleRestart}
            onMoreGames={() => navigate('/games')}
            onHome={() => navigate('/')}
          />
        )}
      </div>

    </div>
  );
};
