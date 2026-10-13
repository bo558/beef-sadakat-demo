import { Gift, Hamburger, X } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState, type ReactNode } from "react";
import { brand } from "../brand";
import { useStore } from "../store/store";

/** public/ altındaki dosyalar için yol: uygulama hangi alt yoldan sunulursa sunulsun çalışır. */
export const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\/+/, "")}`;

/** Marka logosu (orijinal dosya, kare oran korunur). */
export function BrandLogo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={asset(brand.logo.src)}
      width={size}
      height={size}
      alt={brand.logo.alt}
      className={`block aspect-square shrink-0 select-none rounded-md object-contain ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}

/** Dijital damga kartı: logo karosu gibi turuncu zemin, krem damgalar, koyu ödül şeridi. */
export function StampCard({
  stamps,
  required,
  rewardName,
  name,
  freshIndex,
  compact,
}: {
  stamps: number;
  required: number;
  rewardName: string;
  name?: string;
  freshIndex?: number | null;
  compact?: boolean;
}) {
  const shown = Math.min(stamps, required);
  const cols = required <= 5 ? required : Math.ceil(required / 2);
  const left = Math.max(0, required - shown);
  return (
    <div className="relative overflow-hidden rounded-[22px] bg-beef text-cream shadow-[0_18px_40px_-22px_rgba(226,86,1,0.8)]">
      <div className={compact ? "p-3.5" : "p-4 pb-3.5"}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-display text-[18px] uppercase leading-none tracking-[0.02em]">
              {brand.cardTitle[0]} <span className="text-ink">{brand.cardTitle[1]}</span>
            </div>
            {name && <div className="mt-1.5 truncate text-[13px] font-medium text-ink/75">{name}</div>}
          </div>
          <div className={`t-num ${compact ? "text-[26px]" : "text-[32px]"}`} aria-label={`${shown} / ${required} damga`}>
            {shown}
            <span className="text-[18px] text-ink/45">/{required}</span>
          </div>
        </div>

        <ol className={`grid ${compact ? "mt-3 gap-2" : "mt-4 gap-2.5"}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: required }, (_, i) => {
            const filled = i < shown;
            const next = i === shown;
            const rot = ((i * 37) % 17) - 8;
            return (
              <li key={i} className="mx-auto aspect-square w-full max-w-12">
                {filled ? (
                  <div
                    className={`grid h-full w-full place-items-center rounded-full bg-cream text-beef ${freshIndex === i ? "animate-stamp" : ""}`}
                    style={{ transform: `rotate(${rot}deg)`, ["--r" as string]: `${rot}deg` }}
                    aria-label={`${i + 1}. damga dolu`}
                  >
                    <Hamburger className="h-[52%] w-[52%]" strokeWidth={2.2} />
                  </div>
                ) : (
                  <div
                    className={`grid h-full w-full place-items-center rounded-full border-[1.5px] border-dashed ${next ? "border-cream bg-cream/10" : "border-cream/45"}`}
                    aria-label={`${i + 1}. damga boş`}
                  >
                    <span className={`font-display text-[13px] ${next ? "text-cream" : "text-cream/60"}`}>{i + 1}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <div className={`flex items-center gap-2.5 rounded-xl bg-ink px-3 text-cream ${compact ? "mt-3 py-2" : "mt-4 py-2.5"}`}>
          <Gift className="h-4 w-4 shrink-0 text-beef" />
          <div className="min-w-0 flex-1 truncate text-[13px]">
            <span className="font-semibold">{required} damga</span>
            <span className="text-smoke"> = 1 {rewardName}</span>
          </div>
          <div className="shrink-0 text-[13px] font-semibold text-beef">{left === 0 ? "Doldu" : `${left} kaldı`}</div>
        </div>
      </div>
    </div>
  );
}

export function QrImage({ value, size = 208 }: { value: string; size?: number }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(value, { margin: 1, width: size * 2, errorCorrectionLevel: "M", color: { dark: "#161514", light: "#FFFFFF" } })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [value, size]);
  return src ? (
    <img src={src} width={size} height={size} alt="Kişisel QR kodu" className="block" style={{ imageRendering: "pixelated", width: size, height: size }} />
  ) : (
    <div style={{ width: size, height: size }} className="animate-pulse rounded bg-ink/10" />
  );
}

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(var(--demo-bar)+max(10px,env(safe-area-inset-top)))] z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`animate-rise pointer-events-auto max-w-sm rounded-xl px-4 py-2.5 text-[14px] font-medium shadow-lg ${
            t.tone === "ok" ? "bg-ink text-cream ring-1 ring-beef/50" : t.tone === "bad" ? "bg-bad text-cream" : "bg-white text-ink ring-1 ring-black/10"
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

/** Alttan açılan panel. `fixedTo="frame"`: telefon çerçevesinin içinde kalır. */
export function Sheet({ onClose, children, label, light, fixedTo = "frame" }: { onClose: () => void; children: ReactNode; label: string; light?: boolean; fixedTo?: "frame" | "page" }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className={`${fixedTo === "frame" ? "absolute" : "fixed"} inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px]`} onClick={onClose}>
      <div
        className={`animate-rise relative no-scrollbar max-h-[90%] w-full max-w-lg overflow-y-auto rounded-t-[28px] p-5 pb-[max(20px,env(safe-area-inset-bottom))] ${light ? "bg-white text-ink" : "bg-ink-2 text-cream ring-1 ring-ink-line"}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-label={label}
      >
        <div className={`mx-auto mb-3 h-1 w-10 rounded-full ${light ? "bg-ink/15" : "bg-cream/20"}`} />
        <button onClick={onClose} className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full ${light ? "bg-ink/5" : "bg-ink-3"}`} aria-label="Kapat">
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}
