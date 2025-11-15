'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/lib/language-context';

// Startup role-based funny messages
const startupMessages = [
  {
    role: 'CEO',
    message: 'Our CEO pivoted this page into the void.',
    subtitle: "It's not a bug, it's a strategic repositioning.",
    emoji: '👔',
    action: 'Schedule a standup to find it',
  },
  {
    role: 'CTO',
    message: 'The CTO refactored this page out of existence.',
    subtitle: "Don't worry, it's in the backlog for v2.0.",
    emoji: '💻',
    action: 'Check the staging environment',
  },
  {
    role: 'CFO',
    message: 'The CFO cut this page to reduce burn rate.',
    subtitle: "We're being capital efficient here.",
    emoji: '💰',
    action: 'Return to cap table',
  },
  {
    role: 'Product Manager',
    message: "Product decided this page doesn't align with our roadmap.",
    subtitle: 'Actually, it was never in the PRD.',
    emoji: '📊',
    action: 'Check the user stories',
  },
  {
    role: 'Designer',
    message: 'Our designer is still iterating on this page.',
    subtitle: "It's in Figma, but the spacing is off by 2px.",
    emoji: '🎨',
    action: 'View the wireframes',
  },
  {
    role: 'Frontend Dev',
    message: "Frontend dev said 'Works on my machine' 🤷",
    subtitle: 'Have you tried clearing your cache?',
    emoji: '⚛️',
    action: 'Inspect element (good luck)',
  },
  {
    role: 'Backend Dev',
    message: "Backend returned a 404. That's all we know.",
    subtitle: "Check the logs... oh wait, we don't log 404s.",
    emoji: '🔧',
    action: 'Query the database',
  },
  {
    role: 'DevOps',
    message: 'DevOps deployed this page to production.',
    subtitle: "Just kidding, it's still in the CI/CD pipeline.",
    emoji: '🚀',
    action: 'Rollback to stable',
  },
  {
    role: 'Intern',
    message: 'The intern accidentally deleted this page.',
    subtitle: 'They meant to git push, but ran git push --force instead.',
    emoji: '🎓',
    action: 'Restore from backup',
  },
  {
    role: 'Marketing',
    message: 'Marketing is crafting the perfect messaging for this page.',
    subtitle: "Did we mention we're growth hacking?",
    emoji: '📈',
    action: 'Subscribe to newsletter',
  },
  {
    role: 'Sales',
    message: 'Sales promised this page would be here by EOD.',
    subtitle: "They're still in discovery calls.",
    emoji: '🤝',
    action: 'Book a demo anyway',
  },
  {
    role: 'Investor',
    message: 'Our investors are asking for metrics on this page.',
    subtitle: "Somehow we're still pre-revenue.",
    emoji: '💼',
    action: 'See the pitch deck',
  },
  {
    role: 'Founder',
    message: "The founder is hustling 24/7, but this page isn't here.",
    subtitle: "We're disrupting the 404 space.",
    emoji: '🦄',
    action: 'Join the revolution',
  },
  {
    role: 'Scrum Master',
    message: 'This page is blocked by dependencies.',
    subtitle: "Let's circle back in the next sprint.",
    emoji: '📋',
    action: 'Add to sprint backlog',
  },
  {
    role: 'QA Engineer',
    message: 'QA filed a bug report, but nobody read it.',
    subtitle: "Status: Won't Fix (Works As Intended)",
    emoji: '🐛',
    action: 'Re-test in production',
  },
];

