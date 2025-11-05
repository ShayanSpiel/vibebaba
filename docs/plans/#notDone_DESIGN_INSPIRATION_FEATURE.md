# #notDone Design Inspiration Feature

**Status**: Planning Phase - Documented for future implementation
**Priority**: Medium
**Estimated Effort**: 4-6 hours implementation
**Dependencies**: Gemini 2.0 Flash (already integrated), Optional: Mistral Pixtral 12B

---

## Overview

AI-powered design extraction from screenshots and brand references. Analyzes competitor designs to extract colors, typography, UI patterns, and component suggestions that are then merged with AI-generated styling in the UX node.

**Key Principle**: Outputs **DESIGN DATA** (colors, fonts, patterns), **NOT CODE**. The data is consumed by Frontend node for code generation.

---

## Architecture

### Location: Sub-node within UX Node ✅

**NOT a standalone node** - Integrated as conditional logic within the existing UX Node.

**Why UX Node?**
- ✅ Outputs design tokens (data) consumed by Frontend
- ✅ Runs before code generation (defines styling first)
- ✅ Logical fit with design system selection
- ✅ Can merge with AI-generated styling
- ❌ Frontend Node is too late (already has styling config)
- ❌ Standalone node adds unnecessary workflow complexity

### Execution Flow

```
User Input
    ↓
Founder Node (validates request)
    ↓
PM Node (defines appType, designStyle)
    ↓
┌─────────────────────────────────────────────────┐
│ UX Node (ENHANCED)                              │
│                                                 │
│ 1. Design System Selection (existing)          │
│ 2. AI Styling Extraction (existing)            │
│                                                 │
│ 3. Design Inspiration Analysis (NEW)           │
│    ├─ Check trigger conditions                 │
│    ├─ If triggered: Analyze with Gemini Vision │
│    ├─ Extract: colors, fonts, patterns         │
│    ├─ Validate & format tokens                 │
│    └─ Merge with AI styling                    │
│                                                 │
│ Output: stylingConfig + designInspiration      │
└─────────────────────────────────────────────────┘
    ↓
Backend Node (API design)
    ↓
Frontend Node (uses stylingConfig to generate code)
    ↓
QA Node → DevOps Node → END
```

**Execution Time Impact:**
- No reference provided: +0 seconds
- Screenshot analysis: +1-2 seconds
- URL screenshot (Phase 2): +3-5 seconds

---

## Trigger Conditions

Design inspiration analysis runs when **ANY** of these conditions are true:

```typescript
const shouldAnalyze =
  state.referenceImage ||                              // 1. User uploaded screenshot
  state.referenceUrl ||                                // 2. User provided competitor URL
  state.userDescription.includes('like Stripe') ||    // 3. Brand mention
  state.userDescription.includes('similar to') ||     // 4. Comparison keyword
  detectBrandInDescription(state.userDescription);    // 5. Brand detection regex
```

### Example Triggers

| User Input | Trigger | Method |
|------------|---------|--------|
| "Build an app like Stripe" | ✅ YES | Brand detection |
| "Make it similar to Linear" | ✅ YES | Comparison keyword |
| "Check out stripe.com for inspiration" | ✅ YES | URL extraction |
| *Uploads screenshot of Notion* | ✅ YES | Direct image upload |
| "Modern SaaS dashboard" | ❌ NO | No reference provided |
| "Dark theme with purple accents" | ❌ NO | No external reference |

### Brand Detection

Uses existing `BRAND_DATABASE` from `lib/mcp-query-optimizer.ts`:

```typescript
const SUPPORTED_BRANDS = [
  'stripe', 'linear', 'notion', 'figma', 'vercel',
  'slack', 'discord', 'spotify', 'netflix', 'airbnb',
  'openai', 'anthropic', 'midjourney', 'twitter', 'instagram',
  // ... 50+ brands in database
];
```

---

## Vision Models

### Primary Model: Gemini 2.0 Flash ⭐

**Status**: Already integrated in VibeBaba
**Cost**: FREE (200-1,500 requests/day) or $0.10/M tokens (paid tier)
**Quality**: Proven excellent for UI screenshot analysis
**Speed**: 1-2 seconds per analysis
**Context Window**: 1M tokens

**Why Gemini?**
- ✅ Already integrated in `lib/ai-config.ts`
- ✅ Generous free tier (currently used by all nodes)
- ✅ 25x cheaper than GPT-4V when paid
- ✅ 30x cheaper than Claude Sonnet
- ✅ Proven quality for design extraction

### Fallback Model: Mistral Pixtral 12B

**Status**: Not yet integrated (requires OpenRouter)
**Cost**: $0.15/M tokens (similar to Gemini paid tier)
**Quality**: Good, experimental for UI analysis
**Speed**: 1-2 seconds per analysis
**Context Window**: 128K tokens

