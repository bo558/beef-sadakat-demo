import { Hamburger } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useStore } from "../store/store";

/** public/ altındaki dosyalar için yol: uygulama hangi alt yoldan sunulursa sunulsun çalışır. */
export const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\/+/, "")}`;

/**
 * LOGO YER TUTUCU — orijinal boynuzlu BEEF BURGER logosunun vektör dosyası
 * gelene kadar kullanılır. Logo yeniden çizilmemiştir.
 */
export function LogoPlaceholder({ tone = "dark", size = "md" }: { tone?: "dark" | "light"; size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "h-9 px-3 text-[15px]", md: "h-12 px-4 text-xl", lg: "h-20 px-6 text-4xl" }[size];
  const col = tone === "dark" ? "border-beef/70 text-beef" : "border-ink/50 text-ink";
  return (
    <div
      className={`relative inline-flex select-none items-center justify-center rounded-xl border-2 border-dashed ${col} ${dims}`}
      title="Logo yer tutucu: orijinal logo dosyası bekleniyor"
      aria-label="BEEF BURGER logosu (yer tutucu)"
    >
      <span className="font-display tracking-[0.06em] leading-none">BEEF BURGER</span>
      <span
        className={`absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 text-[8px] font-bold uppercase tracking-[0.14em] ${
          tone === "dark" ? "bg-ink text-beef/80" : "bg-paper text-ink/60"
        }`}
      >
        logo yer tutucu
      </span>
    </div>
  );
}

/** Dijital sadakat kartı — uygulamanın merkezindeki öğe. */
export function StampCard({
  stamps,
  required,
  name,
  rewardName,
  freshIndex,
  compact,
}: {
  stamps: number;
  required: number;
  name?: string;
  rewardName: string;
  freshIndex?: number | null;
  compact?: boolean;
}) {
  const cols = required <= 4 ? required : required <= 10 ? Math.ceil(required / 2) : 6;
  const left = Math.max(0, required - stamps);
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-beef text-ink shadow-[0_24px_60px_-20px_rgba(251,204,10,0.45)]">
      <div className="wrap-texture absolute inset-0" aria-hidden />
      <div className={`relative ${compact ? "p-4" : "p-5"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-ink/70">Beef Kart</div>
            {name && <div className="truncate text-sm font-bold">{name}</div>}
          </div>
          <div className="text-right">
            <div className="font-display text-[44px] leading-[0.9] tabular">
              {stamps}
              <span className="text-ink/45">/{required}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} role="list" aria-label={`${stamps} / ${required} damga`}>
          {Array.from({ length: required }, (_, i) => {
            const filled = i < stamps;
            const next = i === stamps;
            const rot = ((i * 37) % 17) - 8;
            return (
              <div key={i} role="listitem" className="relative aspect-square">
                {filled ? (
                  <div
                    className={`grid h-full w-full place-items-center rounded-full bg-ink text-beef shadow-[inset_0_-3px_0_rgba(255,255,255,0.08)] ${freshIndex === i ? "animate-stamp" : ""}`}
                    style={{ transform: `rotate(${rot}deg)`, ["--r" as string]: `${rot}deg` }}
                    aria-label={`${i + 1}. damga dolu`}
                  >
                    <Hamburger className="h-[52%] w-[52%]" strokeWidth={2.2} />
                  </div>
                ) : (
                  <div
                    className={`grid h-full w-full place-items-center rounded-full border-2 border-dashed ${next ? "border-ink/70 bg-ink/5" : "border-ink/30"}`}
                    aria-label={`${i + 1}. damga boş`}
                  >
                    <span className={`font-display text-lg leading-none ${next ? "text-ink/70" : "text-ink/30"}`}>{i + 1}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-beef text-ink font-display text-lg">{required + 1}</div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-beef">{required + 1}. sipariş hediye</div>
            <div className="truncate text-sm font-semibold">{rewardName}</div>
          </div>
          <div className="text-right text-xs font-semibold text-smoke">{left === 0 ? "Hazır!" : `${left} kaldı`}</div>
        </div>
      </div>
    </div>
  );
}

export function QrImage({ value, size = 232 }: { value: string; size?: number }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(value, { margin: 1, width: size * 2, errorCorrectionLevel: "M", color: { dark: "#0E0D0B", light: "#FFFFFF" } })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [value, size]);
  return src ? (
    <img src={src} width={size} height={size} alt="Kişisel QR kodu" className="block" style={{ imageRendering: "pixelated" }} />
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
          className={`animate-rise pointer-events-auto max-w-md rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl ${
            t.tone === "ok" ? "bg-ink text-white ring-1 ring-beef/40" : t.tone === "bad" ? "bg-bad text-white" : "bg-white text-ink ring-1 ring-black/10"
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${className}`}>
      Örnek veri
    </span>
  );
}
