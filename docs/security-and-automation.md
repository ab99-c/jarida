# Security & Automation Documentation for Jarida Live

## Overview
This document outlines the security policies, environment variable management, and automated sync configuration for **Jarida Live**.

## 1. Security & Secrets Management
- **Never commit secrets:** Passwords, database URLs with plaintext credentials, and API keys must never be committed to the Git repository.
- **Environment Variables:** All secure tokens are injected at runtime via Manus or Vercel Environment Variables configuration.
- **Token Protection:** Git operations use token-authenticated HTTPS/SSH credentials managed securely in the sandbox environment without exposing them in codebase files.

## 2. Automated Daily News Collection & Archive
1. **Trigger:** `.github/workflows/daily-sync.yml` runs every day at 06:00 UTC (07:00 in Morocco during winter), or manually from GitHub Actions.
2. **Collection:** `pnpm auto:sync` runs `pnpm check`, then calls the deployed `jarida.refreshFeed` endpoint. The server reads the configured RSS feeds, validates and deduplicates stories, and stores new articles in the database.
3. **Failure handling:** The run fails if the endpoint is unavailable or every RSS feed fails. A run with zero new stories is successful when at least one feed was read successfully.
4. **Archive:** Stored articles remain in the database. The edition API returns up to the latest 1,000 stories, and the archive groups those stories by publication date. The bundled sample stories are used only when no live/database stories are available.
5. **Deployment record:** `.daily-edition-sync` records the successful run time, number of new stories, and number of feeds reached. The workflow commits and pushes that record to `origin/main`, triggering the configured Vercel deployment.

Set the repository Actions variable `JARIDA_APP_URL` when the production app uses a different host. It defaults to `https://jarida-tan.vercel.app`.