**When to use Pixtral?**
- Gemini free tier quota exhausted
- Testing alternative models
- Gemini API downtime

**Implementation:**
```typescript
try {
  return await analyzeWithGemini(image);
} catch (quotaError) {
  console.log('[Design] Gemini quota exhausted, using Pixtral fallback');
  return await analyzeWithPixtral(image);
}
```

### Model Comparison

| Feature | Gemini 2.0 Flash | Pixtral 12B | GPT-4V | Claude 3.5 Sonnet |
|---------|------------------|-------------|--------|-------------------|
| **Cost (Input)** | $0.10/M | $0.15/M | $2.50/M | $3.00/M |
| **Cost (Output)** | $0.40/M | $0.15/M | $10.00/M | $15.00/M |
| **Free Tier** | ✅ 200-1,500/day | ✅ Beta access | ❌ None | ❌ None |
| **UI Analysis** | Excellent | Good | Excellent | Best (70% accuracy) |
| **Speed** | Very Fast | Fast | Fast | Fast |
| **Integration** | ✅ Done | ⚪ Needs work | ⚪ Not planned | ⚪ Optional |

**Recommendation**: Use Gemini as primary (already integrated + free tier). Add Pixtral as fallback later if needed.

---

## Output Structure

### What It Produces

Design inspiration outputs **structured design tokens** (data, not code):

```typescript
interface DesignInspiration {
  // Source of inspiration
  source: 'screenshot' | 'brand' | 'url';

  // Color palette extracted
  colors: {
    primary: string;      // Hex value, e.g., "#635bff"
    secondary: string;    // e.g., "#0a2540"
    accent: string;       // e.g., "#00d4ff"
    background: string;   // e.g., "#ffffff"
    surface: string;      // e.g., "#f6f9fc"
  };

  // Typography information
  typography: {
    headingFont: string;  // Font family, e.g., "Inter"
    bodyFont: string;     // e.g., "Inter"
    scale: string[];      // Font sizes, e.g., ["12px", "14px", "16px", "20px", "24px"]
  };

  // UI patterns identified (strings, not implementations)
  patterns: string[];     // e.g., ["hero-centered", "gradient-backgrounds", "card-grid-3-col"]

  // Spacing system
  spacing: number[];      // e.g., [8, 16, 24, 32, 48, 64]
  borderRadius: string;   // e.g., "8px" or "rounded-lg"

  // Component suggestions (descriptions, not code)
  components: string[];   // e.g., ["Navigation: logo left, links right", "Hero: centered CTA"]

  // AI-generated analysis summary
  suggestions: string;    // e.g., "Modern SaaS design with purple gradient backgrounds..."

  // Confidence score
  quality: number;        // 0-100, indicates analysis confidence
}
```

### How It's Used

**In UX Node:**
```typescript
// Merge inspiration colors with AI-generated styling
if (designInspiration) {
  stylingConfig.colorTheme = {
    ...stylingConfig.colorTheme,
    primary: designInspiration.colors.primary,      // Override with extracted color
    secondary: designInspiration.colors.secondary,
    accent: designInspiration.colors.accent,
  };

  stylingConfig.typography = {
    ...stylingConfig.typography,
    fontFamily: designInspiration.typography.headingFont,
  };
}
```

**In Frontend Node:**
```typescript
// Use patterns and components as guidance
if (state.designInspiration) {
  // Reference patterns: ["hero-centered", "card-grid-3-col"]
  // Implement matching React components
  // Apply suggested component structures
}
```

### Example Output

**User uploads Stripe homepage screenshot:**

```typescript
{
  source: "screenshot",
  colors: {
    primary: "#635bff",    // Stripe purple
    secondary: "#0a2540",  // Stripe dark blue
    accent: "#00d4ff",     // Stripe cyan
    background: "#ffffff",
    surface: "#f6f9fc"     // Light gray
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    scale: ["14px", "16px", "20px", "24px", "32px", "48px"]
  },
  patterns: [
    "hero-centered",
    "gradient-backgrounds",
    "feature-grid-3-columns",
    "glassmorphism-cards"
  ],
  spacing: [8, 16, 24, 32, 48],
  borderRadius: "8px",
  components: [
    "Navigation bar: white background, logo left, links center, CTA right",
    "Hero section: centered heading, gradient background, large CTA button",
    "Feature cards: 3-column grid, icons, short descriptions",
    "Footer: dark background, 4-column link grid"
  ],
  suggestions: "Modern SaaS design with purple gradient backgrounds, clean typography using Inter font, rounded corners (8px), and generous white space. Heavy use of card-based layouts with subtle shadows.",
  quality: 92
}
```

