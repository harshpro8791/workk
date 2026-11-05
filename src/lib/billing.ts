import QRCode from "qrcode";

export type PlanId = "lifetime" | "monthly";

export type PremiumLicense = {
  unlocked: boolean;
  buyerId: string;
  tier: PlanId;
  activatedAt: number;
  expiresAt: number | null;
  code: string;
  source?: "gumroad";
  checkedAt?: number;
};

const STORAGE_KEY = "momentum.premium.v1";
const SECRET = "HARSH_PREMIUM_TRACKER_2026"; // client-side only; good for manual unlock, not bank-grade security.

export const SELLER = {
  name: "Harsh",
  appName: "Premium Habit Tracker",
  upiId: "8791274566@ibl",
  telegramUsername: "trackwithharsh",
  telegramHandle: "@trackwithharsh",
  monthlyPrice: 10,
  lifetimePrice: 49,
  message:
    "Hi Harsh! 👋\nI have completed the payment for the Premium Habit Tracker.\nI have attached my payment screenshot.\nPlease verify my payment and send me the Habit Tracker. Thank you!",
};

export const PLANS: Record<PlanId, { id: PlanId; label: string; price: number; blurb: string; badge?: string }> = {
  lifetime: {
    id: "lifetime",
    label: "Lifetime",
    price: 49,
    blurb: "One-time payment. Full access forever.",
    badge: "Best value",
  },
  monthly: {
    id: "monthly",
    label: "Monthly",
    price: 10,
    blurb: "30 days of premium access.",
  },
};

export function upiLink(plan: PlanId) {
  const item = PLANS[plan];
  const params = new URLSearchParams({
    pa: SELLER.upiId,
    pn: SELLER.name,
    am: String(item.price),
    cu: "INR",
    tn: `${SELLER.appName} ${item.label} plan`,
  });
  return `upi://pay?${params.toString()}`;
}

export async function qrDataUrl(plan: PlanId) {
  return QRCode.toDataURL(upiLink(plan), {
    margin: 1,
    width: 520,
    color: { dark: "#0b0d12", light: "#0000" },
  });
}

export function telegramDraft(extra?: string) {
  const text = `${SELLER.message}${extra ? `\n\n${extra}` : ""}`;
  return `https://t.me/${SELLER.telegramUsername}?text=${encodeURIComponent(text)}`;
}

