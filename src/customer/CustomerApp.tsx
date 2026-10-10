import { Gift, History, House, LayoutDashboard, QrCode, RotateCcw, Sparkles, Ticket, Wand2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { asset, BrandLogo, Toasts } from "../components/brand";
import { balanceOf, earnStamp, initials } from "../data/engine";
import { useStore } from "../store/store";
import { Onboarding } from "./Onboarding";
import { CardScreen, HistoryScreen, HomeScreen, ProfileScreen, QrScreen, RewardsScreen, type ScreenProps } from "./screens";

const TABS = [
  { key: "", label: "Ana sayfa", icon: House },
  { key: "kart", label: "Kartım", icon: Ticket },
  { key: "qr", label: "QR", icon: QrCode },
  { key: "odul", label: "Ödüller", icon: Gift },
  { key: "gecmis", label: "Geçmiş", icon: History },
] as const;

export function CustomerApp({ sub, go }: { sub: string; go: (p: string) => void }) {
  return (
    <div className="min-h-[calc(100%-var(--demo-bar))] bg-[#0f0e0d] lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-10 lg:px-8 lg:py-8">
      <aside className="hidden lg:block lg:justify-self-end">
        <SideInfo go={go} />
      </aside>
      <PhoneFrame>
        <AppInner sub={sub} go={(p) => go(`app${p ? `/${p}` : ""}`)} rootGo={go} />
      </PhoneFrame>
      <aside className="hidden lg:block">
        <DemoDock go={go} />
      </aside>
    </div>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-[calc(100dvh-var(--demo-bar))] w-full overflow-hidden bg-ink lg:h-[min(860px,calc(100dvh-64px-var(--demo-bar)))] lg:w-[400px] lg:rounded-[48px] lg:ring-[10px] lg:ring-ink-3 lg:shadow-[0_40px_120px_-30px_rgba(226,86,1,0.35)]">
      {children}
    </div>
  );
}

function AppInner({ sub, go, rootGo }: { sub: string; go: (p: string) => void; rootGo: (p: string) => void }) {
  const { state, update, toast } = useStore();
  const me = state.customers.find((c) => c.id === state.session.customerId);
  const scroller = useRef<HTMLDivElement>(null);
  const bal = me ? balanceOf(state, me.id) : 0;
  const prevBal = useRef(bal);
  const [fresh, setFresh] = useState<number | null>(null);

  useEffect(() => {
    if (bal > prevBal.current) {
      setFresh(bal - 1);
      const t = setTimeout(() => setFresh(null), 1200);
      prevBal.current = bal;
      return () => clearTimeout(t);
    }
    prevBal.current = bal;
  }, [bal]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [sub]);

  if (!me)
    return (
      <div className="no-scrollbar h-full overflow-y-auto">
        <Onboarding />
      </div>
    );

  const newGrant = state.grants.find((g) => g.customerId === me.id && !state.session.seenGrantIds.includes(g.id));
  const demoScan = () =>
    update((s) => {
      const out = earnStamp(s, {
        customerId: me.id,
        branchId: s.panel.branchId,
        staffId: s.panel.staffId,
        receiptNo: `DEMO-${Math.floor(Math.random() * 90000 + 10000)}`,
        amount: s.rules.minSpend + 120,
        ignoreCooldown: true,
      });
      if (!out.result.ok) toast(out.result.error, "bad");
      else if (!out.result.rewardGrantId) toast("+1 damga! Kartın güncellendi.");
      return out.state;
    });

  const props: ScreenProps = { me, go, freshIndex: fresh };
  const screen =
    sub === "kart" ? (
      <CardScreen {...props} />
    ) : sub === "qr" ? (
      <QrScreen {...props} onDemoScan={demoScan} />
    ) : sub === "odul" ? (
      <RewardsScreen {...props} />
    ) : sub === "gecmis" ? (
      <HistoryScreen {...props} />
    ) : sub === "profil" ? (
      <ProfileScreen {...props} />
    ) : (
      <HomeScreen {...props} />
    );

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between px-4 pb-2 pt-[max(10px,env(safe-area-inset-top))]">
        <button onClick={() => go("")} aria-label="Ana sayfa">
          <BrandLogo size="sm" />
        </button>
        <div className="flex items-center gap-2">
          <MobileDemo go={rootGo} />
          <button
          onClick={() => go("profil")}
          className={`grid h-9 w-9 place-items-center rounded-full font-display text-[13px] font-semibold ${sub === "profil" ? "bg-beef text-ink" : "bg-ink-2 text-cream ring-1 ring-ink-line"}`}
          aria-label="Profil"
        >
          {initials(me.name)}
          </button>
        </div>
      </header>
      <main ref={scroller} className="no-scrollbar flex-1 overflow-y-auto pb-24" key={sub}>
        <div className="animate-rise">{screen}</div>
      </main>
      <nav className="absolute inset-x-0 bottom-0 border-t border-ink-line bg-ink/95 px-2 pb-[max(6px,env(safe-area-inset-bottom))] pt-1 backdrop-blur" aria-label="Ana menü">
        <ul className="grid grid-cols-5">
          {TABS.map((t) => {
            const active = sub === t.key || (t.key === "" && !sub);
            const Icon = t.icon;
            if (t.key === "qr")
              return (
                <li key={t.key} className="grid place-items-center">
                  <button
                    onClick={() => go("qr")}
                    className={`-mt-5 grid h-[52px] w-[52px] place-items-center rounded-full ring-4 ring-ink transition-transform active:scale-95 ${active ? "bg-white text-ink" : "bg-beef text-ink"}`}
                    aria-label="QR kodumu göster"
                    aria-current={active ? "page" : undefined}
                  >
                    <QrCode className="h-6 w-6" />
                  </button>
                </li>
              );
            return (
              <li key={t.key}>
                <button
                  onClick={() => go(t.key)}
                  className={`flex h-12 w-full flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium ${active ? "text-beef" : "text-smoke"}`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-5 w-5" />
                  {t.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      {newGrant && (
        <Celebration
          rewardName={state.rewards.find((r) => r.id === newGrant.rewardId)?.name ?? "Ödül"}
          onClose={(toRewards) => {
            update((s) => ({ ...s, session: { ...s.session, seenGrantIds: [...s.session.seenGrantIds, newGrant.id] } }));
            if (toRewards) go("odul");
          }}
        />
      )}
      <div className="absolute inset-x-0 top-0 z-[60]">
        <Toasts />
      </div>
    </div>
  );
}

function Celebration({ rewardName, onClose }: { rewardName: string; onClose: (toRewards: boolean) => void }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col overflow-hidden bg-beef text-ink" role="dialog" aria-modal aria-label="Ödül kazandın">
      <div className="burst absolute left-1/2 top-[38%] h-[170%] w-[170%] -translate-x-1/2 -translate-y-1/2" aria-hidden />
      <button onClick={() => onClose(false)} className="absolute right-4 top-6 z-10 grid h-10 w-10 place-items-center rounded-full bg-ink/10" aria-label="Kapat">
        <X className="h-5 w-5" />
      </button>
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="animate-pop relative">
          <img src={asset("brand/burger-yakin.jpg")} alt="" className="h-36 w-36 rounded-full object-cover ring-[6px] ring-ink" />
          <span className="absolute -right-1 -top-1 grid h-11 w-11 rotate-12 place-items-center rounded-full bg-ink text-beef">
            <Sparkles className="h-5 w-5" />
          </span>
        </div>
        <div className="t-label mt-6">Kart doldu</div>
        <h2 className="t-display mt-1.5 text-[34px] text-cream">
          Menün
          <br />
          bizden!
        </h2>
        <p className="mt-2.5 max-w-[16rem] text-sm font-medium">{rewardName} ödülün Ödüllerim'e eklendi. Kartın yeniden başladı.</p>
      </div>
      <div className="relative grid gap-2 px-6 pb-[max(24px,env(safe-area-inset-bottom))]">
        <button onClick={() => onClose(true)} className="h-12 rounded-xl bg-ink text-sm font-semibold text-beef">
          Ödülümü gör
        </button>
        <button onClick={() => onClose(false)} className="h-11 rounded-xl text-sm font-semibold">
          Sonra
        </button>
      </div>
    </div>
  );
}

/* -------- Masaüstünde telefonun yanındaki açıklama ve demo kontrolleri -------- */
function SideInfo({ go }: { go: (p: string) => void }) {
  return (
    <div className="max-w-[300px] text-cream">
      <div className="t-label text-beef">Müşteri uygulaması · prototip</div>
      <h1 className="t-display mt-2 text-[32px]">The Beef <span className="text-beef">Kart</span></h1>
      <p className="mt-3 text-[13px] leading-relaxed text-smoke">
        Mobil öncelikli PWA prototipi. Tüm veriler örnektir ve yalnızca bu tarayıcıda saklanır. SMS, veritabanı ve kasa bağlantısı yoktur.
      </p>
      <div className="mt-6 grid gap-2">
        <button onClick={() => go("panel/kasa")} className="flex h-10 items-center gap-2 rounded-lg bg-white px-3.5 text-[13px] font-semibold text-ink">
          <LayoutDashboard className="h-4 w-4" /> İşletme paneline geç
        </button>
        <a href="#/panel/kasa" target="_blank" rel="noreferrer" className="flex h-10 items-center gap-2 rounded-lg px-3.5 text-[13px] font-medium text-smoke ring-1 ring-ink-line hover:text-cream">
          Paneli yeni sekmede aç (canlı senkron)
        </a>
      </div>
    </div>
  );
}

function useDemoActions() {
  const { state, update, reset, toast, loginDemo } = useStore();
  const me = state.customers.find((c) => c.id === state.session.customerId);
  const add = (n: number) =>
    update((s) => {
      let cur = s;
      for (let i = 0; i < n; i++) {
        const out = earnStamp(cur, {
          customerId: me!.id,
          branchId: cur.panel.branchId,
          staffId: cur.panel.staffId,
          receiptNo: `DEMO-${Date.now().toString().slice(-6)}${i}`,
          amount: cur.rules.minSpend + 150,
          ignoreCooldown: true,
        });
        cur = out.state;
      }
      return cur;
    });
  const fill = () => {
    const left = state.rules.stampsRequired - balanceOf(state, me!.id);
    add(Math.max(1, left));
  };
  return { me, add, fill, reset: () => (reset(), toast("Demo sıfırlandı.", "info")), loginDemo };
}

function DemoDock({ go }: { go: (p: string) => void }) {
  const { me, add, fill, reset, loginDemo } = useDemoActions();
  return (
    <div className="w-[240px] rounded-2xl bg-ink-2 p-4 text-cream ring-1 ring-ink-line">
      <div className="t-label flex items-center gap-2 text-beef">
        <Wand2 className="h-4 w-4" /> Demo kontrolleri
      </div>
      {me ? (
        <div className="mt-4 grid gap-2">
          <DemoBtn onClick={() => add(1)}>+1 damga ekle</DemoBtn>
          <DemoBtn onClick={fill}>Kartı doldur → ödül</DemoBtn>
          <DemoBtn onClick={() => go("app/qr")}>QR ekranını aç</DemoBtn>
          <DemoBtn onClick={() => go("panel/kasa")}>Kasada okut (panel)</DemoBtn>
        </div>
      ) : (
        <div className="mt-4 grid gap-2">
          <p className="text-sm text-smoke">Kayıt akışını dene ya da örnek üyeyle gir.</p>
          <DemoBtn onClick={loginDemo}>Örnek üye ile gir</DemoBtn>
        </div>
      )}
      <button onClick={reset} className="mt-4 flex items-center gap-2 text-xs font-bold text-smoke hover:text-cream">
        <RotateCcw className="h-3.5 w-3.5" /> Demoyu sıfırla
      </button>
    </div>
  );
}

function DemoBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="h-10 rounded-lg bg-ink-3 px-3.5 text-left text-[13px] font-medium hover:bg-beef hover:text-ink">
      {children}
    </button>
  );
}

function MobileDemo({ go }: { go: (p: string) => void }) {
  const [open, setOpen] = useState(false);
  const { me, add, fill, reset, loginDemo } = useDemoActions();
  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 items-center gap-1.5 rounded-full bg-ink-3 px-2.5 text-[11px] font-semibold text-beef ring-1 ring-beef/30"
        aria-label="Demo kontrollerini aç"
      >
        <Wand2 className="h-3.5 w-3.5" /> Demo
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/60" onClick={() => setOpen(false)}>
          <div className="animate-rise w-full rounded-t-3xl bg-ink-2 p-5 pb-[max(20px,env(safe-area-inset-bottom))] ring-1 ring-ink-line" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="t-label text-beef">Demo kontrolleri</div>
              <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-ink-3" aria-label="Kapat">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {me ? (
                <>
                  <DemoBtn onClick={() => (add(1), setOpen(false))}>+1 damga</DemoBtn>
                  <DemoBtn onClick={() => (fill(), setOpen(false))}>Kartı doldur</DemoBtn>
                  <DemoBtn onClick={() => go("panel/kasa")}>İşletme paneli</DemoBtn>
                  <DemoBtn onClick={() => (reset(), setOpen(false))}>Sıfırla</DemoBtn>
                </>
              ) : (
                <>
                  <DemoBtn onClick={() => (loginDemo(), setOpen(false))}>Örnek üye</DemoBtn>
                  <DemoBtn onClick={() => go("panel")}>İşletme paneli</DemoBtn>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
