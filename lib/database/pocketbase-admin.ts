import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

// Create admin-authenticated PocketBase client for server-side operations
let adminPb: PocketBase | null = null;
let authPromise: Promise<PocketBase> | null = null;

/**
 * Get admin-authenticated PocketBase client
 * This bypasses user-level permissions for server-side operations
 */
export async function getAdminPb(): Promise<PocketBase> {
  // Return existing client if already authenticated
  if (adminPb && adminPb.authStore.isValid) {
    return adminPb;
  }

  // If authentication is in progress, wait for it
  if (authPromise) {
    return authPromise;
  }

  // Start new authentication
  authPromise = (async () => {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error(
        'Admin credentials not configured. Set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD'
      );
    }

    adminPb = new PocketBase(PB_URL);
    adminPb.autoCancellation(false);

    try {
      await adminPb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
      console.log('✅ Admin PocketBase client authenticated');
      return adminPb;
    } catch (error) {
      console.error('❌ Failed to authenticate admin PocketBase client:', error);
      adminPb = null;
      throw error;
    } finally {
      authPromise = null;
    }
  })();

  return authPromise;
}

/**
 * Clear admin authentication (useful for testing)
 */
export function clearAdminAuth() {
  if (adminPb) {
    adminPb.authStore.clear();
    adminPb = null;
  }
  authPromise = null;
}
