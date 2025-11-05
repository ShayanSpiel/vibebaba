// lib/services/org-auto-create.ts

import { pb } from '../pocketbase';
import type { Organization, OrgMember } from '../pocketbase';

/**
 * Auto-create organization for new user
 * Called automatically after user signup
 *
 * IMPORTANT: This is INVISIBLE to the user
 * They don't know it's happening, they just start using the app
 */
export async function autoCreateOrganization(
  userId: string,
  userEmail: string,
  userName?: string
): Promise<Organization | null> {
  try {
    console.log(`[OrgAutoCreate] Creating organization for user: ${userEmail}`);

    // Check if user already has an organization
    const existingMembers = await pb.collection('org_members').getFullList<OrgMember>({
      filter: `userId = "${userId}"`,
      expand: 'organizationId'
    });

    if (existingMembers.length > 0) {
      const org = (existingMembers[0] as any).expand?.organizationId;
      console.log(`[OrgAutoCreate] ✅ User already has organization: ${org?.name}`);
      return org;
    }

    // Generate unique slug from email
    const baseSlug = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
    const uniqueSlug = `${baseSlug}-${Date.now()}`;

    // Get user's current credits (for migration)
    const user = await pb.collection('users').getOne(userId);

    // Create organization
    const orgName = userName ? `${userName}'s Organization` : `${userEmail}'s Organization`;
    const organization = await pb.collection('organizations').create<Organization>({
      name: orgName,
      slug: uniqueSlug,
      ownerId: userId,
      totalCredits: (user as any).totalTokens || 0,
      usedCredits: (user as any).usedTokens || 0,
      monthlyCredits: (user as any).dailyTokens || 0
    });

    console.log(`[OrgAutoCreate] ✅ Created organization: ${organization.id}`);

    // Add user as owner
    await pb.collection('org_members').create<OrgMember>({
      organizationId: organization.id,
      userId: userId,
      role: 'owner'
    });

    console.log(`[OrgAutoCreate] ✅ Added user as owner`);

    return organization;

  } catch (error) {
    console.error('[OrgAutoCreate] ❌ Failed to create organization:', error);
    // Don't throw - user can still use app without org for now
    return null;
  }
}

/**
 * Get user's organization (or create if missing)
 */
export async function getUserOrganization(userId: string): Promise<Organization | null> {
  try {
    // Get user's org membership
    const members = await pb.collection('org_members').getFullList<OrgMember>({
      filter: `userId = "${userId}"`,
      expand: 'organizationId'
    });

    if (members.length > 0) {
      const org = (members[0] as any).expand?.organizationId;
      return org || null;
    }

    // No org found - this shouldn't happen, but handle gracefully
    console.warn(`[OrgAutoCreate] ⚠️ User ${userId} has no organization - this is unexpected`);
    return null;

  } catch (error) {
    console.error('[OrgAutoCreate] Error getting user organization:', error);
    return null;
  }
}

/**
 * Get user's organization with error handling
 * Returns undefined if not found (backwards compatible)
 */
export async function getUserOrganizationSafe(userId: string): Promise<Organization | undefined> {
  try {
    const org = await getUserOrganization(userId);
    return org || undefined;
  } catch (error) {
    console.error('[OrgAutoCreate] Error in getUserOrganizationSafe:', error);
    return undefined;
  }
}
