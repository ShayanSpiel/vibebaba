/**
 * Design Components Library
 * Catalog of pre-built design patterns and components
 */

export interface DesignComponent {
  id: string;
  name: string;
  category: string;
  description: string;
  code: string;
  preview?: string;
}

export const COMPONENT_LIBRARY: DesignComponent[] = [
  {
    id: 'hero-section',
    name: 'Hero Section',
    category: 'layout',
    description: 'Full-width hero section with gradient background',
    code: `<section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background-base to-background-subtle">
  <div className="max-w-4xl mx-auto px-6 text-center">
    <h1 className="text-5xl font-bold mb-6">Welcome to Our Platform</h1>
    <p className="text-xl text-text-secondary mb-8">Build amazing things</p>
    <Button size="lg">Get Started</Button>
  </div>
</section>`,
  },
  {
    id: 'card-grid',
    name: 'Card Grid',
    category: 'layout',
    description: '3-column responsive card grid',
    code: `<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card>
    <CardHeader>
      <CardTitle>Feature 1</CardTitle>
    </CardHeader>
    <CardContent>
      <p>Description goes here</p>
    </CardContent>
  </Card>
  {/* Repeat for more cards */}
</div>`,
  },
  {
    id: 'form-basic',
    name: 'Basic Form',
    category: 'forms',
    description: 'Simple form with validation',
    code: `<form className="space-y-4">
  <div className="space-y-2">
    <label className="text-sm font-medium">Email</label>
    <Input type="email" placeholder="email@example.com" />
  </div>
  <Button type="submit">Submit</Button>
</form>`,
  },
];

export function getComponentsByCategory(category: string): DesignComponent[] {
  return COMPONENT_LIBRARY.filter((comp) => comp.category === category);
}

export function getComponentById(id: string): DesignComponent | undefined {
  return COMPONENT_LIBRARY.find((comp) => comp.id === id);
}
