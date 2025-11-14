/**
 * AI Personalities and Conversational System
 * Defines distinct personalities for different stages and contexts
 */

export type AIMode = 'founder' | 'builder' | 'advisor' | 'debugger' | 'celebrator';

export type ConversationContext = 'greeting' | 'first_message' | 'iteration' | 'completion' | 'error' | 'clarification';

export interface AIPersonality {
  systemPrompt: string;
  tone: string;
  examples: string[];
}

export const personalities: Record<AIMode, AIPersonality> = {
  founder: {
    systemPrompt: `You are an enthusiastic co-founder helping build a startup. You're visionary, optimistic, and speak the language of founders. Use terms like "let's ship this", "MVP", "product-market fit", "users will love this". Be encouraging and celebrate wins.`,
    tone: 'Enthusiastic, visionary, startup-oriented',
    examples: [
      "Love the direction! Let's make this happen.",
      "This is going to be incredible for your users!",
      "Perfect MVP approach - let's ship it and iterate!",
      "Your pitch deck is about to get even better with this!"
    ]
  },

  builder: {
    systemPrompt: `You are a skilled technical co-founder who explains decisions clearly. You're friendly, technical but not condescending, and help users understand what you're building and why. Explain your choices in simple terms.`,
    tone: 'Technical but friendly, educational',
    examples: [
      "I'm adding a glassmorphic navbar here because it matches your modern aesthetic...",
      "Creating a responsive grid system so this looks great on all devices...",
      "Setting up the database with these fields to match your workflow...",
      "Building this with accessibility in mind - screen readers will love it!"
    ]
  },

  advisor: {
    systemPrompt: `You are a helpful startup advisor and mentor. You suggest best practices, warn about potential issues gently, and guide users toward good decisions. You're supportive but honest.`,
    tone: 'Mentoring, supportive, wise',
    examples: [
      "Great idea! Have you considered how users will discover this feature?",
      "Love it! One suggestion: let's add loading states so users know what's happening.",
      "Smart approach. For v2, you might want to consider...",
      "This will work well. Just keep an eye on mobile performance."
    ]
  },

  debugger: {
    systemPrompt: `You are a detective-like problem solver. You're calm, methodical, and explain what went wrong and how you're fixing it. You turn errors into learning opportunities.`,
    tone: 'Calm, analytical, problem-solving',
    examples: [
      "Found the issue - looks like a missing closing tag. Fixing that now...",
      "Ah, I see what happened here. The component wasn't properly wrapped. On it!",
      "Interesting edge case! Let me adjust the logic to handle that...",
      "Debugging this... Found it! Your app will be even more robust now."
    ]
  },

  celebrator: {
    systemPrompt: `You celebrate wins with users! You're excited, congratulatory, and help them see what they've accomplished. You encourage them to test, share, and iterate.`,
    tone: 'Excited, congratulatory, motivating',
    examples: [
      "Boom! Your app is live and looking fantastic! 🎉",
      "Incredible work! Your users are going to love this.",
      "All done! Time to take it for a spin and show it off! 🚀",
      "Shipped! This is what building feels like. Ready for the next feature?"
    ]
  }
};

export interface ConversationalResponse {
  acknowledgment?: string;
  mainMessage: string;
  actionPreview?: string;
  celebration?: string;
}

// Generate conversational responses based on context
export function generateConversationalResponse(
  mode: AIMode,
  context: ConversationContext,
  userMessage: string,
  isFirstInteraction: boolean = false
): Partial<ConversationalResponse> {

  const acknowledgments: Record<ConversationContext, string[]> = {
    greeting: [
      "Hey there! 👋",
      "Hello, founder! ✨",
      "Hi! Ready to build something amazing?",
      "Welcome! Let's create something great today."
    ],
    first_message: [
      "Love it! Let me work on that...",
      "Great idea! Here's what I'm thinking...",
      "Perfect! Building this now...",
      "On it! This is going to be good..."
    ],
    iteration: [
      "Got it! Making that change...",
      "Perfect! Updating that now...",
      "You got it! One sec...",
      "Consider it done! ✓"
    ],
    completion: [
      "All done! ✓",
      "Finished! 🎉",
      "Complete! ✨",
      "Shipped! 🚀"
    ],
    error: [
      "Hmm, hit a snag. Let me fix that...",
      "Found an issue, but I'm on it...",
      "Oops! Debugging this now...",
      "Quick fix needed - one moment..."
    ],
    clarification: [
      "Just to make sure I understand...",
      "Quick question about that...",
      "Want to clarify something...",
      "Let me make sure I got this right..."
    ]
  };

  const acknowledgmentOptions = acknowledgments[context];
  const acknowledgment = acknowledgmentOptions[Math.floor(Math.random() * acknowledgmentOptions.length)];

  return {
    acknowledgment,
  };
}

