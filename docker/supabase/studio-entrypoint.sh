#!/bin/sh
# =============================================================================
# Studio v2026 self-hosted patch
# =============================================================================
# Problem: Studio v2026 browser-side JS throws an error before sending any
# request to /platform/pg-meta/ unless the project has a non-empty
# `connectionString` (used as x-connection-encrypted header).
# The self-hosted project API always returns connectionString: "" by default.
#
# Fix: Patch the compiled Next.js chunks at startup to inject an AES-encrypted
# connection string. The server-side proxy at /api/platform/pg-meta/ passes
# this header to supabase-meta, which ignores it and uses its own env vars
# (PG_META_DB_*). The value only needs to be truthy on the client side.
# =============================================================================

set -e

echo "[studio-patch] Patching connectionString in Next.js chunks..."

node - <<'EOF'
const fs = require("fs");
const path = require("path");

// Generate encrypted connection string (any truthy value works client-side)
let connStr = "";
try {
  const CryptoJS = require(
    "/app/node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js"
  );
  const pgConn =
    "postgresql://" +
    (process.env.POSTGRES_USER_READ_WRITE || "supabase_admin") +
    ":" +
    (process.env.POSTGRES_PASSWORD || "postgres") +
    "@" +
    (process.env.POSTGRES_HOST || "db") +
    ":" +
    (process.env.POSTGRES_PORT || "5432") +
    "/" +
    (process.env.POSTGRES_DB || "postgres");
  connStr = CryptoJS.AES.encrypt(
    pgConn,
    process.env.PG_META_CRYPTO_KEY || "SAMPLE_KEY"
  ).toString();
  console.log("[studio-patch] Generated encrypted connection string");
} catch (e) {
  // Fallback: a short dummy encrypted-looking string
  connStr = "U2FsdGVkX1" + Date.now().toString(36);
  console.warn("[studio-patch] crypto-js not found, using fallback token:", e.message);
}

// Escape the encrypted string for JSON (it may contain +, /, =)
const safeConnStr = connStr.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

// Patch all compiled chunk files that contain connectionString:""
// Must patch BOTH server chunks (SSR) and static chunks (browser bundles)
const chunkDirs = [
  "/app/apps/studio/.next/server/chunks",
  "/app/apps/studio/.next/static/chunks",
];
let patched = 0;
for (const chunkDir of chunkDirs) {
  let entries;
  try {
    entries = fs.readdirSync(chunkDir, { withFileTypes: true });
  } catch (e) {
    console.warn("[studio-patch] Directory not found, skipping:", chunkDir);
    continue;
  }
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
    const fullPath = path.join(chunkDir, entry.name);
    const before = fs.readFileSync(fullPath, "utf8");
    const after = before.replaceAll(
      'connectionString:""',
      `connectionString:"${safeConnStr}"`
    );
    if (after !== before) {
      fs.writeFileSync(fullPath, after);
      patched++;
      console.log("[studio-patch] Patched:", entry.name);
    }
  }
}
console.log(`[studio-patch] Done — ${patched} file(s) patched.`);
EOF

echo "[studio-patch] Starting Studio..."
exec node apps/studio/server.js
