"use client";

import { motion } from "framer-motion";

interface LoadingAnimationProps {
  type: 'building' | 'database' | 'design' | 'deploying' | 'thinking';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export function LoadingAnimation({ type, size = 'md', message }: LoadingAnimationProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={sizeClasses[size]}>
        {type === 'building' && <BuildingAnimation />}
        {type === 'database' && <DatabaseAnimation />}
        {type === 'design' && <DesignAnimation />}
        {type === 'deploying' && <DeployingAnimation />}
        {type === 'thinking' && <ThinkingAnimation />}
      </div>
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-text-secondary text-center max-w-md"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}

// Building animation - code brackets with pulse
function BuildingAnimation() {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className="w-full h-full"
    >
      <motion.path
        d="M 30 20 L 20 35 L 20 65 L 30 80"
        stroke="url(#gradient1)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M 70 20 L 80 35 L 80 65 L 70 80"
        stroke="url(#gradient1)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
      />
      <motion.circle
        cx="50"
        cy="50"
        r="8"
        fill="url(#gradient1)"
        initial={{ scale: 0.8, opacity: 0.5 }}
        animate={{ scale: 1.2, opacity: 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
      />
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

// Database animation - rotating cylinder
function DatabaseAnimation() {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className="w-full h-full"
    >
      <motion.ellipse
        cx="50"
        cy="30"
        rx="30"
        ry="10"
        fill="none"
        stroke="url(#gradient2)"
        strokeWidth="4"
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
      />
      <motion.path
        d="M 20 30 L 20 70 Q 20 80 50 80 Q 80 80 80 70 L 80 30"
        fill="none"
        stroke="url(#gradient2)"
        strokeWidth="4"
      />
      <motion.ellipse
        cx="50"
        cy="70"
        rx="30"
        ry="10"
        fill="none"
        stroke="url(#gradient2)"
        strokeWidth="4"
        initial={{ opacity: 0.3 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse", delay: 0.4 }}
      />
      <motion.ellipse
        cx="50"
        cy="50"
        rx="30"
        ry="10"
        fill="none"
        stroke="url(#gradient2)"
        strokeWidth="3"
        opacity="0.5"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: [1, 0.8, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <defs>
        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

// Design animation - color palette swapping
function DesignAnimation() {
  const colors = ['#fbbf24', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981'];

  return (
    <motion.svg
      viewBox="0 0 100 100"
      className="w-full h-full"
    >
      {colors.map((color, i) => (
        <motion.circle
          key={i}
          cx={30 + (i * 10)}
          cy={50 + (i % 2 === 0 ? -10 : 10)}
          r="8"
          fill={color}
          initial={{ scale: 0.8, y: 0 }}
          animate={{
            scale: [0.8, 1.2, 0.8],
            y: [0, -10, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
      <motion.path
        d="M 50 70 Q 30 80 20 85 M 50 70 Q 50 85 50 90 M 50 70 Q 70 80 80 85"
        stroke="url(#gradient3)"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <defs>
        <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

// Deploying animation - rocket with exhaust
function DeployingAnimation() {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className="w-full h-full"
    >
      {/* Rocket body */}
      <motion.path
        d="M 50 20 L 40 50 L 40 70 L 50 75 L 60 70 L 60 50 Z"
        fill="url(#gradient4)"
        initial={{ y: 0 }}
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Rocket window */}
      <motion.circle
        cx="50"
        cy="35"
        r="6"
        fill="#93c5fd"
        initial={{ y: 0 }}
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Flames */}
      <motion.path
        d="M 45 75 Q 43 85 45 95 M 50 75 Q 50 88 50 98 M 55 75 Q 57 85 55 95"
        stroke="#f59e0b"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        initial={{ opacity: 0.3, scaleY: 0.5 }}
        animate={{ opacity: [0.3, 1, 0.3], scaleY: [0.5, 1, 0.5] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      />
      <defs>
        <linearGradient id="gradient4" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

// Thinking animation - brain with pulse + sparkles
function ThinkingAnimation() {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className="w-full h-full"
    >
      {/* Brain shape */}
      <motion.path
        d="M 30 40 Q 25 30 35 25 Q 40 22 45 25 Q 50 20 55 25 Q 60 22 65 25 Q 75 30 70 40 Q 75 50 70 60 Q 72 70 65 75 Q 60 78 55 75 Q 50 80 45 75 Q 40 78 35 75 Q 28 70 30 60 Q 25 50 30 40 Z"
        fill="none"
        stroke="url(#gradient5)"
        strokeWidth="3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Sparkles */}
      {[...Array(3)].map((_, i) => (
        <motion.circle
          key={i}
          cx={40 + (i * 10)}
          cy={30 + (i * 8)}
          r="2"
          fill="#fbbf24"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.3
          }}
        />
      ))}
      <defs>
        <linearGradient id="gradient5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

// Simple typing indicator (three dots)
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-text-tertiary rounded-full"
          animate={{
            y: [0, -8, 0],
            opacity: [0.3, 1, 0.3]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15
          }}
        />
      ))}
    </div>
  );
}

// Spinner for inline loading
export function Spinner({ size = 'md', color = 'amber' }: { size?: 'sm' | 'md' | 'lg', color?: 'amber' | 'blue' | 'green' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  };

  const colorClasses = {
    amber: 'border-amber-400 border-t-transparent',
    blue: 'border-blue-400 border-t-transparent',
    green: 'border-green-400 border-t-transparent'
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
}
