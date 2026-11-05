import { useCallback, useEffect, useState } from "react";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

/** Draws the app icon on a canvas so no external asset files are needed. */
export function makeIconDataUrl(size: number, accent: string, maskable = false): string {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return "";

  const pad = maskable ? size * 0.12 : 0;
  const r = maskable ? size * 0.5 : size * 0.22;

  // background
  ctx.fillStyle = "#0b0d12";
  ctx.fillRect(0, 0, size, size);

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, accent);
  grad.addColorStop(1, "#0e1220");
  ctx.fillStyle = grad;
  roundRect(ctx, 0, 0, size, size, r);
  ctx.fill();

  // glow
  const glow = ctx.createRadialGradient(
    size * 0.3,
    size * 0.25,
    size * 0.02,
    size * 0.3,
    size * 0.25,
    size * 0.7,
  );
  glow.addColorStop(0, "rgba(255,255,255,0.42)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  roundRect(ctx, 0, 0, size, size, r);
  ctx.fill();

  // bolt mark
  const s = (size - pad * 2) / 100;
  ctx.save();
  ctx.translate(pad, pad);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(58, 8);
  ctx.lineTo(24, 56);
  ctx.lineTo(46, 56);
  ctx.lineTo(40, 92);
  ctx.lineTo(78, 40);
  ctx.lineTo(54, 40);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.restore();

  return c.toDataURL("image/png");
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

let manifestUrl: string | null = null;

/** Builds + injects a Web App Manifest (and icons) at runtime. */
export function installManifest(accent: string, theme: string) {
  try {
    const icon192 = makeIconDataUrl(192, accent);
    const icon512 = makeIconDataUrl(512, accent);
    const maskable = makeIconDataUrl(512, accent, true);

    const manifest = {
      name: "Momentum — Habits & Focus",
      short_name: "Momentum",
      description:
        "Build habits, keep streaks alive and run focus sessions. Works offline on your Android home screen.",
      start_url: ".",
      scope: ".",
      display: "standalone",
      orientation: "portrait",
      background_color: theme,
      theme_color: theme,
      categories: ["productivity", "lifestyle", "health"],
      icons: [
        { src: icon192, sizes: "192x192", type: "image/png", purpose: "any" },
        { src: icon512, sizes: "512x512", type: "image/png", purpose: "any" },
        { src: maskable, sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
      shortcuts: [
        { name: "Start focus session", short_name: "Focus", url: "?screen=focus" },
        { name: "Today's habits", short_name: "Today", url: "?screen=today" },
      ],
    };

    const blob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" });
    const url = URL.createObjectURL(blob);

    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "manifest";
      document.head.appendChild(link);
    }
    link.href = url;
    if (manifestUrl) URL.revokeObjectURL(manifestUrl);
    manifestUrl = url;

    let apple = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (!apple) {
      apple = document.createElement("link");
      apple.rel = "apple-touch-icon";
      document.head.appendChild(apple);
    }
    apple.href = icon192;

    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.href = icon192;

    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = theme;
  } catch {
    /* canvas/blob unavailable — install just won't be offered */
  }
}

/** True when running inside a packaged app (Capacitor APK / AAB). */
export function isNative(): boolean {
  const c = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; platform?: string } })
    .Capacitor;
  if (!c) return false;
  if (typeof c.isNativePlatform === "function") return c.isNativePlatform();
  return c.platform !== "web";
}

export function isStandalone(): boolean {
  return (
    isNative() ||
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

export function isTouchPhone(): boolean {
  return (
    /android|iphone|ipod/i.test(navigator.userAgent) ||
    (window.matchMedia?.("(pointer: coarse)").matches && window.innerWidth < 820)
  );
}

export function usePwa() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [standalone, setStandalone] = useState(() => isStandalone());

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const mq = window.matchMedia?.("(display-mode: standalone)");
    const onMode = () => setStandalone(isStandalone());
    mq?.addEventListener?.("change", onMode);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      mq?.removeEventListener?.("change", onMode);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return "unavailable" as const;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferred(null);
    return choice.outcome;
  }, [deferred]);

  return {
    canInstall: !!deferred,
    install,
    installed,
    standalone,
    android: isAndroid(),
  };
}
