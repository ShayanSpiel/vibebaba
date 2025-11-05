// lib/config/pricing-config.ts
// PHASE 2: Centralized Pricing Configuration
// This allows dynamic pricing changes without code deployment

export interface PricingPackage {
  id: string;
  name: string;
  monthlyTokens: number;
  dailyTokens: number;
  prices: {
    USD: number;
    IRT: number;
  };
  features: string[];
  displayOrder: number;
  isPopular?: boolean;
}

export interface CurrencyConfig {
  exchangeRates: {
    USD_TO_IRT: number; // 1 USD = X Toman
    USD_TO_RIALS: number; // 1 USD = X Rials (Toman * 10)
  };
  default: 'USD' | 'IRT';
  symbols: {
    USD: string;
    IRT: string;
  };
}

export interface CustomCreditConfig {
  pricePerUnit: {
    USD: number;
    IRT: number;
  };
  unitSize: number; // e.g., 100,000 tokens
  minPurchase: number;
  maxPurchase: number;
}

export interface PricingConfig {
  packages: Record<string, PricingPackage>;
  currency: CurrencyConfig;
  customCredits: CustomCreditConfig;
  version: string;
  lastUpdated: string;
}

// Default configuration (fallback)
const DEFAULT_PRICING_CONFIG: PricingConfig = {
  packages: {
    starter: {
      id: 'starter',
      name: 'Starter',
      monthlyTokens: 500000,
      dailyTokens: 5000,
      prices: { USD: 5, IRT: 350000 },
      features: [
        '500K tokens/month',
        '5K daily bonus',
        'All AI models',
        'Download code',
        'Publish app',
      ],
      displayOrder: 1,
    },
    pro: {
      id: 'pro',
      name: 'Pro',
      monthlyTokens: 2000000,
      dailyTokens: 20000,
      prices: { USD: 15, IRT: 1050000 },
      features: [
        '2M tokens/month',
        '20K daily bonus',
        'All AI models',
        'Download code',
        'Publish app',
        'Custom domain',
        'Priority support',
      ],
      displayOrder: 2,
      isPopular: true,
    },
    unlimited: {
      id: 'unlimited',
      name: 'Unlimited',
      monthlyTokens: 10000000,
      dailyTokens: 50000,
      prices: { USD: 40, IRT: 2800000 },
      features: [
        '10M tokens/month',
        '50K daily bonus',
        'All AI models',
        'Download code',
        'Publish app',
        'Custom domain',
        'Priority support',
        'Dedicated support',
      ],
      displayOrder: 3,
    },
  },
  currency: {
    exchangeRates: {
      USD_TO_IRT: 70000, // 1 USD = 70,000 Toman
      USD_TO_RIALS: 700000, // 1 USD = 700,000 Rials
    },
    default: 'USD',
    symbols: {
      USD: '$',
      IRT: 'تومان',
    },
  },
  customCredits: {
    pricePerUnit: {
      USD: 1,
      IRT: 70000,
    },
    unitSize: 100000, // $1 per 100K tokens
    minPurchase: 100000,
    maxPurchase: 10000000,
  },
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
};

// Configuration loader with caching
let cachedConfig: PricingConfig | null = null;
let lastConfigLoad = 0;
const CONFIG_CACHE_TTL = 300000; // 5 minutes

export function loadPricingConfig(): PricingConfig {
  // Try environment variable first (highest priority)
  if (process.env.PRICING_CONFIG_JSON) {
    try {
      const envConfig = JSON.parse(process.env.PRICING_CONFIG_JSON);
      // Deep merge with default config
      return {
        ...DEFAULT_PRICING_CONFIG,
        ...envConfig,
        packages: {
          ...DEFAULT_PRICING_CONFIG.packages,
          ...envConfig.packages,
        },
        currency: {
          ...DEFAULT_PRICING_CONFIG.currency,
          ...envConfig.currency,
        },
        customCredits: {
          ...DEFAULT_PRICING_CONFIG.customCredits,
          ...envConfig.customCredits,
        },
      };
    } catch (error) {
      console.error('Failed to parse PRICING_CONFIG_JSON:', error);
    }
  }

  // Fallback to default
  return DEFAULT_PRICING_CONFIG;
}

export function getPricingConfig(): PricingConfig {
  const now = Date.now();

  // Return cached if fresh
  if (cachedConfig && now - lastConfigLoad < CONFIG_CACHE_TTL) {
    return cachedConfig;
  }

  // Load fresh config
  cachedConfig = loadPricingConfig();
  lastConfigLoad = now;

  return cachedConfig;
}

// Force reload configuration (use after admin updates)
export function reloadPricingConfig(): PricingConfig {
  cachedConfig = null;
  return getPricingConfig();
}

// Helper functions
export function getPackage(packageId: string): PricingPackage | null {
  const config = getPricingConfig();
  return config.packages[packageId] || null;
}

export function getAllPackages(): PricingPackage[] {
  const config = getPricingConfig();
  return Object.values(config.packages).sort(
    (a, b) => a.displayOrder - b.displayOrder
  );
}

export function convertCurrency(
  amount: number,
  from: 'USD' | 'IRT',
  to: 'USD' | 'IRT'
): number {
  if (from === to) return amount;

  const config = getPricingConfig();
  const rate = config.currency.exchangeRates.USD_TO_IRT;

  if (from === 'USD' && to === 'IRT') {
    return amount * rate;
  } else {
    return amount / rate;
  }
}

export function formatPrice(amount: number, currency: 'USD' | 'IRT'): string {
  const config = getPricingConfig();
  const symbol = config.currency.symbols[currency];

  if (currency === 'IRT') {
    // Format Tomans as "350K" for readability
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M ${symbol}`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K ${symbol}`;
    }
    return `${amount.toLocaleString()} ${symbol}`;
  } else {
    return `${symbol}${amount.toFixed(2)}`;
  }
}

export function getCustomCreditPrice(
  tokens: number,
  currency: 'USD' | 'IRT'
): number {
  const config = getPricingConfig();
  const pricePerUnit = config.customCredits.pricePerUnit[currency];
  const unitSize = config.customCredits.unitSize;

  return Math.ceil(tokens / unitSize) * pricePerUnit;
}

// Get exchange rate to convert to Rials (for Zarinpal)
export function getExchangeRateToRials(): number {
  const config = getPricingConfig();
  return config.currency.exchangeRates.USD_TO_RIALS;
}

// Get exchange rate to convert Toman to Rials
export function tomanToRials(toman: number): number {
  return toman * 10;
}
