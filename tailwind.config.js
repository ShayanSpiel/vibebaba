/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  experimental: {
    optimizeUniversalDefaults: true,
  },
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Proxima Nova', 'Proxima Nova Fallback', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'proxima': ['Proxima Nova', 'Proxima Nova Fallback', 'sans-serif'],
        farsi: ['IRANSansXFaNum', 'IRANSansX', 'sans-serif'],
        'farsi-num': ['IRANSansXFaNum', 'sans-serif'],
        mono: ['Monaco', 'Courier New', 'monospace'],
      },
      colors: {
        // shadcn/ui color system
        border: {
          DEFAULT: "hsl(var(--border))",
          subtle: 'var(--color-border-subtle)',
          light: 'var(--color-border-light)',
          default: 'var(--color-border-default)',
          strong: 'var(--color-border-strong)',
          focus: 'var(--color-border-focus)',
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: {
          DEFAULT: "hsl(var(--background))",
          // Keep legacy custom background colors
          base: 'var(--color-background-base)',
          raised: 'var(--color-background-raised)',
          overlay: 'var(--color-background-overlay)',
          sunken: 'var(--color-background-sunken)',
          subtle: 'var(--color-background-subtle)',
        },
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          // Keep legacy custom accent colors
          light: 'var(--color-accent-light)',
          pale: 'var(--color-accent-pale)',
          hover: 'var(--color-accent-hover)',
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Legacy custom colors - Keep for backward compatibility
        brand: {
          primary: 'var(--color-brand-primary)',
          'primary-hover': 'var(--color-brand-primary-hover)',
          'primary-light': 'var(--color-brand-primary-light)',
          'primary-pale': 'var(--color-brand-primary-pale)',
          'primary-subtle': 'var(--color-brand-primary-subtle)',
        },
        // Text hierarchy - Keep legacy colors
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          subtle: 'var(--color-text-subtle)',
          inverse: 'var(--color-text-inverse)',
        },
        // Semantic colors - Use RGB channels for opacity modifier support
        success: {
          DEFAULT: 'rgb(var(--color-success-rgb) / <alpha-value>)',
          solid: 'var(--color-success)',
        },
        error: {
          DEFAULT: 'rgb(var(--color-error-rgb) / <alpha-value>)',
          solid: 'var(--color-error)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning-rgb) / <alpha-value>)',
          solid: 'var(--color-warning)',
        },
        info: {
          DEFAULT: 'rgb(var(--color-info-rgb) / <alpha-value>)',
          solid: 'var(--color-info)',
        },
      },
      backgroundImage: {
        // Gradient tokens - Dynamic from CSS variables
        'gradient-brand': 'var(--gradient-brand)',
        'gradient-brand-br': 'var(--gradient-brand-br)',
        'gradient-brand-hover': 'var(--gradient-brand-hover)',
        'gradient-success': 'var(--gradient-success)',
        'gradient-error': 'var(--gradient-error)',
        'gradient-warning': 'var(--gradient-warning)',
        'gradient-info': 'var(--gradient-info)',
        'gradient-blue': 'var(--gradient-blue)',
        'gradient-purple': 'var(--gradient-purple)',
        'gradient-orange': 'var(--gradient-orange)',
        'gradient-cyan': 'var(--gradient-cyan)',
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        DEFAULT: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'calc(var(--radius) + 4px)',
        xl: '1rem',
        '2xl': '1.25rem',
        full: '9999px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      borderWidth: {
        none: '0',
        thin: '0.5px',
        DEFAULT: '0.5px',   // Thin borders for subtle design
        thick: '1px',       // For emphasis
        resize: '0.5px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        md: '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        lg: '0 4px 6px 0 rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [
    function ({ addVariant }) {
      addVariant('rtl', '[dir="rtl"] &');
      addVariant('ltr', '[dir="ltr"] &');
    }
  ],
};
