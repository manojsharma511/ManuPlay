import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Maximize2, Minimize2, Volume2, VolumeX, Swords, HelpCircle, RefreshCw } from 'lucide-react';
import type { GameDefinition } from '../../games/types';
import { storageService } from '../../services/StorageService';
import { audioService } from '../../services/AudioService';
import { multiplayerService, type ScoreChallengePayload } from '../../services/MultiplayerService';
import { ManuPlayGameSDK } from '../../services/ManuPlaySDK';

import { TouchOverlay } from '../game-ui/TouchOverlay';
import { OrientationPrompt } from '../game-ui/OrientationPrompt';
import { LoadingScreen } from '../game-ui/LoadingScreen';
import { PauseOverlay } from '../game-ui/PauseOverlay';
import { GameOverOverlay } from '../game-ui/GameOverOverlay';
import { AchievementModal } from '../game-ui/AchievementModal';
import { ChallengeFriendModal } from '../game-ui/ChallengeFriendModal';
import { ReadyScreen } from '../game-ui/ReadyScreen';
import { HowToPlayModal } from '../game-ui/HowToPlayModal';
import { TutorialOverlay, type TutorialStep } from '../game-ui/TutorialOverlay';
import { ContextualHint } from '../game-ui/ContextualHint';

// Existing Game Module Imports
import { NeonDriftGame } from '../../games/neon-drift/NeonDriftGame';
import { SkyRunnerGame } from '../../games/sky-runner/SkyRunnerGame';
import { ZombieSurvivalGame } from '../../games/zombie-survival/ZombieSurvivalGame';
import { BlockPuzzleGame } from '../../games/block-puzzle/BlockPuzzleGame';
import { SpaceShooterGame } from '../../games/space-shooter/SpaceShooterGame';
import { TowerDefenseGame } from '../../games/tower-defense/TowerDefenseGame';
import { HoopMasterGame } from '../../games/hoop-master/HoopMasterGame';
import { CyberMemoryGame } from '../../games/cyber-memory/CyberMemoryGame';
import { NeonWingsGame } from '../../games/neon-wings/NeonWingsGame';
import { TrafficRushGame } from '../../games/traffic-rush/TrafficRushGame';
import { ColorSortGame } from '../../games/color-sort/ColorSortGame';
import { DualArenaGame } from '../../games/dual-arena/DualArenaGame';
import { MiniGolfGame } from '../../games/mini-golf/MiniGolfGame';
import { CricketSmashGame } from '../../games/cricket-smash/CricketSmashGame';
import { PenaltyShootoutGame } from '../../games/penalty-shootout/PenaltyShootoutGame';

interface GameShellProps {
  game: GameDefinition;
}

const GAME_TUTORIALS: Record<string, TutorialStep[]> = {
  'neon-drift': [
    { title: 'Steer Vehicle', description: 'Tap Left or Right touch buttons / Arrow keys to drift across highway lanes.', actionHint: 'Steer Left & Right' },
    { title: 'Nitro Speed', description: 'Hold Boost to blast through traffic and trigger speed multipliers.', actionHint: 'Hold BOOST' }
  ],
  'sky-runner': [
    { title: 'Leap Platforms', description: 'Tap Screen / Space to jump across cyber sky platforms.', actionHint: 'Tap to Jump' },
    { title: 'Double Jump', description: 'Tap again while in mid-air to execute a high double jump!', actionHint: 'Double Jump' }
  ],
  'zombie-survival': [
    { title: 'Move Hero', description: 'Use the Virtual Joystick on the left / WASD keys to move around the arena.', actionHint: 'Use Joystick' },
    { title: 'Fire Weapons', description: 'Tap Fire on the right / Space to shoot laser rounds at approaching zombies.', actionHint: 'Tap Fire' }
  ]
};

