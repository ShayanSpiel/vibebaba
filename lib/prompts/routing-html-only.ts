/**
 * COMPRESSED HTML ROUTING INSTRUCTIONS
 *
 * Reduced from 201 lines to ~60 lines
 * Pattern examples moved to separate reference files
 */

export const HTML_ROUTING_INSTRUCTIONS = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 HTML ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DETECTION:
- Single-page: "page" (singular), "landing page", "contact page"
- Multi-page: "pages" (plural), "about AND contact", "website"

SINGLE-PAGE (default):
- Hash routing: #home, #about, #contact
- Show/hide divs with JavaScript
- Output: index.html + styles.css

MULTI-PAGE (if user requests multiple pages):
- Separate files: index.html, about.html, contact.html
- Links use .html extension
- Duplicate nav/footer on all pages
- Shared styles in styles.css

RULES:
1. Complete HTML documents (<!DOCTYPE html> to </html>)
2. Multi-page links: <a href="about.html">
3. Single-page links: <a href="#about">
4. Shared CSS in styles.css

OUTPUT FORMAT:
[
  {"path": "index.html", "content": "<!DOCTYPE html>..."},
  {"path": "styles.css", "content": "/* CSS */"}
]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

// Detailed routing patterns moved to separate reference files for documentation
// AI has the core patterns in component library
