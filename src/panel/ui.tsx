import { Lock } from "lucide-react";
import type { ReactNode } from "react";

/* Panel bileşenleri: müşteri uygulamasıyla aynı tipografi ölçeği (Oswald başlık, Poppins metin). */

export function Card({ title, action, children, className = "", pad = true }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`min-w-0 rounded-xl bg-white ring-1 ring-paper-line ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-paper-line px-4 py-2.5">
          <h2 className="t-label text-ink/60">{title}</h2>
          {action}
        </header>
      )}
      <div className={pad ? "p-4" : ""}>{children}</div>
    </section>
  );
}

export function Btn({
  children,
  onClick,
  tone = "primary",
  size = "md",
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "primary" | "dark" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const tones = {
    primary: "bg-beef text-ink hover:bg-beef-deep",
    dark: "bg-ink text-white hover:bg-ink-3",
    ghost: "bg-white text-ink ring-1 ring-paper-line hover:bg-paper",
    danger: "bg-bad-soft text-bad hover:bg-bad hover:text-white",
  }[tone];
  const sizes = { sm: "h-8 px-3 text-xs", md: "h-10 px-3.5 text-[13px]", lg: "h-11 px-5 text-sm" }[size];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors disabled:bg-paper disabled:text-ink/35 disabled:ring-0 ${tones} ${sizes} ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "beef" | "ok" | "bad" | "dark" }) {
  const t = {
    neutral: "bg-paper text-ink/70",
    beef: "bg-beef text-ink",
    ok: "bg-ok-soft text-ok",
    bad: "bg-bad-soft text-bad",
    dark: "bg-ink text-beef",
  }[tone];
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${t}`}>{children}</span>;
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <label htmlFor={htmlFor} className="t-label text-ink/55">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-ink/50">{hint}</p>}
    </div>
  );
}

export const inputCls =
  "h-10 w-full rounded-lg bg-paper px-3 text-sm font-medium text-ink outline-none ring-1 ring-paper-line placeholder:text-ink/35 focus:bg-white focus:ring-2 focus:ring-ink focus-visible:outline-none disabled:opacity-60";

export function Locked({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-paper p-3 text-[13px] text-ink/70 ring-1 ring-paper-line">
      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function PageHead({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="t-h1 text-ink">{title}</h1>
        {sub && <p className="mt-0.5 text-[13px] text-ink/55">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Kpi({ label, value, sub, accent }: { label: string; value: ReactNode; sub?: ReactNode; accent?: boolean }) {
  return (
    <div className={`min-w-0 rounded-xl p-3.5 ring-1 ${accent ? "bg-ink text-white ring-ink" : "bg-white ring-paper-line"}`}>
      <div className={`t-label ${accent ? "text-beef" : "text-ink/50"}`}>{label}</div>
      <div className="mt-1.5 font-display text-[24px] font-semibold leading-none tabular">{value}</div>
      {sub && <div className={`mt-1 text-[11px] ${accent ? "text-smoke" : "text-ink/50"}`}>{sub}</div>}
    </div>
  );
}
