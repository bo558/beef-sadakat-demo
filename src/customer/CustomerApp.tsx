import { ChevronDown, ExternalLink, Gift, LogOut, Maximize2, RotateCcw, ScanLine, Settings2, Sparkles, Trash2, Wand2, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { brand } from "../brand";
import { asset, BrandLogo, QrImage, Sheet, StampCard, Toasts } from "../components/brand";
import { DEMO_STAFF_ID, REWARD_VALID_DAYS } from "../data/defaults";
import {
  availableGrants,
  backupCode,
  balanceOf,
  daysLeft,
  deleteCustomer,
  earnStamp,
  firstName,
  fmtDate,
  initials,
  maskPhone,
  qrPayload,
  qrWindow,
  QR_WINDOW_MS,
} from "../data/engine";
import type { Customer } from "../data/types";
import { useStore } from "../store/store";
import { Onboarding } from "./Onboarding";

export function CustomerApp({ go }: { go: (p: string) => void }) {
  return (
    <div className="min-h-[calc(100%-var(--demo-bar))] bg-[#0f0e0d] lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-10 lg:px-8 lg:py-8">
      <aside className="hidden lg:block lg:justify-self-end">
        <SideInfo />
      </aside>
      <div className="relative h-[calc(100dvh-var(--demo-bar))] w-full overflow-hidden bg-ink lg:h-[min(860px,calc(100dvh-64px-var(--demo-bar)))] lg:w-[400px] lg:rounded-[48px] lg:ring-[10px] lg:ring-ink-3 lg:shadow-[0_40px_120px_-30px_rgba(226,86,1,0.35)]">
        <AppInner go={go} />
      </div>
      <aside className="hidden lg:block">
        <DemoDock go={go} />
      </aside>
    </div>
  );
}

function AppInner({ go }: { go: (p: string) => void }) {
  const { state, update, toast } = useStore();
  const me = state.customers.find((c) => c.id === state.session.customerId);
  const [account, setAccount] = useState(false);
  const [demo, setDemo] = useState(false);
  const fresh = useCardEvents(me);
  // Üye değişince (çıkış, başka üyeyle giriş) açık paneller kapanır.
  useEffect(() => {
    setAccount(false);
    setDemo(false);
  }, [me?.id]);

  if (!me)
    return (
      <div className="no-scrollbar h-full overflow-y-auto">
        <Onboarding />
        <div className="absolute inset-x-0 top-0 z-[60]">
          <Toasts />
        </div>
      </div>
    );

  const newGrant = state.grants.find((g) => g.customerId === me.id && g.status !== "void" && !state.session.seenGrantIds.includes(g.id));
  const markSeen = (id: string) => update((s) => ({ ...s, session: { ...s.session, seenGrantIds: [...s.session.seenGrantIds, id] } }));

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between px-4 pb-1 pt-[max(12px,env(safe-area-inset-top))]">
        <BrandLogo size={40} />
        <div className="flex items-center gap-2">
          <button onClick={() => setDemo(true)} className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold text-beef ring-1 ring-beef/35 lg:hidden" aria-label="Demo kontrollerini aç">
            <Wand2 className="h-3.5 w-3.5" /> Demo
          </button>
          <button onClick={() => setAccount(true)} className="grid h-10 w-10 place-items-center rounded-full bg-ink-2 font-display text-[14px] text-cream ring-1 ring-ink-line" aria-label="Hesabım">
            {initials(me.name)}
          </button>
        </div>
      </header>
      <main className="no-scrollbar flex-1 overflow-y-auto">
        <CardScreen me={me} freshIndex={fresh} />
      </main>

      {account && <AccountSheet me={me} onClose={() => setAccount(false)} />}
      {demo && (
        <Sheet label="Demo kontrolleri" onClose={() => setDemo(false)}>
          <DemoActions go={go} onDone={() => setDemo(false)} />
        </Sheet>
      )}
      {newGrant && <Celebration rewardName={newGrant.rewardName} onClose={() => (markSeen(newGrant.id), toast("Ödülün QR ekranında seni bekliyor."))} />}
      <div className="absolute inset-x-0 top-0 z-[60]">
        <Toasts />
      </div>
    </div>
  );
}

