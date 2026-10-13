import { Delete, LockKeyhole } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { BrandLogo } from "../components/brand";
import { ROLE_LABEL } from "../data/defaults";
import { verifyPin } from "../data/engine";
import type { Staff } from "../data/types";
import { useStore } from "../store/store";

/** Personel oturumu: kapatılmış ya da silinmiş personelin oturumu kendiliğinden düşer. */
export function useDeskStaff(): Staff | undefined {
  const { state } = useStore();
  return state.staff.find((s) => s.id === state.desk.staffId && s.active);
}

export function useLogout() {
  const { update } = useStore();
  return () => update((s) => ({ ...s, desk: { staffId: null } }));
}

const MAX_TRIES = 5;
const LOCK_MS = 30_000;

/**
 * 4 haneli PIN ile giriş (telefon ve tablette büyük tuş takımı).
 * DEMO: PIN tarayıcıda kontrol edilir ve demo PIN'leri ekranda yazar; gerçek sürümde doğrulama sunucuda yapılmalıdır.
 */
export function PinGate({ title, needAdmin, children }: { title: string; needAdmin?: boolean; children: ReactNode }) {
  const { state, update } = useStore();
  const me = useDeskStaff();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [tries, setTries] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const locked = lockedUntil > now;

  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [locked]);

  useEffect(() => {
    if (pin.length < 4) return;
    const st = verifyPin(state, pin);
    setPin("");
    if (!st) {
      const n = tries + 1;
      setTries(n);
      if (n >= MAX_TRIES) {
        setLockedUntil(Date.now() + LOCK_MS);
        setNow(Date.now());
        setTries(0);
        setErr("Çok fazla hatalı deneme. 30 saniye bekleyin.");
      } else setErr("PIN hatalı.");
      return;
    }
    if (needAdmin && st.role !== "admin") {
      setErr(`${st.name} için yönetim yetkisi yok. Yönetici PIN'i girin.`);
      return;
    }
    setErr("");
    setTries(0);
    update((s) => ({ ...s, desk: { staffId: st.id } }));
  }, [pin, state, tries, needAdmin, update]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (locked) return;
      if (/^\d$/.test(e.key)) setPin((p) => (p.length < 4 ? p + e.key : p));
      else if (e.key === "Backspace") setPin((p) => p.slice(0, -1));
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [locked]);

  if (me && (!needAdmin || me.role === "admin")) return <>{children}</>;

  const press = (d: string) => !locked && setPin((p) => (p.length < 4 ? p + d : p));
  const demoStaff = state.staff.filter((s) => s.active);

  return (
    <div className="flex min-h-[calc(100dvh-var(--demo-bar))] flex-col items-center justify-center bg-ink px-5 py-8 text-cream">
      <div className="w-full max-w-[340px] text-center">
        <BrandLogo size={56} className="mx-auto" />
        <h1 className="t-display mt-4">{title}</h1>
        <p className="mt-1 text-[15px] text-smoke">{me && needAdmin ? `${me.name} yönetici değil. Yönetici PIN'i girin.` : "Personel PIN'inizi girin"}</p>
        <div className="mt-6 flex justify-center gap-3.5" aria-label={`${pin.length} hane girildi`}>
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className={`h-4 w-4 rounded-full ${i < pin.length ? "bg-beef" : "ring-2 ring-ink-line"}`} />
          ))}
        </div>
        <p className="mt-3 min-h-[22px] text-[14px] font-medium text-alert" role="alert">
          {locked ? `Çok fazla hatalı deneme. ${Math.ceil((lockedUntil - now) / 1000)} sn bekleyin.` : err}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <Key key={d} onClick={() => press(d)} disabled={locked}>
              {d}
            </Key>
          ))}
          <span />
          <Key onClick={() => press("0")} disabled={locked}>
            0
          </Key>
          <Key onClick={() => setPin((p) => p.slice(0, -1))} label="Sil">
            <Delete className="h-6 w-6" />
          </Key>
        </div>
        <div className="mt-6 rounded-xl bg-ink-2 px-3.5 py-3 text-left text-[13px] leading-relaxed text-smoke ring-1 ring-ink-line">
          <div className="t-label flex items-center gap-1.5 text-beef">
            <LockKeyhole className="h-3.5 w-3.5" /> Demo PIN'leri
          </div>
          <div className="mt-1">
            {demoStaff.map((s, i) => (
              <span key={s.id}>
                {i > 0 && " · "}
                {s.name} <b className="text-cream tabular">{s.pin}</b>
                {s.role === "admin" && ` (${ROLE_LABEL.admin.toLocaleLowerCase("tr-TR")})`}
              </span>
            ))}
          </div>
          <div className="mt-1">Demoda PIN tarayıcıda kontrol edilir; gerçek sürümde sunucuda doğrulanır.</div>
        </div>
      </div>
    </div>
  );
}

function Key({ onClick, disabled, label, children }: { onClick: () => void; disabled?: boolean; label?: string; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-16 place-items-center rounded-2xl bg-ink-2 font-display text-[26px] ring-1 ring-ink-line active:scale-95 active:bg-ink-3 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/* ---------- Yönetim sayfası bileşenleri (açık zemin) ---------- */

export function Panel({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl bg-white p-4 ring-1 ring-paper-line sm:p-5 ${className}`}>
      <header className="mb-3.5 flex items-center justify-between gap-3">
        <h2 className="t-h1 text-ink">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

export function Btn({
  children,
  onClick,
  tone = "primary",
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "primary" | "dark" | "ghost" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const tones = {
    primary: "bg-beef text-ink hover:bg-beef-deep",
    dark: "bg-ink text-cream hover:bg-ink-3",
    ghost: "bg-white text-ink ring-1 ring-paper-line hover:bg-paper",
    danger: "bg-bad-soft text-bad hover:bg-bad hover:text-cream",
  }[tone];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-12 items-center justify-center gap-1.5 rounded-xl px-4 text-[15px] font-semibold transition-colors disabled:bg-paper disabled:text-ink/35 disabled:ring-0 ${tones} ${className}`}
    >
      {children}
    </button>
  );
}

export const inputCls =
  "h-12 w-full rounded-xl bg-paper px-3.5 text-[15px] font-medium text-ink outline-none ring-1 ring-paper-line placeholder:text-ink/40 focus:bg-white focus:ring-2 focus:ring-ink focus-visible:outline-none";
