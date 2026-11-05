import { useRef, useState } from "react";
import { Card, Icon, SectionTitle, Switch } from "@/components/ui";
import { useStore } from "@/lib/store";
import { ACCENTS, hexToRgba } from "@/lib/accents";
import { formatExpiry, premiumActive, type PremiumLicense } from "@/lib/billing";
import { isNative } from "@/lib/pwa";
import type { AppState } from "@/lib/types";
import { cn } from "@/utils/cn";

const native = isNative();

export default function SettingsScreen({
  canInstall,
  standalone,
  onInstall,
  premium,
  onResetLicense,
}: {
  canInstall: boolean;
  standalone: boolean;
  onInstall: () => void;
  premium: PremiumLicense | null;
  onResetLicense: () => void;
}) {
  const { state, updateSettings, resetAll, importState, buzz } = useStore();
  const accent = state.settings.accent;
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [copied, setCopied] = useState(false);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `momentum-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    buzz(12);
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importState(JSON.parse(String(reader.result)) as AppState);
        buzz([12, 30, 12]);
      } catch {
        alert("That file could not be read.");
      }
    };
    reader.readAsText(file);
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Momentum",
          text: "Track habits and focus sessions — installs straight to your Android home screen.",
          url: location.href,
        });
      } else {
        await navigator.clipboard.writeText(location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="px-4 pb-6 pt-2">
      <header className="px-1 pt-3">
        <h1 className="text-[26px] font-bold leading-tight">Settings</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Momentum v1.0 · offline-first PWA
        </p>
      </header>

      <SectionTitle>Membership</SectionTitle>
      <Card
        className="overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${hexToRgba(accent, 0.2)}, var(--surface) 68%)` }}
      >
        <div className="flex items-start gap-3">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl"
            style={{ background: accent, color: "#fff" }}
          >
            {premiumActive(premium) ? "💎" : "🔒"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {premiumActive(premium)
                ? premium?.tier === "lifetime"
                  ? "Lifetime premium active"
                  : "Monthly premium active"
                : "Premium locked"}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
              {premium
                ? `${formatExpiry(premium)} · Buyer ID: ${premium.buyerId}`
                : "Unlock premium using the license key you received after purchase."}
            </p>
          </div>
        </div>
        {premium && (
          <button
            onClick={onResetLicense}
            className="press mt-4 h-11 w-full rounded-2xl border text-sm font-semibold"
            style={{ borderColor: "var(--line)", background: "var(--surface-2)" }}
          >
            Remove saved license
          </button>
        )}
      </Card>

      {/* Install / package status */}
      <SectionTitle>{native ? "App package" : "Install on Android"}</SectionTitle>
      {native ? (
        <Card
          className="overflow-hidden"
          style={{ background: `linear-gradient(150deg, ${hexToRgba(accent, 0.22)}, var(--surface) 65%)` }}
        >
          <div className="flex items-start gap-3">
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
              style={{ background: accent, color: "#fff" }}
            >
              <Icon name="check" size={21} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Momentum APK build</p>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
                You're running the packaged Android app (Capacitor build). Haptics use the native
                engine, the screen-back logic is bundled, and everything stays on-device.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card
          className="overflow-hidden"
          style={{ background: `linear-gradient(150deg, ${hexToRgba(accent, 0.22)}, var(--surface) 65%)` }}
        >
          <div className="flex items-start gap-3">
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
              style={{ background: accent, color: "#fff" }}
            >
              <Icon name={standalone ? "check" : "install"} size={21} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {standalone ? "Installed — you're running the app" : "Add Momentum to your home screen"}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
                {standalone
                  ? "Launching in standalone mode. It works offline and keeps your data on-device."
                  : canInstall
                    ? "Chrome can install this as a real Android app — no store required."
                    : "In Chrome, open the ⋮ menu and choose “Add to Home screen” / “Install app”."}
              </p>
            </div>
          </div>
          {!standalone && (
            <button
              onClick={onInstall}
              disabled={!canInstall}
              className={cn("press mt-4 h-12 w-full rounded-2xl text-[15px] font-semibold", !canInstall && "opacity-50")}
              style={{ background: accent, color: "#fff" }}
            >
              {canInstall ? "Install app" : "Use Chrome menu → Install app"}
            </button>
          )}
        </Card>
      )}

      {/* Profile */}
      <SectionTitle>Profile</SectionTitle>
      <Card className="!py-3">
        <label className="text-xs" style={{ color: "var(--muted)" }}>
          Your name
        </label>
        <input
          value={state.settings.name}
          onChange={(e) => updateSettings({ name: e.target.value })}
          className="mt-1 h-9 w-full bg-transparent text-[15px] font-semibold outline-none"
          style={{ color: "var(--text)" }}
          placeholder="there"
        />
      </Card>

      {/* Appearance */}
      <SectionTitle>Appearance</SectionTitle>
      <Card className="flex items-center justify-between !py-3.5">
        <div className="flex items-center gap-3">
          <Icon name={state.settings.theme === "dark" ? "moon" : "sun"} size={19} />
          <span className="text-[15px] font-medium">Dark theme</span>
        </div>
        <Switch
          checked={state.settings.theme === "dark"}
          accent={accent}
          onChange={(v) => {
            updateSettings({ theme: v ? "dark" : "light" });
            buzz(10);
          }}
        />
      </Card>

      <Card className="mt-2.5">
        <p className="text-[15px] font-medium">Accent colour</p>
        <div className="mt-3.5 flex flex-wrap gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                updateSettings({ accent: a.hex });
                buzz(10);
              }}
              className="press grid h-10 w-10 place-items-center rounded-full"
              style={{
                background: a.hex,
                boxShadow: a.hex === accent ? `0 0 0 3px var(--surface), 0 0 0 5px ${a.hex}` : "none",
              }}
              aria-label={a.name}
            >
              {a.hex === accent && <Icon name="check" size={16} strokeWidth={3} className="text-white" />}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
          The colour also re-themes the launcher icon and Android status bar.
        </p>
      </Card>

      {/* Behaviour */}
      <SectionTitle>Behaviour</SectionTitle>
      <Card className="flex items-center justify-between !py-3.5">
        <div className="flex items-center gap-3">
          <Icon name="phone" size={19} />
          <div>
            <p className="text-[15px] font-medium">Haptic feedback</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Vibrate on check-ins (Android)
            </p>
          </div>
        </div>
        <Switch
          checked={state.settings.haptics}
          accent={accent}
          onChange={(v) => updateSettings({ haptics: v })}
        />
      </Card>

      <Card className="mt-2.5">
        <p className="text-[15px] font-medium">Break length</p>
        <div className="mt-3 flex gap-2">
          {[5, 10, 15].map((m) => (
            <button
              key={m}
              onClick={() => updateSettings({ breakLength: m })}
              className="press h-10 flex-1 rounded-xl border text-sm font-semibold"
              style={{
                background: state.settings.breakLength === m ? hexToRgba(accent, 0.18) : "var(--surface-2)",
                borderColor: state.settings.breakLength === m ? accent : "var(--line)",
                color: state.settings.breakLength === m ? accent : "var(--text)",
              }}
            >
              {m} min
            </button>
          ))}
        </div>
      </Card>

      {/* Data */}
      <SectionTitle>Your data</SectionTitle>
      <Card className="divide-y" style={{ borderColor: "var(--line)" }}>
        <Row icon="install" label="Export backup (.json)" onClick={exportData} />
        <Row icon="share" label={copied ? "Link copied!" : "Share this app"} onClick={share} />
        <Row icon="edit" label="Restore from backup" onClick={() => fileRef.current?.click()} />
        <Row
          icon="trash"
          label={confirmReset ? "Tap again to erase everything" : "Clear all history"}
          danger
          onClick={() => {
            if (confirmReset) {
              resetAll();
              setConfirmReset(false);
              buzz([30, 60, 30]);
            } else {
              setConfirmReset(true);
              setTimeout(() => setConfirmReset(false), 4000);
            }
          }}
        />
      </Card>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importData(f);
          e.target.value = "";
        }}
      />

      <p className="mt-6 text-center text-xs" style={{ color: "var(--muted)" }}>
        Everything stays on your device. No accounts, no servers.
      </p>
    </div>
  );
}

function Row({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="press flex w-full items-center gap-3 py-3.5 text-left"
      style={{ color: danger ? "#ff5a6e" : "var(--text)" }}
    >
      <Icon name={icon} size={18} />
      <span className="flex-1 text-[15px] font-medium">{label}</span>
      <Icon name="chevron" size={16} className="opacity-40" />
    </button>
  );
}