---

## Non-Blocking Behavior

**Critical Design Principle**: Feature **NEVER** blocks app generation.

### Error Handling Strategy

```typescript
// In ux-node.ts

let designInspiration: DesignInspiration | null = null;

try {
  if (shouldRunInspiration(state)) {
    console.log('[UX] 🎨 Analyzing design inspiration...');
    designInspiration = await analyzeDesignInspiration({
      image: state.referenceImage,
      url: state.referenceUrl,
      context: state.context,
    });
    console.log('[UX] ✅ Design inspiration extracted');
  }
} catch (error) {
  console.warn('[UX] ⚠️  Design inspiration failed:', error.message);
  console.log('[UX] → Continuing with AI-generated styling');
  // designInspiration stays null - workflow continues
}

// Always proceed regardless of success/failure
return {
  ...state,
  stylingConfig: designInspiration
    ? mergeInspiration(aiStyling, designInspiration)  // Use inspiration
    : aiStyling,                                       // Fallback to AI only
  designInspiration,  // May be null if failed
};
```

### Failure Scenarios Handled

| Failure Type | User Impact | Handling |
|--------------|-------------|----------|
| Image upload failed | ❌ None | Skip analysis, use AI styling |
| Invalid image format | ❌ None | Skip analysis, use AI styling |
| Vision API timeout | ❌ None | Skip analysis, use AI styling |
| Gemini quota exhausted | ❌ None | Fallback to Pixtral, then AI styling |
| Pixtral also fails | ❌ None | Use pure AI styling |
| URL screenshot timeout | ❌ None | Request manual upload, or skip |
| Network error | ❌ None | Skip analysis, use AI styling |

**Result**: User **never sees errors**. App generation just continues with AI-only styling as if no reference was provided.

---

## Implementation Details

### Phase 1: Core Implementation (Manual Upload Only)

**Goal**: Enable screenshot analysis without Puppeteer URL screenshots.

#### Files to Create (3 new files)

**1. `/lib/services/design-inspiration.ts`** (~300 lines)

Main service for analyzing design references.

**Key Functions:**
```typescript
// Main analysis function
export async function analyzeDesignInspiration(params: {
  image?: string;        // base64 screenshot
  url?: string;          // competitor URL (for future Puppeteer support)
  brandName?: string;    // detected brand from description
  context: {
    appType: string;
    designStyle: string;
    visualTone: string;
  };
}): Promise<DesignInspiration | null>

// Vision API wrapper - Gemini primary
async function analyzeWithGemini(
  imageBase64: string,
  analysisPrompt: string
): Promise<VisionResponse>

// Vision API wrapper - Pixtral fallback
async function analyzeWithPixtral(
  imageBase64: string,
  analysisPrompt: string
): Promise<VisionResponse>

// Parse AI response into structured tokens
function parseDesignTokens(response: string): DesignInspiration

// Validate color palette for WCAG compliance
function validateColorPalette(colors: ColorPalette): ColorPalette

// Detect brand mention in user description
function detectBrandInDescription(description: string): string | null

// Generate vision analysis prompt
function buildAnalysisPrompt(context: {
  appType: string;
  designStyle: string;
}): string
```

**Analysis Prompt Template:**
```typescript
const prompt = `Analyze this UI design screenshot and extract the following design tokens:

1. COLOR PALETTE:
   - Primary color (most prominent brand color)
   - Secondary color
   - Accent color
   - Background color
   - Surface color (cards, panels)

2. TYPOGRAPHY:
   - Heading font family
   - Body font family
   - Font size scale (provide 5-6 sizes)

3. UI PATTERNS (identify which patterns are present):
   - Layout type: hero-centered, hero-split, dashboard, landing-page
   - Component patterns: card-grid-3-col, feature-list, testimonial-carousel
   - Design styles: glassmorphism, neumorphism, gradient-backgrounds

4. SPACING & BORDERS:
   - Spacing scale (e.g., 8, 16, 24, 32)
   - Border radius value

5. COMPONENTS (describe key components):
   - Navigation structure
   - Hero section layout
   - Content sections
   - Footer structure

Context: This is for a ${appType} with ${designStyle} design style.

Return response in JSON format:
{
  "colors": { "primary": "#hex", ... },
  "typography": { "headingFont": "...", ... },
  "patterns": [...],
  "spacing": [...],
  "borderRadius": "...",
  "components": [...],
  "suggestions": "..."
}`;
```

---

**2. `/lib/services/screenshot-capture.ts`** (~100 lines) - **PHASE 2 ONLY**

Optional service for auto-screenshotting URLs with Puppeteer.