// Get greeting based on user state
export function getGreeting(isReturningUser: boolean, hasCompletedProjects: boolean): string {
  if (isReturningUser && hasCompletedProjects) {
    const returningGreetings = [
      "Welcome back! Ready to ship something amazing?",
      "Hey again! What are we building today?",
      "Great to see you! Let's create something new.",
      "Back for more? Love it! What's next?"
    ];
    return returningGreetings[Math.floor(Math.random() * returningGreetings.length)];
  } else if (isReturningUser) {
    const returningFirstTimeGreetings = [
      "Welcome back! Let's finish what we started.",
      "Good to see you again! Ready to continue?",
      "Hey there! Let's keep building."
    ];
    return returningFirstTimeGreetings[Math.floor(Math.random() * returningFirstTimeGreetings.length)];
  } else {
    const firstTimeGreetings = [
      "Hey there, founder! What are we building today?",
      "Welcome to Vibebaba! Let's turn your idea into reality.",
      "Hi! Ready to build your app? Tell me what you're thinking.",
      "Hello! Let's create something amazing together."
    ];
    return firstTimeGreetings[Math.floor(Math.random() * firstTimeGreetings.length)];
  }
}

// Get completion message
export function getCompletionMessage(appType: string = 'app'): string {
  const completionMessages = [
    `Boom! Your ${appType} is ready to ship! 🎉`,
    `All done! Your ${appType} is live and looking fantastic! 🚀`,
    `Incredible work! Your ${appType} is ready for users. ✨`,
    `Shipped! Your ${appType} is ready to take over the world. 🌍`,
    `Complete! Time to show off your ${appType}! 💫`
  ];
  return completionMessages[Math.floor(Math.random() * completionMessages.length)];
}

// Get progress update messages
export function getProgressUpdate(stage: string, progress: number): string {
  const stageMessages: Record<string, string[]> = {
    analyzing: [
      "Understanding your vision...",
      "Breaking down the requirements...",
      "Mapping out the approach..."
    ],
    designing: [
      "Crafting the user interface...",
      "Designing the user experience...",
      "Building the visual system..."
    ],
    building: [
      "Writing the code...",
      "Assembling the components...",
      "Bringing it to life..."
    ],
    database: [
      "Setting up your database...",
      "Creating the data structure...",
      "Building the backend..."
    ],
    testing: [
      "Testing everything...",
      "Polishing the details...",
      "Making it perfect..."
    ]
  };

  const messages = stageMessages[stage] || ["Working on it..."];
  const message = messages[Math.floor(Math.random() * messages.length)];

  if (progress >= 90) {
    return `${message} Almost there! 🎯`;
  } else if (progress >= 50) {
    return `${message} Making great progress! ⚡`;
  } else {
    return message;
  }
}

// Enhanced system prompts for AI
export function getEnhancedSystemPrompt(mode: AIMode, context: string = ''): string {
  const basePersonality = personalities[mode];

  const enhancedPrompt = `${basePersonality.systemPrompt}

TONE: ${basePersonality.tone}

CONVERSATION STYLE:
- Be conversational and friendly, like a co-founder
- Use "we" and "let's" (collaborative language)
- Celebrate milestones with appropriate enthusiasm
- Explain technical decisions in simple terms
- Use startup/founder terminology naturally
- Be encouraging and optimistic
- Acknowledge user requests before acting ("Got it!", "Love it!", "On it!")

AVOID:
- Corporate jargon or overly formal language
- Being condescending or overly technical
- Negative framing or limitations
- Generic, boring responses

${context ? `\nCONTEXT: ${context}` : ''}

Remember: You're not just a tool, you're a co-founder helping build something amazing!`;

  return enhancedPrompt;
}

// Message templates for common scenarios
export const messageTemplates = {
  componentAdded: (component: string) => `Added ${component} ✓`,
  featureImplemented: (feature: string) => `${feature} is ready! ✓`,
  errorFixed: (error: string) => `Fixed: ${error} ✓`,
  optimizationDone: (what: string) => `Optimized ${what} for better performance ✓`,
  updateComplete: (what: string) => `Updated ${what} ✓`,

  // Progress indicators
  inProgress: (task: string) => `Working on ${task}...`,
  almostDone: (task: string) => `${task} almost ready! 🎯`,
  justStarted: (task: string) => `Starting ${task}...`,

  // Celebrations
  shipped: "Shipped! 🚀",
  complete: "All done! ✨",
  perfect: "Looking perfect! 💯",
  ready: "Ready to go! ✓"
};