/** Damga eklenince kartta animasyon ve kısa bildirim; ödül kullanılınca "afiyet olsun". */
function useCardEvents(me: Customer | undefined) {
  const { state, toast } = useStore();
  const bal = me ? balanceOf(state, me.id) : 0;
  const avail = me ? availableGrants(state, me.id).map((g) => g.id) : [];
  const prev = useRef({ id: me?.id, bal, avail });
  const [fresh, setFresh] = useState<number | null>(null);
  const availKey = avail.join(",");

  useEffect(() => {
    const p = prev.current;
    prev.current = { id: me?.id, bal, avail };
    if (!me || p.id !== me.id) return;
    const gained = avail.filter((id) => !p.avail.includes(id)).length;
    const lost = state.grants.filter((g) => p.avail.includes(g.id) && !avail.includes(g.id));
    if (lost.some((g) => g.status === "void")) {
      toast("Kartında bir düzeltme yapıldı.", "info");
      return;
    }
    if (bal > p.bal && !gained) {
      toast(`+${bal - p.bal} damga! Kartın güncellendi.`);
      setFresh(bal - 1);
      const t = setTimeout(() => setFresh(null), 1200);
      return () => clearTimeout(t);
    }
    if (lost.some((g) => g.status === "redeemed")) toast("Afiyet olsun! Ödülün kullanıldı.");
    else if (bal < p.bal && !gained) toast("Kartında bir düzeltme yapıldı.", "info");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id, bal, availKey]);
  return fresh;
}

/* ---------------- KARTIM: kart + QR tek ekranda ---------------- */
function CardScreen({ me, freshIndex }: { me: Customer; freshIndex: number | null }) {
  const { state } = useStore();
  const r = state.rules;
  const bal = balanceOf(state, me.id);
  const avail = availableGrants(state, me.id);
  const left = r.stampsRequired - bal;
  const [big, setBig] = useState(false);

  return (
    <div className="px-4 pb-8 pt-2">
      <p className="text-[14px] text-smoke">Selam {firstName(me.name)}</p>
      <h1 className="t-display mt-0.5 text-balance">
        {avail.length > 0 ? (
          <>
            <span className="text-beef">{avail[0]!.rewardName}</span> hazır!
          </>
        ) : left === 1 ? (
          <>
            Son <span className="text-beef">1 damga</span> kaldı
          </>
        ) : (
          <>
            Menüne <span className="text-beef">{left} damga</span> kaldı
          </>
        )}
      </h1>

      <div className="mt-4">
        <StampCard stamps={bal} required={r.stampsRequired} rewardName={r.rewardName} freshIndex={freshIndex} />
      </div>

      <QrCard me={me} onExpand={() => setBig(true)} rewardName={avail[0]?.rewardName} rewardCount={avail.length} rewardDays={avail[0] ? daysLeft(avail[0].expiresAt) : 0} />

      {big && <QrFull me={me} onClose={() => setBig(false)} />}
    </div>
  );
}

function useQrTick() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return { win: qrWindow(now), remain: QR_WINDOW_MS - (now % QR_WINDOW_MS) };
}

function QrCard({ me, onExpand, rewardName, rewardCount, rewardDays }: { me: Customer; onExpand: () => void; rewardName?: string; rewardCount: number; rewardDays: number }) {
  const { win, remain } = useQrTick();
  const code = backupCode(me.id, win);
  return (
    <section className="mt-4 overflow-hidden rounded-[22px] bg-white text-ink">
      {rewardName ? (
        <div className="flex items-center gap-3 bg-ink px-4 py-3 text-cream ring-1 ring-inset ring-beef/40">
          <img src={asset(brand.images.reward)} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold">
              {rewardName} hazır{rewardCount > 1 ? ` · ${rewardCount} ödül` : ""}
            </div>
            <div className="text-[13px] text-smoke">Kasada bu QR'ı göster · son {rewardDays} gün</div>
          </div>
          <Gift className="h-5 w-5 shrink-0 text-beef" />
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 pt-3.5">
          <span className="t-label text-ink/55">Kasada okut</span>
          <span className="text-[13px] text-ink/55">Sipariş başına 1 damga</span>
        </div>
      )}
      <button onClick={onExpand} className="group relative mx-auto mt-3 block" aria-label="QR kodunu büyüt">
        <QrImage value={qrPayload(me.id, win)} size={176} />
        <span className="absolute -right-7 bottom-0 grid h-7 w-7 place-items-center rounded-full bg-ink/5 text-ink/50 group-hover:text-ink">
          <Maximize2 className="h-3.5 w-3.5" />
        </span>
      </button>
      <div className="px-4 pb-4 pt-2 text-center">
        <div className="font-display text-[28px] tracking-[0.14em] tabular" aria-live="polite">
          {code.slice(0, 3)} {code.slice(3)}
        </div>
        <div className="text-[13px] text-ink/55">Okunmazsa bu kodu söyle · kod her dakika yenilenir</div>
        <div className="mx-auto mt-2.5 h-1 max-w-[176px] overflow-hidden rounded-full bg-ink/10" aria-hidden>
          <div className="h-full bg-beef transition-[width] duration-1000 ease-linear" style={{ width: `${(remain / QR_WINDOW_MS) * 100}%` }} />
        </div>
      </div>
    </section>
  );
}

