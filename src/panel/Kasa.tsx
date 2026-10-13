import { Check, CircleAlert, Gift, Hamburger, LogOut, ScanLine, Settings, Smartphone, Undo2, Wand2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BrandLogo, Sheet, StampCard, Toasts } from "../components/brand";
import { UNDO_WINDOW_MS } from "../data/defaults";
import {
  availableGrants,
  balanceOf,
  cooldownLeft,
  daysLeft,
  earnStamp,
  firstName,
  fmtMinutes,
  initials,
  maskPhone,
  qrPayload,
  redeemGrant,
  resolveCode,
  undoRedeem,
  undoStamp,
} from "../data/engine";
import type { Customer } from "../data/types";
import { useStore } from "../store/store";
import { PinGate, useDeskStaff, useLogout } from "./ui";

/** Müşteri ekranda açık kalırsa kasa kendiliğinden okutmaya döner (QR kodu da dakikada bir değişir). */
const IDLE_MS = 60_000;

type Result =
  | { tone: "stamp"; customerId: string; entryId: string; balance: number }
  | { tone: "full"; customerId: string; entryId: string; rewardName: string }
  | { tone: "reward"; customerId: string; grantId: string; rewardName: string }
  | { tone: "undone"; text: string }
  | { tone: "error"; title: string; text: string };

export function KasaApp({ go }: { go: (p: string) => void }) {
  return (
    <PinGate title="Kasa">
      <Kasa go={go} />
    </PinGate>
  );
}

function Kasa({ go }: { go: (p: string) => void }) {
  const { state, update } = useStore();
  const me = useDeskStaff()!;
  const logout = useLogout();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [demo, setDemo] = useState(false);
  const customer = state.customers.find((c) => c.id === customerId);

  // Sonuç ekranı: geri alma süresi bitince (ya da hata/geri alma bildiriminden kısa süre sonra) okutmaya dön.
  useEffect(() => {
    if (!result) return;
    const ms = result.tone === "error" ? 6000 : result.tone === "undone" ? 2500 : UNDO_WINDOW_MS;
    const t = setTimeout(() => setResult(null), ms);
    return () => clearTimeout(t);
  }, [result]);

  useEffect(() => {
    if (!customerId) return;
    const t = setTimeout(() => setCustomerId(null), IDLE_MS);
    return () => clearTimeout(t);
  }, [customerId]);

  const found = (c: Customer) => {
    setResult(null);
    setCustomerId(c.id);
  };

  const giveStamp = () => {
    if (!customer) return;
    update((s) => {
      const out = earnStamp(s, { customerId: customer.id, staffId: me.id });
      if (!out.result.ok) setResult({ tone: "error", title: "Damga verilmedi", text: out.result.error });
      else if (out.result.grantId) setResult({ tone: "full", customerId: customer.id, entryId: out.result.entryId, rewardName: s.rules.rewardName });
      else setResult({ tone: "stamp", customerId: customer.id, entryId: out.result.entryId, balance: out.result.balance });
      return out.state;
    });
    setCustomerId(null);
  };

  const redeem = (grantId: string, rewardName: string) => {
    if (!customer) return;
    update((s) => {
      const out = redeemGrant(s, grantId, me.id);
      if (!out.result.ok) setResult({ tone: "error", title: "Ödül kullanılamadı", text: out.result.error });
      else setResult({ tone: "reward", customerId: customer.id, grantId, rewardName });
      return out.state;
    });
    setCustomerId(null);
  };

  const undo = () => {
    if (!result) return;
    update((s) => {
      const out =
        result.tone === "stamp" || result.tone === "full"
          ? undoStamp(s, result.entryId, me.id)
          : result.tone === "reward"
            ? undoRedeem(s, result.grantId, me.id)
            : null;
      if (!out) return s;
      if (!out.result.ok) setResult({ tone: "error", title: "Geri alınamadı", text: out.result.error });
      else setResult({ tone: "undone", text: result.tone === "reward" ? "Ödül tekrar kullanılabilir durumda." : "Damga karttan çıkarıldı." });
      return out.state;
    });
  };

  return (
    <div className="flex min-h-[calc(100dvh-var(--demo-bar))] flex-col bg-ink text-cream">
      <header className="flex items-center gap-3 border-b border-ink-line px-4 py-2.5 sm:px-6">
        <BrandLogo size={36} />
        <div className="min-w-0 flex-1">
          <div className="t-h1 leading-none">Kasa</div>
          <div className="mt-0.5 truncate text-[13px] text-smoke">{me.name}</div>
        </div>
        <button onClick={() => setDemo(true)} className="flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-beef ring-1 ring-beef/35" aria-label="Demo kontrolleri">
          <Wand2 className="h-4 w-4" /> <span className="hidden sm:inline">Demo</span>
        </button>
        {me.role === "admin" && (
          <button onClick={() => go("yonetim")} className="flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-cream ring-1 ring-ink-line" aria-label="Yönetim">
            <Settings className="h-4 w-4" /> <span className="hidden sm:inline">Yönetim</span>
          </button>
        )}
        <button onClick={logout} className="flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-smoke ring-1 ring-ink-line" aria-label="Çıkış yap">
          <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Çıkış</span>
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-[980px] flex-1 flex-col px-4 py-5 sm:px-6">
        {customer ? (
          <CustomerView c={customer} onStamp={giveStamp} onReward={redeem} onCancel={() => setCustomerId(null)} />
        ) : (
          <ScanView onFound={found} />
        )}
      </main>

      {result && <ResultScreen r={result} onUndo={undo} onNext={() => setResult(null)} />}
      {demo && (
        <Sheet label="Demo kontrolleri" onClose={() => setDemo(false)} fixedTo="page">
          <KasaDemo go={go} onDone={() => setDemo(false)} />
        </Sheet>
      )}
      <Toasts />
    </div>
  );
}

