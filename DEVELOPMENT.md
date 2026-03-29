# Development Guide

This guide covers setup, architecture, and common workflows for the Auto Scheduler.

## Setup

### Prerequisites
- **Node.js 18+**
- **Rust** (via rustup)
- **gws CLI**: `npm install -g @googleworkspace/cli`

### Installation
```bash
npm install
gws config set # Authenticate with Google
```

## Workflows

### Development
- **Desktop App**: `npm run tauri dev` (Full feature set)
- **Web Preview**: `npm run dev` (Mock data mode)

### Testing
- **Run All**: `npm run test`
- **Watch**: `npm run test:watch`
- **Coverage**: `npm run test:coverage`

### Build
- **Desktop**: `npm run tauri build`
- **Web**: `npm run build`

## Architecture

### Data Model
- **Habits**: Stored in local SQLite (`autoscheduler.sqlite`). Defines recurring time windows and priorities.
- **Events**: Synced with Google Calendar. Auto-scheduled habits are tagged in the description: `[AUTO:habit_id:priority]`.

### Core Components
- `lib/scheduler.ts`: The priority-based packing algorithm.
- `src-tauri/src/main.rs`: Rust backend handling SQLite and `gws` CLI execution.
- `lib/tauri-commands.ts`: Type-safe bridge between Frontend and Rust.

## Database Schema
```sql
CREATE TABLE habits (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    duration INTEGER NOT NULL,
    priority TEXT NOT NULL, -- critical, high, medium, low
    start TEXT NOT NULL,    -- HH:mm
    end TEXT NOT NULL       -- HH:mm
);
```

## Common Commands Reference

| Task | Command |
| :--- | :--- |
| **Reset DB** | `rm autoscheduler.sqlite` |
| **Type Check** | `npx tsc --noEmit` |
| **Lint** | `npm run lint` |
| **Clean** | `npm run clean` |

## Troubleshooting
- **Sync Issues**: Verify `gws config list` shows active authentication.
- **Test Failures**: Ensure `node_modules` are up to date and no stale `.cache` exists.
- **Port Conflicts**: If 3000 is busy, use `npm run dev -- -p 3001`.