**Key Functions:**
```typescript
// Screenshot a URL using Puppeteer MCP
export async function captureWebsiteScreenshot(
  url: string,
  options?: {
    fullPage?: boolean;
    width?: number;
    height?: number;
    timeout?: number;
  }
): Promise<string>  // Returns base64 image

// Extract CSS variables from webpage
export async function extractWebsiteStyles(url: string): Promise<{
  cssVariables: Record<string, string>;
  computedColors: string[];
}>
```

**Note**: Skip this file for Phase 1. Require manual screenshot upload initially.

---

**3. `/lib/services/__tests__/design-inspiration.test.ts`** (~150 lines)

Test suite for design inspiration service.

**Test Cases:**
```typescript
describe('Design Inspiration Service', () => {
  describe('analyzeDesignInspiration', () => {
    it('should extract colors from screenshot', async () => {
      const result = await analyzeDesignInspiration({
        image: mockStripeScreenshot,
        context: { appType: 'landing-page', designStyle: 'modern' }
      });

      expect(result.colors.primary).toMatch(/^#[0-9a-f]{6}$/);
      expect(result.quality).toBeGreaterThan(70);
    });

    it('should fall back to Pixtral when Gemini fails', async () => {
      mockGeminiFail();
      const result = await analyzeDesignInspiration({...});
      expect(result).toBeTruthy(); // Should still work
    });

    it('should return null on complete failure (non-blocking)', async () => {
      mockAllVisionAPIsFail();
      const result = await analyzeDesignInspiration({...});
      expect(result).toBeNull();
    });

    it('should validate color contrast for WCAG compliance', async () => {
      const result = await analyzeDesignInspiration({...});
      const contrast = calculateContrast(
        result.colors.primary,
        result.colors.background
      );
      expect(contrast).toBeGreaterThan(4.5); // WCAG AA
    });

    it('should handle invalid image formats', async () => {
      const result = await analyzeDesignInspiration({
        image: 'invalid-base64',
        context: {...}
      });
      expect(result).toBeNull();
    });
  });

  describe('detectBrandInDescription', () => {
    it('should detect brand mentions', () => {
      expect(detectBrandInDescription('like Stripe')).toBe('stripe');
      expect(detectBrandInDescription('similar to Linear')).toBe('linear');
      expect(detectBrandInDescription('modern dashboard')).toBeNull();
    });
  });
});
```

---

#### Files to Modify (4 existing files)

**1. `/lib/langgraph/types.ts`**

Add design inspiration types to state:

```typescript
export interface AppGenState {
  // ... existing fields ...

  // NEW: Design inspiration inputs
  referenceImage?: string;           // User-uploaded screenshot (base64)
  referenceUrl?: string;             // Competitor website URL (for Phase 2)

  // NEW: Design inspiration output
  designInspiration?: DesignInspiration;
}

// NEW: Design inspiration type definition
export interface DesignInspiration {
  source: 'screenshot' | 'brand' | 'url';

  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
  };

  typography: {
    headingFont: string;
    bodyFont: string;
    scale: string[];
  };

  patterns: string[];
  spacing: number[];
  borderRadius: string;
  components: string[];
  suggestions: string;
  quality: number;
}
```

---

**2. `/lib/langgraph/nodes/ux-node.ts`**

Integrate design inspiration analysis:

```typescript
import { analyzeDesignInspiration } from '@/lib/services/design-inspiration';

export async function uxNode(state: AppGenState): Promise<UXNodeOutput> {
  console.log('[UX] 🎨 Starting UX design node...');

  const { userDescription, context } = state;
  const { appType, designStyle, visualTone } = context;

  // ... existing design system selection code ...

  // ... existing AI-based styling extraction ...

  // NEW: Conditional design inspiration analysis
  let designInspiration: DesignInspiration | null = null;

  // Check if user wants design inspiration
  const wantsInspiration =
    state.referenceImage ||
    state.referenceUrl ||
    detectBrandMention(userDescription);

  if (wantsInspiration) {
    try {
      console.log('[UX] 📸 Analyzing design inspiration...');

      designInspiration = await analyzeDesignInspiration({
        image: state.referenceImage,
        url: state.referenceUrl,
        brandName: detectBrandInDescription(userDescription),
        context: {
          appType,
          designStyle: designStyle || 'modern',
          visualTone: visualTone || 'professional',
        },
      });

      if (designInspiration) {
        console.log('[UX] ✅ Design inspiration extracted');
        console.log(`[UX]   - Source: ${designInspiration.source}`);
        console.log(`[UX]   - Primary color: ${designInspiration.colors.primary}`);
        console.log(`[UX]   - Patterns: ${designInspiration.patterns.join(', ')}`);
        console.log(`[UX]   - Quality: ${designInspiration.quality}/100`);
      }
    } catch (error) {
      console.warn('[UX] ⚠️  Design inspiration analysis failed:', error);
      console.log('[UX] → Continuing with AI-generated styling');
      // designInspiration stays null - non-blocking
    }
  }

  // ... existing styling config generation ...

  // NEW: Merge inspiration with AI styling if available
  if (designInspiration) {
    stylingConfig = mergeDesignInspiration(stylingConfig, designInspiration);
    console.log('[UX] 🎨 Merged design inspiration with AI styling');
  }

  return {
    ...state,
    stylingConfig,
    designInspiration,  // NEW: Include in output
  };
}

// NEW: Helper function to merge inspiration with AI styling
function mergeDesignInspiration(
  aiStyling: StylingConfig,
  inspiration: DesignInspiration
): StylingConfig {
  return {
    ...aiStyling,

    // Override colors with extracted palette
    colorTheme: {
      ...aiStyling.colorTheme,
      primary: inspiration.colors.primary,
      secondary: inspiration.colors.secondary,
      accent: inspiration.colors.accent,
    },

    // Override typography with extracted fonts
    typography: {
      ...aiStyling.typography,
      fontFamily: inspiration.typography.headingFont,
    },

    // Keep AI-generated spacing but reference inspiration
    spacing: aiStyling.spacing,

    // Add inspiration patterns to metadata (for frontend reference)
    metadata: {
      ...aiStyling.metadata,
      inspirationPatterns: inspiration.patterns,
      inspirationComponents: inspiration.components,
    },
  };
}
```

