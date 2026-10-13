import { ArrowRight, ScanLine, Settings, Smartphone } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { brand } from "./brand";
import { asset, BrandLogo } from "./components/brand";
import { CustomerApp } from "./customer/CustomerApp";
import { KasaApp } from "./panel/Kasa";
import { YonetimApp } from "./panel/Yonetim";
import { useRoute } from "./store/store";

export default function App() {
  const [parts, go] = useRoute();
  const [area] = parts;
  // Eski panel bağlantıları kasaya yönlenir.
  useEffect(() => {
    if (area === "panel") go("kasa");
  }, [area, go]);
  return (
    <>
      <DemoBar />
      {area === "app" ? <CustomerApp go={go} /> : area === "kasa" || area === "panel" ? <KasaApp go={go} /> : area === "yonetim" ? <YonetimApp go={go} /> : <Landing go={go} />}
    </>
  );
}

/** Tüm ekranlarda görünen demo uyarısı. Yüksekliği --demo-bar değişkeniyle düzende hesaba katılır. */
function DemoBar() {
  return (
    <div role="note" className="sticky top-0 z-[90] flex h-[var(--demo-bar)] items-center justify-center gap-2 bg-cream px-3 text-center text-[11px] font-semibold leading-tight text-ink">
      <span className="rounded bg-beef px-1.5 py-px tracking-[0.12em] text-ink">DEMO</span>
      <span className="min-w-0 truncate sm:hidden">Gerçek uygulama değil · Bilgiler gönderilmez</span>
      <span className="hidden min-w-0 truncate sm:inline">Gerçek THE BEEF uygulaması değildir · Girilen bilgiler hiçbir yere gönderilmez, yalnızca bu tarayıcıda kalır</span>
    </div>
  );
}

function Landing({ go }: { go: (p: string) => void }) {
  return (
    <div className="relative min-h-[calc(100%-var(--demo-bar))] overflow-hidden bg-beef px-4 py-8 text-cream sm:px-8">
      <div className="relative mx-auto grid min-h-[calc(100dvh-90px)] max-w-5xl content-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,340px)] md:items-center">
        <div className="flex min-w-0 flex-col gap-7">
          <BrandLogo size={72} className="ring-2 ring-cream/70" />
          <div>
            <div className="t-label text-ink/70">Sadakat uygulaması · demo</div>
            <h1 className="t-display mt-2 text-[clamp(40px,6vw,64px)] leading-[1.02]">
              Her sipariş
              <br />
              <span className="t-outline">bir damga</span>
            </h1>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-ink/80">
              Müşteri uygulaması ve kasayı aynı tarayıcıda iki sekmede açın: kasada verilen damga, müşteri kartında anında görünür. Veriler yalnızca bu tarayıcıda tutulur; telefon ile tablet arasında paylaşılmaz. Gerçek SMS, kamera ile QR okutma ve veritabanı yoktur.
            </p>
          </div>
          <div className="grid max-w-xl gap-2.5">
            <Choice onClick={() => go("app")} icon={<Smartphone className="h-6 w-6 text-beef" />} title="Müşteri uygulaması" sub="Kart, damgalar ve QR kod tek ekranda" dark />
            <Choice onClick={() => go("kasa")} icon={<ScanLine className="h-6 w-6 text-beef" />} title="Kasa" sub="QR okut, tek dokunuşla damga ya da ödül" />
            <Choice onClick={() => go("yonetim")} icon={<Settings className="h-6 w-6 text-beef" />} title="Yönetim" sub="Müşteri düzeltme, personel, program" />
          </div>
          <p className="text-[12px] text-ink/65">Logo ve fotoğraflar {brand.instagram} hesabından alınmıştır.</p>
        </div>
        <img src={asset(brand.images.hero.src)} alt={brand.images.hero.alt} className="hidden aspect-[3/4] w-full rounded-3xl object-cover md:block" />
      </div>
    </div>
  );
}

function Choice({ onClick, icon, title, sub, dark }: { onClick: () => void; icon: ReactNode; title: string; sub: string; dark?: boolean }) {
  return (
    <button onClick={onClick} className={`group flex items-center gap-4 rounded-2xl p-4 text-left ${dark ? "bg-ink text-cream" : "bg-cream text-ink"}`}>
      {icon}
      <span className="flex-1">
        <span className="t-h1 block text-[18px]">{title}</span>
        <span className={`mt-0.5 block text-[14px] ${dark ? "text-smoke" : "text-ink/65"}`}>{sub}</span>
      </span>
      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
    </button>
  );
}
