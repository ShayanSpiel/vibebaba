// NextAuth PocketBase Adapter
// Syncs NextAuth sessions with PocketBase collections

import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
  VerificationToken,
} from 'next-auth/adapters';
import PocketBase from 'pocketbase';

export function PocketBaseAdapter(pbUrl: string): Adapter {
  const pb = new PocketBase(pbUrl);

  return {
    async createUser(user: Omit<AdapterUser, 'id'>): Promise<AdapterUser> {
      const record = await pb.collection('users').create({
        email: user.email,
        name: user.name,
        avatar: user.image,
        emailVerified: user.emailVerified,
      });
      return {
        id: record.id,
        email: record.email,
        emailVerified: record.emailVerified ? new Date(record.emailVerified) : null,
        name: record.name,
        image: record.avatar,
      };
    },

    async getUser(id: string): Promise<AdapterUser | null> {
      try {
        const record = await pb.collection('users').getOne(id);
        return {
          id: record.id,
          email: record.email,
          emailVerified: record.emailVerified ? new Date(record.emailVerified) : null,
          name: record.name,
          image: record.avatar,
        };
      } catch {
        return null;
      }
    },

    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      try {
        const record = await pb.collection('users').getFirstListItem(`email="${email}"`);
        return {
          id: record.id,
          email: record.email,
          emailVerified: record.emailVerified ? new Date(record.emailVerified) : null,
          name: record.name,
          image: record.avatar,
        };
      } catch {
        return null;
      }
    },

    async getUserByAccount({
      providerAccountId,
      provider,
    }: {
      providerAccountId: string;
      provider: string;
    }): Promise<AdapterUser | null> {
      try {
        const account = await pb
          .collection('accounts')
          .getFirstListItem(`provider="${provider}" && providerAccountId="${providerAccountId}"`);
        const user = await pb.collection('users').getOne(account.userId);
        return {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
          name: user.name,
          image: user.avatar,
        };
      } catch {
        return null;
      }
    },

    async updateUser(
      user: Partial<AdapterUser> & Pick<AdapterUser, 'id'>
    ): Promise<AdapterUser> {
      const record = await pb.collection('users').update(user.id, {
        email: user.email,
        name: user.name,
        avatar: user.image,
        emailVerified: user.emailVerified,
      });
      return {
        id: record.id,
        email: record.email,
        emailVerified: record.emailVerified ? new Date(record.emailVerified) : null,
        name: record.name,
        image: record.avatar,
      };
    },

    async deleteUser(userId: string): Promise<void> {
      await pb.collection('users').delete(userId);
    },

    async linkAccount(account: AdapterAccount): Promise<AdapterAccount> {
      await pb.collection('accounts').create({
        userId: account.userId,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state,
      });
      return account;
    },

    async unlinkAccount({
      providerAccountId,
      provider,
    }: {
      providerAccountId: string;
      provider: string;
    }): Promise<void> {
      const account = await pb
        .collection('accounts')
        .getFirstListItem(`provider="${provider}" && providerAccountId="${providerAccountId}"`);
      await pb.collection('accounts').delete(account.id);
    },

    async createSession(session: {
      sessionToken: string;
      userId: string;
      expires: Date;
    }): Promise<AdapterSession> {
      const record = await pb.collection('sessions').create({
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      });
      return {
        sessionToken: record.sessionToken,
        userId: record.userId,
        expires: new Date(record.expires),
      };
    },

    async getSessionAndUser(sessionToken: string): Promise<{
      session: AdapterSession;
      user: AdapterUser;
    } | null> {
      try {
        const session = await pb
          .collection('sessions')
          .getFirstListItem(`sessionToken="${sessionToken}"`);
        const user = await pb.collection('users').getOne(session.userId);
        return {
          session: {
            sessionToken: session.sessionToken,
            userId: session.userId,
            expires: new Date(session.expires),
          },
          user: {
            id: user.id,
            email: user.email,
            emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
            name: user.name,
            image: user.avatar,
          },
        };
      } catch {
        return null;
      }
    },

    async updateSession(
      session: Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>
    ): Promise<AdapterSession | null | undefined> {
      const record = await pb
        .collection('sessions')
        .getFirstListItem(`sessionToken="${session.sessionToken}"`);
      const updateData: Record<string, any> = {};
      if (session.expires !== undefined) {
        updateData.expires = session.expires;
      }
      await pb.collection('sessions').update(record.id, updateData);
      return {
        sessionToken: record.sessionToken,
        userId: record.userId,
        expires: new Date(session.expires || record.expires),
      };
    },

    async deleteSession(sessionToken: string): Promise<void> {
      const session = await pb
        .collection('sessions')
        .getFirstListItem(`sessionToken="${sessionToken}"`);
      await pb.collection('sessions').delete(session.id);
    },

    async createVerificationToken(token: VerificationToken): Promise<VerificationToken> {
      await pb.collection('verification_tokens').create({
        identifier: token.identifier,
        token: token.token,
        expires: token.expires,
      });
      return token;
    },

    async useVerificationToken({
      identifier,
      token,
    }: {
      identifier: string;
      token: string;
    }): Promise<VerificationToken | null> {
      try {
        const record = await pb
          .collection('verification_tokens')
          .getFirstListItem(`identifier="${identifier}" && token="${token}"`);
        await pb.collection('verification_tokens').delete(record.id);
        return {
          identifier: record.identifier,
          token: record.token,
          expires: new Date(record.expires),
        };
      } catch {
        return null;
      }
    },
  };
}
