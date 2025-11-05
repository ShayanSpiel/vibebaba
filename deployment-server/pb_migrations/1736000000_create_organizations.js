/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Create organizations collection
 * Purpose: Auto-created container per user for multi-tenant foundation
 */
migrate((db) => {
  const collection = new Collection({
    id: 'organizations_collection',
    name: 'organizations',
    type: 'base',
    system: false,
    schema: [
      {
        id: 'name_field',
        name: 'name',
        type: 'text',
        system: false,
        required: true,
        options: {
          min: 1,
          max: 200
        }
      },
      {
        id: 'slug_field',
        name: 'slug',
        type: 'text',
        system: false,
        required: true,
        unique: true,
        options: {
          min: 1,
          max: 100,
          pattern: '^[a-z0-9-]+$'
        }
      },
      {
        id: 'owner_field',
        name: 'ownerId',
        type: 'relation',
        system: false,
        required: true,
        options: {
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          minSelect: null,
          maxSelect: 1,
          displayFields: ['email']
        }
      },
      {
        id: 'total_credits_field',
        name: 'totalCredits',
        type: 'number',
        system: false,
        required: true,
        options: {
          min: 0
        }
      },
      {
        id: 'used_credits_field',
        name: 'usedCredits',
        type: 'number',
        system: false,
        required: true,
        options: {
          min: 0
        }
      },
      {
        id: 'monthly_credits_field',
        name: 'monthlyCredits',
        type: 'number',
        system: false,
        required: true,
        options: {
          min: 0
        }
      }
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_organizations_slug ON organizations (slug)',
      'CREATE INDEX idx_organizations_owner ON organizations (ownerId)'
    ],
    listRule: '@request.auth.id != "" && ownerId = @request.auth.id',
    viewRule: '@request.auth.id != "" && ownerId = @request.auth.id',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != "" && ownerId = @request.auth.id',
    deleteRule: null
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId('organizations');
  return dao.deleteCollection(collection);
});
