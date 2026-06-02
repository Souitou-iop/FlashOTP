# Security Integrity Review - 2026-06-03

## Executive Summary

Scope reviewed: `mfa-manager`, a static-exported Next.js/React/TypeScript MFA QR and temporary TOTP manager.

The project builds successfully and I did not find obvious attacker-controlled raw HTML sinks, dynamic code execution, committed secret files, remote third-party scripts, API routes, cookies, or server-side auth surfaces in the app code. The main integrity/security concerns are around how highly sensitive MFA seeds are persisted/exported in the browser, dependency advisory exposure, and missing defense-in-depth headers for a static app.

## High Severity

### H-1: MFA seeds are persisted in browser localStorage without encryption or integrity protection

- Rule ID: REACT-STORAGE / sensitive client storage
- Location: `lib/useLocalStorage.ts:12`, `lib/useLocalStorage.ts:29`; used by `components/TempMfaPanel.tsx:17`
- Evidence:
  - `localStorage.getItem(key)`
  - `localStorage.setItem(key, JSON.stringify(valueToStore))`
  - `useLocalStorage<TempMfaEntry[]>("temp-mfa-entries", [])`
- Impact: Any script that runs in this origin, browser extension with sufficient access, shared-machine user, or local malware can read or modify saved MFA seeds. Modification is also an integrity issue: a tampered saved secret can cause generated TOTP codes or exported QR codes to no longer match the user's real account setup.
- Fix: For the safest default, avoid persistence for MFA seeds and keep temporary entries in memory only. If persistence is required, gate it behind an explicit user action and encrypt the serialized entries with WebCrypto using a passphrase-derived key. Add an authenticated mode such as AES-GCM so tampering is detected on load.
- Mitigation: Show persistent-storage status clearly in the UI, provide a one-click wipe, and document that localStorage is not a secure vault.
- False positive notes: This may be an intentional product feature, but the current app name/description says "临时管理 MFA" while the implementation persists seeds until explicit deletion.

## Medium Severity

### M-1: Production dependency audit reports a moderate PostCSS XSS advisory through Next.js

- Rule ID: NEXT-SUPPLY-001
- Location: `package.json:14`; dependency tree from `npm ls next postcss --all`
- Evidence:
  - Direct dependency: `next: "16.2.7"`
  - `npm audit --omit=dev --json` reports `postcss` advisory `GHSA-qx2v-qp2m-jg93` through `next/node_modules/postcss@8.4.31`, affecting `<8.5.10`.
- Impact: If attacker-controlled CSS is processed/stringified by the vulnerable PostCSS path, it can produce XSS via unescaped `</style>`. I did not find user-controlled CSS processing in this app, so this is supply-chain exposure rather than a proven reachable exploit.
- Fix: Upgrade Next.js when a patched release updates its bundled PostCSS, or track the upstream Next.js advisory/fix. Do not apply the audit-suggested downgrade to `next@9.3.3`; that is not a safe fix.
- Mitigation: Keep dependency update checks in CI and avoid adding any feature that processes user-supplied CSS until this dependency path is patched.
- False positive notes: `@tailwindcss/postcss` uses `postcss@8.5.15`, which is patched; the advisory is specifically from Next's nested PostCSS.

### M-2: No app-level security headers are visible for the static export

- Rule ID: REACT-CSP / browser-enforced protections
- Location: `next.config.ts:3`, generated `out/index.html`
- Evidence:
  - `next.config.ts` only sets `output: "export"` and `images.unoptimized`.
  - No visible CSP, `frame-ancestors` / `X-Frame-Options`, `X-Content-Type-Options`, or `Referrer-Policy` configuration exists in repo app code.