---

**3. `/app/api/langgraph/execute/route.ts`**

Accept new design inspiration inputs:

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      description,
      context,
      // NEW: Design inspiration inputs
      referenceImage,    // base64 screenshot
      referenceUrl,      // competitor URL
    } = body;

    // Validate description
    if (!description?.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // NEW: Validate image if provided
    if (referenceImage && !referenceImage.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image format (must be base64 data URI)' },
        { status: 400 }
      );
    }

    // NEW: Validate URL if provided
    if (referenceUrl) {
      try {
        new URL(referenceUrl);
      } catch {
        return NextResponse.json(
          { error: 'Invalid reference URL' },
          { status: 400 }
        );
      }
    }

    // Create initial state
    const initialState: AppGenState = {
      userDescription: description,
      context: context || {},
      // NEW: Pass design inspiration inputs
      referenceImage,
      referenceUrl,
      // ... rest of state
    };

    // Execute workflow
    const workflow = createWorkflow();
    const result = await workflow.invoke(initialState);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

**4. `/lib/ai-config.ts`**

Enable vision capabilities and add Pixtral model:

```typescript
export const AI_MODES = {
  // ... client mode ...

  server: {
    name: 'Server-Side AI (Mistral + Gemini + OpenRouter + Groq)',
    providers: ['mistral', 'gemini', 'openrouter', 'groq'] as AIProvider[],
    defaultModel: 'gemini-2.0-flash-exp',  // CHANGE: Use Gemini as default
    features: {
      streaming: false,
      vision: true,           // CHANGE: Enable vision (was false)
      textToImage: false,
    }
  }
};

// Add Pixtral model configuration
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // ... existing models ...

  // NEW: Mistral Pixtral 12B (vision)
  'pixtral-12b': {
    provider: 'openrouter',
    displayName: 'Pixtral 12B (Vision)',
    contextWindow: 128000,
    maxOutput: 8192,
    supports: {
      streaming: true,
      vision: true,         // Vision capability
      functionCalling: false,
    },
    pricing: {
      input: 0.15,          // $0.15 per 1M tokens
      output: 0.15,
    },
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  },
};
```

---

### Phase 2: Puppeteer URL Screenshots (Optional Future)

**Goal**: Auto-screenshot competitor URLs instead of requiring manual upload.

**Additional Complexity**: MEDIUM (50-100 lines + configuration)

**New Requirements:**
1. Enable Puppeteer MCP in `lib/mcp-config.ts`
2. Implement `screenshot-capture.ts` service
3. Add timeout and error handling for blocked sites
4. Handle anti-bot protections

**Benefits:**
- ✅ User convenience (paste URL vs upload screenshot)
- ✅ Always current designs (live screenshots)

**Drawbacks:**
- ❌ Some sites block headless Chrome (Cloudflare, etc.)
- ❌ Slower execution (+2-5 seconds per URL)
- ❌ More failure modes to handle

**Recommendation**: Start with Phase 1 (manual upload). Add Puppeteer in Phase 2 based on user feedback and demand.

---

## Performance & Cost Analysis

### API Costs (per generation with design inspiration)

**Assuming**: Average screenshot = 1,500 input tokens, 500 output tokens

