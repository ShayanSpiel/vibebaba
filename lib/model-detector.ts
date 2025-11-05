/**
 * Dynamic Model Detection
 * Automatically detects which AI model is being used and provides detailed info
 */

export interface ModelDetection {
  modelId: string;
  provider: 'claude' | 'openai' | 'gemini' | 'unknown';
  modelName: string;
  version: string | null;
  isOpus41: boolean;
  isOpus4: boolean;
  isOpus3: boolean;
  isSonnet4: boolean;
  isSonnet37: boolean;
  isSonnet35: boolean;
  isHaiku: boolean;
  isGPT5: boolean;
  isGPT4: boolean;
  isO1: boolean;
  isO3: boolean;
  isGemini: boolean;
  isClaude: boolean;
  displayName: string;
  emoji: string;
}

/**
 * Detect and analyze a model ID
 */
export function detectModel(modelId: string): ModelDetection {
  const lowerId = modelId.toLowerCase();

  // Initialize detection object
  const detection: ModelDetection = {
    modelId,
    provider: 'unknown',
    modelName: 'Unknown Model',
    version: null,
    isOpus41: false,
    isOpus4: false,
    isOpus3: false,
    isSonnet4: false,
    isSonnet37: false,
    isSonnet35: false,
    isHaiku: false,
    isGPT5: false,
    isGPT4: false,
    isO1: false,
    isO3: false,
    isGemini: false,
    isClaude: false,
    displayName: modelId,
    emoji: '🤖',
  };

  // Claude (Anthropic) Detection
  if (lowerId.includes('anthropic') || lowerId.includes('claude')) {
    detection.provider = 'claude';
    detection.isClaude = true;
    detection.emoji = '🟣';

    // Opus 4.1
    if (lowerId.includes('opus-4.1') || lowerId.includes('opus-4_1')) {
      detection.isOpus41 = true;
      detection.modelName = 'Claude Opus 4.1';
      detection.version = '4.1';
      detection.displayName = 'Claude Opus 4.1';
    }
    // Opus 4
    else if (lowerId.includes('opus-4') && !lowerId.includes('4.1')) {
      detection.isOpus4 = true;
      detection.modelName = 'Claude Opus 4';
      detection.version = '4';
      detection.displayName = 'Claude Opus 4';
    }
    // Opus 3
    else if (lowerId.includes('opus-3') || lowerId.includes('3-opus')) {
      detection.isOpus3 = true;
      detection.modelName = 'Claude Opus 3';
      detection.version = '3';
      detection.displayName = 'Claude Opus 3';
    }
    // Sonnet 4
    else if (lowerId.includes('sonnet-4') || lowerId.includes('4-sonnet')) {
      detection.isSonnet4 = true;
      detection.modelName = 'Claude Sonnet 4';
      detection.version = '4';
      detection.displayName = 'Claude Sonnet 4';
    }
    // Sonnet 3.7
    else if (lowerId.includes('sonnet-3.7') || lowerId.includes('3.7-sonnet')) {
      detection.isSonnet37 = true;
      detection.modelName = 'Claude Sonnet 3.7';
      detection.version = '3.7';
      detection.displayName = 'Claude Sonnet 3.7';
    }
    // Sonnet 3.5
    else if (lowerId.includes('sonnet-3.5') || lowerId.includes('3.5-sonnet')) {
      detection.isSonnet35 = true;
      detection.modelName = 'Claude Sonnet 3.5';
      detection.version = '3.5';
      detection.displayName = 'Claude Sonnet 3.5';
    }
    // Haiku
    else if (lowerId.includes('haiku')) {
      detection.isHaiku = true;
      detection.modelName = 'Claude Haiku';
      detection.displayName = 'Claude Haiku';
    }
    // Generic Claude
    else {
      detection.modelName = 'Claude';
      detection.displayName = 'Claude (Sonnet)';
    }
  }
  // OpenAI Detection
  else if (lowerId.includes('openai') || lowerId.includes('gpt') || lowerId.includes('o1') || lowerId.includes('o3')) {
    detection.provider = 'openai';
    detection.emoji = '🟢';

    // GPT-5
    if (lowerId.includes('gpt-5') || lowerId.includes('gpt5')) {
      detection.isGPT5 = true;
      detection.modelName = 'GPT-5';
      detection.displayName = 'GPT-5';
      detection.version = '5';
    }
    // GPT-4
    else if (lowerId.includes('gpt-4') || lowerId.includes('gpt4')) {
      detection.isGPT4 = true;
      detection.modelName = 'GPT-4';
      detection.displayName = 'GPT-4';
      detection.version = '4';
    }
    // O3
    else if (lowerId.includes('o3')) {
      detection.isO3 = true;
      detection.modelName = 'O3';
      detection.displayName = 'OpenAI O3';
    }
    // O1
    else if (lowerId.includes('o1')) {
      detection.isO1 = true;
      detection.modelName = 'O1';
      detection.displayName = 'OpenAI O1';
    }
    else {
      detection.modelName = 'OpenAI';
      detection.displayName = 'OpenAI Model';
    }
  }
  // Gemini Detection
  else if (lowerId.includes('gemini') || lowerId.includes('google')) {
    detection.provider = 'gemini';
    detection.isGemini = true;
    detection.emoji = '🔵';
    detection.modelName = 'Gemini';
    detection.displayName = 'Google Gemini';

    if (lowerId.includes('pro')) {
      detection.displayName = 'Gemini Pro';
    } else if (lowerId.includes('flash')) {
      detection.displayName = 'Gemini Flash';
    }
  }

  return detection;
}

/**
 * Log model detection results to console
 */
export function logModelDetection(modelId: string): ModelDetection {
  const detection = detectModel(modelId);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 MODEL DETECTION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Model ID:', detection.modelId);
  console.log('Display Name:', detection.displayName);
  console.log('Provider:', detection.provider.toUpperCase());

  // Specific model confirmations
  if (detection.isOpus41) {
    console.log('Is Claude Opus 4.1:', '✅ YES');
  }
  if (detection.isOpus4) {
    console.log('Is Claude Opus 4:', '✅ YES');
  }
  if (detection.isOpus3) {
    console.log('Is Claude Opus 3:', '✅ YES');
  }
  if (detection.isSonnet4) {
    console.log('Is Claude Sonnet 4:', '✅ YES');
  }
  if (detection.isSonnet37) {
    console.log('Is Claude Sonnet 3.7:', '✅ YES');
  }
  if (detection.isSonnet35) {
    console.log('Is Claude Sonnet 3.5:', '✅ YES');
  }
  if (detection.isHaiku) {
    console.log('Is Claude Haiku:', '✅ YES');
  }
  if (detection.isGPT5) {
    console.log('Is GPT-5:', '✅ YES');
  }
  if (detection.isGPT4) {
    console.log('Is GPT-4:', '✅ YES');
  }
  if (detection.isO3) {
    console.log('Is O3:', '✅ YES');
  }
  if (detection.isO1) {
    console.log('Is O1:', '✅ YES');
  }
  if (detection.isGemini) {
    console.log('Is Gemini:', '✅ YES');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return detection;
}

/**
 * Get a simple one-line model description
 */
export function getModelDescription(modelId: string): string {
  const detection = detectModel(modelId);
  return `${detection.emoji} ${detection.displayName}`;
}