const GAME_HINTS: Record<string, string> = {
  'neon-drift': '← STEER LEFT / RIGHT — HOLD BOOST FOR SPEED →',
  'sky-runner': '↑ TAP TO JUMP — TAP AGAIN FOR DOUBLE JUMP ↑',
  'zombie-survival': '🕹️ USE JOYSTICK TO MOVE — TAP FIRE TO SHOOT',
  'block-puzzle': '🧩 DRAG NEON BLOCKS ONTO GRID TO CLEAR LINES',
  'space-shooter': '🚀 DRAG SHIP TO MOVE AND AUTO-FIRE LASERS',
  'tower-defense': '🏰 TAP ROAD CELLS TO PLACE PLASMA TURRETS',
  'hoop-master': '🏀 TAP AND TIME YOUR SHOTS TO SCORE SWISHES',
  'cyber-memory': '🃏 FLIP CARDS TO MATCH IDENTICAL PAIRS',
  'neon-wings': '⚡ TAP TO FLAP WINGS THROUGH CYBER PORTALS',
  'traffic-rush': '🏎️ SHIFT LANES AT HIGH SPEED TO DODGE TRAFFIC',
  'color-sort': '🧪 TAP TUBES TO POUR AND SORT MATCHING LIQUID COLORS',
  'dual-arena': '⚔️ TAP LEFT/RIGHT OR USE KEYS TO BATTLE PLAYER 2',
  'mini-golf': '⛳ DRAG BACKWARDS TO AIM & ADJUST SHOT POWER',
  'cricket-smash': '🏏 TAP SCREEN WHEN BALL CROSSES CYAN TIMING LINE',
  'penalty-shootout': '⚽ SWIPE FOOTBALL UPWARD TOWARD GOAL CORNERS'
};

