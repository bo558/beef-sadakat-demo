import { Gift, Hamburger } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState, type ReactNode } from "react";
import { useStore } from "../store/store";

/** public/ altındaki dosyalar için yol: uygulama hangi alt yoldan sunulursa sunulsun çalışır. */
export const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\/+/, "")}`;

/**
 * BEEF'in gerçek logosu (public/brand/logo.jpg, 1024×1024, orijinal dosya).
 * Kare oran korunur; esnetme, kırpma veya yeniden çizim yok. Köşe yuvarlaması
 * yalnızca logonun düz turuncu zeminine denk gelir.
 */
export function BrandLogo({ size = "sm", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const px = { sm: 40, md: 52, lg: 76 }[size];
  return (
    <img
      src={asset("brand/logo.jpg")}
      width={px}
      height={px}
      alt="the beef · burger & more logosu"
      className={`block aspect-square shrink-0 select-none rounded-md object-contain ${className}`}
      style={{ width: px, height: px }}
      draggable={false}
    />
  );
}

/** Instagram'daki sarı fırça darbesi etiket. */
export function BrushLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`brush ${className}`}>{children}</span>;
}

/**
 * Dijital sadakat kartı. Instagram kampanya görsellerindeki gibi siyah zemin,
 * sarı yalnızca dolu damgalarda, sayaçta ve hediye şeridinde.
 */
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
    <div className="relative overflow-hidden rounded-2xl bg-ink-2 text-white ring-1 ring-ink-line">
      <div className="wrap-texture absolute inset-0" aria-hidden />
      <div className={`relative ${compact ? "p-3.5" : "p-4"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <BrushLabel>Beef Kart</BrushLabel>
            {name && <div className="mt-1.5 truncate text-xs text-smoke">{name}</div>}
          </div>
          <div className="t-num-lg text-beef" aria-label={`${stamps} / ${required} damga`}>
            {stamps}
            <span className="text-[18px] text-smoke">/{required}</span>
          </div>
        </div>

        <div className={`grid ${compact ? "mt-3 gap-2" : "mt-3.5 gap-2.5"}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} role="list">
          {Array.from({ length: required }, (_, i) => {
            const filled = i < stamps;
            const next = i === stamps;
            const rot = ((i * 37) % 17) - 8;
            return (
              <div key={i} role="listitem" className="mx-auto aspect-square w-full max-w-12">
                {filled ? (
                  <div
                    className={`grid h-full w-full place-items-center rounded-full bg-beef text-ink ${freshIndex === i ? "animate-stamp" : ""}`}
                    style={{ transform: `rotate(${rot}deg)`, ["--r" as string]: `${rot}deg` }}
                    aria-label={`${i + 1}. damga dolu`}
                  >
                    <Hamburger className="h-[50%] w-[50%]" strokeWidth={2.2} />
                  </div>
                ) : (
                  <div
                    className={`grid h-full w-full place-items-center rounded-full border-[1.5px] border-dashed ${next ? "border-beef/80" : "border-ink-line"}`}
                    aria-label={`${i + 1}. damga boş`}
                  >
                    <span className={`font-display text-[13px] font-medium ${next ? "text-beef" : "text-smoke/50"}`}>{i + 1}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={`flex items-center gap-2.5 rounded-xl bg-beef px-3 text-ink ${compact ? "mt-3 py-2" : "mt-3.5 py-2.5"}`}>
          <Gift className="h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1 truncate text-[13px]">
            <span className="font-semibold">{required + 1}. sipariş hediye</span>
            <span className="text-ink/70"> · {rewardName}</span>
          </div>
          <div className="shrink-0 text-xs font-semibold">{left === 0 ? "Hazır!" : `${left} kaldı`}</div>
        </div>
      </div>
    </div>
  );
}

export function QrImage({ value, size = 208 }: { value: string; size?: number }) {
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
          className={`animate-rise pointer-events-auto max-w-sm rounded-xl px-3.5 py-2.5 text-[13px] font-medium shadow-lg ${
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
  return <span className={`inline-flex items-center rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${className}`}>Örnek veri</span>;
}