- Impact: If the app is hosted without equivalent edge headers, there is less defense-in-depth against XSS, clickjacking, MIME confusion, and referrer leakage. This matters more because the app handles MFA seeds and QR contents entirely in the browser.
- Fix: Configure headers at the static host/CDN. For example, add a strict CSP compatible with the generated Next static assets, `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, and a restrictive `Referrer-Policy`.
- Mitigation: If the host cannot set headers, a limited CSP meta tag can help for some directives, but it cannot enforce `frame-ancestors`.
- False positive notes: Headers may be configured outside the repository. Verify at runtime with `curl -I <deployed-url>`.

### M-3: CSV export does not escape formula-injection prefixes or embedded quotes/newlines

- Rule ID: JS-DATA-EXPORT-001
- Location: `components/TempMfaPanel.tsx:255-262`
- Evidence:
  - `const header = "Issuer,Name,Secret,Algorithm,Digits,Period,URI"`
  - `return "\"${entry.issuer}\",\"${entry.name}\",\"${entry.secret}\",..."`
- Impact: If an imported/scanned issuer or account name starts with characters such as `=`, `+`, `-`, or `@`, opening the exported CSV in spreadsheet software can interpret it as a formula. Embedded quotes/newlines can also corrupt CSV structure. This is a data integrity issue and can become a local exfiltration vector depending on spreadsheet settings.
- Fix: Centralize CSV escaping: double embedded quotes, preserve newlines safely, and prefix formula-like cell values with a single quote or tab before export.
- Mitigation: Prefer JSON/URI export for sensitive backups until CSV escaping is fixed.
- False positive notes: Exploitability depends on the user opening the CSV in formula-evaluating spreadsheet software.

## Low Severity

### L-1: Static service worker caches the app shell on a sensitive tool

- Rule ID: REACT-PWA-001
- Location: `app/layout.tsx:57-69`, `public/sw.js:1-84`
- Evidence:
  - The layout registers `/sw.js` via inline script.
  - The service worker uses `CACHE_NAME = "flashotp-v2"` and caches `/`, static assets, and successful page responses.
- Impact: I did not find evidence that runtime MFA entries are cached in Cache Storage, because secrets are stored in localStorage and rendered client-side. However, service workers are powerful origin-level proxies and can complicate incident response/update behavior for an app handling MFA material.
- Fix: If offline capability is not a core requirement, remove service worker registration. If it is required, keep cache scope minimal, avoid caching navigations that might ever include sensitive rendered state, and provide a clear update/wipe flow.
- Mitigation: Add documentation telling users to clear site data after sensitive use.
- False positive notes: Current implementation does not appear to cache uploaded backup file contents or generated QR image blobs.

### L-2: PWA manifest references missing PNG icons

- Rule ID: APP-INTEGRITY-001
- Location: `public/manifest.json:10-22`, `public/`
- Evidence:
  - Manifest references `/icon-192.png` and `/icon-512.png`.
  - Existing public assets include `icon-192.svg`, but no matching PNG icons.
- Impact: Installability and PWA presentation may fail or degrade. This is not a direct security vulnerability, but it is an application integrity issue.
- Fix: Add the referenced PNG icons or update the manifest to reference existing assets supported by target browsers.
- Mitigation: Keep manifest validation in release checks.
- False positive notes: Some browsers may tolerate missing icons, but the manifest is still inconsistent.

## Positive Findings

- `npm run build` passed with TypeScript checks.
- No `.env`, private key, or obvious committed secret files were found under the reviewed project files.
- No app API routes, server actions, cookies, auth/session code, database access, shell execution, SSRF fetchers, or CORS surfaces were found.
- No attacker-controlled `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write`, `postMessage`, or unsafe redirect handling was found in source.
- Imported issuer/name values are rendered via React JSX interpolation, which escapes text by default.
- The file-import mode keeps imported backup entries in React state and provides a reset; it does not use the `temp-mfa-entries` persistent localStorage path.

## Verification

- `npm run build` passed.
- `npm audit --omit=dev --json` completed and reported 2 moderate production advisories.
- `npm ls next postcss --all` confirmed Next's nested `postcss@8.4.31` and Tailwind's patched `postcss@8.5.15`.
- `rg` pattern review checked for high-risk browser sinks, env exposure, storage, service worker/cache use, and MFA secret export paths.

## Residual Risk

- Runtime hosting headers were not verified because no deployed URL was provided.
- CodeGraph is not initialized for this project, so structural review used source reads and literal pattern search instead.
- This report does not include dynamic browser testing of clipboard/camera permission flows.