function hash(input: string) {
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

function makePayload(buyerId: string, tier: PlanId, expiresAt: number | null) {
  return `${buyerId.trim().toLowerCase()}|${tier}|${expiresAt ?? "LIFE"}`;
}

/**
 * Member ID stays human-readable. Access code is derived from buyerId + plan + expiry.
 * This is intentionally manual/offline and can be generated from the script in /scripts.
 */
export function generateCode(buyerId: string, tier: PlanId, expiresAt: number | null) {
  const payload = makePayload(buyerId, tier, expiresAt);
  const sig = hash(`${payload}|${SECRET}`).slice(0, 12);
  const exp = expiresAt ? new Date(expiresAt).toISOString().slice(0, 10).replace(/-/g, "") : "LIFE";
  return `MHP-${tier === "lifetime" ? "L" : "M"}-${exp}-${sig}`;
}

export function validateLicense(buyerId: string, code: string): PremiumLicense | null {
  const clean = code.trim().toUpperCase();
  const m = /^MHP-(L|M)-([0-9]{8}|LIFE)-([A-Z0-9]+)$/.exec(clean);
  if (!m) return null;
  const tier: PlanId = m[1] === "L" ? "lifetime" : "monthly";
  const expiresAt = m[2] === "LIFE" ? null : new Date(
    `${m[2].slice(0, 4)}-${m[2].slice(4, 6)}-${m[2].slice(6, 8)}T23:59:59Z`,
  ).getTime();
  const expected = generateCode(buyerId, tier, expiresAt);
  if (expected !== clean) return null;
  if (expiresAt && expiresAt < Date.now()) return null;
  return {
    unlocked: true,
    buyerId: buyerId.trim(),
    tier,
    activatedAt: Date.now(),
    expiresAt,
    code: clean,
  };
}


// ---------------------------------------------------------------------------
// Gumroad license keys
// ---------------------------------------------------------------------------

/**
 * Gumroad products that unlock the app. Add one entry per product.
 * - lifetime: never expires
 * - monthly:  expires `days` after the sale date
 */
export const GUMROAD_PRODUCTS: { id: string; tier: PlanId; days?: number }[] = [
  { id: "j6Pi2IWsCrvZf65R-CGTzw==", tier: "lifetime" },
  // Monthly product (uncomment and paste its Product ID when you create it):
  // { id: "PASTE_MONTHLY_PRODUCT_ID", tier: "monthly", days: 30 },
];

// One key may be activated on at most this many installs.
const GUMROAD_MAX_USES = 5;
const RECHECK_EVERY_MS = 3 * 24 * 60 * 60 * 1000;

export type GumroadResult =
  | { ok: true; license: PremiumLicense }
  | { ok: false; message: string; network?: boolean };

type GumroadResponse = {
  success?: boolean;
  uses?: number;
  message?: string;
  purchase?: {
    email?: string;
    sale_timestamp?: string;
    refunded?: boolean;
    chargebacked?: boolean;
    disputed?: boolean;
    dispute_won?: boolean;
    subscription_ended_at?: string | null;
    subscription_failed_at?: string | null;
  };
};

// "I" (capital i) and "l" (small L) look alike when copied from a screenshot,
// so we also try the swapped spelling of the product id.
function productIdVariants(id: string) {
  return Array.from(new Set([id, id.replace(/I/g, "l")]));
}

async function callGumroad(productId: string, key: string, increment: boolean): Promise<GumroadResponse | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const body = new URLSearchParams({
      product_id: productId,
      license_key: key,
      increment_uses_count: String(increment),
    });
    const res = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      body,
      signal: ctrl.signal,
    });
    return (await res.json()) as GumroadResponse;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function verifyGumroadKey(rawKey: string, increment = true): Promise<GumroadResult> {
  const key = rawKey.trim();
  if (!key) return { ok: false, message: "Enter your license key" };
  let network = false;
  for (const product of GUMROAD_PRODUCTS) {
    for (const pid of productIdVariants(product.id)) {
      const data = await callGumroad(pid, key, increment);
      if (!data) {
        network = true;
        continue;
      }
      if (!data.success || !data.purchase) continue;
      const pu = data.purchase;
      if (pu.refunded || pu.chargebacked || (pu.disputed && !pu.dispute_won)) {
        return { ok: false, message: "This purchase was refunded or disputed" };
      }
      if (pu.subscription_ended_at || pu.subscription_failed_at) {
        return { ok: false, message: "This subscription has ended" };
      }
      if (increment && (data.uses ?? 0) > GUMROAD_MAX_USES) {
        return { ok: false, message: "This key was already used on too many devices" };
      }
      const sale = pu.sale_timestamp ? Date.parse(pu.sale_timestamp) : Date.now();
      const expiresAt =
        product.tier === "lifetime" ? null : (Number.isFinite(sale) ? sale : Date.now()) + (product.days ?? 30) * 86400000;
      if (expiresAt !== null && expiresAt < Date.now()) {
        return { ok: false, message: "This plan has expired" };
      }
      return {
        ok: true,
        license: {
          unlocked: true,
          buyerId: pu.email || "gumroad",
          tier: product.tier,
          activatedAt: Date.now(),
          expiresAt,
          code: key,
          source: "gumroad",
          checkedAt: Date.now(),
        },
      };
    }
  }
  return network
    ? { ok: false, message: "Can't reach server. Check your internet and try again", network: true }
    : { ok: false, message: "Invalid license key" };
}

/** Quietly re-checks a saved Gumroad license (refund detection). */
export async function recheckGumroad(p: PremiumLicense): Promise<"valid" | "revoked" | "unknown"> {
  if (p.source !== "gumroad") return "valid";
  if (Date.now() - (p.checkedAt ?? 0) < RECHECK_EVERY_MS) return "unknown";
  const res = await verifyGumroadKey(p.code, false);
  if (res.ok) return "valid";
  return res.network ? "unknown" : "revoked";
}

export function savePremium(p: PremiumLicense) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function loadPremium(): PremiumLicense | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PremiumLicense;
    if (!data?.buyerId || !data?.code || !data?.tier) return null;
    if (data.source === "gumroad") {
      return data.expiresAt && data.expiresAt < Date.now() ? null : data;
    }
    const valid = validateLicense(data.buyerId, data.code);
    return valid ? { ...valid, activatedAt: data.activatedAt ?? Date.now() } : null;
  } catch {
    return null;
  }
}

export function clearPremium() {
  localStorage.removeItem(STORAGE_KEY);
}

export function premiumActive(p: PremiumLicense | null) {
  return !!p && (p.expiresAt === null || p.expiresAt > Date.now());
}

export function formatExpiry(p: PremiumLicense | null) {
  if (!p) return "Locked";
  if (p.expiresAt === null) return "Lifetime active";
  return `Active till ${new Date(p.expiresAt).toLocaleDateString()}`;
}
