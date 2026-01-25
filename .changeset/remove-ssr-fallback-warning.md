---
"@data-client/react": patch
---

Remove misleading 'Uncaught Suspense' warning in SSRDataProvider

The SSRDataProvider now uses `null` instead of `BackupLoading` as the Suspense fallback. This prevents the confusing "Uncaught Suspense" development warning from appearing during normal Next.js server-side rendering, where suspense is expected behavior.
