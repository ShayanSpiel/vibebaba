/**
 * Curated Unsplash images for different categories
 * These are high-quality, hand-picked images that work well for prototypes
 */

interface ImageSet {
  hero: string[];
  feature: string[];
  background: string[];
}

const imageLibrary: Record<string, ImageSet> = {
  tech: {
    hero: [
      'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=600&fit=crop&auto=format',
    ],
    feature: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=500&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800&h=500&fit=crop&auto=format',
    ],
    background: [
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&h=1080&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&h=1080&fit=crop&auto=format',
    ],
  },
  saas: {
    hero: [
      'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&h=600&fit=crop&auto=format',
    ],
    feature: [
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=500&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=500&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=500&fit=crop&auto=format',
    ],
    background: [
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1920&h=1080&fit=crop&auto=format',
    ],
  },
  design: {
    hero: [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1200&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1200&h=600&fit=crop&auto=format',
    ],
    feature: [
      'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=800&h=500&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1561070791-36c11767b26a?w=800&h=500&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=800&h=500&fit=crop&auto=format',
    ],
    background: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&h=1080&fit=crop&auto=format',
    ],
  },
  fitness: {
    hero: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=600&fit=crop&auto=format',
    ],
    feature: [
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=500&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&h=500&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=500&fit=crop&auto=format',
    ],
    background: [
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920&h=1080&fit=crop&auto=format',
    ],
  },
  food: {
    hero: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=1200&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&h=600&fit=crop&auto=format',
    ],
    feature: [
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=500&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=500&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=500&fit=crop&auto=format',
    ],
    background: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&h=1080&fit=crop&auto=format',
    ],
  },
  ecommerce: {
    hero: [
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop&auto=format',
    ],
    feature: [
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=500&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=500&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=500&fit=crop&auto=format',
    ],
    background: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop&auto=format',
    ],
  },
  education: {
    hero: [
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&h=600&fit=crop&auto=format',
    ],
    feature: [
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=500&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1471970471555-19d4b113e9ed?w=800&h=500&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=500&fit=crop&auto=format',
    ],
    background: [
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1920&h=1080&fit=crop&auto=format',
    ],
  },
  travel: {
    hero: [
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&h=600&fit=crop&auto=format',
    ],
    feature: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=500&fit=crop&auto=format',
    ],
    background: [
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&h=1080&fit=crop&auto=format',
    ],
  },
  social: {
    hero: [
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&h=600&fit=crop&auto=format',
    ],
    feature: [
      'https://images.unsplash.com/photo-1543269664-7eef42226a21?w=800&h=500&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=500&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=500&fit=crop&auto=format',
    ],
    background: [
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&h=1080&fit=crop&auto=format',
    ],
  },
  productivity: {
    hero: [
      'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&h=600&fit=crop&auto=format',
    ],
    feature: [
      'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&h=500&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&h=500&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=800&h=500&fit=crop&auto=format',
    ],
    background: [
      'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1920&h=1080&fit=crop&auto=format',
    ],
  },
};

/**
 * Detect category from description and return relevant images
 */
export function getRelevantImages(description: string): {
  hero: string;
  feature1: string;
  feature2: string;
  feature3: string;
  background: string;
} {
  const lowerDesc = description.toLowerCase();

  let category: keyof typeof imageLibrary = 'tech'; // default

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

  const images = imageLibrary[category];

  return {
    hero: images.hero[0],
    feature1: images.feature[0],
    feature2: images.feature[1] || images.feature[0],
    feature3: images.feature[2] || images.feature[0],
    background: images.background[0],
  };
}