/* ---------------- 1 · OKUT ---------------- */
function ScanView({ onFound }: { onFound: (c: Customer) => void }) {
  const { state } = useStore();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [scanning, setScanning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const tryCode = (value: string) => {
    const c = resolveCode(state, value);
    if (c) {
      setErr("");
      setCode("");
      onFound(c);
    } else setErr("Kod bulunamadı ya da süresi doldu. Müşteriden ekrandaki güncel kodu isteyin.");
  };

  // Demo: kameraya gösterilen QR'ı canlandırır. Okunan içerik, gerçek okutmadaki gibi kod çözümlemesinden geçer.
  const simulate = (c: Customer) => {
    setScanning(c.id);
    setTimeout(() => {
      setScanning(null);
      tryCode(qrPayload(c.id));
    }, 700);
  };

  const demoList = useMemo(() => {
    const app = state.customers.find((c) => c.id === state.session.customerId);
    const others = state.customers
      .filter((c) => c.id !== app?.id)
      .sort((a, b) => availableGrants(state, b.id).length - availableGrants(state, a.id).length)
      .slice(0, app ? 3 : 4);
    return app ? [app, ...others] : others;
  }, [state]);

  return (
    <div className="grid flex-1 grid-cols-[minmax(0,1fr)] content-start gap-5 md:grid-cols-2 md:gap-6">
      <section>
        <div className="relative mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-[28px] bg-[#0c0b0a] ring-1 ring-ink-line md:aspect-[4/5]">
          <div className="absolute inset-[16%]">
            {["left-0 top-0 border-l-4 border-t-4 rounded-tl-3xl", "right-0 top-0 border-r-4 border-t-4 rounded-tr-3xl", "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-3xl", "right-0 bottom-0 border-r-4 border-b-4 rounded-br-3xl"].map((c) => (
              <span key={c} className={`absolute h-12 w-12 border-beef ${c}`} />
            ))}
            <span className="absolute inset-x-3 h-0.5 bg-beef shadow-[0_0_18px_4px_rgba(226,86,1,0.55)]" style={{ animation: "scanline 2.4s ease-in-out infinite" }} />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 text-center">
            <div className="text-[15px] font-semibold" aria-live="polite">
              {scanning ? "QR okunuyor…" : "Müşterinin QR'ını okutun"}
            </div>
            <div className="mt-0.5 text-[13px] text-smoke">Demo: kamera bağlı değil · aşağıdan bir QR seçin</div>
          </div>
        </div>
      </section>

      <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === 6) tryCode(code);
          }}
        >
          <label htmlFor="ks-code" className="t-label text-smoke">
            Okunmazsa: QR altındaki 6 haneli kod
          </label>
          <div className="mt-2 flex gap-2">
            <input
              ref={inputRef}
              id="ks-code"
              inputMode="numeric"
              autoComplete="off"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setErr("");
              }}
              placeholder="••• •••"
              className="h-14 min-w-0 flex-1 rounded-2xl bg-ink-2 px-4 text-center font-display text-[26px] tracking-[0.3em] text-cream outline-none ring-1 ring-ink-line tabular placeholder:text-ink-line focus:ring-2 focus:ring-beef focus-visible:outline-none"
            />
            <button type="submit" disabled={code.length !== 6} className="h-14 shrink-0 rounded-2xl bg-beef px-6 text-[15px] font-semibold text-ink disabled:bg-ink-3 disabled:text-smoke">
              Bul
            </button>
          </div>
          {err && (
            <p className="mt-2.5 flex items-start gap-2 text-[14px] font-medium text-alert" role="alert">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {err}
            </p>
          )}
        </form>

        <div>
          <div className="t-label text-smoke">Demo · kameraya gösterilen QR</div>
          <ul className="mt-2 grid grid-cols-[minmax(0,1fr)] gap-2">
            {demoList.map((c) => {
              const avail = availableGrants(state, c.id).length;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => simulate(c)}
                    disabled={!!scanning}
                    className="flex h-16 w-full items-center gap-3 rounded-2xl bg-ink-2 px-3 text-left ring-1 ring-ink-line hover:ring-beef/60 disabled:opacity-60"
                  >
                    <Avatar name={c.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{c.name}</span>
                      <span className="block truncate text-[13px] text-smoke">
                        {c.id === state.session.customerId ? "Uygulamada açık · " : ""}
                        {balanceOf(state, c.id)}/{state.rules.stampsRequired}
                        {avail ? " · ödül hazır" : ""}
                      </span>
                    </span>
                    {scanning === c.id ? <ScanLine className="h-5 w-5 animate-pulse text-beef" /> : <ScanLine className="h-5 w-5 text-smoke" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}

/* ---------------- 2 · MÜŞTERİ ---------------- */
function CustomerView({ c, onStamp, onReward, onCancel }: { c: Customer; onStamp: () => void; onReward: (grantId: string, name: string) => void; onCancel: () => void }) {
  const { state } = useStore();
  const r = state.rules;
  const bal = balanceOf(state, c.id);
  const reward = availableGrants(state, c.id)[0];
  const rewardCount = availableGrants(state, c.id).length;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);
  const wait = cooldownLeft(state, c.id, now);

  return (
    <div className="animate-rise mx-auto grid w-full max-w-[880px] grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start md:gap-6">
      <div>
        <div className="flex items-center gap-3">
          <Avatar name={c.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="t-display truncate text-[28px]">{c.name}</div>
            <div className="text-[14px] text-smoke tabular">{maskPhone(c.phone)}</div>
          </div>
          <button onClick={onCancel} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink-2 ring-1 ring-ink-line" aria-label="Vazgeç, yeni müşteri okut">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">
          <StampCard stamps={bal} required={r.stampsRequired} rewardName={r.rewardName} compact />
        </div>
      </div>

      <div className="grid gap-3">
        {reward && (
          <button onClick={() => onReward(reward.id, reward.rewardName)} className="flex min-h-[88px] w-full items-center gap-4 rounded-[22px] bg-beef px-5 py-4 text-left text-ink active:scale-[0.99]">
            <Gift className="h-8 w-8 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[24px] uppercase leading-tight">Ödülü kullan</span>
              <span className="block text-[14px] font-medium text-ink/75">
                {reward.rewardName} · son {daysLeft(reward.expiresAt)} gün{rewardCount > 1 ? ` · toplam ${rewardCount} ödül` : ""}
              </span>
            </span>
          </button>
        )}
        <button
          onClick={onStamp}
          disabled={wait > 0}
          className={`flex min-h-[88px] w-full items-center gap-4 rounded-[22px] px-5 py-4 text-left active:scale-[0.99] disabled:cursor-not-allowed ${reward ? "bg-ink-2 text-cream ring-1 ring-ink-line" : "bg-beef text-ink"} disabled:bg-ink-2 disabled:text-smoke disabled:ring-1 disabled:ring-ink-line`}
        >
          <Hamburger className="h-8 w-8 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[24px] uppercase leading-tight">+1 damga</span>
            <span className={`block text-[14px] font-medium ${reward ? "text-smoke" : "text-ink/75"}`}>
              {wait > 0 ? `Son damga yakın zamanda verildi · ${fmtMinutes(wait)} sonra` : "Bu sipariş için"}
            </span>
          </span>
        </button>
        {wait > 0 && <p className="text-[13px] leading-relaxed text-smoke">Aynı siparişe ikinci damga verilmemesi için bekleme süresi uygulanır. Hata olduğunu düşünüyorsanız yöneticiye bildirin.</p>}
        <button onClick={onCancel} className="h-12 rounded-2xl text-[15px] font-semibold text-smoke hover:text-cream">
          Vazgeç
        </button>
      </div>
    </div>
  );
}

/* ---------------- 3 · SONUÇ (tam ekran) ---------------- */
function ResultScreen({ r, onUndo, onNext }: { r: Result; onUndo: () => void; onNext: () => void }) {
  const { state } = useStore();
  const name = "customerId" in r ? firstName(state.customers.find((c) => c.id === r.customerId)?.name ?? "") : "";
  const canUndo = r.tone === "stamp" || r.tone === "full" || r.tone === "reward";
  const look = {
    stamp: { bg: "bg-ok text-cream", icon: <Check className="h-12 w-12" strokeWidth={3} />, title: "+1 damga verildi", text: r.tone === "stamp" ? `${name} · kart ${r.balance}/${state.rules.stampsRequired}` : "" },
    full: { bg: "bg-beef text-ink", icon: <Gift className="h-12 w-12" />, title: "Kart doldu!", text: r.tone === "full" ? `${name} bir ${r.rewardName} kazandı. Ödül sonraki siparişte kullanılabilir.` : "" },
    reward: { bg: "bg-beef text-ink", icon: <Gift className="h-12 w-12" />, title: "Ödül kullanıldı", text: r.tone === "reward" ? `${name} · ${r.rewardName}. Afiyet olsun!` : "" },
    undone: { bg: "bg-ink-3 text-cream", icon: <Undo2 className="h-12 w-12" />, title: "Geri alındı", text: r.tone === "undone" ? r.text : "" },
    error: { bg: "bg-bad text-cream", icon: <CircleAlert className="h-12 w-12" />, title: r.tone === "error" ? r.title : "", text: r.tone === "error" ? r.text : "" },
  }[r.tone];

  return (
    <div className={`fixed inset-x-0 bottom-0 top-[var(--demo-bar)] z-40 flex flex-col ${look.bg}`} role="alertdialog" aria-modal aria-label={look.title}>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="animate-pop grid h-24 w-24 place-items-center rounded-full bg-black/15">{look.icon}</div>
        <h2 className="t-display mt-6 text-[clamp(34px,7vw,52px)]">{look.title}</h2>
        <p className="mt-3 max-w-md text-[17px] font-medium opacity-90">{look.text}</p>
      </div>
      <div className="mx-auto grid w-full max-w-md gap-2.5 px-6 pb-[max(24px,env(safe-area-inset-bottom))]">
        {canUndo && (
          <button onClick={onUndo} className="relative flex h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-black/15 text-[15px] font-semibold">
            <span className="absolute inset-0 origin-left bg-black/10" style={{ animation: `shrink ${UNDO_WINDOW_MS}ms linear forwards` }} aria-hidden />
            <Undo2 className="relative h-4 w-4" /> <span className="relative">Geri al</span>
          </button>
        )}
        <button onClick={onNext} className="h-14 rounded-2xl bg-ink text-[15px] font-semibold text-cream">
          {r.tone === "error" ? "Tamam" : "Yeni müşteri"}
        </button>
      </div>
    </div>
  );
}

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-beef font-display text-ink ${size === "lg" ? "h-14 w-14 text-[18px]" : "h-10 w-10 text-[14px]"}`}>{initials(name)}</span>
  );
}

function KasaDemo({ go, onDone }: { go: (p: string) => void; onDone: () => void }) {
  const { state, update, reset, toast } = useStore();
  return (
    <div>
      <div className="t-label flex items-center gap-2 text-beef">
        <Wand2 className="h-4 w-4" /> Demo kontrolleri
      </div>
      <div className="mt-3 grid gap-2">
        <Toggle
          checked={state.demo.skipCooldown}
          onChange={(v) => update((s) => ({ ...s, demo: { skipCooldown: v } }))}
          title="Bekleme süresini kapat"
          sub="Yalnızca deneme için: aynı müşteriye arka arkaya damga verilebilir."
        />
        <button onClick={() => go("app")} className="flex h-12 items-center gap-2 rounded-xl bg-ink-3 px-3.5 text-left text-[14px] font-medium hover:bg-beef hover:text-ink">
          <Smartphone className="h-4 w-4" /> Müşteri uygulamasına geç
        </button>
        <button
          onClick={() => {
            reset();
            toast("Demo sıfırlandı.", "info");
            onDone();
          }}
          className="flex h-12 items-center gap-2 rounded-xl bg-ink-3 px-3.5 text-left text-[14px] font-medium hover:bg-beef hover:text-ink"
        >
          Demoyu sıfırla
        </button>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, title, sub }: { checked: boolean; onChange: (v: boolean) => void; title: string; sub: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-ink-3 px-3.5 py-3">
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold">{title}</span>
        <span className="block text-[13px] text-smoke">{sub}</span>
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-beef ${checked ? "bg-beef" : "bg-ink-line"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left] ${checked ? "left-6" : "left-1"}`} />
      </span>
    </label>
  );
}
