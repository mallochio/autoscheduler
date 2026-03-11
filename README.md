# Auto Google Calendar Scheduler

> ⚠️ **Work in Progress** — This project is under active development and not yet feature-complete.

A local-first, auto-scheduling calendar application built with Tauri, Next.js, and Rust. It integrates directly with Google Workspace (via the `gws` CLI) to manage your events and automatically schedules habits into your free time.

## Prerequisites

- [Node.js](https://nodejs.org/)
- [Rust](https://rustup.rs/)
- `gws` CLI installed and authenticated (`npm install -g @googleworkspace/cli`)

## Development

```bash
npm install
npm run tauri dev
```

## Build

```bash
npm run tauri build
```
