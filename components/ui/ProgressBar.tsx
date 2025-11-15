'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  stage?: string;
  showConfetti?: boolean;
  className?: string;
}

interface ProgressStage {
  label: string;
  emoji: string;
  range: [number, number];
}

const stages: ProgressStage[] = [
  { label: 'Analyzing your idea', emoji: '🧠', range: [0, 15] },
  { label: 'Designing UI', emoji: '🎨', range: [15, 40] },
  { label: 'Creating database', emoji: '💾', range: [40, 55] },
  { label: 'Building frontend', emoji: '⚡', range: [55, 85] },
  { label: 'Testing & polishing', emoji: '🧪', range: [85, 95] },
  { label: 'Ready to ship!', emoji: '🚀', range: [95, 100] },
];

export function ProgressBar({
  progress,
  stage,
  showConfetti = false,
  className = '',
}: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<ProgressStage>(stages[0]);
  const [stageChanged, setStageChanged] = useState(false);

  useEffect(() => {
    // Smooth progress animation
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);

    // Determine current stage
    const newStage =
      stages.find((s) => progress >= s.range[0] && progress < s.range[1]) ||
      stages[stages.length - 1];
    if (newStage.label !== currentStage.label) {
      setStageChanged(true);
      setCurrentStage(newStage);
      setTimeout(() => setStageChanged(false), 600);
    }

    return () => clearTimeout(timer);
  }, [progress]);

  const isComplete = progress >= 100;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Progress bar */}
      <div className="relative h-3 bg-background-subtle rounded-full overflow-hidden shadow-inner">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 rounded-full shadow-lg"
          initial={{ width: 0 }}
          animate={{ width: `${displayProgress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>

        {/* Completion glow */}
        {isComplete && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-amber-400/50 to-yellow-600/50 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>

      {/* Stage indicator */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStage.label}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex items-center justify-between text-sm"
        >
          <div className="flex items-center gap-2">
            <motion.span
              className="text-2xl"
              animate={stageChanged ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              {currentStage.emoji}
            </motion.span>
            <span className="text-text-secondary font-medium">{stage || currentStage.label}</span>
          </div>

          {/* Progress percentage */}
          <motion.span
            className="text-text-tertiary font-mono text-xs"
            key={displayProgress}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {Math.round(displayProgress)}%
          </motion.span>
        </motion.div>
      </AnimatePresence>

      {/* Stage checkpoints */}
      <div className="flex justify-between relative">
        {stages.map((s, index) => {
          const isReached = progress >= s.range[0];
          const isActive = progress >= s.range[0] && progress < s.range[1];

          return (
            <motion.div
              key={s.label}
              className="flex flex-col items-center gap-1 relative z-10"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Checkpoint dot */}
              <motion.div
                className={`w-3 h-3 rounded-full border-2 ${
                  isReached
                    ? 'bg-amber-500 border-amber-400 shadow-lg shadow-amber-500/50'
                    : 'bg-background-base border-light'
                }`}
                animate={isActive ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
              />

              {/* Checkpoint emoji (mobile-hidden) */}
              <span className="text-xs hidden sm:block opacity-60">{s.emoji}</span>
            </motion.div>
          );
        })}

        {/* Connecting line */}
        <div className="absolute top-1.5 left-0 right-0 h-[2px] bg-border-light -z-0" />
        <motion.div
          className="absolute top-1.5 left-0 h-[2px] bg-gradient-to-r from-amber-400 to-yellow-500 -z-0"
          initial={{ width: 0 }}
          animate={{ width: `${displayProgress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Confetti on completion */}
      {isComplete && showConfetti && <ConfettiEffect />}
    </div>
  );
}

// Simple confetti effect
function ConfettiEffect() {
  const confettiColors = ['#fbbf24', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#3b82f6'];

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: confettiColors[i % confettiColors.length],
            left: `${Math.random() * 100}%`,
            top: '-10px',
          }}
          initial={{ y: -10, opacity: 1, rotate: 0 }}
          animate={{
            y: window.innerHeight + 10,
            opacity: [1, 1, 0],
            rotate: Math.random() * 720,
            x: (Math.random() - 0.5) * 200,
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 0.5,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}

// Compact version for smaller spaces
export function CompactProgressBar({ progress, label }: { progress: number; label?: string }) {
  return (
    <div className="space-y-2">
      <div className="relative h-2 bg-background-subtle rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-yellow-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {label && (
        <div className="flex items-center justify-between text-xs text-text-tertiary">
          <span>{label}</span>
          <span className="font-mono">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
}