function QrFull({ me, onClose }: { me: Customer; onClose: () => void }) {
  const { win } = useQrTick();
  const code = backupCode(me.id, win);
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white px-6 text-center text-ink" role="dialog" aria-modal aria-label="QR kodu" onClick={onClose}>
      <button onClick={onClose} className="absolute right-4 top-[max(16px,env(safe-area-inset-top))] grid h-11 w-11 place-items-center rounded-full bg-ink/5" aria-label="Kapat">
        <X className="h-5 w-5" />
      </button>
      <BrandLogo size={52} />
      <div className="mt-3 text-[15px] font-semibold">{me.name}</div>
      <div className="mt-5">
        <QrImage value={qrPayload(me.id, win)} size={260} />
      </div>
      <div className="mt-4 font-display text-[36px] tracking-[0.14em] tabular">
        {code.slice(0, 3)} {code.slice(3)}
      </div>
      <p className="mt-2 text-[14px] text-ink/55">Ekran parlaklığını artırmak okutmayı hızlandırır.</p>
    </div>
  );
}

/* ---------------- HESAP (alt panel) ---------------- */
function AccountSheet({ me, onClose }: { me: Customer; onClose: () => void }) {
  const { state, update, toast } = useStore();
  const [open, setOpen] = useState<"rules" | "kvkk" | "delete" | null>(null);
  const r = state.rules;
  const toggle = (k: typeof open) => setOpen(open === k ? null : k);
  return (
    <Sheet label="Hesabım" onClose={onClose}>
      <div className="flex items-center gap-3 pr-10">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-beef font-display text-[16px] text-ink">{initials(me.name)}</div>
        <div className="min-w-0">
          <div className="t-h1 truncate">{me.name}</div>
          <div className="text-[13px] text-smoke tabular">
            {maskPhone(me.phone)} · {fmtDate(me.joinedAt)}'den beri üye
          </div>
        </div>
      </div>
      <div className="mt-5 divide-y divide-ink-line overflow-hidden rounded-2xl bg-ink ring-1 ring-ink-line">
        <Row title="Program kuralları" onClick={() => toggle("rules")} open={open === "rules"}>
          <ul className="grid gap-1.5 text-[14px] text-cream/85">
            <li>• Her siparişte 1 damga kazanırsın.</li>
            <li>
              • {r.stampsRequired} damga = 1 {r.rewardName}.
            </li>
            <li>• Ödül, kart dolduktan sonra {REWARD_VALID_DAYS} gün geçerlidir.</li>
            <li>• Damgaların silinmez.</li>
            <li>• Aynı siparişe ikinci damga verilmez.</li>
          </ul>
        </Row>
        <Row title="KVKK aydınlatma metni" onClick={() => toggle("kvkk")} open={open === "kvkk"}>
          <p className="text-[14px] text-smoke">Hukuki metin hazırlanma aşamasında. Onay tarihin: {fmtDate(me.kvkkAt)}.</p>
        </Row>
        <button onClick={() => update((s) => ({ ...s, session: { ...s.session, customerId: null } }))} className="flex h-14 w-full items-center gap-3 px-4 text-left text-[15px] font-medium">
          <LogOut className="h-4 w-4 text-smoke" /> Çıkış yap
        </button>
        <Row title="Hesabımı sil" danger onClick={() => toggle("delete")} open={open === "delete"}>
          <p className="text-[14px] text-smoke">Ad, telefon, damga ve ödüllerin silinir; bu işlem geri alınamaz. Demo: yalnızca bu tarayıcıdaki örnek veriden silinir.</p>
          <button
            onClick={() => {
              update((s) => deleteCustomer(s, me.id));
              toast("Hesabın silindi.", "info");
            }}
            className="mt-3 h-12 w-full rounded-xl bg-bad text-[15px] font-semibold text-cream"
          >
            Hesabımı kalıcı olarak sil
          </button>
        </Row>
      </div>
    </Sheet>
  );
}

