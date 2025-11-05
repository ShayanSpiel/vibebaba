# Development Server Guide

## Server is Now Running Consistently

Your development server is now configured with **nodemon** for automatic restart on file changes. It's currently running on **http://localhost:3003**

## What Was Fixed

### Problems Identified:
1. Multiple orphaned Next.js processes causing port conflicts
2. No auto-restart mechanism when files changed
3. Server crashes required manual intervention
4. No process management tool

### Solutions Implemented:
1. **Nodemon** installed for automatic process management
2. **Custom configuration** ([nodemon.json](nodemon.json)) to watch relevant files
3. **Cleanup script** ([scripts/clean-dev.sh](scripts/clean-dev.sh)) to kill orphaned processes
4. **New npm scripts** for better control

---

## How to Use

### Starting the Server

```bash
# Recommended: Start with nodemon (auto-restart enabled)
npm run dev

# Alternative: Direct Next.js (no auto-restart)
npm run dev:direct

# Clean start: Kill old processes first
npm run dev:clean
```

### Managing Processes

```bash
# Kill all orphaned dev processes
npm run kill:dev

# Or manually
ps aux | grep "next dev" | grep -v grep | awk '{print $2}' | xargs kill -9
```

### Port Management

If port 3000 is already in use, Next.js will automatically use the next available port (3001, 3002, 3003, etc.).

Check the console output to see which port is being used:
```
✓ Ready in 10.1s
- Local:        http://localhost:3003
```

---

## How Nodemon Works

Nodemon watches your files and automatically restarts the server when changes are detected.

### Configuration ([nodemon.json](nodemon.json))

**Watched directories:**
- `app/**/*`
- `components/**/*`
- `lib/**/*`
- `public/**/*`
- `styles/**/*`
- `.env` and `.env.local`

**Watched file types:**
- `.js`, `.jsx`, `.ts`, `.tsx`
- `.json`, `.css`, `.scss`

**Ignored directories:**
- `.next/**/*` (build output)
- `node_modules/**/*`
- `.git/**/*`
- `scripts/**/*`

**Restart delay:** 1 second (prevents multiple restarts from rapid file changes)

---

## Why Changes No Longer Break the Server

### Before:
- File changes could crash the server
- TypeScript errors would stop the server
- Configuration changes required manual restart
- Orphaned processes caused conflicts

### After:
- **Nodemon automatically restarts** on file changes
- **1-second delay** prevents restart storms
- **Process management** handles crashes gracefully
- **Cleanup scripts** prevent port conflicts

---

## Troubleshooting

### Server Won't Start

```bash
# 1. Kill all processes
npm run kill:dev

# 2. Clear Next.js cache
rm -rf .next

# 3. Start fresh
npm run dev
```

### Port Already in Use

Nodemon will automatically find an available port. Check the console for:
```
⚠ Port 3000 is in use, using available port 3003 instead.
```

### Manual Restart

If you need to manually restart the server while it's running with nodemon:
1. Type `rs` in the terminal where nodemon is running
2. Or press `Ctrl+C` and run `npm run dev` again

### Server Keeps Crashing

Check the logs for errors:
```bash
# If running in background
tail -f /tmp/dev-server.log

# Look for TypeScript or dependency errors
```

---

## Best Practices

1. **Always use `npm run dev`** instead of `next dev` directly
2. **Don't run multiple dev servers** at the same time
3. **Use `npm run kill:dev`** if you see "port in use" errors
4. **Watch the console** for the actual port being used
5. **Wait for "Ready in X.Xs"** message before testing

---

## Technical Details

### Why Nodemon vs PM2?

- **Nodemon**: Lightweight, perfect for development, auto-restart on file changes
- **PM2**: Heavy, production-focused, overkill for local development

### File Watcher Limits

If you see "too many files" errors:

**macOS:**
```bash
ulimit -n 10240
```

**Linux:**
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start with nodemon (recommended) |
| `npm run dev:direct` | Start without nodemon |
| `npm run dev:clean` | Clean start with process cleanup |
| `npm run kill:dev` | Kill all dev processes |
| `rs` (in nodemon) | Manual restart |
| `Ctrl+C` | Stop server |

---

## Current Status

✅ Server is running on http://localhost:3003
✅ Nodemon is monitoring 233 files
✅ Auto-restart enabled
✅ Ready for development

**You can now make code changes without worrying about the server crashing!**
