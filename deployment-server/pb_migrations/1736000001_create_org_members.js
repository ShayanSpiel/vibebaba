/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Create org_members collection
 * Purpose: Track user membership in organizations
 */
migrate((db) => {
  const collection = new Collection({
    id: 'org_members_collection',
    name: 'org_members',
    type: 'base',
    system: false,
    schema: [
      {
        id: 'organization_field',
        name: 'organizationId',
        type: 'relation',
        system: false,
        required: true,
        options: {
          collectionId: 'organizations_collection',
          cascadeDelete: true,
          minSelect: null,
          maxSelect: 1,
          displayFields: ['name']
        }
      },
      {
        id: 'user_field',
        name: 'userId',
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
        id: 'role_field',
        name: 'role',
        type: 'select',
        system: false,
        required: true,
        options: {
          maxSelect: 1,
          values: ['owner', 'admin', 'member', 'viewer']
        }
      }
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_org_members_unique ON org_members (organizationId, userId)',
      'CREATE INDEX idx_org_members_user ON org_members (userId)'
    ],
    listRule: 'userId = @request.auth.id || organizationId.ownerId = @request.auth.id',
    viewRule: 'userId = @request.auth.id || organizationId.ownerId = @request.auth.id',
    createRule: 'organizationId.ownerId = @request.auth.id',
    updateRule: 'organizationId.ownerId = @request.auth.id',
    deleteRule: 'organizationId.ownerId = @request.auth.id'
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId('org_members');
  return dao.deleteCollection(collection);
});
