import { NextRequest, NextResponse } from "next/server";
import { generateWithFallback } from "@/lib/ai/ai";
import { getAuthenticatedUser } from "@/lib/database/pocketbase-middleware";
import { consumeTokens, getAvailableTokens, checkAndResetDailyTokens } from "@/lib/database/pocketbase-credits";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, description, prototypeCode } = await req.json();

    // Estimate tokens needed
    const estimatedTokens = Math.ceil(description.length / 2);

    // Check if user has enough tokens
    const updatedUser = await checkAndResetDailyTokens(user.id);
    const availableTokens = getAvailableTokens(updatedUser);
    if (availableTokens < estimatedTokens) {
      return NextResponse.json(
        { error: "Insufficient tokens. Please purchase more credits.", insufficientTokens: true },
        { status: 402 }
      );
    }

    const prompt = `Generate a backend configuration with database collection AND page structure.

Project Description:
${description}

⚠️ CRITICAL RULES FOR DATABASE:
1. Create 1-3 collections based on app complexity (simple = 1, moderate = 2, complex = 3)
2. DO NOT create users, auth, or any standard collections unless explicitly mentioned
3. Keep it simple - 3-5 fields maximum per collection
4. Use descriptive field names based on the entity
5. Collections should represent main entities (e.g., products, posts/comments, orders/items)

⚠️ CRITICAL RULES FOR PAGES VS SECTIONS:
YOU MUST CAREFULLY DISTINGUISH BETWEEN:
- PAGES = Separate HTML files with navigation between them
- SECTIONS = Different parts of a SINGLE scrolling page (hero, features, pricing on same page)

🚨 CRITICAL: LANDING PAGES ARE ALWAYS SINGLE-PAGE APPS!
If the description mentions "landing page" → Return empty pages array: []
Landing pages have SECTIONS (hero, features, testimonials, CTA) on ONE scrolling page.

SINGLE-PAGE INDICATORS (return pages: []):
✓ Contains "landing page" keyword
✓ Mentions "sections" like "hero section", "features section", "contact section"
✓ Says "single page" explicitly
✓ Simple tools, calculators, dashboards
✓ Waitlist pages, coming soon pages
✓ Product showcase pages

MULTI-PAGE INDICATORS (return pages array with routes):
✓ Explicitly mentions "multi-page" or "multiple pages"
✓ Describes SEPARATE destinations: "an about us page", "a dedicated pricing page"
✓ Blogs, portfolios, documentation sites (each post/project = separate page)
✓ Admin panels with different views
✓ Uses phrases like "navigate to" or "go to the pricing page"

EXAMPLES:
❌ WRONG: "Build a B2B SaaS landing page with features, pricing, testimonials"
   → {"pages": [{"name": "Features", "route": "/features"}...]} ← NO! These are SECTIONS!

✅ CORRECT: "Build a B2B SaaS landing page with features, pricing, testimonials"
   → {"pages": []} ← YES! It's a landing page with sections on one page!

❌ WRONG: "Create a portfolio site"
   → {"pages": []} ← NO! Portfolios need separate pages for each project!

✅ CORRECT: "Create a portfolio site with project showcase"
   → {"pages": [{"name": "Home", "route": "/"}, {"name": "Projects", "route": "/projects"}, {"name": "About", "route": "/about"}]}

✅ CORRECT: "Build a blog platform"
   → {"pages": [{"name": "Home", "route": "/"}, {"name": "Blog", "route": "/blog"}, {"name": "About", "route": "/about"}]}

✅ CORRECT: "Simple waitlist page with email signup"
   → {"pages": []} ← Single page!

✅ CORRECT: "Multi-page corporate website with separate about and contact pages"
   → {"pages": [{"name": "Home", "route": "/"}, {"name": "About", "route": "/about"}, {"name": "Contact", "route": "/contact"}]}

Return ONLY this JSON format (no markdown, no explanations):
{
  "collections": [
    {
      "name": "posts",
      "fields": [
        {"name": "title", "type": "string"},
        {"name": "content", "type": "text"},
        {"name": "author", "type": "string"},
        {"name": "date", "type": "string"}
      ]
    }
  ],
  "pages": [
    {"name": "Home", "route": "/"},
    {"name": "About", "route": "/about"},
    {"name": "Contact", "route": "/contact"}
  ]
}

Generate the JSON now:`;

    let text = await generateWithFallback(prompt);

    // Clean up markdown code blocks if present
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    // Parse JSON
    let backendConfig;
    try {
      backendConfig = JSON.parse(text);

      // Validate: limit collections to max 3 (reasonable limit for generated apps)
      if (backendConfig.collections && backendConfig.collections.length > 3) {
        console.warn(`AI generated ${backendConfig.collections.length} collections, limiting to first 3`);
        backendConfig.collections = backendConfig.collections.slice(0, 3);
      }

      // Remove unnecessary fields
      delete backendConfig.endpoints;
      delete backendConfig.authentication;
      delete backendConfig.storage;
      delete backendConfig.realtime;
      delete backendConfig.setupInstructions;

    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      // Fallback: Create a simple "items" collection
      backendConfig = {
        collections: [
          {
            name: "items",
            fields: [
              { name: "title", type: "string" },
              { name: "description", type: "text" }
            ]
          }
        ]
      };
    }

    // Consume tokens after successful generation
    await consumeTokens(user.id, estimatedTokens, "/api/ai/backend");

    return NextResponse.json({ backendConfig });
  } catch (error: any) {
    console.error("Error generating backend:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