export default function NotFound() {
  const { dir } = useLanguage();
  const router = useRouter();
  const [currentMessage, setCurrentMessage] = useState(startupMessages[0]);
  const [isGlitching, setIsGlitching] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Randomly select a startup message on mount
  useEffect(() => {
    const randomMessage = startupMessages[Math.floor(Math.random() * startupMessages.length)];
    setCurrentMessage(randomMessage);
  }, []);

  // Change message every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => {
        const randomMessage = startupMessages[Math.floor(Math.random() * startupMessages.length)];
        setCurrentMessage(randomMessage);
        setIsGlitching(false);
      }, 200);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Track mouse for parallax effect
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 20;
    const y = (clientY / window.innerHeight - 0.5) * 20;
    setMousePosition({ x, y });
  };

  return (
    <main
      className="min-h-screen bg-background-base flex flex-col relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating circles */}
        <div
          className="absolute top-20 left-10 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl animate-pulse"
          style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}
        />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse"
          style={{ transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)` }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-72 h-72 bg-amber-600/5 rounded-full blur-3xl animate-pulse"
          style={{ transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)` }}
        />
      </div>

      {/* Header */}
      <header className="h-16 sticky top-0 z-30 bg-background-base/80 backdrop-blur-md border-b border-light shadow-sm">
        <div className="container-lg mx-auto h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <span className="text-text-primary font-semibold text-lg">VB</span>
          </Link>
        </div>
      </header>

      {/* Main 404 Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="max-w-4xl w-full text-center space-y-8">
          {/* Giant 404 with SVG illustration */}
          <div className="relative">
            <div
              className={`text-[12rem] md:text-[16rem] font-black leading-none transition-all duration-200 ${
                isGlitching ? 'blur-sm' : ''
              }`}
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 80px rgba(251, 191, 36, 0.3)',
                transform: `translate(${mousePosition.x * 0.3}px, ${mousePosition.y * 0.3}px)`,
              }}
            >
              404
            </div>

            {/* Floating emoji */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl animate-bounce"
              style={{
                transform: `translate(calc(-50% + ${mousePosition.x * 0.5}px), calc(-50% + ${mousePosition.y * 0.5}px))`,
              }}
            >
              {currentMessage.emoji}
            </div>
          </div>

          {/* Role Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400/10 to-yellow-600/10 border border-amber-500/30 rounded-full backdrop-blur-sm">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-amber-400 font-semibold text-lg tracking-wide">
                {currentMessage.role.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Message */}
          <div
            className={`space-y-4 transition-all duration-200 ${isGlitching ? 'opacity-0 blur-sm' : 'opacity-100'}`}
          >
            <h1 className="text-3xl md:text-5xl font-bold text-text-primary leading-tight">
              {currentMessage.message}
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary font-light">
              {currentMessage.subtitle}
            </p>
          </div>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <button
              onClick={() => router.push('/')}
              className="px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-600 text-white font-semibold rounded-xl hover:from-amber-500 hover:to-yellow-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              🏠 Back to Home
            </button>

            <button
              onClick={() => router.back()}
              className="px-8 py-4 bg-background-raised border-2 border-light text-text-primary font-semibold rounded-xl hover:border-amber-500/50 hover:bg-background-overlay transition-all hover:scale-105 active:scale-95"
            >
              ← Go Back
            </button>
          </div>

          {/* Fun action hint */}
          <div className="pt-6">
            <p className="text-text-secondary/60 text-sm font-light italic">
              💡 Suggestion: {currentMessage.action}
            </p>
          </div>

          {/* Fun facts carousel */}
          <div className="pt-12 border-t border-light/30">
            <div className="max-w-2xl mx-auto">
              <p className="text-text-secondary/40 text-xs font-light mb-4">
                🎲 Messages rotate every 5 seconds • Refresh for a new role
              </p>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4 opacity-50">
                {startupMessages.slice(0, 5).map((msg, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsGlitching(true);
                      setTimeout(() => {
                        setCurrentMessage(msg);
                        setIsGlitching(false);
                      }, 200);
                    }}
                    className="text-3xl hover:scale-125 transition-transform cursor-pointer hover:opacity-100"
                    title={msg.role}
                  >
                    {msg.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative SVG illustration at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-10 pointer-events-none">
        <svg viewBox="0 0 1200 120" className="w-full h-full" preserveAspectRatio="none">
          <path
            d="M0,50 C200,100 400,0 600,50 C800,100 1000,0 1200,50 L1200,120 L0,120 Z"
            fill="url(#gradient)"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
