'use client';

import { useEffect, useState } from 'react';

interface TypingTextProps {
  text: string;
  speed?: number; // Characters per second (default: 40)
  onComplete?: () => void;
  showCursor?: boolean;
  className?: string;
}

export function TypingText({
  text,
  speed = 40,
  onComplete,
  showCursor = true,
  className = '',
}: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const delay = 1000 / speed; // Convert chars/sec to ms per char
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    } else if (currentIndex === text.length && !isComplete) {
      setIsComplete(true);
      if (onComplete) {
        // Small delay before calling onComplete to show final state
        setTimeout(onComplete, 300);
      }
    }
  }, [currentIndex, text, speed, isComplete, onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && showCursor && (
        <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" />
      )}
    </span>
  );
}