export const GameShell: React.FC<GameShellProps> = ({ game }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Flow & State
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(10);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [showReadyScreen, setShowReadyScreen] = useState(true);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [muted, setMuted] = useState(() => storageService.getPreferences().muted);
  const [showOrientationWarning, setShowOrientationWarning] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);

  const [incomingChallenge, setIncomingChallenge] = useState<ScoreChallengePayload | null>(null);
  const gameInstanceRef = useRef<any>(null);

  useEffect(() => {
    const challengeParam = searchParams.get('challenge');
    if (challengeParam) {
      const parsed = multiplayerService.parseChallengeLink(challengeParam);
      if (parsed) setIncomingChallenge(parsed);
    }
  }, [searchParams]);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    storageService.recordRecentPlay(game.id);
    ManuPlayGameSDK.gameStarted(game.id);

    storageService.loadGameState(game.id).then(save => {
      if (save?.highScore) setBestScore(save.highScore);
    });

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

    // Auto-pause when app is backgrounded or tab hidden
    const handleVisibilityChange = () => {
      if (document.hidden && !isPaused && !isGameOver && !showReadyScreen) {
        handlePause();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [game]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    startLoadProcess();

    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy();
      }
    };
  }, [game.id]);

  const startLoadProcess = () => {
    setIsLoading(true);
    setHasLoadError(false);
    setLoadingProgress(30);

    const timer1 = setTimeout(() => setLoadingProgress(75), 200);
    const timer2 = setTimeout(() => {
      setLoadingProgress(100);
      setIsLoading(false);
    }, 400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  };

  const handleStartGame = () => {
    setShowReadyScreen(false);
    if (!storageService.isTutorialCompleted(game.id) && GAME_TUTORIALS[game.id]) {
      setShowTutorial(true);
    }
    startGameEngine();
  };

  const startGameEngine = () => {
    if (!canvasRef.current) return;

    try {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy();
      }

      const handleGameOver = (finalScore: number) => {
        setScore(finalScore);
        setIsGameOver(true);
        if (finalScore > bestScore) setBestScore(finalScore);
        ManuPlayGameSDK.gameCompleted(game.id, finalScore);
      };

      const handleScoreUpdate = (currentScore: number) => {
        setScore(currentScore);
      };

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
        case 'tower-defense':
          gameInstanceRef.current = new TowerDefenseGame(handleGameOver, handleScoreUpdate);
          break;
        case 'hoop-master':
          gameInstanceRef.current = new HoopMasterGame(handleGameOver, handleScoreUpdate);
          break;
        case 'cyber-memory':
          gameInstanceRef.current = new CyberMemoryGame(handleGameOver, handleScoreUpdate);
          break;
        case 'neon-wings':
          gameInstanceRef.current = new NeonWingsGame(handleGameOver, handleScoreUpdate);
          break;
        case 'traffic-rush':
          gameInstanceRef.current = new TrafficRushGame(handleGameOver, handleScoreUpdate);
          break;
        case 'color-sort':
          gameInstanceRef.current = new ColorSortGame(handleGameOver, handleScoreUpdate);
          break;
        case 'dual-arena':
          gameInstanceRef.current = new DualArenaGame(handleGameOver, handleScoreUpdate);
          break;
        case 'mini-golf':
          gameInstanceRef.current = new MiniGolfGame(handleGameOver, handleScoreUpdate);
          break;
        case 'cricket-smash':
          gameInstanceRef.current = new CricketSmashGame(handleGameOver, handleScoreUpdate);
          break;
        case 'penalty-shootout':
          gameInstanceRef.current = new PenaltyShootoutGame(handleGameOver, handleScoreUpdate);
          break;
        default:
          gameInstanceRef.current = new NeonDriftGame(handleGameOver, handleScoreUpdate);
          break;
      }

      gameInstanceRef.current.init(canvasRef.current);
    } catch (err) {
      console.error('Failed to initialize game engine:', err);
      setHasLoadError(true);
    }
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
      <AchievementModal />

      {/* Top Header Controls */}
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
            onClick={() => setIsHowToPlayOpen(true)}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 hover:text-white backdrop-blur-md active:scale-95 transition-all cursor-pointer"
            aria-label="How to Play"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
          </button>

          <button
            onClick={() => setIsChallengeModalOpen(true)}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-cyan-400 hover:text-white backdrop-blur-md active:scale-95 transition-all cursor-pointer"
            aria-label="Challenge Friend"
          >
            <Swords className="w-4 h-4" />
          </button>

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

      {incomingChallenge && (
        <div className="absolute top-14 left-0 right-0 z-30 p-2 bg-gradient-to-r from-purple-600/90 to-pink-600/90 text-white text-center text-xs font-bold shadow-lg animate-slideDown">
          🔥 CHALLENGE MATCH: Beat {incomingChallenge.challengerName}'s score of {incomingChallenge.targetScore.toLocaleString()}!
        </div>
      )}

      {/* Canvas & Overlay Viewport */}
      <div className="relative w-full flex-1 flex items-center justify-center bg-slate-950 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full object-contain block touch-none" />

        {/* Transient Contextual Control Hint */}
        {!isLoading && !showReadyScreen && !isPaused && !isGameOver && (
          <ContextualHint hintText={GAME_HINTS[game.id] || ''} durationMs={4500} />
        )}

        {isLoading && <LoadingScreen progress={loadingProgress} gameTitle={game.title} />}

        {hasLoadError && (
          <div className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-3">
              <RefreshCw className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">GAME COULDN'T LOAD</h3>
            <p className="text-slate-400 text-xs mb-4 max-w-xs">Something went wrong while launching {game.title}. Please try again.</p>
            <div className="flex gap-3">
              <button
                onClick={startLoadProcess}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase cursor-pointer"
              >
                TRY AGAIN
              </button>
              <button
                onClick={() => navigate('/games')}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
              >
                BACK TO GAMES
              </button>
            </div>
          </div>
        )}

        {/* Ready Screen Flow */}
        {!isLoading && showReadyScreen && (
          <ReadyScreen
            game={game}
            bestScore={bestScore}
            onStart={handleStartGame}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
            isTouchDevice={isTouchDevice}
          />
        )}

        {/* Interactive Tutorial */}
        {showTutorial && GAME_TUTORIALS[game.id] && (
          <TutorialOverlay
            gameId={game.id}
            steps={GAME_TUTORIALS[game.id]}
            onComplete={() => setShowTutorial(false)}
          />
        )}

        {showOrientationWarning && game.orientation !== 'any' && (
          <OrientationPrompt
            requiredOrientation={game.orientation}
            onDismiss={() => setShowOrientationWarning(false)}
          />
        )}

        {!isLoading && !showReadyScreen && !isPaused && !isGameOver && isTouchDevice && (
          <TouchOverlay onPause={handlePause} gameId={game.id} orientation={game.orientation} />
        )}

        {isPaused && (
          <PauseOverlay
            onResume={handleResume}
            onRestart={handleRestart}
            onExit={() => navigate('/')}
          />
        )}

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

      <HowToPlayModal
        game={game}
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
        onStartGame={showReadyScreen ? handleStartGame : undefined}
      />

      <ChallengeFriendModal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        gameId={game.id}
        gameTitle={game.title}
        score={score}
      />
    </div>
  );
};