| Scenario | Model | Input Cost | Output Cost | Total | Daily Limit |
|----------|-------|-----------|-------------|-------|-------------|
| **Free Tier** | Gemini 2.0 Flash | $0 | $0 | $0 | 200-1,500 |
| **Paid Tier** | Gemini 2.0 Flash | $0.00015 | $0.00020 | $0.00035 | Unlimited |
| **Fallback** | Pixtral 12B | $0.00023 | $0.00008 | $0.00031 | Unlimited |
| **Premium** | Claude 3.5 Sonnet | $0.00450 | $0.00750 | $0.01200 | Unlimited |

**Calculation Example (Gemini Paid):**
- Input: 1,500 tokens × $0.10 / 1,000,000 = $0.00015
- Output: 500 tokens × $0.40 / 1,000,000 = $0.00020
- **Total: $0.00035 per screenshot analysis**

**At scale:**
- 1,000 analyses/day = $0.35/day = $10.50/month
- 10,000 analyses/day = $3.50/day = $105/month

**Compare to competitors:**
- GPT-4V: ~$0.0063 per analysis (18x more expensive)
- Claude Sonnet: ~$0.012 per analysis (34x more expensive)

### Execution Time Impact

| Scenario | Time Added | Notes |
|----------|-----------|-------|
| No reference provided | +0s | Feature not triggered |
| Screenshot with Gemini | +1-2s | Vision API call |
| Screenshot with Pixtral | +1-2s | Vision API call (fallback) |
| URL with Puppeteer (Phase 2) | +3-5s | Screenshot capture + analysis |

**UX Node Total Time:**
- Without inspiration: ~3-5 seconds (existing)
- With inspiration: ~4-7 seconds (+1-2s)
- With URL screenshot: ~6-10 seconds (+3-5s, Phase 2 only)

---

## Example User Flows

### Flow 1: Brand Mention Detection

```
User Input:
  "Build a payment dashboard like Stripe"

Detection:
  ✓ Keyword "like Stripe" detected
  ✓ Brand "Stripe" found in BRAND_DATABASE

Execution:
  1. No screenshot needed (uses brand database)
  2. Returns pre-configured Stripe design tokens:
     - Colors: #635bff (purple), #0a2540 (dark blue)
     - Font: Inter
     - Patterns: hero-centered, gradient-backgrounds

UX Node Output:
  stylingConfig with Stripe-inspired colors and fonts

Result:
  App generated with Stripe's visual style
```

---

### Flow 2: Screenshot Upload (Recommended for Phase 1)

```
User Input:
  "Build a SaaS dashboard"
  + Upload: linear-app-screenshot.png

Detection:
  ✓ referenceImage provided (base64 data URI)

Execution:
  1. Send screenshot to Gemini Vision
  2. Extract design tokens:
     - Colors: #5e6ad2 (purple), #171717 (dark)
     - Font: Inter
     - Patterns: sidebar-left, command-palette, minimal-ui
  3. Parse response into DesignInspiration object
  4. Validate colors for WCAG compliance

UX Node Output:
  stylingConfig merged with Linear-inspired design

Result:
  App generated matching Linear's aesthetic
```

---

### Flow 3: URL Reference (Phase 2 - Future)

```
User Input:
  "Use stripe.com homepage for design inspiration"

Detection:
  ✓ URL "stripe.com" extracted
  ✓ referenceUrl provided

Execution:
  1. Puppeteer screenshots stripe.com (full page)
  2. Extract CSS variables from page
  3. Send screenshot to Gemini Vision
  4. Combine extracted colors + vision analysis
  5. Return DesignInspiration object

UX Node Output:
  stylingConfig with Stripe's exact colors

Result:
  App generated matching current Stripe homepage
```

---

### Flow 4: No Reference (Existing Behavior)

```
User Input:
  "Modern SaaS dashboard with dark mode"

Detection:
  ✗ No referenceImage
  ✗ No referenceUrl
  ✗ No brand mention

Execution:
  1. Skip design inspiration analysis
  2. Use AI-only styling extraction (existing)

UX Node Output:
  stylingConfig from AI (no inspiration)

Result:
  App generated with AI-designed colors/fonts
```

---

## Error Handling & Edge Cases

### Handled Failure Scenarios

| Error Type | Detection | Recovery Strategy |
|-----------|-----------|-------------------|
| **Invalid image format** | Check MIME type | Skip analysis, log warning |
| **Image too large** | Check file size > 5MB | Reject with 400 error |
| **Vision API timeout** | 10-second timeout | Skip analysis, use AI styling |
| **Gemini quota exhausted** | 429 rate limit error | Fallback to Pixtral |
| **Pixtral also fails** | Both APIs errored | Use pure AI styling |
| **Invalid URL** | URL parse error | Request manual screenshot |
| **URL screenshot timeout** | Puppeteer > 10s | Fallback to manual upload |
| **Site blocks headless** | 403 Forbidden | Request manual screenshot |
| **Network error** | Fetch fails | Retry once, then skip |
| **Malformed JSON response** | Parse error | Skip analysis, log error |

