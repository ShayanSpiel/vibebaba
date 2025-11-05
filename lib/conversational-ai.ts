/**
 * Conversational AI - Live Progress Messaging
 * This makes the AI tell users what it's doing in real-time
 */

export interface LiveProgressMessage {
  type: 'acknowledgment' | 'progress' | 'completion';
  content: string;
  emoji?: string;
}

// Acknowledgments - AI confirms it understood the request
export function getAcknowledgment(userRequest: string): LiveProgressMessage {
  const acknowledgments = [
    { content: "Got it! Let me work on that...", emoji: "✓" },
    { content: "Perfect! On it now...", emoji: "⚡" },
    { content: "Love it! Making that happen...", emoji: "🚀" },
    { content: "You got it! Starting now...", emoji: "💪" },
    { content: "Awesome! Building that for you...", emoji: "🔨" },
    { content: "Great idea! Let's do this...", emoji: "💡" },
  ];

  const selected = acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
  return {
    type: 'acknowledgment',
    content: selected.content,
    emoji: selected.emoji
  };
}

// Progress messages based on what the AI is doing
export function getProgressMessage(action: string): LiveProgressMessage {
  const progressMessages: Record<string, LiveProgressMessage[]> = {
    analyzing: [
      { type: 'progress', content: "Analyzing your request..." },
      { type: 'progress', content: "Understanding what you need...", emoji: "🧠" },
      { type: 'progress', content: "Breaking down the requirements...", emoji: "🔍" },
    ],
    designing: [
      { type: 'progress', content: "Designing the UI components...", emoji: "🎨" },
      { type: 'progress', content: "Choosing the perfect layout...", emoji: "📐" },
      { type: 'progress', content: "Crafting the user experience...", emoji: "✨" },
    ],
    coding: [
      { type: 'progress', content: "Writing the code...", emoji: "💻" },
      { type: 'progress', content: "Building the components...", emoji: "🔧" },
      { type: 'progress', content: "Adding the functionality...", emoji: "⚙️" },
    ],
    database: [
      { type: 'progress', content: "Setting up the database...", emoji: "🗄️" },
      { type: 'progress', content: "Creating the data structure...", emoji: "📊" },
      { type: 'progress', content: "Configuring the backend...", emoji: "⚡" },
    ],
    testing: [
      { type: 'progress', content: "Testing the code...", emoji: "🧪" },
      { type: 'progress', content: "Validating everything works...", emoji: "✓" },
      { type: 'progress', content: "Polishing the details...", emoji: "💎" },
    ],
    updating: [
      { type: 'progress', content: "Updating the code...", emoji: "🔄" },
      { type: 'progress', content: "Making the changes...", emoji: "✏️" },
      { type: 'progress', content: "Applying your feedback...", emoji: "💡" },
    ],
  };

  const messages = progressMessages[action] || progressMessages.coding;
  return messages[Math.floor(Math.random() * messages.length)];
}

// Completion messages
export function getCompletionMessage(task: string): LiveProgressMessage {
  const completions = [
    { content: `Done! ${task} is ready ✓`, emoji: "🎉" },
    { content: `All set! ${task} complete ✓`, emoji: "✨" },
    { content: `Finished! ${task} is live ✓`, emoji: "🚀" },
    { content: `Complete! ${task} looking good ✓`, emoji: "💯" },
  ];

  const selected = completions[Math.floor(Math.random() * completions.length)];
  return {
    type: 'completion',
    content: selected.content,
    emoji: selected.emoji
  };
}

// Generate a full conversational response with progress steps
export function generateConversationalResponse(
  userMessage: string,
  action: 'modify_code' | 'add_feature' | 'fix_bug' | 'explain' | 'general',
  steps: string[]
): string {
  const ack = getAcknowledgment(userMessage);

  // Build the response with live progress feel
  let response = `${ack.content}\n\n`;

  // Add progress steps
  steps.forEach((step, index) => {
    const progress = getProgressMessage(step);
    response += `${progress.emoji || '•'} ${progress.content}\n`;
  });

  response += `\n`;

  return response;
}

// Quick update responses (for small changes)
export function getQuickUpdateResponse(): string {
  const quickResponses = [
    "On it! ⚡",
    "Making that change now... 🔧",
    "Updating... ✏️",
    "Tweaking that for you... 🎯",
    "Consider it done! ✓",
    "Already on it... 🚀",
  ];

  return quickResponses[Math.floor(Math.random() * quickResponses.length)];
}

// Explain what the AI is about to do
export function explainAction(action: string, details: string): string {
  const explanations: Record<string, string> = {
    modify_code: `I'm going to ${details}. This will take just a moment...`,
    add_feature: `Adding ${details} to your app. Here's what I'm doing:`,
    fix_bug: `Found the issue! Fixing ${details} now...`,
    improve: `Great suggestion! I'll ${details} to make it even better.`,
    general: `Let me help with that. ${details}`,
  };

  return explanations[action] || `Working on: ${details}`;
}

// Celebratory messages for completions
export function getCelebratoryMessage(achievement: string): string {
  const celebrations = [
    `🎉 Boom! ${achievement}!`,
    `✨ All done! ${achievement} is ready!`,
    `🚀 Shipped! ${achievement} looking great!`,
    `💯 Perfect! ${achievement} complete!`,
    `🌟 Awesome! ${achievement} is live!`,
  ];

  return celebrations[Math.floor(Math.random() * celebrations.length)];
}

// Error messages with personality
export function getErrorMessage(error: string): string {
  return `Hmm, hit a snag: ${error}\n\nBut don't worry, let me fix that...`;
}
