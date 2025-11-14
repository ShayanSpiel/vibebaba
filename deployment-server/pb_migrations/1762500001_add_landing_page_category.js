/// <reference path="../pb_data/types.d.ts" />

/**
 * Add landing-page category to example_categories
 * Fixes "Category not found: landing-page" error
 */
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("example_categories");

  // Create landing-page category
  const record = new Record(collection, {
    slug: "landing-page",
    name: "Landing Page",
    description: "Full-page landing page examples with hero sections, features, CTAs, and animations",
    minExamplesRequired: 3,
    targetExamples: 10,
    isActive: true,
    priority: 9
  });

  return dao.saveRecord(record);
}, (db) => {
  // Rollback: delete the landing-page category
  const dao = new Dao(db);
  const records = dao.findRecordsByExpr("example_categories", $dbx.exp("slug = {:slug}", {
    slug: "landing-page"
  }));

  if (records.length > 0) {
    return dao.deleteRecord(records[0]);
  }
});
