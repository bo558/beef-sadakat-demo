import { ArrowRight, LayoutDashboard, Smartphone } from "lucide-react";
import { asset, BrandLogo } from "./components/brand";
import { CustomerApp } from "./customer/CustomerApp";
import { PanelApp } from "./panel/PanelApp";
import { useRoute } from "./store/store";

export default function App() {
  const [parts, go] = useRoute();
  const [area, sub = "", param] = parts;
  return (
    <>
      <DemoBar />
      {area === "app" ? <CustomerApp sub={sub} go={go} /> : area === "panel" ? <PanelApp sub={sub} param={param} go={go} /> : <Landing go={go} />}
    </>
  );
}

/** Tüm ekranlarda görünen demo uyarısı. Yüksekliği --demo-bar değişkeniyle düzende hesaba katılır. */
function DemoBar() {
  return (
    <div
      role="note"
      className="sticky top-0 z-[90] flex h-[var(--demo-bar)] items-center justify-center gap-2 bg-cream px-3 text-center text-[10.5px] font-semibold leading-tight text-ink sm:text-[11px]"
    >
      <span className="rounded bg-beef px-1.5 py-px tracking-[0.12em] text-ink">DEMO</span>
      <span className="min-w-0 truncate sm:hidden">Gerçek uygulama değil · Bilgiler gönderilmez</span>
      <span className="hidden min-w-0 truncate sm:inline">Gerçek THE BEEF uygulaması değildir · Girilen bilgiler hiçbir yere gönderilmez</span>
    </div>
  );
}

/* Giriş: logo karosu gibi turuncu zemin; afişlerdeki gibi dolu + konturlu başlık. */
function Landing({ go }: { go: (p: string) => void }) {
  return (
    <div className="relative min-h-[calc(100%-var(--demo-bar))] overflow-hidden bg-beef px-4 py-8 text-cream sm:px-8">
      <div className="relative mx-auto grid min-h-[calc(100dvh-80px)] max-w-5xl content-between gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,360px)] md:items-center">
        <div className="flex min-w-0 flex-col gap-8">
          <div className="self-start">
            <BrandLogo size="lg" onBrand />
          </div>
          <div>
            <div className="t-label text-ink/70">Sadakat uygulaması · etkileşimli prototip</div>
            <h1 className="t-display mt-2 text-[clamp(38px,6vw,64px)] leading-[1.02]">
              Her burger
              <br />
              <span className="t-outline">bir damga!</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink/80">
              Müşteri uygulaması ve işletme paneli aynı örnek veriyi paylaşır. Panelde verilen damga, müşteri kartında anında görünür. Gerçek veritabanı, SMS veya kasa bağlantısı yoktur.
            </p>
            <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
              <button onClick={() => go("app")} className="group flex items-center gap-3.5 rounded-xl bg-ink p-4 text-left text-cream">
                <Smartphone className="h-6 w-6 shrink-0 text-beef" />
                <span className="flex-1">
                  <span className="t-h2 block text-[17px]">Müşteri uygulaması</span>
                  <span className="mt-0.5 block text-xs text-smoke">Kayıt, dijital kart, QR, ödüller, geçmiş, profil</span>
                </span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button onClick={() => go("panel/kasa")} className="group flex items-center gap-3.5 rounded-xl bg-cream p-4 text-left text-ink">
                <LayoutDashboard className="h-6 w-6 shrink-0 text-beef" />
                <span className="flex-1">
                  <span className="t-h2 block text-[17px]">İşletme paneli</span>
                  <span className="mt-0.5 block text-xs text-ink/65">Kasa, müşteriler, işlemler, kampanya, şubeler</span>
                </span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
            <p className="mt-4 text-[11px] text-ink/65">Logo ve fotoğraflar @thebeef.burger hesabından alınmıştır.</p>
          </div>
        </div>
        <img src={asset("brand/burger-yakin.jpg")} alt="THE BEEF burger, yakın çekim" className="hidden aspect-[3/4] w-full rounded-2xl object-cover md:block" />
      </div>
    </div>
  );
}
