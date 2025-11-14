import { CustomProjectConfig } from 'lost-pixel';

export const config: CustomProjectConfig = {
  pageShots: {
    pages: [
      { path: '/', name: 'homepage' },
      { path: '/project/new', name: 'new-project' }
    ],
    baseUrl: 'http://localhost:3000',
    mask: [
      { selector: '[data-testid="timestamp"]' },
      { selector: '.loading-spinner' }
    ]
  },
  threshold: 0,
  shotConcurrency: 5,
  generateOnly: true,
  failOnDifference: true,
  beforeScreenshot: async (page) => {
    await page.waitForLoadState('networkidle');
  }
};
