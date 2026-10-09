import { ArrowRight, LayoutDashboard, Smartphone } from "lucide-react";
import { asset, LogoPlaceholder } from "./components/brand";
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
      className="sticky top-0 z-[90] flex h-[var(--demo-bar)] items-center justify-center gap-2 bg-wall-pink px-3 text-center text-[11px] font-extrabold leading-tight text-white sm:text-xs"
    >
      <span className="rounded bg-white/20 px-1.5 py-0.5 tracking-[0.12em]">DEMO</span>
      <span className="min-w-0 truncate sm:hidden">Gerçek uygulama değil · Bilgiler gönderilmez</span>
      <span className="hidden min-w-0 truncate sm:inline">Gerçek BEEF uygulaması değildir · Girilen bilgiler hiçbir yere gönderilmez</span>
    </div>
  );
}

function Landing({ go }: { go: (p: string) => void }) {
  return (
    <div className="relative min-h-[calc(100%-var(--demo-bar))] overflow-hidden bg-ink px-4 py-10 text-white sm:px-8">
      <img src={asset("brand/dis-cephe.jpg")} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/85 to-ink" />
      <div className="relative mx-auto flex min-h-[calc(100dvh-80px)] max-w-5xl flex-col">
        <div className="self-start">
          <LogoPlaceholder />
        </div>
        <div className="mt-auto pt-16">
          <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-beef">Sadakat uygulaması · etkileşimli prototip</div>
          <h1 className="mt-3 max-w-3xl font-display text-[clamp(48px,9vw,104px)] uppercase leading-[1.02]">
            Her burger
            <br />
            <span className="text-beef">bir damga.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-smoke">
            Müşteri uygulaması ve işletme paneli aynı örnek veriyi paylaşır. Panelde verilen damga, müşteri kartında anında görünür. Gerçek veritabanı, SMS veya kasa bağlantısı yoktur.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <button onClick={() => go("app")} className="group flex items-center gap-5 rounded-3xl bg-beef p-6 text-left text-ink">
              <Smartphone className="h-10 w-10 shrink-0" />
              <span className="flex-1">
                <span className="block font-display text-3xl uppercase leading-none">Müşteri uygulaması</span>
                <span className="mt-1 block text-sm font-semibold text-ink/70">Kayıt, dijital kart, QR, ödüller, geçmiş, profil</span>
              </span>
              <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
            </button>
            <button onClick={() => go("panel/kasa")} className="group flex items-center gap-5 rounded-3xl bg-white p-6 text-left text-ink">
              <LayoutDashboard className="h-10 w-10 shrink-0" />
              <span className="flex-1">
                <span className="block font-display text-3xl uppercase leading-none">İşletme paneli</span>
                <span className="mt-1 block text-sm font-semibold text-ink/70">Kasa, müşteriler, işlemler, kampanya, şubeler</span>
              </span>
              <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
          <p className="mt-6 text-xs text-smoke">Logo yer tutucudur; orijinal boynuzlu BEEF BURGER logosunun vektör dosyası bekleniyor. Fotoğraflar BEEF'in Instagram hesabından alınmıştır.</p>
        </div>
      </div>
    </div>
  );
}