### Logging Strategy

```typescript
// Success
console.log('[UX] ✅ Design inspiration extracted');
console.log(`[UX]   - Source: ${source}`);
console.log(`[UX]   - Primary: ${colors.primary}`);
console.log(`[UX]   - Quality: ${quality}/100`);

// Warning (non-blocking)
console.warn('[UX] ⚠️  Design inspiration failed:', error.message);
console.log('[UX] → Continuing with AI-generated styling');

// Error (should not reach user)
console.error('[Design] Fatal error:', error);
// Still return null, don't throw
```

### User-Facing Messaging

**Success:**
- Silent - user sees inspired design in generated app
- Optional: "✨ Design inspired by [source]" badge in UI

**Failure:**
- Silent - app generation continues normally
- No error message shown to user
- Backend logs for debugging only

---

## Success Metrics

### Must-Have (Phase 1)

- ✅ Extract color palette with 90%+ accuracy
- ✅ Identify 3+ UI patterns per screenshot
- ✅ Non-blocking (never crash workflow)
- ✅ Analysis time < 5 seconds
- ✅ WCAG AA color contrast validation
- ✅ Graceful fallback to AI styling on failure

### Nice-to-Have (Phase 2)

- ⚪ Component suggestions match reference
- ⚪ Typography extraction accurate
- ⚪ Layout patterns correctly identified
- ⚪ URL screenshot capture working for 80%+ sites
- ⚪ Support multiple image uploads (compare 2-3 references)

### Quality Benchmarks

| Metric | Target | Measurement |
|--------|--------|-------------|
| Color accuracy | 90%+ | Hex values match screenshot |
| Pattern detection | 3+ patterns | Correct identification |
| Font detection | 80%+ | Font family name correct |
| Analysis time | < 5s | P95 latency |
| Quota efficiency | < 100 req/day | Free tier usage |
| Failure rate | < 5% | Non-blocking errors |

---

## Future Enhancements

### Phase 3 Potential Features

1. **Multi-Image Comparison**
   - Upload 2-3 reference screenshots
   - Compare and blend design elements
   - "Make it like Stripe + Linear combined"

2. **Animation Pattern Detection**
   - Screen recording to GIF
   - Detect: hover effects, transitions, scroll animations
   - Extract Framer Motion configs

3. **Responsive Breakpoint Analysis**
   - Screenshot at mobile, tablet, desktop widths
   - Extract breakpoint values
   - Identify responsive patterns

4. **Component Library Matching**
   - Detect if design uses Shadcn, MUI, Chakra, etc.
   - Auto-select matching component library
   - Preserve design system

5. **Design System Export**
   - Generate complete design system JSON
   - Export to Figma tokens
   - Create Tailwind config file

6. **Real-Time Design Preview**
   - Show extracted colors/fonts before generation
   - Allow user to tweak before proceeding
   - "Approve inspiration" step

---

## Integration with Existing System

### UX Node Before Enhancement

```typescript
// Current UX Node flow:
1. Select design system (Shadcn, Radix, etc.)
2. Extract styling preferences from description
3. Generate colors with AI
4. Generate typography with AI
5. Return stylingConfig
```

### UX Node After Enhancement

```typescript
// Enhanced UX Node flow:
1. Select design system (Shadcn, Radix, etc.)
2. Extract styling preferences from description
3. Generate colors with AI
4. Generate typography with AI

// NEW STEP:
5. Check if design inspiration needed
   ├─ If YES: Analyze screenshot/brand
   │   ├─ Extract colors, fonts, patterns
   │   ├─ Validate WCAG compliance
   │   └─ Merge with AI-generated styling
   └─ If NO: Skip to step 6

6. Return stylingConfig + designInspiration
```

**Key Point**: Existing functionality **unchanged** when no reference provided.

---

## Documentation Updates Needed

### Update These Files

1. **`/docs/LANGGRAPH_WORKFLOW_DOCUMENTATION.md`**
   - Add "Design Inspiration (Optional)" section under UX Node
   - Document new state fields
   - Show example workflows

2. **`/docs/API_DOCUMENTATION.md`** (if exists)
   - Document new API fields: `referenceImage`, `referenceUrl`
   - Add example cURL requests
   - Document error responses

3. **`README.md`**
   - Add design inspiration to feature list
   - Mention vision capabilities
   - Add screenshot of feature

---

## Environment Variables

### Required (Existing)

```bash
# Already configured in VibeBaba
GEMINI_API_KEY=your_gemini_api_key_here
```

