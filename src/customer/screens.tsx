import {
  ArrowRight,
  Bell,
  CalendarClock,
  Check,
  ChevronRight,
  Clock,
  Download,
  Gift,
  Hamburger,
  Info,
  LogOut,
  MapPin,
  QrCode,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  Ticket,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { asset, DemoBadge, QrImage, StampCard } from "../components/brand";
import {
  availableGrants,
  backupCode,
  balanceOf,
  daysLeft,
  fmtDate,
  fmtDateTime,
  fmtTL,
  grantsOf,
  initials,
  maskPhone,
  qrPayload,
  qrWindow,
  QR_WINDOW_MS,
  redeemGrant,
} from "../data/engine";
import type { AppState, Customer } from "../data/types";
import { useStore } from "../store/store";

export interface ScreenProps {
  me: Customer;
  go: (p: string) => void;
  freshIndex: number | null;
}

function useRewardName(state: AppState) {
  return state.rewards.find((r) => r.id === state.rules.rewardId)?.name ?? "Ödül";
}

/* ---------------- ANA SAYFA ---------------- */
export function HomeScreen({ me, go, freshIndex }: ScreenProps) {
  const { state } = useStore();
  const r = state.rules;
  const bal = balanceOf(state, me.id);
  const avail = availableGrants(state, me.id);
  const rewardName = useRewardName(state);
  const left = r.stampsRequired - bal;
  const first = me.name.split(" ")[0];
  const recent = useMemo(() => activity(state, me.id).slice(0, 3), [state, me.id]);

  return (
    <div className="px-5 pb-8">
      <section className="pt-1">
        <p className="text-sm font-semibold text-smoke">Selam {first} 👋</p>
        <h1 className="mt-1 font-display text-[34px] uppercase leading-[1] text-balance">
          {left <= 0 ? (
            <>Menün hazır!</>
          ) : left === 1 ? (
            <>
              Son <span className="text-beef">1 damga</span> kaldı!
            </>
          ) : (
            <>
              Menüne <span className="text-beef">{left} damga</span> kaldı
            </>
          )}
        </h1>
      </section>

      <div className="mt-5">
        <button onClick={() => go("kart")} className="block w-full text-left" aria-label="Kart ayrıntılarını aç">
          <StampCard stamps={Math.min(bal, r.stampsRequired)} required={r.stampsRequired} name={me.name} rewardName={rewardName} freshIndex={freshIndex} />
        </button>
      </div>

      <button
        onClick={() => go("qr")}
        className="mt-4 flex h-16 w-full items-center gap-4 rounded-2xl bg-white px-5 text-ink active:scale-[0.99]"
      >
        <QrCode className="h-7 w-7" />
        <span className="flex-1 text-left">
          <span className="block text-[15px] font-extrabold">QR'ımı göster</span>
          <span className="block text-xs font-semibold text-ink/60">Kasada okut, damganı kap</span>
        </span>
        <ArrowRight className="h-5 w-5" />
      </button>

      {avail.length > 0 && (
        <button onClick={() => go("odul")} className="mt-4 flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-ink-2 p-3 text-left ring-1 ring-beef/40">
          <img src={asset("brand/burger-ambalaj.jpg")} alt="" className="h-16 w-16 rounded-xl object-cover" />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-beef">{avail.length} hediye hazır</div>
            <div className="truncate font-bold">{state.rewards.find((x) => x.id === avail[0]!.rewardId)?.name}</div>
            <div className="text-xs text-smoke">Son {daysLeft(avail[0]!.expiresAt)} gün</div>
          </div>
          <ChevronRight className="h-5 w-5 text-smoke" />
        </button>
      )}

      <section className="mt-7">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-smoke">Nasıl çalışır?</h2>
        <ol className="mt-3 grid grid-cols-3 gap-2">
          {[
            { n: "01", t: "Sipariş ver", d: `${fmtTL(r.minSpend)} ve üzeri` },
            { n: "02", t: "QR'ı okut", d: "Kasada 5 saniye" },
            { n: "03", t: `${r.stampsRequired}. damga`, d: `${r.stampsRequired + 1}. sipariş bizden` },
          ].map((s) => (
            <li key={s.n} className="rounded-2xl bg-ink-2 p-3 ring-1 ring-ink-line">
              <div className="font-display text-lg text-beef">{s.n}</div>
              <div className="mt-1 text-[13px] font-extrabold leading-tight">{s.t}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-smoke">{s.d}</div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-7 overflow-hidden rounded-3xl bg-ink-2 ring-1 ring-ink-line">
        <div className="relative h-44">
          <img src={asset("brand/burger-renkli-duvar.jpg")} alt="Renkli mekân duvarı önünde BEEF burger" className="h-full w-full object-cover object-[50%_45%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-2 via-ink-2/10 to-transparent" />
          <DemoBadge className="absolute right-3 top-3 bg-ink/70 text-white" />
        </div>
        <div className="-mt-6 p-4 pt-0">
          <div className="relative font-display text-2xl uppercase leading-tight">Renkli mekân, güçlü lezzet</div>
          <p className="mt-1 text-sm text-smoke">Duyuru ve kampanya alanı. İçerikler panelden yönetilecek.</p>
        </div>
      </section>

      <section className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-smoke">Son hareketler</h2>
          <button onClick={() => go("gecmis")} className="text-xs font-bold text-beef">
            Tümü
          </button>
        </div>
        <ul className="mt-2 divide-y divide-ink-line">
          {recent.map((a) => (
            <ActivityRow key={a.id} a={a} />
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ---------------- KART / İLERLEME ---------------- */
export function CardScreen({ me, go, freshIndex }: ScreenProps) {
  const { state } = useStore();
  const r = state.rules;
  const bal = balanceOf(state, me.id);
  const rewardName = useRewardName(state);
  // Bu kartın damgaları: son "convert" kaydından sonrakiler
  const cardEntries = useMemo(() => {
    const mine = state.ledger.filter((e) => e.customerId === me.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const lastConv = mine.map((e) => e.type).lastIndexOf("convert");
    return mine.slice(lastConv + 1).filter((e) => e.amount !== 0);
  }, [state.ledger, me.id]);
  const pct = Math.min(100, Math.round((bal / r.stampsRequired) * 100));
  const branchName = (id: string) => state.branches.find((b) => b.id === id)?.name ?? "—";

  return (
    <div className="px-5 pb-8">
      <h1 className="font-display text-[34px] uppercase leading-none">Kartım</h1>
      <div className="mt-4">
        <StampCard stamps={Math.min(bal, r.stampsRequired)} required={r.stampsRequired} name={me.name} rewardName={rewardName} freshIndex={freshIndex} />
      </div>

      <div className="mt-5 rounded-2xl bg-ink-2 p-4 ring-1 ring-ink-line">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-smoke">İlerleme</div>
            <div className="font-display text-3xl tabular">%{pct}</div>
          </div>
          <div className="text-right text-sm text-smoke">
            {bal >= r.stampsRequired ? "Ödülün hazır" : `${r.stampsRequired - bal} sipariş sonra`}
            <div className="font-bold text-white">{rewardName}</div>
          </div>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-ink-3">
          <div className="h-full rounded-full bg-beef transition-[width] duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <section className="mt-7">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-smoke">Bu karttaki damgalar</h2>
        {cardEntries.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-ink-2 p-4 text-sm text-smoke ring-1 ring-ink-line">Yeni kartın boş. İlk siparişinde QR'ını okut.</p>
        ) : (
          <ol className="relative mt-3 grid gap-0 border-l-2 border-dashed border-ink-line pl-5">
            {cardEntries.map((e) => (
              <li key={e.id} className="relative py-2.5">
                <span className={`absolute -left-[29px] top-3 grid h-4 w-4 place-items-center rounded-full ${e.amount > 0 ? "bg-beef" : "bg-wall-orange"}`} />
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-bold">
                    {e.type === "welcome" ? `+${e.amount} hoş geldin damgası` : e.type === "reversal" ? "−1 düzeltme" : "+1 damga"}
                  </span>
                  <span className="shrink-0 text-xs text-smoke tabular">{fmtDateTime(e.createdAt)}</span>
                </div>
                <div className="text-xs text-smoke">{e.type === "welcome" ? "Üyelik hediyesi" : `${branchName(e.branchId)} şubesi`}</div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-7 rounded-2xl bg-ink-2 p-4 ring-1 ring-ink-line">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-smoke">Program kuralları</h2>
          <span className="rounded-full bg-beef/15 px-2 py-0.5 text-[10px] font-bold uppercase text-beef">Taslak</span>
        </div>
        <ul className="mt-3 grid gap-2.5 text-sm">
          <Rule icon={<Hamburger className="h-4 w-4" />}>{r.stampsRequired} damga = 1 {rewardName.toLocaleLowerCase("tr-TR")}</Rule>
          <Rule icon={<Receipt className="h-4 w-4" />}>Damga için en az {fmtTL(r.minSpend)} tutarında sipariş</Rule>
          <Rule icon={<Clock className="h-4 w-4" />}>Aynı hesaba {fmtCooldown(r.cooldownMinutes)} içinde en fazla 1 damga</Rule>
          <Rule icon={<CalendarClock className="h-4 w-4" />}>
            Damgalar {r.stampExpiryMonths} ay, ödüller {r.rewardExpiryDays} gün geçerli
          </Rule>
          <Rule icon={<Ticket className="h-4 w-4" />}>Ödül, en fazla {fmtTL(state.rewards.find((x) => x.id === r.rewardId)?.cap ?? 0)} değerindeki ürünler için geçerli</Rule>
        </ul>
      </section>
      <button onClick={() => go("qr")} className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-beef font-extrabold text-ink">
        <QrCode className="h-5 w-5" /> Damga için QR'ımı göster
      </button>
    </div>
  );
}

function fmtCooldown(m: number) {
  return m >= 60 && m % 60 === 0 ? `${m / 60} saat` : `${m} dakika`;
}

function Rule({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-beef text-ink">{icon}</span>
      <span className="pt-1 text-white/90">{children}</span>
    </li>
  );
}

/* ---------------- QR ---------------- */
export function QrScreen({ me, onDemoScan }: ScreenProps & { onDemoScan: () => void }) {
  const { state } = useStore();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const win = qrWindow(now);
  const remain = QR_WINDOW_MS - (now % QR_WINDOW_MS);
  const code = backupCode(me.id, win);
  const bal = balanceOf(state, me.id);

  return (
    <div className="flex min-h-full flex-col items-center px-5 pb-8 text-center">
      <h1 className="font-display text-[34px] uppercase leading-none">Kasada okut</h1>
      <p className="mt-2 max-w-[18rem] text-sm text-smoke">Siparişini verirken bu kodu personele göster. Kod her dakika yenilenir.</p>

      <div className="mt-6 w-full max-w-[320px] rounded-[28px] bg-white p-5 text-ink shadow-[0_30px_60px_-25px_rgba(251,204,10,0.5)]">
        <div className="flex items-center justify-between text-left">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink/50">Beef Kart</div>
            <div className="font-bold">{me.name}</div>
          </div>
          <div className="rounded-full bg-beef px-3 py-1 font-display text-lg tabular">
            {Math.min(bal, state.rules.stampsRequired)}/{state.rules.stampsRequired}
          </div>
        </div>
        <div className="mt-4 grid place-items-center">
          <QrImage value={qrPayload(me.id, win)} size={232} />
        </div>
        <div className="mt-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/50">Okunmazsa kodu söyle</div>
          <div className="font-display text-4xl tracking-[0.12em] tabular" aria-live="polite">
            {code.slice(0, 3)} {code.slice(3)}
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10" aria-hidden>
          <div className="h-full bg-ink transition-[width] duration-200 ease-linear" style={{ width: `${(remain / QR_WINDOW_MS) * 100}%` }} />
        </div>
        <div className="mt-1.5 text-xs font-semibold text-ink/50 tabular">{Math.ceil(remain / 1000)} sn sonra yenilenir</div>
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-smoke">
        <Sun className="h-4 w-4" /> Ekran parlaklığını artırmak okutmayı hızlandırır.
      </p>

      <div className="mt-6 w-full max-w-[320px] rounded-2xl border border-dashed border-beef/40 p-4 text-left">
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-beef">Demo</div>
        <p className="mt-1 text-sm text-smoke">Personelin bu kodu okuttuğunu ve siparişi doğruladığını canlandır.</p>
        <button onClick={onDemoScan} className="mt-3 h-12 w-full rounded-xl bg-beef font-extrabold text-ink">
          Kasada okutuldu (+1 damga)
        </button>
      </div>
    </div>
  );
}

/* ---------------- ÖDÜLLER ---------------- */
export function RewardsScreen({ me, go }: ScreenProps) {
  const { state, update, toast } = useStore();
  const [tab, setTab] = useState<"avail" | "used">("avail");
  const [open, setOpen] = useState<string | null>(null);
  const all = grantsOf(state, me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const avail = all.filter((g) => g.status === "available");
  const used = all.filter((g) => g.status !== "available");
  const r = state.rules;
  const bal = balanceOf(state, me.id);
  const reward = (id: string) => state.rewards.find((x) => x.id === id);
  const openGrant = all.find((g) => g.id === open);

  return (
    <div className="px-5 pb-8">
      <h1 className="font-display text-[34px] uppercase leading-none">Ödüllerim</h1>

      <div className="mt-4 flex items-center gap-4 rounded-2xl bg-beef p-4 text-ink">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink text-beef">
          <Gift className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink/60">Sıradaki ödül</div>
          <div className="truncate font-extrabold">{reward(r.rewardId)?.name}</div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/15">
            <div className="h-full rounded-full bg-ink" style={{ width: `${Math.min(100, (bal / r.stampsRequired) * 100)}%` }} />
          </div>
        </div>
        <div className="font-display text-2xl tabular">
          {Math.min(bal, r.stampsRequired)}/{r.stampsRequired}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 rounded-2xl bg-ink-2 p-1 ring-1 ring-ink-line" role="tablist">
        {(
          [
            ["avail", `Kullanılabilir (${avail.length})`],
            ["used", `Geçmiş (${used.length})`],
          ] as const
        ).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`h-10 rounded-xl text-sm font-bold ${tab === k ? "bg-white text-ink" : "text-smoke"}`}>
            {l}
          </button>
        ))}
      </div>

      <ul className="mt-4 grid gap-3">
        {(tab === "avail" ? avail : used).map((g) => {
          const rw = reward(g.rewardId);
          return (
            <li key={g.id} className={`overflow-hidden rounded-3xl ring-1 ${g.status === "available" ? "bg-ink-2 ring-beef/40" : "bg-ink-2/60 ring-ink-line"}`}>
              <div className="flex gap-4 p-3">
                {rw?.image ? (
                  <img src={asset(rw.image)} alt={rw.name} className={`h-24 w-24 shrink-0 rounded-2xl object-cover ${g.status !== "available" ? "grayscale" : ""}`} />
                ) : (
                  <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-beef text-ink">
                    <Hamburger className="h-10 w-10" />
                  </div>
                )}
                <div className="min-w-0 flex-1 py-1">
                  <div className="font-extrabold">{rw?.name}</div>
                  <div className="text-xs leading-snug text-smoke">{rw?.description}</div>
                  <div className="mt-2 text-xs font-bold">
                    {g.status === "available" ? (
                      <span className="text-beef">Son {daysLeft(g.expiresAt)} gün · {fmtDate(g.expiresAt)}</span>
                    ) : g.status === "redeemed" ? (
                      <span className="text-smoke">Kullanıldı · {fmtDate(g.redeemedAt!)}</span>
                    ) : (
                      <span className="text-wall-orange">Süresi doldu</span>
                    )}
                  </div>
                </div>
              </div>
              {g.status === "available" && (
                <button onClick={() => setOpen(g.id)} className="flex h-12 w-full items-center justify-center gap-2 bg-beef text-sm font-extrabold text-ink">
                  <Ticket className="h-4 w-4" /> Kasada kullan
                </button>
              )}
            </li>
          );
        })}
        {(tab === "avail" ? avail : used).length === 0 && (
          <li className="rounded-3xl bg-ink-2 p-6 text-center ring-1 ring-ink-line">
            <Gift className="mx-auto h-8 w-8 text-smoke" />
            <p className="mt-2 font-bold">{tab === "avail" ? "Henüz kullanılabilir ödülün yok" : "Geçmiş ödül yok"}</p>
            <p className="mt-1 text-sm text-smoke">{tab === "avail" ? `${Math.max(0, r.stampsRequired - bal)} damga sonra ilk ödülün burada olacak.` : "Kullandığın ödüller burada listelenir."}</p>
            {tab === "avail" && (
              <button onClick={() => go("qr")} className="mt-4 h-11 rounded-xl bg-white px-5 text-sm font-extrabold text-ink">
                QR'ımı göster
              </button>
            )}
          </li>
        )}
      </ul>

      {openGrant && (
        <Sheet onClose={() => setOpen(null)}>
          {openGrant.status === "available" ? (
            <div className="text-center">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink/50">Tek kullanımlık ödül kodu</div>
              <div className="mt-1 font-display text-3xl uppercase">{reward(openGrant.rewardId)?.name}</div>
              <div className="mt-4 grid place-items-center">
                <QrImage value={`BEEF-R.${openGrant.id}`} size={200} />
              </div>
              <div className="mt-3 font-display text-2xl tracking-[0.14em] tabular">{openGrant.id.slice(-6).toUpperCase()}</div>
              <p className="mx-auto mt-2 max-w-[17rem] text-sm text-ink/60">
                Personel okuttuğunda ödülün kullanılmış sayılır. Ürün en fazla {fmtTL(reward(openGrant.rewardId)?.cap ?? 0)} değerinde olabilir.
              </p>
              <div className="mt-5 rounded-2xl border border-dashed border-ink/25 p-3 text-left">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/50">Demo</div>
                <button
                  onClick={() => {
                    update((s) => {
                      const out = redeemGrant(s, openGrant.id, s.panel.staffId, s.panel.branchId);
                      if (!out.result.ok) toast(out.result.error, "bad");
                      else toast("Afiyet olsun! Ödülün kullanıldı.");
                      return out.state;
                    });
                  }}
                  className="mt-2 h-12 w-full rounded-xl bg-ink font-extrabold text-beef"
                >
                  Kasada onaylandı
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center">
              <div className="animate-pop mx-auto grid h-20 w-20 place-items-center rounded-full bg-ok text-white">
                <Check className="h-10 w-10" strokeWidth={3} />
              </div>
              <div className="mt-4 font-display text-3xl uppercase">Afiyet olsun!</div>
              <p className="mt-1 text-sm text-ink/60">
                {reward(openGrant.rewardId)?.name} · {openGrant.redeemedAt ? fmtDateTime(openGrant.redeemedAt) : ""}
              </p>
              <button onClick={() => setOpen(null)} className="mt-6 h-12 w-full rounded-xl bg-ink font-extrabold text-white">
                Tamam
              </button>
            </div>
          )}
        </Sheet>
      )}
    </div>
  );
}

export function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/60 backdrop-blur-[2px]" onClick={onClose}>
      <div className="animate-rise relative max-h-[92%] w-full overflow-y-auto rounded-t-[32px] bg-white p-6 pb-[max(24px,env(safe-area-inset-bottom))] text-ink" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ink/15" />
        <button onClick={onClose} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-ink/5" aria-label="Kapat">
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

/* ---------------- GEÇMİŞ ---------------- */
interface Activity {
  id: string;
  at: string;
  kind: "earn" | "welcome" | "convert" | "redeem" | "reversal" | "adjust";
  title: string;
  sub: string;
  delta?: number;
}

function activity(state: AppState, customerId: string): Activity[] {
  const branch = (id?: string) => state.branches.find((b) => b.id === id)?.name ?? "—";
  const orders = new Map(state.orders.map((o) => [o.id, o]));
  const reward = (id: string) => state.rewards.find((r) => r.id === id)?.name ?? "Ödül";
  const out: Activity[] = [];
  for (const e of state.ledger) {
    if (e.customerId !== customerId) continue;
    const o = e.orderId ? orders.get(e.orderId) : undefined;
    if (e.type === "earn") out.push({ id: e.id, at: e.createdAt, kind: "earn", title: "Damga kazandın", sub: `${branch(e.branchId)} · ${o ? `${fmtTL(o.amount)} · Fiş ${o.receiptNo}` : ""}`, delta: 1 });
    else if (e.type === "welcome") out.push({ id: e.id, at: e.createdAt, kind: "welcome", title: "Hoş geldin hediyesi", sub: "Üyelik", delta: e.amount });
    else if (e.type === "convert") {
      const g = state.grants.find((x) => x.id === e.grantId);
      out.push({ id: e.id, at: e.createdAt, kind: "convert", title: `${reward(g?.rewardId ?? "")} kazandın`, sub: `${-e.amount} damga ödüle dönüştü`, delta: e.amount });
    } else if (e.type === "reversal") out.push({ id: e.id, at: e.createdAt, kind: "reversal", title: "Damga düzeltmesi", sub: e.note || "Hatalı işlem geri alındı", delta: e.amount });
    else out.push({ id: e.id, at: e.createdAt, kind: "adjust", title: "Düzeltme", sub: e.note ?? "", delta: e.amount });
  }
  for (const g of state.grants)
    if (g.customerId === customerId && g.status === "redeemed" && g.redeemedAt)
      out.push({ id: `rd-${g.id}`, at: g.redeemedAt, kind: "redeem", title: `${reward(g.rewardId)} kullandın`, sub: branch(g.redeemedBranchId) });
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

function ActivityRow({ a }: { a: Activity }) {
  const icon = {
    earn: <Hamburger className="h-5 w-5" />,
    welcome: <Sparkles className="h-5 w-5" />,
    convert: <Gift className="h-5 w-5" />,
    redeem: <Ticket className="h-5 w-5" />,
    reversal: <Undo2 className="h-5 w-5" />,
    adjust: <RotateCcw className="h-5 w-5" />,
  }[a.kind];
  const tone =
    a.kind === "convert" || a.kind === "redeem" ? "bg-white text-ink" : a.kind === "reversal" || a.kind === "adjust" ? "bg-wall-orange/20 text-wall-orange" : "bg-beef text-ink";
  return (
    <li className="flex items-center gap-3 py-3">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-bold">{a.title}</div>
        <div className="truncate text-xs text-smoke">{a.sub}</div>
      </div>
      <div className="shrink-0 text-right">
        {a.delta !== undefined && (
          <div className={`font-display text-lg tabular ${a.delta > 0 ? "text-beef" : "text-smoke"}`}>
            {a.delta > 0 ? "+" : "−"}
            {Math.abs(a.delta)}
          </div>
        )}
        <div className="text-[11px] text-smoke tabular">{fmtDateTime(a.at)}</div>
      </div>
    </li>
  );
}

export function HistoryScreen({ me }: ScreenProps) {
  const { state } = useStore();
  const [filter, setFilter] = useState<"all" | "stamps" | "rewards">("all");
  const list = activity(state, me.id).filter((a) =>
    filter === "all" ? true : filter === "stamps" ? ["earn", "welcome", "reversal", "adjust"].includes(a.kind) : ["convert", "redeem"].includes(a.kind),
  );
  const groups = new Map<string, Activity[]>();
  for (const a of list) {
    const k = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(new Date(a.at));
    groups.set(k, [...(groups.get(k) ?? []), a]);
  }
  const visits = state.orders.filter((o) => o.customerId === me.id);
  return (
    <div className="px-5 pb-8">
      <h1 className="font-display text-[34px] uppercase leading-none">Geçmiş</h1>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Ziyaret" value={visits.length} />
        <Stat label="Kazanılan ödül" value={state.grants.filter((g) => g.customerId === me.id).length} />
        <Stat label="Üyelik" value={fmtDate(me.joinedAt).split(" ").slice(1).join(" ")} small />
      </div>
      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">
        {(
          [
            ["all", "Tümü"],
            ["stamps", "Damgalar"],
            ["rewards", "Ödüller"],
          ] as const
        ).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`h-9 shrink-0 rounded-full px-4 text-sm font-bold ${filter === k ? "bg-beef text-ink" : "bg-ink-2 text-smoke ring-1 ring-ink-line"}`}>
            {l}
          </button>
        ))}
      </div>
      {[...groups.entries()].map(([k, items]) => (
        <section key={k} className="mt-5">
          <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-smoke">{k}</h2>
          <ul className="mt-1 divide-y divide-ink-line">
            {items.map((a) => (
              <ActivityRow key={a.id} a={a} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div className="rounded-2xl bg-ink-2 p-3 ring-1 ring-ink-line">
      <div className={`font-display tabular ${small ? "text-lg leading-7" : "text-3xl"}`}>{value}</div>
      <div className="text-[11px] font-semibold text-smoke">{label}</div>
    </div>
  );
}

/* ---------------- PROFİL ---------------- */
export function ProfileScreen({ me }: ScreenProps) {
  const { state, update, reset, toast } = useStore();
  const home = state.branches.find((b) => b.id === me.homeBranchId);
  const setMarketing = (v: boolean) =>
    update((s) => ({
      ...s,
      customers: s.customers.map((c) => (c.id === me.id ? { ...c, consents: { ...c.consents, marketing: v, consentAt: new Date().toISOString() } } : c)),
    }));
  return (
    <div className="px-5 pb-8">
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-beef font-display text-2xl text-ink">{initials(me.name)}</div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-[28px] uppercase leading-none">{me.name}</h1>
          <p className="mt-1 text-sm text-smoke tabular">{maskPhone(me.phone)}</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <InfoTile icon={<CalendarClock className="h-4 w-4" />} label="Üyelik" value={fmtDate(me.joinedAt)} />
        <InfoTile icon={<MapPin className="h-4 w-4" />} label="Şube" value={home?.name ?? "—"} />
      </div>

      <Group title="Bildirimler">
        <ToggleRow
          id="pf-mkt"
          icon={<Bell className="h-5 w-5" />}
          title="Kampanya SMS'leri"
          sub={me.consents.marketing ? `İzin verildi · ${fmtDate(me.consents.consentAt)}` : "İzin yok · istediğin zaman açabilirsin"}
          checked={me.consents.marketing}
          onChange={setMarketing}
        />
        <Row icon={<Info className="h-5 w-5" />} title="Ödül hatırlatmaları" sub="Ödülün bitmeden haber veririz (hizmet bildirimi)" />
      </Group>

      <Group title="Hesap ve gizlilik">
        <Row icon={<ShieldCheck className="h-5 w-5" />} title="KVKK aydınlatma metni" sub={`Onay: ${fmtDate(me.consents.consentAt)}`} chevron />
        <Row icon={<Download className="h-5 w-5" />} title="Verilerimi indir" sub="Kayıtlarının bir kopyasını iste" chevron onClick={() => toast("Demo: talebin alındı, gerçek sürümde e-posta/SMS ile iletilecek.", "info")} />
        <Row icon={<Trash2 className="h-5 w-5" />} title="Hesabımı sil" sub="Kişisel verilerin silinir, damgaların kaybolur" chevron danger onClick={() => toast("Demo: silme talebi oluşturulmadı (prototip).", "info")} />
      </Group>

      <Group title="Prototip">
        <Row icon={<RotateCcw className="h-5 w-5" />} title="Demoyu sıfırla" sub="Tüm örnek veriler başlangıç hâline döner" onClick={() => (reset(), toast("Demo sıfırlandı.", "info"))} />
        <Row
          icon={<LogOut className="h-5 w-5" />}
          title="Çıkış yap"
          sub="Karşılama ekranına dön"
          onClick={() => update((s) => ({ ...s, session: { ...s.session, customerId: null } }))}
        />
      </Group>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-ink-2 p-3 ring-1 ring-ink-line">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-smoke">
        {icon}
        {label}
      </div>
      <div className="mt-1 truncate font-bold">{value}</div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-smoke">{title}</h2>
      <div className="mt-2 divide-y divide-ink-line overflow-hidden rounded-2xl bg-ink-2 ring-1 ring-ink-line">{children}</div>
    </section>
  );
}

function Row({ icon, title, sub, chevron, danger, onClick }: { icon: React.ReactNode; title: string; sub: string; chevron?: boolean; danger?: boolean; onClick?: () => void }) {
  const C = onClick ? "button" : "div";
  return (
    <C onClick={onClick} className="flex w-full items-center gap-3 p-4 text-left">
      <span className={danger ? "text-wall-orange" : "text-beef"}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className={`block font-bold ${danger ? "text-wall-orange" : ""}`}>{title}</span>
        <span className="block text-xs text-smoke">{sub}</span>
      </span>
      {chevron && <ChevronRight className="h-4 w-4 text-smoke" />}
    </C>
  );
}

function ToggleRow({ id, icon, title, sub, checked, onChange }: { id: string; icon: React.ReactNode; title: string; sub: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3 p-4">
      <span className="text-beef">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        <span className="block text-xs text-smoke">{sub}</span>
      </span>
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-beef ${checked ? "bg-beef" : "bg-ink-3"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left] ${checked ? "left-6" : "left-1"}`} />
      </span>
    </label>
  );
}
