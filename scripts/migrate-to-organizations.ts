// scripts/migrate-to-organizations.ts

import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

/**
 * Migration script: Add organizations for all existing users
 *
 * RUN THIS ONCE after creating the new collections
 *
 * Usage:
 *   npx tsx scripts/migrate-to-organizations.ts
 *
 * SAFE TO RUN MULTIPLE TIMES (idempotent)
 */

async function migrate() {
  console.log('🚀 Starting organization migration...\n');

  try {
    // Authenticate as admin (use admin credentials)
    const adminEmail = process.env.PB_ADMIN_EMAIL || 'admin@vibecoding.com';
    const adminPassword = process.env.PB_ADMIN_PASSWORD || 'admin123456';

    try {
      await pb.admins.authWithPassword(adminEmail, adminPassword);
      console.log('✅ Authenticated as admin\n');
    } catch (error) {
      console.log('⚠️  Running without admin auth (using existing auth)\n');
    }

    // Get all users
    const users = await pb.collection('users').getFullList();
    console.log(`Found ${users.length} users\n`);

    let created = 0;
    let skipped = 0;
    let updated = 0;

    for (const user of users) {
      console.log(`\n📍 Processing user: ${user.email}`);

      try {
        // Check if user already has organization
        const existingMembers = await pb.collection('org_members').getFullList({
          filter: `userId = "${user.id}"`,
          expand: 'organizationId'
        });

        let organization;

        if (existingMembers.length > 0) {
          // User already has org
          organization = (existingMembers[0] as any).expand?.organizationId;
          console.log(`  ✅ Already has organization: ${organization?.name}`);
          skipped++;
        } else {
          // Create organization
          const slug = `${user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
          const orgName = (user as any).name ? `${(user as any).name}'s Organization` : `${user.email}'s Organization`;

          organization = await pb.collection('organizations').create({
            name: orgName,
            slug: slug,
            ownerId: user.id,
            totalCredits: (user as any).totalTokens || 0,
            usedCredits: (user as any).usedTokens || 0,
            monthlyCredits: (user as any).dailyTokens || 0
          });

          console.log(`  ✅ Created organization: ${organization.id}`);

          // Add user as owner
          await pb.collection('org_members').create({
            organizationId: organization.id,
            userId: user.id,
            role: 'owner'
          });

          console.log(`  ✅ Added user as owner`);
          created++;
        }

        // Migrate user's projects to organization
        const projects = await pb.collection('projects').getFullList({
          filter: `userId = "${user.id}"`
        });

        console.log(`  📦 Found ${projects.length} projects`);

        let projectsUpdated = 0;
        for (const project of projects) {
          // Check if project already has organizationId
          if (!(project as any).organizationId) {
            await pb.collection('projects').update(project.id, {
              organizationId: organization.id
            });
            projectsUpdated++;
          }
        }

        if (projectsUpdated > 0) {
          console.log(`  ✅ Updated ${projectsUpdated} projects`);
          updated += projectsUpdated;
        }

      } catch (error: any) {
        console.error(`  ❌ Error migrating user ${user.email}:`, error.message);
        // Continue with next user
      }
    }

    console.log('\n🎉 Migration complete!');
    console.log(`\nSummary:`);
    console.log(`  Organizations created: ${created}`);
    console.log(`  Users skipped (already had org): ${skipped}`);
    console.log(`  Projects updated: ${updated}`);

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