### Optional (Phase 2)

```bash
# For Pixtral fallback via OpenRouter
OPENROUTER_API_KEY=your_openrouter_api_key_here

# OR direct Mistral API (alternative)
MISTRAL_API_KEY=your_mistral_api_key_here

# For Puppeteer URL screenshots (Phase 2)
# No additional env vars needed (uses MCP)
```

---

## Testing Strategy

### Unit Tests

**File**: `/lib/services/__tests__/design-inspiration.test.ts`

- Test color extraction accuracy
- Test pattern identification
- Test fallback logic (Gemini → Pixtral)
- Test error handling (all failure modes)
- Test WCAG validation
- Test brand detection regex

### Integration Tests

**File**: `/lib/langgraph/__tests__/ux-node-inspiration.test.ts`

- Test UX node with screenshot
- Test UX node with brand mention
- Test UX node without reference (existing behavior)
- Test styling merge logic
- Test non-blocking behavior on failure

### Manual Testing Checklist

- [ ] Upload screenshot of Stripe homepage
- [ ] Verify extracted colors match Stripe purple
- [ ] Check generated app uses inspired colors
- [ ] Test with Linear screenshot
- [ ] Test with invalid image format
- [ ] Test with network disconnected (offline)
- [ ] Test with "like Stripe" text (no screenshot)
- [ ] Test quota exhaustion (Gemini → Pixtral fallback)
- [ ] Verify app still generates on all failures

---

## Rollout Plan

### Phase 1: Documentation & Planning ✅ CURRENT

- [x] Document architecture decisions
- [x] Define data structures
- [x] Identify implementation files
- [x] Estimate effort and risks
- [ ] Review with team
- [ ] Get approval to proceed

### Phase 2: Core Implementation

**Estimated Time**: 4-6 hours

1. Create `design-inspiration.ts` service (2 hours)
2. Update type definitions (30 mins)
3. Enhance UX node (1 hour)
4. Update API route (30 mins)
5. Enable vision in AI config (15 mins)
6. Write tests (1 hour)
7. Manual testing (1 hour)

### Phase 3: Frontend UI (Optional)

**Estimated Time**: 2-3 hours

1. Add image upload button to chat panel
2. Add URL input field
3. Show preview of uploaded image
4. Display "inspired by" badge on success
5. Handle upload errors gracefully

### Phase 4: Puppeteer Integration (Optional)

**Estimated Time**: 2-3 hours

1. Enable Puppeteer MCP
2. Implement `screenshot-capture.ts`
3. Add timeout and retry logic
4. Test with various websites
5. Document limitations (sites that block)

---

## Approval Checklist

**Before implementing, confirm:**

- [x] Architecture: Design inspiration as UX sub-node (not standalone)
- [x] Output type: Data (colors, fonts, patterns), not code
- [x] Primary model: Gemini 2.0 Flash (free tier)
- [x] Fallback model: Pixtral 12B (experimental)
- [x] Trigger: Conditional (only when reference provided)
- [x] Error handling: Non-blocking (always continue)
- [ ] Phase 1 scope: Manual upload only (no Puppeteer)
- [ ] Documentation complete and reviewed
- [ ] Team consensus on approach
- [ ] Ready to implement

---

## References

### Internal Documentation

- `/docs/LANGGRAPH_WORKFLOW_DOCUMENTATION.md` - Workflow overview
- `/docs/research/#done_AI_GENERATION_RESEARCH_AND_IMPROVEMENTS.md` - AI best practices
- `/lib/mcp-query-optimizer.ts` - Brand database (50+ brands)
- `/lib/langgraph/nodes/ux-node.ts` - Current UX node implementation

### External Resources

- **Gemini 2.0 Flash**: https://ai.google.dev/gemini-api/docs/vision
- **Mistral Pixtral**: https://docs.mistral.ai/capabilities/vision/
- **screenshot-to-code**: https://github.com/abi/screenshot-to-code (reference only)
- **OpenRouter**: https://openrouter.ai (for Pixtral access)

### Related Features

- Brand detection in `lib/mcp-query-optimizer.ts`
- Color contrast validation in `lib/langgraph/nodes/ux-node.ts` (uses `colord`)
- Vision capabilities in `lib/ai-config.ts`
- MCP client integration in `lib/mcp-client.ts`

---

## Contact & Questions

**For implementation questions:**
- Review this document first
- Check existing UX node code
- Reference Gemini Vision API docs

**For architecture changes:**
- Discuss before deviating from documented plan
- Update this document if approach changes
- Notify team of scope adjustments

---

**Last Updated**: January 2025
**Status**: #notDone - Awaiting approval for implementation
**Next Steps**: Review document → Get team approval → Begin Phase 2 implementation
