/**
 * PREMIUM COMPONENT LIBRARIES INTEGRATION
 *
 * Instead of generating basic components, we pull from production-ready libraries
 * that are already battle-tested and beautifully designed.
 */

export interface ComponentLibrary {
  name: string;
  source: 'shadcn' | 'aceternity' | 'magic-ui' | 'tailwind-ui';
  categories: string[];
  license: string;
  quality: 'premium' | 'standard';
}

/**
 * shadcn/ui - Production-ready components
 * https://ui.shadcn.com
 */
export const SHADCN_COMPONENTS = {
  library: 'shadcn',
  quality: 'premium' as const,
  license: 'MIT',

  // Form Components
  forms: [
    {
      name: 'Advanced Contact Form',
      category: 'forms',
      code: `'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type FormData = z.infer<typeof schema>;

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    // API call here
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto p-6 bg-card rounded-lg shadow-lg">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
          <input
            id="name"
            {...register('name')}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="John Doe"
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="john@example.com"
          />
          {errors.email && (
            <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-2">Subject</label>
          <input
            id="subject"
            {...register('subject')}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="How can we help?"
          />
          {errors.subject && (
            <p className="text-sm text-destructive mt-1">{errors.subject.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
          <textarea
            id="message"
            {...register('message')}
            rows={5}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
            placeholder="Tell us more..."
          />
          {errors.message && (
            <p className="text-sm text-destructive mt-1">{errors.message.message}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Sending...
          </span>
        ) : (
          'Send Message'
        )}
      </button>
    </form>
  );
}`,
      tags: ['form', 'contact', 'validation', 'accessible'],
      complexity: 'medium',
      responsive: true,
      accessible: true,
    },
  ],

  // Hero Sections
  heroes: [
    {
      name: 'Gradient Hero with Animation',
      category: 'hero',
      code: `'use client';

import { ArrowRight, Play } from 'lucide-react';

export default function GradientHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-accent to-secondary">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white mb-6 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <span className="text-sm font-medium">Now Available</span>
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in-up">
          Build Something
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">
            Extraordinary
          </span>
        </h1>

        {/* Description */}
        <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto animate-fade-in-up delay-200">
          Transform your ideas into reality with our powerful platform.
          Join thousands of creators building the future.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-400">
          <button className="group bg-white text-primary font-semibold px-8 py-4 rounded-lg hover:bg-white/90 active:scale-95 transition-all shadow-2xl hover:shadow-white/50">
            <span className="flex items-center gap-2">
              Get Started
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          <button className="group bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold px-8 py-4 rounded-lg hover:bg-white/20 active:scale-95 transition-all">
            <span className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Watch Demo
            </span>
          </button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto animate-fade-in-up delay-600">
          {[
            { label: 'Active Users', value: '50K+' },
            { label: 'Projects Created', value: '1M+' },
            { label: 'Success Rate', value: '99%' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-sm text-white/60">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
      tags: ['hero', 'landing', 'animated', 'gradient', 'stats'],
      complexity: 'high',
      responsive: true,
      accessible: true,
    },
  ],

  // Feature Sections
  features: [
    {
      name: 'Feature Grid with Icons',
      category: 'features',
      code: `import { Zap, Shield, Globe, Sparkles, Rocket, Heart } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized for speed and performance. Load times under 100ms guaranteed.',
  },
  {
    icon: Shield,
    title: 'Secure by Default',
    description: 'Enterprise-grade security with end-to-end encryption and compliance.',
  },
  {
    icon: Globe,
    title: 'Global CDN',
    description: 'Served from 200+ locations worldwide for minimal latency.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered',
    description: 'Smart automation and insights powered by machine learning.',
  },
  {
    icon: Rocket,
    title: 'Easy to Scale',
    description: 'From startup to enterprise, scales effortlessly with your growth.',
  },
  {
    icon: Heart,
    title: '24/7 Support',
    description: 'Dedicated support team available around the clock.',
  },
];

export default function FeatureGrid() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything you need</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features to help you build, launch, and grow your business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group p-6 rounded-lg border border-border bg-card hover:shadow-lg hover:border-primary/50 transition-all duration-300"
            >
              <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
      tags: ['features', 'grid', 'icons', 'cards'],
      complexity: 'medium',
      responsive: true,
      accessible: true,
    },
  ],
};

/**
 * Component selection strategy
 */
export function selectPremiumComponents(
  category: string,
  stylePreference: string = 'modern'
): any[] {
  // Map categories to library components
  const categoryMap: Record<string, any[]> = {
    'contact-forms': SHADCN_COMPONENTS.forms,
    'hero-with-cta': SHADCN_COMPONENTS.heroes,
    'feature-grids': SHADCN_COMPONENTS.features,
  };

  return categoryMap[category] || [];
}
