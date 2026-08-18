# Security & Automation Documentation for Jarida Live

## Overview
This document outlines the security policies, environment variable management, and automated sync configuration for **Jarida Live**.

## 1. Security & Secrets Management
- **Never commit secrets:** Passwords, database URLs with plaintext credentials, and API keys must never be committed to the Git repository.
- **Environment Variables:** All secure tokens are injected at runtime via Manus or Vercel Environment Variables configuration.
- **Token Protection:** Git operations use token-authenticated HTTPS/SSH credentials managed securely in the sandbox environment without exposing them in codebase files.

## 2. Automated Daily Sync & Deployment Workflow
1. **Trigger:** The automated script (`pnpm auto:sync`) or GitHub Actions / Vercel Cron triggers the daily update.
2. **Verification:** The script runs `pnpm check` to ensure TypeScript compilation succeeds.
3. **Data Pulse:** Updates `.daily-edition-sync` with the latest ISO timestamp.
4. **Git Commit & Push:** Changes are staged, committed with a structured message (`chore(edition): ...`), and pushed to `origin/main`.
5. **Vercel Production Deploy:** Vercel automatically detects the new commit on `main` and builds/deploys the production site (`jarida-live.vercel.app`).
