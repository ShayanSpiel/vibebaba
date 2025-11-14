/**
 * Direct HTML generation - No AI involvement in structure
 * AI only provides content (titles, descriptions, etc.)
 */

interface PageContent {
  title: string;
  description: string;
}

interface DatabaseCollection {
  name: string;
  fields: Array<{ name: string; type: string }>;
}

export function generateCompleteHTML(
  projectId: string,
  description: string,
  pages: Array<{ id: string; name: string }>,
  backendConfig?: { collections?: DatabaseCollection[] },
  aiContent?: {
    heroTitle?: string;
    heroSubtitle?: string;
    features?: Array<{ title: string; description: string }>;
    pageContents?: Record<string, PageContent>;
  }
) {
  const heroTitle = aiContent?.heroTitle || "Welcome to Your App";
  const heroSubtitle = aiContent?.heroSubtitle || "Build amazing things with our platform";
  const features = aiContent?.features || [
    { title: "Fast", description: "Lightning-fast performance" },
    { title: "Secure", description: "Enterprise-grade security" },
    { title: "Scalable", description: "Grows with your needs" }
  ];

  // Generate navigation links (ONLY for pages that exist)
  const navLinks = pages.map(p =>
    `<a href="#${p.id}" class="nav-link text-beerus-700 hover:text-gohan-100 font-medium transition-colors">${p.name}</a>`
  ).join('\n          ');

  // Generate page sections
  const pageSections = pages.map((page, index) => {
    if (page.id === 'home') {
      return generateHomePage(index === 0, heroTitle, heroSubtitle, features, undefined);
    } else if (page.id === 'about') {
      return generateAboutPage(aiContent?.pageContents?.about);
    } else if (page.id === 'contact') {
      return generateContactPage();
    } else if (page.id === 'pricing') {
      return generatePricingPage();
    } else if (page.id === 'faq') {
      return generateFAQPage();
    } else if (page.id === 'services') {
      return generateServicesPage();
    } else if (page.id === 'blog') {
      return generateBlogPage();
    } else if (backendConfig && page.id === backendConfig.collections?.[0]?.name) {
      // Database CRUD page
      return generateDatabasePage(backendConfig.collections[0]);
    }
    // Generic page
    return `
  <!-- ${page.name} Page -->
  <div id="${page.id}" class="page">
    <section class="py-20">
      <div class="max-w-7xl mx-auto px-4">
        <h1 class="text-4xl font-bold text-gohan-100 mb-8">${page.name}</h1>
        <div class="prose max-w-none">
          <p class="text-lg text-beerus-600">${aiContent?.pageContents?.[page.id]?.description || 'Content for ' + page.name}</p>
        </div>
      </div>
    </section>
  </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${description.split(' ').slice(0, 5).join(' ')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'] },
          colors: {
            piccolo: { DEFAULT: '#10B981', 50: '#ECFDF5', 100: '#D1FAE5', 200: '#A7F3D0', 300: '#6EE7B7', 400: '#34D399', 500: '#10B981', 600: '#059669', 700: '#047857', 800: '#065F46', 900: '#064E3B' },
            hit: { DEFAULT: '#6366F1', 50: '#EEF2FF', 100: '#E0E7FF', 200: '#C7D2FE', 300: '#A5B4FC', 400: '#818CF8', 500: '#6366F1', 600: '#4F46E5', 700: '#4338CA', 800: '#3730A3', 900: '#312E81' },
            beerus: { DEFAULT: '#F3F4F6', 50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 300: '#D1D5DB', 400: '#9CA3AF', 500: '#6B7280', 600: '#4B5563', 700: '#374151', 800: '#1F2937', 900: '#111827' },
            goku: { DEFAULT: '#FFFFFF', 100: '#FFFFFF', 200: '#FEFEFE' },
            gohan: { DEFAULT: '#000000', 100: '#111827', 200: '#1F2937' },
            trunks: { DEFAULT: '#EF4444', 500: '#EF4444', 600: '#DC2626' }
          }
        }
      }
    };
  </script>
  <style>
    .page { display: none; }
    .page.active { display: block; }
    .nav-link { transition: all 0.2s; }
    .nav-link:hover { color: #6366F1; }
    .nav-link.active { color: #6366F1; font-weight: 600; }
  </style>
</head>
<body class="bg-beerus-50 font-sans">

  <!-- Navigation -->
  <nav class="bg-goku-100 border-b border-beerus-200 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="text-2xl font-bold text-gohan-100">Brand</div>
        <div class="flex gap-6">
          ${navLinks}
        </div>
      </div>
    </div>
  </nav>

  <!-- PAGES -->
  ${pageSections}

  <!-- Router Script -->
  <script>
    function showPage(pageId) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

      const page = document.getElementById(pageId);
      if (page) {
        page.classList.add('active');
        document.querySelectorAll(\`a[href="#\${pageId}"]\`).forEach(l => l.classList.add('active'));
      }
    }

    // Intercept ALL clicks on links to prevent full URL navigation
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a');
      if (target && target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const pageId = target.getAttribute('href').slice(1);
        showPage(pageId);
        // Update URL hash without triggering navigation
        history.replaceState(null, '', '#' + pageId);
      }
    });

    window.addEventListener('hashchange', () => {
      const pageId = location.hash.slice(1) || 'home';
      showPage(pageId);
    });

    document.addEventListener('DOMContentLoaded', () => {
      const pageId = location.hash.slice(1) || 'home';
      showPage(pageId);
    });
  </script>
</body>
</html>`;
}

function generateHomePage(isActive: boolean, heroTitle: string, heroSubtitle: string, features: Array<{ title: string; description: string }>, heroImageQuery?: string) {
  // Use fixed high-quality Unsplash images (source API was deprecated)
  const heroImage = 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=600&fit=crop&auto=format';

  return `
  <!-- Home Page -->
  <div id="home" class="page ${isActive ? 'active' : ''}">
    <section class="bg-gradient-to-b from-hit-50 to-goku-100 py-20">
      <div class="max-w-7xl mx-auto px-4 text-center">
        <h1 class="text-5xl font-bold text-gohan-100 mb-6">${heroTitle}</h1>
        <p class="text-xl text-beerus-600 mb-8 max-w-2xl mx-auto">${heroSubtitle}</p>
        <button class="px-8 py-4 bg-hit-500 hover:bg-hit-600 text-white rounded-lg font-medium text-lg transition-colors">Get Started</button>
        <img src="${heroImage}" alt="Hero" class="w-full max-w-5xl mx-auto mt-12 rounded-2xl shadow-2xl" loading="lazy" />
      </div>
    </section>

    <section class="py-20">
      <div class="max-w-7xl mx-auto px-4">
        <h2 class="text-4xl font-bold text-center text-gohan-100 mb-12">Features</h2>
        <div class="grid md:grid-cols-3 gap-8">
          ${features.map(f => `
          <div class="bg-goku-100 p-8 rounded-xl border border-beerus-200 shadow-sm hover:shadow-lg transition-shadow">
            <h3 class="text-2xl font-bold text-gohan-100 mb-4">${f.title}</h3>
            <p class="text-beerus-600">${f.description}</p>
          </div>`).join('')}
        </div>
      </div>
    </section>
  </div>`;
}

function generateAboutPage(content?: PageContent) {
  return `
  <!-- About Page -->
  <div id="about" class="page">
    <section class="py-20">
      <div class="max-w-7xl mx-auto px-4">
        <h1 class="text-4xl font-bold text-gohan-100 mb-8">${content?.title || 'About Us'}</h1>
        <div class="prose max-w-none">
          <p class="text-lg text-beerus-600 mb-6">${content?.description || 'Learn more about our company and mission.'}</p>
          <div class="grid md:grid-cols-2 gap-8 mt-12">
            <div>
              <h3 class="text-2xl font-bold text-gohan-100 mb-4">Our Mission</h3>
              <p class="text-beerus-600">We strive to deliver exceptional value to our customers through innovation and dedication.</p>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gohan-100 mb-4">Our Vision</h3>
              <p class="text-beerus-600">To be the leading provider in our industry, setting new standards for excellence.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>`;
}

function generateContactPage() {
  return `
  <!-- Contact Page -->
  <div id="contact" class="page">
    <section class="bg-goku-100 py-20 px-4">
      <div class="max-w-3xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-4xl md:text-5xl font-bold text-gohan-100 mb-4">Get in touch</h2>
          <p class="text-xl text-beerus-600">We'd love to hear from you</p>
        </div>
        <form class="bg-goku-100 p-8 rounded-2xl border border-beerus-200 shadow-lg">
          <div class="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label class="block text-sm font-medium text-gohan-100 mb-2">First Name</label>
              <input type="text" class="w-full px-4 py-3 rounded-lg border border-beerus-200 focus:border-hit-500 focus:outline-none focus:ring-2 focus:ring-hit-100" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gohan-100 mb-2">Last Name</label>
              <input type="text" class="w-full px-4 py-3 rounded-lg border border-beerus-200 focus:border-hit-500 focus:outline-none focus:ring-2 focus:ring-hit-100" required>
            </div>
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium text-gohan-100 mb-2">Email</label>
            <input type="email" class="w-full px-4 py-3 rounded-lg border border-beerus-200 focus:border-hit-500 focus:outline-none focus:ring-2 focus:ring-hit-100" required>
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium text-gohan-100 mb-2">Message</label>
            <textarea rows="5" class="w-full px-4 py-3 rounded-lg border border-beerus-200 focus:border-hit-500 focus:outline-none focus:ring-2 focus:ring-hit-100" required></textarea>
          </div>
          <button type="submit" class="w-full px-8 py-4 bg-hit-500 hover:bg-hit-600 text-white rounded-lg font-semibold text-lg shadow-md hover:shadow-lg transition-all">Send Message</button>
        </form>
      </div>
    </section>
  </div>`;
}

function generatePricingPage() {
  return `
  <!-- Pricing Page -->
  <div id="pricing" class="page">
    <section class="bg-beerus-50 py-20 px-4">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold text-gohan-100 mb-4">Simple, transparent pricing</h2>
          <p class="text-xl text-beerus-600">Choose the plan that's right for you</p>
        </div>
        <div class="grid md:grid-cols-3 gap-8">
          <div class="bg-goku-100 rounded-2xl p-8 border border-beerus-200 hover:shadow-xl transition-all">
            <h3 class="text-2xl font-bold text-gohan-100 mb-2">Starter</h3>
            <div class="mb-6"><span class="text-5xl font-bold text-gohan-100">$9</span><span class="text-beerus-600">/month</span></div>
            <ul class="space-y-4 mb-8">
              <li class="flex items-center gap-3"><svg class="w-5 h-5 text-piccolo-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"></path></svg><span class="text-beerus-700">5 projects</span></li>
              <li class="flex items-center gap-3"><svg class="w-5 h-5 text-piccolo-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"></path></svg><span class="text-beerus-700">Basic support</span></li>
            </ul>
            <button class="w-full px-6 py-3 bg-beerus-100 hover:bg-beerus-200 text-gohan-100 rounded-lg font-medium transition-colors">Get Started</button>
          </div>
          <div class="bg-gradient-to-br from-hit-500 to-hit-600 rounded-2xl p-8 text-white shadow-2xl transform scale-105 relative">
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-piccolo-500 px-4 py-1 rounded-full text-sm font-bold">POPULAR</div>
            <h3 class="text-2xl font-bold mb-2">Pro</h3>
            <div class="mb-6"><span class="text-5xl font-bold">$29</span><span class="opacity-90">/month</span></div>
            <ul class="space-y-4 mb-8">
              <li class="flex items-center gap-3"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"></path></svg><span>Unlimited projects</span></li>
              <li class="flex items-center gap-3"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"></path></svg><span>Priority support</span></li>
            </ul>
            <button class="w-full px-6 py-3 bg-white text-hit-600 rounded-lg font-medium hover:bg-beerus-50 transition-colors">Get Started</button>
          </div>
          <div class="bg-goku-100 rounded-2xl p-8 border border-beerus-200 hover:shadow-xl transition-all">
            <h3 class="text-2xl font-bold text-gohan-100 mb-2">Enterprise</h3>
            <div class="mb-6"><span class="text-5xl font-bold text-gohan-100">$99</span><span class="text-beerus-600">/month</span></div>
            <ul class="space-y-4 mb-8">
              <li class="flex items-center gap-3"><svg class="w-5 h-5 text-piccolo-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"></path></svg><span class="text-beerus-700">Everything in Pro</span></li>
              <li class="flex items-center gap-3"><svg class="w-5 h-5 text-piccolo-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"></path></svg><span class="text-beerus-700">24/7 support</span></li>
            </ul>
            <button class="w-full px-6 py-3 bg-gohan-100 hover:bg-gohan-200 text-white rounded-lg font-medium transition-colors">Contact Sales</button>
          </div>
        </div>
      </div>
    </section>
  </div>`;
}

function generateFAQPage() {
  return `
  <!-- FAQ Page -->
  <div id="faq" class="page">
    <section class="bg-goku-100 py-20 px-4">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold text-gohan-100 mb-4">FAQ</h2>
          <p class="text-xl text-beerus-600">Everything you need to know</p>
        </div>
        <div class="space-y-6">
          <div class="bg-beerus-50 p-6 rounded-xl border border-beerus-200">
            <h3 class="text-xl font-bold text-gohan-100 mb-3">How do I get started?</h3>
            <p class="text-beerus-700 leading-relaxed">Simply sign up for a free account and start using our platform immediately.</p>
          </div>
          <div class="bg-beerus-50 p-6 rounded-xl border border-beerus-200">
            <h3 class="text-xl font-bold text-gohan-100 mb-3">What payment methods do you accept?</h3>
            <p class="text-beerus-700 leading-relaxed">We accept all major credit cards and PayPal.</p>
          </div>
          <div class="bg-beerus-50 p-6 rounded-xl border border-beerus-200">
            <h3 class="text-xl font-bold text-gohan-100 mb-3">Can I cancel anytime?</h3>
            <p class="text-beerus-700 leading-relaxed">Yes, cancel anytime with no penalties or fees.</p>
          </div>
        </div>
      </div>
    </section>
  </div>`;
}

function generateServicesPage() {
  return `
  <!-- Services Page -->
  <div id="services" class="page">
    <section class="py-20">
      <div class="max-w-7xl mx-auto px-4">
        <h1 class="text-4xl font-bold text-gohan-100 mb-8 text-center">Our Services</h1>
        <div class="grid md:grid-cols-3 gap-8 mt-12">
          <div class="bg-goku-100 p-8 rounded-xl border border-beerus-200 shadow-sm">
            <h3 class="text-2xl font-bold text-gohan-100 mb-4">Consulting</h3>
            <p class="text-beerus-600">Expert guidance to help you achieve your goals</p>
          </div>
          <div class="bg-goku-100 p-8 rounded-xl border border-beerus-200 shadow-sm">
            <h3 class="text-2xl font-bold text-gohan-100 mb-4">Development</h3>
            <p class="text-beerus-600">Custom solutions built to your specifications</p>
          </div>
          <div class="bg-goku-100 p-8 rounded-xl border border-beerus-200 shadow-sm">
            <h3 class="text-2xl font-bold text-gohan-100 mb-4">Support</h3>
            <p class="text-beerus-600">24/7 assistance when you need it most</p>
          </div>
        </div>
      </div>
    </section>
  </div>`;
}

function generateBlogPage(blog1ImageQuery?: string, blog2ImageQuery?: string) {
  // Use fixed high-quality Unsplash images (source API was deprecated)
  const blog1Image = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop&auto=format';
  const blog2Image = 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop&auto=format';

  return `
  <!-- Blog Page -->
  <div id="blog" class="page">
    <section class="py-20">
      <div class="max-w-7xl mx-auto px-4">
        <h1 class="text-4xl font-bold text-gohan-100 mb-8 text-center">Blog</h1>
        <div class="grid md:grid-cols-2 gap-8 mt-12">
          <article class="bg-goku-100 rounded-xl border border-beerus-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
            <img src="${blog1Image}" alt="Blog post" class="w-full h-48 object-cover" />
            <div class="p-6">
              <h3 class="text-2xl font-bold text-gohan-100 mb-3">Getting Started Guide</h3>
              <p class="text-beerus-600 mb-4">Learn the basics and start building amazing things.</p>
              <a href="#blog" class="text-hit-500 hover:text-hit-600 font-medium">Read more →</a>
            </div>
          </article>
          <article class="bg-goku-100 rounded-xl border border-beerus-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
            <img src="${blog2Image}" alt="Blog post" class="w-full h-48 object-cover" />
            <div class="p-6">
              <h3 class="text-2xl font-bold text-gohan-100 mb-3">Best Practices</h3>
              <p class="text-beerus-600 mb-4">Tips and tricks from our expert team.</p>
              <a href="#blog" class="text-hit-500 hover:text-hit-600 font-medium">Read more →</a>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>`;
}

function generateDatabasePage(collection: DatabaseCollection) {
  const fields = collection.fields || [];
  const collectionName = collection.name;
  const singularName = collectionName.endsWith('s') ? collectionName.slice(0, -1) : collectionName;

  return `
  <!-- ${collectionName} Page (Database CRUD) -->
  <div id="${collectionName}" class="page">
    <section class="py-20">
      <div class="max-w-7xl mx-auto px-4">
        <h1 class="text-4xl font-bold text-gohan-100 mb-8">${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)}</h1>

        <!-- Create Form -->
        <div class="bg-goku-100 p-8 rounded-xl border border-beerus-200 shadow-sm mb-12">
          <h2 class="text-2xl font-bold text-gohan-100 mb-6">Add New ${singularName.charAt(0).toUpperCase() + singularName.slice(1)}</h2>
          <form id="add-form" class="space-y-4">
            ${fields.map(f => {
              if (f.type === 'number') {
                return `<div>
              <label class="block text-sm font-medium text-gohan-100 mb-2">${f.name.charAt(0).toUpperCase() + f.name.slice(1)}</label>
              <input type="number" name="${f.name}" placeholder="${f.name}" class="w-full px-4 py-3 rounded-lg border border-beerus-200 focus:border-hit-500 focus:outline-none focus:ring-2 focus:ring-hit-100" required>
            </div>`;
              } else if (f.name.toLowerCase().includes('description') || f.name.toLowerCase().includes('bio') || f.name.toLowerCase().includes('content')) {
                return `<div>
              <label class="block text-sm font-medium text-gohan-100 mb-2">${f.name.charAt(0).toUpperCase() + f.name.slice(1)}</label>
              <textarea name="${f.name}" placeholder="${f.name}" rows="4" class="w-full px-4 py-3 rounded-lg border border-beerus-200 focus:border-hit-500 focus:outline-none focus:ring-2 focus:ring-hit-100" required></textarea>
            </div>`;
              }
              return `<div>
              <label class="block text-sm font-medium text-gohan-100 mb-2">${f.name.charAt(0).toUpperCase() + f.name.slice(1)}</label>
              <input type="text" name="${f.name}" placeholder="${f.name}" class="w-full px-4 py-3 rounded-lg border border-beerus-200 focus:border-hit-500 focus:outline-none focus:ring-2 focus:ring-hit-100" required>
            </div>`;
            }).join('\n            ')}
            <button type="submit" class="px-6 py-3 bg-hit-500 hover:bg-hit-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all">Add ${singularName.charAt(0).toUpperCase() + singularName.slice(1)}</button>
          </form>
        </div>

        <!-- Display Data -->
        <h2 class="text-2xl font-bold text-gohan-100 mb-6">All ${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)}</h2>
        <div id="${collectionName}-list" class="grid md:grid-cols-3 gap-6">
          <!-- Data will be loaded here -->
        </div>
      </div>
    </section>

    <script>
    // Load and display data
    function load${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)}() {
      const items = db.get(${JSON.stringify(collectionName)});
      console.log('📊 Loaded ${collectionName}:', items.length, 'records');

      const container = document.getElementById(${JSON.stringify(collectionName + '-list')});
      container.innerHTML = '';

      if (items.length === 0) {
        container.innerHTML = '<p class="text-beerus-600 col-span-3 text-center py-8">No ${collectionName} yet. Add one above!</p>';
        return;
      }

      items.forEach(item => {
        container.innerHTML += \`
          <div class="bg-goku-100 p-6 rounded-xl border border-beerus-200 shadow-sm hover:shadow-lg transition-shadow">
            ${fields.map(f => `<p class="mb-2"><strong class="text-gohan-100">${f.name.charAt(0).toUpperCase() + f.name.slice(1)}:</strong> <span class="text-beerus-600">\${item[${JSON.stringify(f.name)}] || 'N/A'}</span></p>`).join('\n            ')}
            <button onclick="deleteItem('\${item.id}')" class="mt-4 px-4 py-2 bg-trunks-500 hover:bg-trunks-600 text-white rounded-lg text-sm font-medium transition-colors">Delete</button>
          </div>
        \`;
      });
    }

    // Delete item
    function deleteItem(id) {
      if (confirm('Delete this item?')) {
        db.delete(${JSON.stringify(collectionName)}, id);
        load${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)}();
      }
    }

    // Form submission
    document.getElementById('add-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(e.target);
      const newItem = {};
      ${fields.map(f => `newItem[${JSON.stringify(f.name)}] = formData.get(${JSON.stringify(f.name)});`).join('\n      ')}

      db.add(${JSON.stringify(collectionName)}, newItem);
      e.target.reset();
      load${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)}();
    });

    // Load on page show
    load${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)}();
    </script>
  </div>`;
}
