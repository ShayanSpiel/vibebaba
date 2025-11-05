"use client";

import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'chat' | 'code' | 'preview' | 'database';
}

// Base skeleton with shimmer animation
export function Skeleton({ className = "", variant = "default" }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative overflow-hidden bg-background-subtle rounded ${className}`}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </motion.div>
  );
}

// Chat skeleton - mimics chat bubbles
export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* User message (right side) */}
      <div className="flex justify-end">
        <Skeleton className="h-16 w-3/4 rounded-2xl" />
      </div>

      {/* Assistant message (left side) */}
      <div className="flex justify-start">
        <Skeleton className="h-24 w-5/6 rounded-2xl" />
      </div>

      {/* User message (right side) */}
      <div className="flex justify-end">
        <Skeleton className="h-12 w-2/3 rounded-2xl" />
      </div>

      {/* Assistant message (left side) - loading */}
      <div className="flex justify-start items-start gap-2">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

// Code skeleton - mimics code lines
export function CodeSkeleton() {
  return (
    <div className="space-y-2 p-4 bg-background-base rounded-lg">
      <Skeleton className="h-4 w-16" /> {/* Line number */}
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-4/5" />
      <div className="h-4" /> {/* Empty line */}
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

// Preview skeleton - mimics browser/app preview
export function PreviewSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 pb-4 border-b border-light">
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-8 flex-1 ml-4 rounded-lg" />
      </div>

      {/* Hero section */}
      <div className="space-y-4">
        <Skeleton className="h-12 w-3/4 mx-auto" />
        <Skeleton className="h-6 w-2/3 mx-auto" />
        <Skeleton className="h-10 w-40 mx-auto rounded-lg" />
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-3 gap-4 pt-8">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>

      {/* Content sections */}
      <div className="space-y-3 pt-8">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-10/12" />
      </div>
    </div>
  );
}

// Database skeleton - mimics table rows
export function DatabaseSkeleton() {
  return (
    <div className="space-y-2">
      {/* Table header */}
      <div className="flex gap-4 pb-2 border-b-2 border-light">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Table rows */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 py-2 border-b border-light">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
  );
}

// Page skeleton - full page loading
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background-base p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>

        {/* Main content */}
        <div className="col-span-2 space-y-6">
          <Skeleton className="h-96 rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact skeleton for small UI elements
export function CompactSkeleton({ width = "w-full", height = "h-4" }: { width?: string; height?: string }) {
  return <Skeleton className={`${width} ${height}`} />;
}