function Row({ title, onClick, open, danger, children }: { title: string; onClick: () => void; open: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <div>
      <button onClick={onClick} aria-expanded={open} className={`flex h-14 w-full items-center gap-3 px-4 text-left text-[15px] font-medium ${danger ? "text-alert" : ""}`}>
        {danger ? <Trash2 className="h-4 w-4" /> : <Settings2 className="h-4 w-4 text-smoke" />}
        <span className="flex-1">{title}</span>
        <ChevronDown className={`h-4 w-4 text-smoke transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

/* ---------------- KUTLAMA ---------------- */
function Celebration({ rewardName, onClose }: { rewardName: string; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col overflow-hidden bg-beef text-ink" role="dialog" aria-modal aria-label="Ödül kazandın">
      <div className="burst absolute left-1/2 top-[38%] h-[170%] w-[170%] -translate-x-1/2 -translate-y-1/2" aria-hidden />
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="animate-pop relative">
          <img src={asset(brand.images.hero.src)} alt="" className="h-36 w-36 rounded-full object-cover ring-[6px] ring-ink" />
          <span className="absolute -right-1 -top-1 grid h-11 w-11 rotate-12 place-items-center rounded-full bg-ink text-beef">
            <Sparkles className="h-5 w-5" />
          </span>
        </div>
        <div className="t-label mt-6">Kartın doldu</div>
        <h2 className="t-display mt-1.5 text-[38px] text-cream">
          {rewardName}
          <br />
          bizden!
        </h2>
        <p className="mt-3 max-w-[17rem] text-[15px] font-medium">Bir sonraki siparişinde kasada QR'ını göstermen yeterli.</p>
      </div>
      <div className="relative px-6 pb-[max(24px,env(safe-area-inset-bottom))]">
        <button onClick={onClose} className="h-14 w-full rounded-2xl bg-ink text-[15px] font-semibold text-beef">
          Harika!
        </button>
      </div>
    </div>
  );
}

/* ---------------- DEMO ---------------- */
function useDemoActions() {
  const { state, update, reset, toast, loginDemo } = useStore();
  const me = state.customers.find((c) => c.id === state.session.customerId);
  const add = (n: number) =>
    update((s) => {
      let cur = s;
      for (let i = 0; i < n; i++) cur = earnStamp(cur, { customerId: me!.id, staffId: DEMO_STAFF_ID, ignoreCooldown: true }).state;
      return cur;
    });
  const fill = () => add(Math.max(1, state.rules.stampsRequired - balanceOf(state, me!.id)));
  return { me, add, fill, reset: () => (reset(), toast("Demo sıfırlandı.", "info")), loginDemo };
}

function DemoActions({ go, onDone }: { go: (p: string) => void; onDone?: () => void }) {
  const { me, add, fill, reset, loginDemo } = useDemoActions();
  const done = (fn: () => void) => () => (fn(), onDone?.());
  return (
    <div>
      <div className="t-label flex items-center gap-2 text-beef">
        <Wand2 className="h-4 w-4" /> Demo kontrolleri
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-smoke">Kısayollar bekleme süresini atlar ve işlem kaydına "Demo kısayolu" olarak yazılır.</p>
      <div className="mt-3 grid gap-2">
        {me ? (
          <>
            <DemoBtn onClick={done(() => add(1))}>+1 damga (kasada okutulmuş gibi)</DemoBtn>
            <DemoBtn onClick={done(fill)}>Kartı doldur → ödül</DemoBtn>
          </>
        ) : (
          <DemoBtn onClick={done(loginDemo)}>Örnek üye ile gir (Ece)</DemoBtn>
        )}
        <DemoBtn onClick={() => go("kasa")}>
          <ScanLine className="h-4 w-4" /> Kasa ekranına geç
        </DemoBtn>
        <a href="#/kasa" target="_blank" rel="noreferrer" className="flex h-11 items-center gap-2 rounded-xl px-3.5 text-[14px] font-medium text-smoke ring-1 ring-ink-line hover:text-cream">
          <ExternalLink className="h-4 w-4" /> Kasayı yeni sekmede aç (aynı tarayıcıda senkron)
        </a>
      </div>
      <button onClick={done(reset)} className="mt-4 flex items-center gap-2 text-[13px] font-semibold text-smoke hover:text-cream">
        <RotateCcw className="h-3.5 w-3.5" /> Demoyu sıfırla
      </button>
    </div>
  );
}

function DemoBtn({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="flex h-11 items-center gap-2 rounded-xl bg-ink-3 px-3.5 text-left text-[14px] font-medium text-cream hover:bg-beef hover:text-ink">
      {children}
    </button>
  );
}

function SideInfo() {
  return (
    <div className="max-w-[300px] text-cream">
      <div className="t-label text-beef">Müşteri uygulaması · prototip</div>
      <h1 className="t-display mt-2 text-[34px]">
        {brand.cardTitle[0]} <span className="text-beef">{brand.cardTitle[1]}</span>
      </h1>
      <p className="mt-3 text-[14px] leading-relaxed text-smoke">
        Uygulama açılınca kart ve QR kod tek ekranda. Ödül kazanılınca aynı ekranda görünür; kasada aynı QR okutulur.
      </p>
      <p className="mt-3 text-[13px] leading-relaxed text-smoke/80">Tüm veriler örnektir ve yalnızca bu tarayıcıda saklanır. SMS, sunucu ve kasa bağlantısı yoktur.</p>
    </div>
  );
}

function DemoDock({ go }: { go: (p: string) => void }) {
  return (
    <div className="w-[270px] rounded-2xl bg-ink-2 p-4 text-cream ring-1 ring-ink-line">
      <DemoActions go={go} />
    </div>
  );
}
