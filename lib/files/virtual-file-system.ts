/**
 * Virtual File System for Multi-File Projects
 * Creates a single HTML file that simulates multiple pages
 */

interface ProjectFile {
  path: string;
  content: string;
}

/**
 * Generate a single HTML wrapper that simulates multiple files
 * Uses client-side routing to show different files based on the URL path
 */
export function generateMultiFileWrapper(files: ProjectFile[]): string {
  // Find index.html or use first HTML file
  const indexFile =
    files.find((f) => f.path === 'index.html') || files.find((f) => f.path.endsWith('.html'));

  if (!indexFile) {
    return '<html><body><h1>Error: No HTML files found</h1></body></html>';
  }

  // Create a map of all files
  const filesMap = files.reduce(
    (acc, file) => {
      acc[file.path] = file.content;
      return acc;
    },
    {} as Record<string, string>
  );

  // Inject virtual routing system into the index.html
  const injectedHTML = injectVirtualRouter(indexFile.content, filesMap);

  return injectedHTML;
}

/**
 * Inject virtual routing system into HTML
 */
function injectVirtualRouter(indexHTML: string, filesMap: Record<string, string>): string {
  // Create the virtual file system script
  const vfsScript = `
<script>
// Virtual File System - Simulates multiple HTML files
(function() {
  const VFS_FILES = ${JSON.stringify(filesMap)};
  let currentPath = '/';

  // Function to load and display a "file"
  function loadPage(path) {
    // Normalize path
    if (!path || path === '/') path = '/index.html';
    if (!path.startsWith('/')) path = '/' + path;
    if (!path.includes('.')) path = path + '.html';

    console.log('VFS: Loading page:', path);

    // Remove leading slash for lookup
    const filePath = path.substring(1);

    if (VFS_FILES[filePath]) {
      currentPath = path;

      // Parse and inject the new HTML
      const newDoc = new DOMParser().parseFromString(VFS_FILES[filePath], 'text/html');

      // Replace body content
      document.body.innerHTML = newDoc.body.innerHTML;

      // Update title
      if (newDoc.title) {
        document.title = newDoc.title;
      }

      // Re-inject VFS script to maintain routing
      const scriptTag = document.createElement('script');
      scriptTag.textContent = document.currentScript.textContent;
      document.body.appendChild(scriptTag);

      // Update URL display (not actual URL as we're in iframe)
      window.parent.postMessage({ type: 'vfs-navigate', path: currentPath }, '*');

      console.log('VFS: Page loaded successfully');
    } else {
      console.error('VFS: File not found:', filePath);
      document.body.innerHTML = \`
        <div style="padding: 40px; font-family: system-ui; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">404 - Page Not Found</h1>
          <p>The page <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">\${path}</code> does not exist.</p>
          <p><a href="/" style="color: #3b82f6;" onclick="event.preventDefault(); window.VFS.loadPage('/');">Go to Home</a></p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 14px; color: #6b7280;">Available pages:</p>
          <ul style="font-size: 14px; color: #6b7280;">
            \${Object.keys(VFS_FILES).filter(f => f.endsWith('.html')).map(f =>
              \`<li><a href="/\${f}" onclick="event.preventDefault(); window.VFS.loadPage('/\${f}');" style="color: #3b82f6;">/\${f}</a></li>\`
            ).join('')}
          </ul>
        </div>
      \`;
    }
  }

  // Intercept all link clicks
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && link.href) {
      const href = link.getAttribute('href');

      // Only intercept relative links and .html links
      if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('javascript:')) {
        e.preventDefault();
        e.stopPropagation();
        loadPage(href);
      }
    }
  }, true);

  // Expose VFS API
  window.VFS = {
    loadPage: loadPage,
    files: Object.keys(VFS_FILES),
    currentPath: () => currentPath
  };

  console.log('VFS: Initialized with files:', Object.keys(VFS_FILES));
})();
</script>
  `;

  // Inject before </body> tag, or at the end if no </body>
  if (indexHTML.includes('</body>')) {
    return indexHTML.replace('</body>', vfsScript + '\n</body>');
  } else {
    return indexHTML + vfsScript;
  }
}

/**
 * Convert single-file hash-based app to multi-file structure
 * Extracts page sections and creates separate HTML files
 * NOTE: This function is client-side only due to DOMParser usage
 */
export function convertHashBasedToMultiFile(singleFileHTML: string): ProjectFile[] {
  // This function requires browser APIs, so it can only run on client-side
  if (typeof window === 'undefined') {
    console.warn('convertHashBasedToMultiFile called on server-side, returning single file');
    return [{ path: 'index.html', content: singleFileHTML }];
  }

  const files: ProjectFile[] = [];

  try {
    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(singleFileHTML, 'text/html');

    // Extract head content (shared across all pages)
    const headContent = doc.head ? doc.head.innerHTML : '';

    // Find all page sections: <div id="page-name" class="page">
    const pageSections = Array.from(doc.querySelectorAll('[class*="page"]')).filter((el) => el.id);

    if (pageSections.length === 0) {
      // No multi-page structure, return as single index.html
      return [{ path: 'index.html', content: singleFileHTML }];
    }

    // Extract navigation
    const nav = doc.querySelector('nav');
    const navHTML = nav ? nav.outerHTML : '';

    // Create a file for each page section
    pageSections.forEach((section) => {
      const pageId = section.id;
      const pageContent = section.innerHTML;

      const pageHTML = `<!DOCTYPE html>
<html>
<head>
  ${headContent}
</head>
<body>
  ${navHTML}
  <div class="page active">
    ${pageContent}
  </div>
</body>
</html>`;

      files.push({
        path: pageId === 'home' ? 'index.html' : `${pageId}.html`,
        content: pageHTML,
      });
    });

    return files;
  } catch (error) {
    console.error('Error in convertHashBasedToMultiFile:', error);
    return [{ path: 'index.html', content: singleFileHTML }];
  }
}
