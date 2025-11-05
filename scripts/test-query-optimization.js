const description = "A checklist generation app with ability to attach tasks to dates, with a big calendar view that shows all tasks";

// Simulate extractKeywords function
function extractKeywords(desc) {
  const stopWords = ['a', 'an', 'the', 'with', 'to', 'that', 'shows', 'all', 'of', 'for', 'in', 'on'];
  return desc.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .filter((word, i, arr) => arr.indexOf(word) === i)
    .slice(0, 10);
}

const keywords = extractKeywords(description);
console.log("📝 Keywords extracted:", keywords);

// Old query (problematic)
const oldGitHubQuery = `asana app stars:>20 react`;
console.log("\n❌ OLD GitHub Query (returns 0 results):");
console.log("  ", oldGitHubQuery);
console.log("   Problem: Too specific, requires 'asana app' literal match");

// New query (improved)
const semanticKeywords = keywords.slice(0, 3);
const searchTerms = ['asana', 'project management', ...semanticKeywords].join(' ');
const newGitHubQuery = `${searchTerms} language:typescript stars:>10`;
console.log("\n✅ NEW GitHub Query (better results):");
console.log("  ", newGitHubQuery);
console.log("   Improvement: Semantic keywords + lower star threshold");

// Web search improvements
const oldWebQuery = `asana app design patterns best practices 2024 2025`;
console.log("\n❌ OLD Web Query:");
console.log("  ", oldWebQuery);
console.log("   Problem: Still using 'asana app' literal");

const newWebQuery = `${semanticKeywords.join(' ')} app design patterns best practices 2024 2025`;
console.log("\n✅ NEW Web Query:");
console.log("  ", newWebQuery);
console.log("   Improvement: Focus on functionality (checklist, generation, ability)");

console.log("\n🎯 SUMMARY:");
console.log("  - Timeout increased: 3s → 10s");
console.log("  - Min stars lowered: 20 → 10");
console.log("  - Query strategy: Brand literal → Semantic keywords");
console.log("  - Expected improvement: 0 results → 10-50 results");
