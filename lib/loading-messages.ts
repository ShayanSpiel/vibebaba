/**
 * Enhanced loading messages system
 * Professional, fun, and founder-oriented
 */

export interface LoadingMessageCategory {
  building: string[];
  database: string[];
  design: string[];
  quickUpdate: string[];
  thinking: string[];
  analyzing: string[];
  deploying: string[];
}

export const loadingMessages: LoadingMessageCategory = {
  building: [
    'Architecting your masterpiece... Your Product Hunt launch is gonna be 🔥',
    "Coding your vision... Zero bugs guaranteed* (*we're optimistic)",
    'Shipping pixels faster than your standup meeting 🚀',
    'Building your unicorn... No VC funding required 🦄',
    'Deploying dreams... This is what 10x feels like ⚡',
    'Crafting code magic... Your users will love this 💫',
    'Assembling brilliance... MVP mode activated 🎯',
    'Generating greatness... Product-market fit incoming 📈',
    'Weaving web wonders... Better than Wix, we promise 🌟',
    'Compiling creativity... Your pitch deck just got better 📊',
  ],

  database: [
    'Spinning up your database... Better than Excel, we promise 📊',
    'Creating your data sanctuary... CRUD operations incoming 🗄️',
    'Schema-ing your success... Perfectly normalized ✨',
    'Building data foundations... No SQL injection worries here 🛡️',
    'Architecting your backend... Scalability built-in 🏗️',
    'Deploying database magic... Your data is in good hands 💾',
  ],

  design: [
    'Crafting pixel perfection... Designers will weep tears of joy 🎨',
    'Deploying beautiful UI... Your users will thank you 💅',
    'Making it pretty... Instagram-worthy code ahead 📸',
    'Painting your interface... UI/UX excellence loading 🖌️',
    'Designing delight... Dribbble-worthy vibes incoming 🎭',
    'Styling success... Your app never looked so good ✨',
  ],

  quickUpdate: [
    'On it! One sec... ⚡',
    'Making that happen... ✨',
    'Tweaking that for you... 🔧',
    'Consider it done... 🎯',
    'Already on it... 🚀',
    'Coming right up... 💫',
    'Easy peasy... 🍋',
    'You got it... ✓',
  ],

  thinking: [
    'Thinking through this... 🤔',
    'Processing your genius idea... 💡',
    'Analyzing the possibilities... 🧠',
    'Connecting the dots... 🔗',
    'Computing the perfect solution... ⚙️',
    'Figuring out the best approach... 🎯',
  ],

  analyzing: [
    'Analyzing your idea... This is gonna be good 🔍',
    'Reading between the lines... Understanding your vision 📖',
    'Dissecting the requirements... MVP clarity incoming 🎯',
    'Mapping out the strategy... Founder mode activated 🗺️',
    "Breaking it down... Let's build something amazing 🚀",
  ],

  deploying: [
    'Deploying to the cloud... ☁️',
    'Launching your app... 3... 2... 1... 🚀',
    'Going live... Your users are gonna love this 🌟',
    'Shipping to production... No turning back now 📦',
    'Making it live... Hello, world! 🌍',
  ],
};

// Get a random message from a specific category
export function getRandomLoadingMessage(category: keyof LoadingMessageCategory): string {
  const messages = loadingMessages[category];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Get a message based on context
export function getContextualLoadingMessage(
  stage:
    | 'building'
    | 'database'
    | 'design'
    | 'quickUpdate'
    | 'thinking'
    | 'analyzing'
    | 'deploying',
  isQuickAction: boolean = false
): string {
  if (isQuickAction && stage !== 'quickUpdate') {
    return getRandomLoadingMessage('quickUpdate');
  }
  return getRandomLoadingMessage(stage);
}

// Special rare messages (1% chance)
const rareMessages = [
  'Summoning the code gods... 🧙‍♂️',
  'Hacking the matrix... Just kidding, building your app 💻',
  'Channeling Steve Jobs energy... 🍎',
  'Consulting the startup oracle... 🔮',
  'Deploying unicorn dust... 🦄✨',
  'Building at lightspeed... Did you blink? ⚡',
  'Creating digital perfection... Michelangelo would be proud 🎨',
];

export function getMaybeRareMessage(normalMessage: string): string {
  // 1% chance of getting a rare message
  if (Math.random() < 0.01) {
    return rareMessages[Math.floor(Math.random() * rareMessages.length)];
  }
  return normalMessage;
}

// Time-based messages (Easter eggs)
export function getTimeBasedMessage(): string | null {
  const hour = new Date().getHours();

  if (hour >= 0 && hour < 6) {
    return "Burning the midnight oil? Let's ship this! 🌙";
  } else if (hour >= 22) {
    return "Late night coding session? You're dedicated! 💪";
  } else if (new Date().getDay() === 5 && hour >= 15) {
    return 'Friday deploy? Living dangerously! 🎲';
  }

  return null;
}
