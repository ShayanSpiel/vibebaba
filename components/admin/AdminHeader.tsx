'use client';

import { Bell, LogOut } from 'lucide-react';
import { usePocketBaseAuth } from '@/components/auth/PocketBaseAuthProvider';
import { Button } from '@/components/ui/button';

export function AdminHeader() {
  const { user, logout } = usePocketBaseAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border-light bg-background-raised px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-text-primary">Admin Dashboard</h1>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-background-subtle rounded-lg transition-colors border border-transparent hover:border-border-light">
          <Bell className="h-5 w-5 text-text-primary" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-error" />
        </button>

        <div className="flex items-center gap-3 border-l border-border-light pl-4">
          <div className="text-right">
            <p className="text-sm font-medium text-text-primary">{user?.name || 'Admin'}</p>
            <p className="text-xs text-text-secondary">{user?.email}</p>
          </div>

          <button
            className="p-2 hover:bg-background-subtle rounded-lg transition-colors border border-transparent hover:border-border-light"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="h-5 w-5 text-text-primary" />
          </button>
        </div>
      </div>
    </header>
  );
}
