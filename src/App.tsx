import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import BottomNav, { type TabId } from "@/components/BottomNav";
import CelebrationLayer, { confetti, levelUp } from "@/components/effects";
import HabitEditor from "@/components/HabitEditor";
import PhoneFrame from "@/components/PhoneFrame";
import PremiumGate from "@/components/PremiumGate";
import StatusBar from "@/components/StatusBar";
import { Icon } from "@/components/ui";
import {
  clearPremium,
  loadPremium,
  premiumActive,
  recheckGumroad,
  savePremium,
  validateLicense,
  verifyGumroadKey,
  type PremiumLicense,
} from "@/lib/billing";
import { StoreProvider, useStore, useGamification } from "@/lib/store";
import { installManifest, isNative, isTouchPhone, usePwa } from "@/lib/pwa";
import { hexToRgba } from "@/lib/accents";
import type { Habit } from "@/lib/types";
import TodayScreen from "@/screens/TodayScreen";
import HabitsScreen from "@/screens/HabitsScreen";
import FocusScreen from "@/screens/FocusScreen";
import StatsScreen from "@/screens/StatsScreen";
import SettingsScreen from "@/screens/SettingsScreen";

function AppInner() {
  const { state } = useStore();
  const { accent, theme } = state.settings;
  const pwa = usePwa();
  const [premium, setPremium] = useState<PremiumLicense | null>(() => loadPremium());
  const isPremium = premiumActive(premium);

  const unlockPremium = (buyerId: string, code: string) => {
    const valid = validateLicense(buyerId, code);
    if (!valid) return false;
    savePremium(valid);
    setPremium(valid);
    return true;
  };

  const resetPremium = () => {
    clearPremium();
    setPremium(null);
  };

  const unlockGumroad = async (key: string) => {
    const res = await verifyGumroadKey(key);
    if (res.ok) {
      savePremium(res.license);
      setPremium(res.license);
    }
    return res;
  };

  // Quietly re-check Gumroad licenses every few days so refunded keys stop working.
  useEffect(() => {
    if (!premium || premium.source !== "gumroad") return;
    let cancelled = false;
    void recheckGumroad(premium).then((r) => {
      if (cancelled) return;
      if (r === "revoked") {
        clearPremium();
        setPremium(null);
      } else if (r === "valid") {
        const next = { ...premium, checkedAt: Date.now() };
        savePremium(next);
        setPremium(next);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [premium?.code]);

  const initialTab = useMemo<TabId>(() => {
    const q = new URLSearchParams(location.search).get("screen");
    const valid: TabId[] = ["today", "habits", "focus", "stats", "settings"];
    return valid.includes(q as TabId) ? (q as TabId) : "today";
  }, []);

  const [tab, setTab] = useState<TabId>(initialTab);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [bannerHidden, setBannerHidden] = useState(false);
  const game = useGamification();
  const prevLevel = useRef(game.level);
  useEffect(() => {
    if (game.level > prevLevel.current && prevLevel.current > 0) {
      levelUp(game.level, game.title);
      confetti(150, [accent, "#ffffff", "#ffc247"]);
    }
    prevLevel.current = game.level;
  }, [game.level, game.title, accent]);

  const [framed, setFramed] = useState(() => {
    if (isNative()) return false;
    return !isTouchPhone() && window.innerWidth >= 1000 && !window.matchMedia("(display-mode: standalone)").matches;
  });

  useEffect(() => {
    const onResize = () =>
      setFramed(!isNative() && !isTouchPhone() && window.innerWidth >= 1000 && !pwa.standalone);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pwa.standalone]);

  // Rebuild the manifest + launcher icon whenever the theme changes.
  useEffect(() => {
    const bg = theme === "dark" ? "#0b0d12" : "#f2f3f8";
    installManifest(accent, bg);
    document.documentElement.setAttribute("data-theme", theme);
    document.body.style.background = framed ? "#05070c" : bg;
  }, [accent, theme, framed]);

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (h: Habit) => {
    setEditing(h);
    setEditorOpen(true);
  };

  const screen = (() => {
    switch (tab) {
      case "today":
        return <TodayScreen onAdd={openNew} />;
      case "habits":
        return <HabitsScreen onAdd={openNew} onEdit={openEdit} />;
      case "focus":
        return <FocusScreen />;
      case "stats":
        return <StatsScreen />;
      case "settings":
        return (
          <SettingsScreen
            canInstall={pwa.canInstall}
            standalone={pwa.standalone}
            onInstall={() => void pwa.install()}
            premium={premium}
            onResetLicense={resetPremium}
          />
        );
    }
  })();

  const showBanner = pwa.canInstall && !pwa.standalone && !bannerHidden && !framed;

  const lockedApp = (
    <div
      data-theme={theme}
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={
        {
          "--accent": accent,
          "--accent-soft": hexToRgba(accent, 0.18),
          background: "var(--bg)",
          color: "var(--text)",
        } as CSSProperties
      }
    >
      {framed && <StatusBar />}
      {!framed && <div style={{ height: "env(safe-area-inset-top)" }} />}
      <main className="relative flex-1 overflow-y-auto">
        <PremiumGate
          accent={accent}
          premium={premium}
          onUnlock={unlockPremium}
          onUnlockGumroad={unlockGumroad}
          onReset={resetPremium}
          validate={validateLicense}
        />
      </main>
      <CelebrationLayer accent={accent} />
      {framed && (
        <div className="pointer-events-none absolute bottom-1.5 left-1/2 z-40 h-1 w-28 -translate-x-1/2 rounded-full bg-white/30" />
      )}
    </div>
  );

  if (!isPremium) {
    if (!framed) return <div className="h-full w-full">{lockedApp}</div>;
    return (
      <PhoneFrame accent={accent} canInstall={pwa.canInstall} onInstall={() => void pwa.install()}>
        {lockedApp}
      </PhoneFrame>
    );
  }

  const app = (
    <div
      data-theme={theme}
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={
        {
          "--accent": accent,
          "--accent-soft": hexToRgba(accent, 0.18),
          background: "var(--bg)",
          color: "var(--text)",
        } as CSSProperties
      }
    >
      {framed && <StatusBar />}
      {!framed && <div style={{ height: "env(safe-area-inset-top)" }} />}

      <main className="app-scroll no-scrollbar relative flex-1 overflow-y-auto">
        <div key={tab} className="anim-spring mx-auto min-h-full w-full max-w-[560px]">
          {screen}
        </div>
      </main>

      {showBanner && (
        <div className="anim-fade-up px-3 pb-2">
          <div
            className="flex items-center gap-3 rounded-2xl border p-3"
            style={{
              background: `linear-gradient(120deg, ${hexToRgba(accent, 0.28)}, var(--surface) 70%)`,
              borderColor: hexToRgba(accent, 0.4),
            }}
          >
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
              style={{ background: accent, color: "#fff" }}
            >
              <Icon name="install" size={19} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Install Momentum</p>
              <p className="truncate text-xs" style={{ color: "var(--muted)" }}>
                Add it to your home screen
              </p>
            </div>
            <button
              onClick={() => void pwa.install()}
              className="press rounded-full px-4 py-2 text-xs font-bold"
              style={{ background: accent, color: "#fff" }}
            >
              Install
            </button>
            <button
              onClick={() => setBannerHidden(true)}
              className="press p-1"
              style={{ color: "var(--muted)" }}
              aria-label="Dismiss"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>
      )}

      <BottomNav active={tab} onChange={setTab} accent={accent} />

      <CelebrationLayer accent={accent} />

      <HabitEditor open={editorOpen} habit={editing} onClose={() => setEditorOpen(false)} />

      {framed && (
        <div className="pointer-events-none absolute bottom-1.5 left-1/2 z-40 h-1 w-28 -translate-x-1/2 rounded-full bg-white/30" />
      )}
    </div>
  );

  if (!framed) return <div className="h-full w-full">{app}</div>;

  return (
    <PhoneFrame accent={accent} canInstall={pwa.canInstall} onInstall={() => void pwa.install()}>
      {app}
    </PhoneFrame>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  );
}
