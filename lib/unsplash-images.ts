/**
 * Unsplash API Integration - High-quality contextual images
 * Uses Unsplash API for relevant, professional photos based on app category
 * Documentation: https://unsplash.com/documentation#get-a-random-photo
 */

interface CategoryQueries {
  hero: string;
  feature: string;
  background: string;
}

const categoryQueries: Record<string, CategoryQueries> = {
  tech: {
    hero: 'technology workspace computer',
    feature: 'tech coding developer',
    background: 'technology digital',
  },
  saas: {
    hero: 'saas software dashboard',
    feature: 'business team office',
    background: 'cloud modern tech',
  },
  design: {
    hero: 'design creative art',
    feature: 'designer graphics colors',
    background: 'abstract minimal',
  },
  fitness: {
    hero: 'fitness gym workout',
    feature: 'exercise health sport',
    background: 'athlete training',
  },
  food: {
    hero: 'food restaurant culinary',
    feature: 'cooking meal cuisine',
    background: 'kitchen ingredients',
  },
  ecommerce: {
    hero: 'shopping store retail',
    feature: 'product fashion style',
    background: 'shop commerce',
  },
  education: {
    hero: 'education learning school',
    feature: 'student books study',
    background: 'library classroom',
  },
  travel: {
    hero: 'travel adventure vacation',
    feature: 'destination explore nature',
    background: 'landscape journey',
  },
  social: {
    hero: 'social people community',
    feature: 'friends connection team',
    background: 'group network',
  },
  productivity: {
    hero: 'productivity workspace organized',
    feature: 'planner tasks efficient',
    background: 'office desk',
  },
};

// Get Unsplash API key from environment
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';

// Rate limiting configuration
const RATE_LIMIT_DELAY = 200; // milliseconds between requests
let lastRequestTime = 0;

/**
 * Helper function to add rate limiting delay
 */
async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

/**
 * Fetch with timeout and retry logic
 */
async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}): Promise<Response> {
  const { timeout = 5000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Fetch a random image URL from Unsplash API with retry logic
 */
async function fetchUnsplashImage(query: string, width: number, height: number, retries = 2): Promise<string> {
  // Apply rate limiting
  await rateLimit();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[Unsplash] Retry attempt ${attempt} for query: ${query}`);
        // Exponential backoff: wait longer between retries
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }

      const params = new URLSearchParams({
        client_id: UNSPLASH_ACCESS_KEY,
        query: query,
        orientation: 'landscape',
        w: width.toString(),
        h: height.toString(),
      });

      const response = await fetchWithTimeout(
        `https://api.unsplash.com/photos/random?${params}`,
        { timeout: 8000 } // 8 second timeout
      );

      if (!response.ok) {
        console.warn(`[Unsplash] API error: ${response.status} ${response.statusText}`);
        if (response.status === 429) {
          // Rate limited, wait longer
          console.warn('[Unsplash] Rate limited, waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        // For other errors, try next attempt or fallback
        if (attempt === retries) {
          return `https://picsum.photos/${width}/${height}`;
        }
        continue;
      }

      const data = await response.json();

      // Return the optimized URL with requested dimensions
      return `${data.urls.raw}&w=${width}&h=${height}&fit=crop`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`[Unsplash] Fetch error (attempt ${attempt + 1}/${retries + 1}):`, errorMessage);

      // If this was the last retry, fall back to picsum
      if (attempt === retries) {
        console.warn('[Unsplash] All retries exhausted, using fallback image service');
        return `https://picsum.photos/${width}/${height}`;
      }
    }
  }

  // Fallback (should not reach here, but just in case)
  return `https://picsum.photos/${width}/${height}`;
}

/**
 * Generate Unsplash image URLs for a given category (async)
 * Returns high-quality, contextually relevant images
 * Uses rate-limited sequential fetching to avoid API timeouts
 */
async function generateImageUrls(category: keyof typeof categoryQueries) {
  const queries = categoryQueries[category];

  console.log(`[Unsplash] Fetching images sequentially with rate limiting...`);

  // Fetch images sequentially with rate limiting to avoid overwhelming the API
  const hero = await fetchUnsplashImage(queries.hero, 1200, 600);
  const feature1 = await fetchUnsplashImage(queries.feature, 800, 500);
  const feature2 = await fetchUnsplashImage(queries.feature, 800, 500);
  const feature3 = await fetchUnsplashImage(queries.feature, 800, 500);
  const background = await fetchUnsplashImage(queries.background, 1920, 1080);

  console.log(`[Unsplash] All images fetched successfully`);

  return {
    hero,
    feature: [feature1, feature2, feature3],
    background,
  };
}

/**
 * Detect category from description and return relevant images
 * Now async to fetch high-quality images from Unsplash API
 */
export async function getRelevantImages(description: string): Promise<{
  hero: string;
  feature1: string;
  feature2: string;
  feature3: string;
  background: string;
}> {
  const lowerDesc = description.toLowerCase();

  let category: keyof typeof categoryQueries = 'tech'; // default

  if (lowerDesc.includes('fitness') || lowerDesc.includes('gym') || lowerDesc.includes('workout') || lowerDesc.includes('health')) {
    category = 'fitness';
  } else if (lowerDesc.includes('food') || lowerDesc.includes('restaurant') || lowerDesc.includes('recipe') || lowerDesc.includes('meal')) {
    category = 'food';
  } else if (lowerDesc.includes('design') || lowerDesc.includes('creative') || lowerDesc.includes('art')) {
    category = 'design';
  } else if (lowerDesc.includes('saas') || lowerDesc.includes('software') || lowerDesc.includes('platform')) {
    category = 'saas';
  } else if (lowerDesc.includes('shop') || lowerDesc.includes('ecommerce') || lowerDesc.includes('e-commerce') || lowerDesc.includes('store') || lowerDesc.includes('product')) {
    category = 'ecommerce';
  } else if (lowerDesc.includes('education') || lowerDesc.includes('learning') || lowerDesc.includes('course') || lowerDesc.includes('school')) {
    category = 'education';
  } else if (lowerDesc.includes('travel') || lowerDesc.includes('trip') || lowerDesc.includes('vacation') || lowerDesc.includes('hotel')) {
    category = 'travel';
  } else if (lowerDesc.includes('social') || lowerDesc.includes('community') || lowerDesc.includes('network') || lowerDesc.includes('chat')) {
    category = 'social';
  } else if (lowerDesc.includes('task') || lowerDesc.includes('todo') || lowerDesc.includes('productivity') || lowerDesc.includes('note')) {
    category = 'productivity';
  }

  console.log(`[Unsplash] Fetching images for category: ${category}`);
  const images = await generateImageUrls(category);

  return {
    hero: images.hero,
    feature1: images.feature[0],
    feature2: images.feature[1],
    feature3: images.feature[2],
    background: images.background,
  };
}
