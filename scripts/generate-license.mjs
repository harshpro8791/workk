#!/usr/bin/env node
/**
 * Generate manual access codes for buyers.
 *
 * Usage:
 *   node scripts/generate-license.mjs lifetime buyer123
 *   node scripts/generate-license.mjs monthly buyer123 2026-12-31
 *
 * If monthly expiry date is omitted, +30 days is used.
 */

const SECRET = "HARSH_PREMIUM_TRACKER_2026";

function hash(input) {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0, ch; i < input.length; i++) {
    ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36).toUpperCase();
}

function generateCode(buyerId, tier, expiresAt) {
  const payload = `${buyerId.trim().toLowerCase()}|${tier}|${expiresAt ?? "LIFE"}`;
  const sig = hash(`${payload}|${SECRET}`).slice(0, 12);
  const exp = expiresAt ? new Date(expiresAt).toISOString().slice(0, 10).replace(/-/g, "") : "LIFE";
  return `MHP-${tier === "lifetime" ? "L" : "M"}-${exp}-${sig}`;
}

const [, , tierArg, buyerId, expiryArg] = process.argv;
if (!buyerId || !["lifetime", "monthly"].includes(String(tierArg))) {
  console.log("Usage:");
  console.log("  node scripts/generate-license.mjs lifetime buyer123");
  console.log("  node scripts/generate-license.mjs monthly buyer123 2026-12-31");
  process.exit(1);
}

let expiresAt = null;
if (tierArg === "monthly") {
  if (expiryArg) {
    expiresAt = new Date(`${expiryArg}T23:59:59Z`).getTime();
  } else {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 30);
    d.setUTCHours(23, 59, 59, 0);
    expiresAt = d.getTime();
  }
}

const code = generateCode(buyerId, tierArg, expiresAt);
console.log("\nBuyer ID:", buyerId);
console.log("Plan:", tierArg);
console.log("Access Code:", code);
if (expiresAt) console.log("Expires:", new Date(expiresAt).toLocaleString());
console.log("\nSend these 2 things to the buyer:");
console.log(`  ID: ${buyerId}`);
console.log(`  PASS: ${code}`);
