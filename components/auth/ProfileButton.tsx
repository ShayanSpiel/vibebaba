"use client";

import { useState } from "react";
import { useAuth } from "./PocketBaseAuthProvider";
import { useRouter } from "next/navigation";
import { TokenBar } from "@/components/credits/TokenBar";

interface ProfileButtonProps {
  variant?: "default" | "compact";
}

export function ProfileButton({ variant = "default" }: ProfileButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { session, signOut } = useAuth();
  const router = useRouter();

  const user = session.data?.user;

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    router.push("/");
  };

  const handleSettings = () => {
    setIsOpen(false);
    router.push("/settings");
  };

  if (!user) return null;

  // Get initials from name or email
  const getInitials = () => {
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

  // Get avatar URL (Google OAuth profile picture)
  const getAvatarUrl = () => {
    if (user.avatar) {
      // If avatar is a full URL (from OAuth), use it directly
      if (user.avatar.startsWith('http')) {
        return user.avatar;
      }
      // If it's a PocketBase file, construct the URL
      return `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/${user.collectionId}/${user.id}/${user.avatar}`;
    }
    return null;
  };

  const avatarUrl = getAvatarUrl();

  // Compact variant - Simple circular profile for project header
  if (variant === "compact") {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-white text-xs font-bold flex items-center justify-center hover:shadow-lg hover:from-amber-500 hover:to-yellow-700 transition-all shadow-md ring-2 ring-amber-400/20 hover:ring-amber-400/40 overflow-hidden"
          aria-label="Profile menu"
          title={user.name || user.email || "Profile"}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user.name || "Profile"}
              className="w-full h-full object-cover"
            />
          ) : (
            getInitials()
          )}
        </button>

        {/* Dropdown Menu - Same as default variant */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-80 bg-background-raised rounded-xl shadow-xl border border-light overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* User info */}
            <div className="px-5 py-4 bg-gradient-to-br from-background-subtle to-background-raised border-b border-light">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-white text-lg font-bold flex items-center justify-center shadow-lg overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user.name || "Profile"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {user.name || "User"}
                  </p>
                  <p className="text-xs text-text-tertiary truncate">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Token Balance */}
            <div className="px-5 py-3 bg-background-base border-b border-light">
              <TokenBar variant="compact" showLabel={true} />
            </div>

            {/* Menu items */}
            <div className="py-2">
              <button
                onClick={handleSettings}
                className="w-full text-left px-5 py-2.5 text-sm font-medium text-text-primary hover:bg-background-subtle transition-colors flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-background-subtle group-hover:bg-brand-primary/10 flex items-center justify-center transition-colors">
                  <svg
                    className="w-4 h-4 text-text-secondary group-hover:text-brand-primary transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                Settings
              </button>

              <button
                onClick={handleSignOut}
                className="w-full text-left px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-background-subtle group-hover:bg-red-500/10 flex items-center justify-center transition-colors">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
                Log out
              </button>
            </div>
          </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Avatar Button - Enhanced */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background-raised hover:bg-background-subtle border border-light hover:border-brand-primary/30 transition-all shadow-sm"
        aria-label="User menu"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-white text-xs font-semibold flex items-center justify-center shadow-sm overflow-hidden">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user.name || "Profile"}
              className="w-full h-full object-cover"
            />
          ) : (
            getInitials()
          )}
        </div>
        <span className="text-sm font-medium text-text-primary hidden sm:inline">
          {user.name?.split(" ")[0] || "Account"}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-text-secondary transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu - Enhanced */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-background-raised rounded-xl shadow-xl border border-light overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User info */}
          <div className="px-5 py-4 bg-gradient-to-br from-background-subtle to-background-raised border-b border-light">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-white text-lg font-bold flex items-center justify-center shadow-lg overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user.name || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {user.name || "User"}
                </p>
                <p className="text-xs text-text-tertiary truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Token Balance */}
          <div className="px-5 py-3 bg-background-base border-b border-light">
            <TokenBar variant="compact" showLabel={true} />
          </div>

          {/* Menu items */}
          <div className="py-2">
            <button
              onClick={handleSettings}
              className="w-full text-left px-5 py-2.5 text-sm font-medium text-text-primary hover:bg-background-subtle transition-colors flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-background-subtle group-hover:bg-brand-primary/10 flex items-center justify-center transition-colors">
                <svg
                  className="w-4 h-4 text-text-secondary group-hover:text-brand-primary transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              Settings
            </button>

            <button
              onClick={handleSignOut}
              className="w-full text-left px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-background-subtle group-hover:bg-red-500/10 flex items-center justify-center transition-colors">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              Log out
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
