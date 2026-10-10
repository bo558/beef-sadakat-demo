import {
  ArrowRight,
  Camera,
  Check,
  CircleAlert,
  Gift,
  Hamburger,
  Keyboard,
  Phone,
  ScanLine,
  Search,
  Ticket,
  TrendingUp,
  Undo2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { asset, StampCard } from "../components/brand";
import { ROLE_LABEL } from "../data/defaults";
import {
  availableGrants,
  balanceOf,
  daysLeft,
  earnStamp,
  fmtDate,
  fmtDateTime,
  fmtTL,
  grantsOf,
  initials,
  isReversed,
  lastEarn,
  maskPhone,
  redeemGrant,
  resolveCode,
  reverseEntry,
} from "../data/engine";
import type { AppState, Customer, ProgramRules, Role } from "../data/types";
import { useStore } from "../store/store";
import { Badge, Btn, Card, Field, inputCls, Kpi, Locked, PageHead } from "./ui";

const DAY = 86_400_000;

function useMe() {
  const { state } = useStore();
  const me = state.staff.find((s) => s.id === state.panel.staffId)!;
  const can = (r: Role[]) => r.includes(me.role);
  return { me, can };
}

/* =========================================================
   KASA — QR okut, sipariş doğrula, damga ver, ödül kullandır
   ========================================================= */
type Feedback = { tone: "ok" | "bad" | "reward"; title: string; text: string } | null;

export function RegisterPage({ preselect }: { preselect?: string }) {
  const { state, update } = useStore();
  const { me } = useMe();
  const [mode, setMode] = useState<"qr" | "code" | "search">("qr");
  const [customerId, setCustomerId] = useState<string | null>(preselect ?? null);
  const [scanning, setScanning] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeErr, setCodeErr] = useState("");
  const [q, setQ] = useState("");
  const [receipt, setReceipt] = useState("");
  const [amount, setAmount] = useState("");
  const [skipCooldown, setSkipCooldown] = useState(false);
  const [fb, setFb] = useState<Feedback>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [lastRedeemed, setLastRedeemed] = useState<string | null>(null);

  useEffect(() => {
    if (preselect) setCustomerId(preselect);
  }, [preselect]);

  const customer = state.customers.find((c) => c.id === customerId);
  const branch = state.branches.find((b) => b.id === state.panel.branchId)!;
  const r = state.rules;

  const pick = (id: string) => {
    setCustomerId(id);
    setFb(null);
    setReceipt("");
    setAmount("");
    setLastRedeemed(null);
  };
  const simulateScan = (id: string) => {
    setScanning(id);
    setTimeout(() => {
      setScanning(null);
      pick(id);
    }, 900);
  };

  const nearby = useMemo(() => {
    const appUser = state.customers.find((c) => c.id === state.session.customerId);
    const others = state.customers.filter((c) => c.id !== appUser?.id).slice(0, 3);
    return appUser ? [appUser, ...others] : others;
  }, [state.customers, state.session.customerId]);

  const matches = q.trim().length >= 2 ? state.customers.filter((c) => c.name.toLocaleLowerCase("tr-TR").includes(q.toLocaleLowerCase("tr-TR")) || c.phone.endsWith(q.replace(/\D/g, "")) && q.replace(/\D/g, "").length >= 4) : [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    update((s) => {
      const out = earnStamp(s, {
        customerId: customer.id,
        branchId: s.panel.branchId,
        staffId: s.panel.staffId,
        receiptNo: receipt,
        amount: Number(amount.replace(",", ".")),
        ignoreCooldown: skipCooldown,
      });
      if (!out.result.ok) setFb({ tone: "bad", title: "Damga verilmedi", text: out.result.error });
      else if (out.result.rewardGrantId)
        setFb({ tone: "reward", title: "Kart doldu, ödül açıldı!", text: `${customer.name.split(" ")[0]} artık bir ${state.rewards.find((x) => x.id === s.rules.rewardId)?.name.toLocaleLowerCase("tr-TR")} kazandı. Kart sıfırlandı.` });
      else setFb({ tone: "ok", title: "+1 damga verildi", text: `${customer.name} · kart ${out.result.balance}/${s.rules.stampsRequired}` });
      if (out.result.ok) {
        setReceipt("");
        setAmount("");
      }
      return out.state;
    });
  };

  const doRedeem = (grantId: string) => {
    update((s) => {
      const out = redeemGrant(s, grantId, s.panel.staffId, s.panel.branchId);
      if (out.result.ok) {
        setFb({ tone: "ok", title: "Ödül kullanıldı", text: "Ödül kullanılmış olarak işaretlendi. Afiyet olsun!" });
        setLastRedeemed(grantId);
      } else setFb({ tone: "bad", title: "Ödül kullanılamadı", text: out.result.error });
      return out.state;
    });
    setConfirm(null);
  };

  const recentHere = state.ledger
    .filter((e) => e.branchId === state.panel.branchId && (e.type === "earn" || e.type === "reversal"))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return (
    <div className="grid gap-5">
      <PageHead title="Kasa" sub={`${branch.name} şubesi · ${me.name}`} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* 1. Müşteriyi tanı */}
        <Card title="1 · Müşteriyi bul">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-paper p-1 ring-1 ring-paper-line" role="tablist">
            {(
              [
                ["qr", "QR okut", Camera],
                ["code", "Kod gir", Keyboard],
                ["search", "Ara", Search],
              ] as const
            ).map(([k, l, I]) => (
              <button key={k} role="tab" aria-selected={mode === k} onClick={() => setMode(k)} className={`flex h-9 items-center justify-center gap-1.5 rounded-md text-[13px] font-semibold ${mode === k ? "bg-ink text-beef" : "text-ink/60"}`}>
                <I className="h-4 w-4" /> {l}
              </button>
            ))}
          </div>

          {mode === "qr" && (
            <div className="mt-4">
              <div className="relative mx-auto aspect-[16/9] w-full max-w-[440px] overflow-hidden rounded-xl bg-ink">
                <div className="absolute inset-0 opacity-25" style={{ background: "radial-gradient(circle at 50% 40%, #3a352c, #0e0d0b 70%)" }} />
                <div className="absolute inset-[14%] rounded-xl">
                  {["left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl", "right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl", "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-2xl", "right-0 bottom-0 border-r-4 border-b-4 rounded-br-2xl"].map((c) => (
                    <span key={c} className={`absolute h-10 w-10 border-beef ${c}`} />
                  ))}
                  <span className="absolute inset-x-3 h-0.5 bg-beef shadow-[0_0_16px_4px_rgba(251,204,10,0.6)]" style={{ animation: "scanline 2.4s ease-in-out infinite" }} />
                </div>
              </div>
              <p className="mt-2 text-center text-xs font-semibold text-ink/60" aria-live="polite">
                {scanning ? "Kod okunuyor…" : "Kamera simülasyonu · müşterinin QR'ını çerçeveye getirin"}
              </p>
              <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/50">Demo: kameraya gösterilen QR'lar</div>
              <div className="mt-2 grid gap-2">
                {nearby.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => simulateScan(c.id)}
                    disabled={!!scanning}
                    className={`flex items-center gap-3 rounded-xl p-2.5 text-left ring-1 transition-colors ${customerId === c.id ? "bg-beef/20 ring-beef" : "bg-white ring-paper-line hover:bg-paper"}`}
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-ink font-display text-[13px] font-semibold text-beef">{initials(c.name)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{c.name}</span>
                      <span className="block text-xs text-ink/50">{i === 0 && c.id === state.session.customerId ? "Müşteri uygulamasında açık olan üye" : maskPhone(c.phone)}</span>
                    </span>
                    {scanning === c.id ? <ScanLine className="h-4 w-4 animate-pulse" /> : <ArrowRight className="h-4 w-4 text-ink/40" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "code" && (
            <form
              className="mt-4 grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const c = resolveCode(state, code);
                if (c) {
                  pick(c.id);
                  setCodeErr("");
                } else setCodeErr("Kod bulunamadı ya da süresi doldu. Müşteriden ekrandaki güncel kodu isteyin.");
              }}
            >
              <Field label="QR altındaki 6 haneli kod" htmlFor="rg-code" hint="Kodlar 60 saniyede bir yenilenir (müşteri uygulaması › QR ekranı).">
                <input id="rg-code" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••• •••" className={`${inputCls} h-12 text-center font-display text-2xl font-semibold tracking-[0.3em]`} />
              </Field>
              {codeErr && <p className="text-sm font-semibold text-bad">{codeErr}</p>}
              <Btn type="submit" disabled={code.length !== 6} tone="dark" size="lg">
                Müşteriyi bul
              </Btn>
            </form>
          )}

          {mode === "search" && (
            <div className="mt-4 grid gap-3">
              <Field label="Ad veya telefonun son 4 hanesi" htmlFor="rg-q">
                <input id="rg-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Örn. Ece ya da 0001" className={inputCls} />
              </Field>
              <ul className="grid gap-1.5">
                {matches.slice(0, 6).map((c) => (
                  <li key={c.id}>
                    <button onClick={() => pick(c.id)} className="flex w-full items-center gap-3 rounded-xl bg-paper p-2.5 text-left hover:bg-beef/20">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-ink font-display text-[13px] font-semibold text-beef">{initials(c.name)}</span>
                      <span className="flex-1 text-sm font-semibold">{c.name}</span>
                      <span className="text-xs text-ink/50 tabular">{maskPhone(c.phone)}</span>
                    </button>
                  </li>
                ))}
                {q.trim().length >= 2 && matches.length === 0 && <li className="text-sm text-ink/50">Eşleşen üye yok.</li>}
              </ul>
              <p className="flex items-center gap-2 text-xs text-ink/50">
                <Phone className="h-3.5 w-3.5" /> Telefonla aramada personel numaranın tamamını görmez.
              </p>
            </div>
          )}
        </Card>

        {/* 2. İşlem */}
        <div className="grid min-w-0 content-start gap-6">
          {!customer ? (
            <div className="grid min-h-[320px] place-items-center rounded-xl border-2 border-dashed border-paper-line p-8 text-center">
              <div>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-beef text-ink">
                  <ScanLine className="h-6 w-6" />
                </div>
                <p className="t-h2 mt-3">Müşteriyi okutun</p>
                <p className="mt-1 text-sm text-ink/60">QR, 6 haneli kod ya da arama ile üyeyi bulun.</p>
              </div>
            </div>
          ) : (
            <>
              <CustomerStrip c={customer} onClear={() => setCustomerId(null)} />
              {fb && <FeedbackBanner fb={fb} onClose={() => setFb(null)} />}
              <div className="grid gap-5 2xl:grid-cols-2">
                <Card title="2 · Siparişi doğrula, damga ver">
                  <form onSubmit={submit} className="grid gap-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Fiş / adisyon no" htmlFor="rg-receipt">
                        <input id="rg-receipt" value={receipt} onChange={(e) => setReceipt(e.target.value.toUpperCase())} placeholder="Örn. C-48213" className={inputCls} autoComplete="off" />
                      </Field>
                      <Field label="Tutar (₺)" htmlFor="rg-amount">
                        <input id="rg-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d,]/g, ""))} placeholder={String(r.minSpend + 150)} className={`${inputCls} tabular`} />
                      </Field>
                    </div>
                    <div className="grid gap-1.5 rounded-xl bg-paper p-3 text-xs text-ink/70">
                      <Rule ok={Number(amount.replace(",", ".")) >= r.minSpend}>Minimum sepet {fmtTL(r.minSpend)}</Rule>
                      <Rule ok={!state.orders.some((o) => o.branchId === state.panel.branchId && o.receiptNo === receipt.trim())}>Bu fiş daha önce işlenmemiş</Rule>
                      <CooldownRule state={state} customerId={customer.id} minutes={r.cooldownMinutes} />
                    </div>
                    <label htmlFor="rg-skip" className="flex items-center gap-2 text-xs font-semibold text-ink/60">
                      <input id="rg-skip" type="checkbox" checked={skipCooldown} onChange={(e) => setSkipCooldown(e.target.checked)} className="h-4 w-4 accent-[#e25601]" />
                      Demo: bekleme süresini yoksay
                    </label>
                    <Btn type="submit" size="lg" disabled={!receipt.trim() || !amount}>
                      <Hamburger className="h-5 w-5" /> Damga ver
                    </Btn>
                    <button
                      type="button"
                      onClick={() => {
                        setReceipt(`${branch.id === "br-cerkezkoy" ? "C" : "O"}-${Math.floor(Math.random() * 9000 + 50000)}`);
                        setAmount(String(r.minSpend + 160));
                      }}
                      className="text-left text-xs font-semibold text-ink/50 underline underline-offset-4"
                    >
                      Örnek fiş bilgisi doldur
                    </button>
                  </form>
                </Card>
                <Card title="Kart ve ödüller">
                  <StampCard stamps={Math.min(balanceOf(state, customer.id), r.stampsRequired)} required={r.stampsRequired} rewardName={state.rewards.find((x) => x.id === r.rewardId)?.name ?? ""} compact />
                  <div className="mt-4 grid gap-2">
                    {availableGrants(state, customer.id).map((g) => (
                      <div key={g.id} className="flex items-center gap-3 rounded-xl bg-beef/15 p-3 ring-1 ring-beef">
                        <Gift className="h-5 w-5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{state.rewards.find((x) => x.id === g.rewardId)?.name}</div>
                          <div className="text-xs text-ink/60">Son {daysLeft(g.expiresAt)} gün · tavan {fmtTL(state.rewards.find((x) => x.id === g.rewardId)?.cap ?? 0)}</div>
                        </div>
                        <Btn size="sm" tone="dark" onClick={() => setConfirm(g.id)}>
                          Kullandır
                        </Btn>
                      </div>
                    ))}
                    {availableGrants(state, customer.id).length === 0 && <p className="text-sm text-ink/50">Kullanılabilir ödül yok.</p>}
                    {lastRedeemed && (
                      <button onClick={() => doRedeem(lastRedeemed)} className="mt-1 rounded-xl border border-dashed border-bad/40 p-3 text-left text-xs font-semibold text-bad">
                        Demo: aynı ödül kodunu tekrar okut (çift kullanım denemesi)
                      </button>
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}

          <Card title="Bu şubede son damgalar" pad={false}>
            <ul className="divide-y divide-paper-line">
              {recentHere.map((e) => {
                const c = state.customers.find((x) => x.id === e.customerId);
                const st = state.staff.find((x) => x.id === e.staffId);
                return (
                  <li key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span className={`grid h-8 w-8 place-items-center rounded-full ${e.amount > 0 ? "bg-beef" : "bg-bad-soft text-bad"}`}>{e.amount > 0 ? <Hamburger className="h-4 w-4" /> : <Undo2 className="h-4 w-4" />}</span>
                    <button onClick={() => c && pick(c.id)} className="min-w-0 flex-1 truncate text-left font-semibold hover:underline">
                      {c?.name}
                    </button>
                    <span className="hidden text-ink/50 sm:inline">{st?.name}</span>
                    <span className="text-ink/50 tabular">{fmtDateTime(e.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>

      {confirm && customer && (
        <Modal onClose={() => setConfirm(null)} title="Ödülü kullandır">
          {(() => {
            const g = state.grants.find((x) => x.id === confirm)!;
            const rw = state.rewards.find((x) => x.id === g.rewardId)!;
            return (
              <div className="grid gap-4">
                <div className="flex items-center gap-4">
                  {rw.image ? <img src={asset(rw.image)} alt="" className="h-20 w-20 rounded-xl object-cover object-bottom" /> : <div className="grid h-20 w-20 place-items-center rounded-xl bg-beef"><Gift className="h-8 w-8" /></div>}
                  <div>
                    <div className="t-h1">{rw.name}</div>
                    <div className="mt-1 text-sm text-ink/60">{rw.description}</div>
                    <div className="mt-1 text-sm font-semibold">Fiyat tavanı: {fmtTL(rw.cap)}</div>
                  </div>
                </div>
                <p className="rounded-xl bg-paper p-3 text-sm text-ink/70">
                  {customer.name} için bu ödül tek seferlik kullanılacak ve geri alınamayacak. Tavanı aşan ürünlerde fark müşteriden alınır (taslak kural).
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Btn tone="ghost" onClick={() => setConfirm(null)}>
                    Vazgeç
                  </Btn>
                  <Btn tone="dark" onClick={() => doRedeem(confirm)}>
                    <Check className="h-4 w-4" /> Onayla
                  </Btn>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}

function Rule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex items-center gap-2 font-semibold ${ok ? "text-ok" : "text-ink/50"}`}>
      {ok ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <span className="h-3.5 w-3.5 rounded-full border-2 border-current" />}
      {children}
    </div>
  );
}

function CooldownRule({ state, customerId, minutes }: { state: AppState; customerId: string; minutes: number }) {
  const last = lastEarn(state, customerId);
  const wait = last ? minutes * 60_000 - (Date.now() - Date.parse(last.createdAt)) : 0;
  return <Rule ok={wait <= 0}>{wait <= 0 ? "Bekleme süresi uygun" : `Son damgadan beri ${Math.round((Date.now() - Date.parse(last!.createdAt)) / 60000)} dk geçti (min. ${minutes} dk)`}</Rule>;
}

function CustomerStrip({ c, onClear }: { c: Customer; onClear: () => void }) {
  const { state } = useStore();
  const visits = state.orders.filter((o) => o.customerId === c.id);
  const lastV = visits.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-ink p-3.5 text-cream">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-beef font-display text-[15px] font-semibold text-ink">{initials(c.name)}</span>
      <div className="min-w-0 flex-1">
        <div className="t-h1 truncate">{c.name}</div>
        <div className="mt-0.5 text-xs text-smoke tabular">
          {maskPhone(c.phone)} · {visits.length} ziyaret{lastV ? ` · son ${fmtDate(lastV.createdAt)}` : ""}
        </div>
      </div>
      <div className="text-right">
        <div className="t-num-lg text-[24px] text-beef">
          {Math.min(balanceOf(state, c.id), state.rules.stampsRequired)}/{state.rules.stampsRequired}
        </div>
        <div className="text-xs text-smoke">damga</div>
      </div>
      <button onClick={onClear} className="grid h-10 w-10 place-items-center rounded-full bg-ink-3" aria-label="Müşteriyi kapat">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function FeedbackBanner({ fb, onClose }: { fb: NonNullable<Feedback>; onClose: () => void }) {
  const tone = fb.tone === "ok" ? "bg-ok text-cream" : fb.tone === "bad" ? "bg-bad text-cream" : "bg-beef text-ink";
  const Icon = fb.tone === "bad" ? CircleAlert : fb.tone === "reward" ? Gift : Check;
  return (
    <div role="status" className={`animate-pop flex items-start gap-2.5 rounded-xl p-3 ${tone}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="t-h2">{fb.title}</div>
        <div className="text-[13px] opacity-90">{fb.text}</div>
      </div>
      <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-black/10" aria-label="Kapat">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-black/50 p-0 sm:place-items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal aria-label={title} className="animate-rise w-full max-w-md rounded-t-3xl bg-white p-6 pb-[max(24px,env(safe-area-inset-bottom))] text-ink sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink/60">{title}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-paper" aria-label="Kapat">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   GENEL BAKIŞ
   ========================================================= */
export function DashboardPage({ go }: { go: (p: string) => void }) {
  const { state } = useStore();
  const { can } = useMe();
  const [scope, setScope] = useState<"branch" | "all">("branch");
  const branchId = state.panel.branchId;
  const inScope = (b: string) => scope === "all" || b === branchId;
  const now = Date.now();
  const earns = state.ledger.filter((e) => e.type === "earn" && inScope(e.branchId) && !isReversed(state, e.id));
  const today = earns.filter((e) => new Date(e.createdAt).toDateString() === new Date().toDateString()).length;
  const last30 = earns.filter((e) => now - Date.parse(e.createdAt) < 30 * DAY).length;
  const grants30 = state.grants.filter((g) => now - Date.parse(g.createdAt) < 90 * DAY);
  const redeemed = grants30.filter((g) => g.status === "redeemed").length;
  const orders = state.orders.filter((o) => inScope(o.branchId) && now - Date.parse(o.createdAt) < 30 * DAY);
  const avg = orders.length ? orders.reduce((s, o) => s + o.amount, 0) / orders.length : 0;
  const members = state.customers.filter((c) => scope === "all" || c.homeBranchId === branchId);
  const r = state.rules;

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * DAY);
    const key = d.toDateString();
    return { d, n: earns.filter((e) => new Date(e.createdAt).toDateString() === key).length };
  });
  const max = Math.max(3, ...days.map((d) => d.n));

  const buckets = [
    { l: `0–${Math.floor(r.stampsRequired * 0.4)}`, test: (b: number) => b <= Math.floor(r.stampsRequired * 0.4) },
    { l: `${Math.floor(r.stampsRequired * 0.4) + 1}–${r.stampsRequired - 3}`, test: (b: number) => b > Math.floor(r.stampsRequired * 0.4) && b <= r.stampsRequired - 3 },
    { l: `${r.stampsRequired - 2}–${r.stampsRequired - 1} · ödüle yakın`, test: (b: number) => b >= r.stampsRequired - 2 },
  ].map((b) => ({ ...b, n: members.filter((c) => b.test(balanceOf(state, c.id))).length }));
  const near = members.filter((c) => balanceOf(state, c.id) >= r.stampsRequired - 2);
  const withReward = members.filter((c) => availableGrants(state, c.id).length > 0);

  return (
    <div className="grid gap-5">
      <PageHead
        title="Genel bakış"
        sub="Örnek verilerle hesaplanır."
        action={
          can(["admin", "manager"]) ? (
            <div className="grid grid-cols-2 rounded-xl bg-white p-1 ring-1 ring-paper-line">
              {(
                [
                  ["branch", "Bu şube"],
                  ["all", "Tüm şubeler"],
                ] as const
              ).map(([k, l]) => (
                <button key={k} onClick={() => setScope(k)} disabled={k === "all" && !can(["admin"])} className={`h-9 rounded-lg px-3 text-sm font-semibold ${scope === k ? "bg-ink text-beef" : "text-ink/60 disabled:text-ink/25"}`}>
                  {l}
                </button>
              ))}
            </div>
          ) : undefined
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi accent label="Bugün verilen damga" value={today} sub={`Son 30 gün: ${last30}`} />
        <Kpi label="Üye" value={members.length} sub={`${members.filter((c) => now - Date.parse(c.joinedAt) < 30 * DAY).length} yeni (30 gün)`} />
        <Kpi label="Ödül kullanım oranı" value={`%${grants30.length ? Math.round((redeemed / grants30.length) * 100) : 0}`} sub={`${redeemed}/${grants30.length} ödül · 90 gün`} />
        <Kpi label="Ortalama sepet" value={fmtTL(Math.round(avg))} sub={`${orders.length} doğrulanmış sipariş`} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card title="Son 14 gün · verilen damga" action={<TrendingUp className="h-4 w-4 text-ink/40" />}>
          <svg viewBox="0 0 700 220" className="h-auto w-full" role="img" aria-label="Günlük damga sayısı grafiği">
            {[0, 0.5, 1].map((t) => (
              <g key={t}>
                <line x1="34" x2="700" y1={190 - t * 160} y2={190 - t * 160} stroke="#e6e2d9" strokeWidth="1" />
                <text x="26" y={194 - t * 160} textAnchor="end" fontSize="11" fill="#161514" opacity="0.5">
                  {Math.round(max * t)}
                </text>
              </g>
            ))}
            {days.map((d, i) => {
              const h = (d.n / max) * 160;
              const x = 44 + i * 47;
              const isToday = i === 13;
              return (
                <g key={i}>
                  <rect x={x} y={190 - h} width="32" height={Math.max(h, 2)} rx="6" fill={isToday ? "#e25601" : "#161514"} opacity={isToday ? 1 : 0.85} />
                  {d.n > 0 && (
                    <text x={x + 16} y={184 - h} textAnchor="middle" fontSize="11" fontWeight="700" fill="#161514">
                      {d.n}
                    </text>
                  )}
                  <text x={x + 16} y="210" textAnchor="middle" fontSize="11" fill="#161514" opacity="0.55">
                    {d.d.getDate()}
                  </text>
                </g>
              );
            })}
          </svg>
        </Card>
        <Card title="Kart doluluk dağılımı">
          <div className="grid gap-3">
            {buckets.map((b, i) => (
              <div key={b.l}>
                <div className="flex justify-between text-sm font-semibold">
                  <span>{b.l} damga</span>
                  <span className="tabular">{b.n}</span>
                </div>
                <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-paper">
                  <div className={`h-full rounded-full ${i === 2 ? "bg-beef" : "bg-ink"}`} style={{ width: `${members.length ? (b.n / members.length) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button onClick={() => go("musteriler")} className="rounded-xl bg-beef/20 p-3 text-left ring-1 ring-beef">
              <div className="t-num">{near.length}</div>
              <div className="text-xs font-semibold">ödüle 1–2 damga kalan</div>
            </button>
            <button onClick={() => go("musteriler")} className="rounded-xl bg-paper p-3 text-left ring-1 ring-paper-line">
              <div className="t-num">{withReward.length}</div>
              <div className="text-xs font-semibold">ödülü hazır bekleyen</div>
            </button>
          </div>
        </Card>
      </div>
      <Card title="Son hareketler" pad={false} action={<button onClick={() => go("islemler")} className="text-xs font-semibold text-ink/60 hover:text-ink">Tümü →</button>}>
        <LedgerTable rows={8} scopeAll={scope === "all"} compact />
      </Card>
    </div>
  );
}

/* =========================================================
   MÜŞTERİLER
   ========================================================= */
export function CustomersPage({ go }: { go: (p: string) => void }) {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const [f, setF] = useState<"all" | "near" | "reward" | "new">("all");
  const [open, setOpen] = useState<string | null>(null);
  const r = state.rules;
  const rows = state.customers
    .map((c) => {
      const bal = balanceOf(state, c.id);
      const visits = state.orders.filter((o) => o.customerId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return { c, bal, avail: availableGrants(state, c.id).length, last: visits[0]?.createdAt, visits: visits.length };
    })
    .filter(({ c, bal, avail }) => {
      const s = q.toLocaleLowerCase("tr-TR");
      if (s && !c.name.toLocaleLowerCase("tr-TR").includes(s) && !c.phone.endsWith(s.replace(/\D/g, "") || "x")) return false;
      if (f === "near") return bal >= r.stampsRequired - 2;
      if (f === "reward") return avail > 0;
      if (f === "new") return Date.now() - Date.parse(c.joinedAt) < 30 * DAY;
      return true;
    })
    .sort((a, b) => (b.last ?? b.c.joinedAt).localeCompare(a.last ?? a.c.joinedAt));
  const sel = state.customers.find((c) => c.id === open);

  return (
    <div className="grid gap-5">
      <PageHead title="Müşteriler" sub={`${state.customers.length} üye · örnek veri`} />
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <label htmlFor="cu-q" className="sr-only">
            Müşteri ara
          </label>
          <input id="cu-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ad veya telefonun son haneleri" className={`${inputCls} bg-white pl-9`} />
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {(
            [
              ["all", "Tümü"],
              ["near", "Ödüle yakın"],
              ["reward", "Ödülü hazır"],
              ["new", "Yeni üyeler"],
            ] as const
          ).map(([k, l]) => (
            <button key={k} onClick={() => setF(k)} className={`h-10 shrink-0 rounded-xl px-3.5 text-sm font-semibold ${f === k ? "bg-ink text-beef" : "bg-white text-ink/60 ring-1 ring-paper-line"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-paper-line">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-paper-line text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/50">
              <th className="px-4 py-2.5">Üye</th>
              <th className="px-3 py-2.5">Telefon</th>
              <th className="px-3 py-2.5">Kart</th>
              <th className="px-3 py-2.5">Ödül</th>
              <th className="px-3 py-2.5">Ziyaret</th>
              <th className="px-3 py-2.5">Son ziyaret</th>
              <th className="px-3 py-2.5">Şube</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-line">
            {rows.map(({ c, bal, avail, last, visits }) => (
              <tr key={c.id} onClick={() => setOpen(c.id)} className="cursor-pointer hover:bg-paper">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink font-display text-[13px] font-semibold text-beef">{initials(c.name)}</span>
                    <span className="font-semibold">{c.name}</span>
                    {state.session.customerId === c.id && <Badge tone="dark">Uygulamada</Badge>}
                  </div>
                </td>
                <td className="px-3 py-2.5 tabular text-ink/70">{maskPhone(c.phone)}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 overflow-hidden rounded-full bg-paper">
                      <div className="h-full rounded-full bg-ink" style={{ width: `${(Math.min(bal, r.stampsRequired) / r.stampsRequired) * 100}%` }} />
                    </div>
                    <span className="font-semibold tabular">
                      {bal}/{r.stampsRequired}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5">{avail > 0 ? <Badge tone="beef">{avail} hazır</Badge> : <span className="text-ink/30">—</span>}</td>
                <td className="px-3 py-2.5 tabular">{visits}</td>
                <td className="px-3 py-2.5 text-ink/70">{last ? fmtDate(last) : "—"}</td>
                <td className="px-3 py-2.5 text-ink/70">{state.branches.find((b) => b.id === c.homeBranchId)?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-sm text-ink/50">Filtreye uyan üye yok.</p>}
      </div>
      {sel && <CustomerDrawer c={sel} onClose={() => setOpen(null)} go={go} />}
    </div>
  );
}

function CustomerDrawer({ c, onClose, go }: { c: Customer; onClose: () => void; go: (p: string) => void }) {
  const { state } = useStore();
  const r = state.rules;
  const grants = grantsOf(state, c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const ledger = state.ledger.filter((e) => e.customerId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const spent = state.orders.filter((o) => o.customerId === c.id).reduce((s, o) => s + o.amount, 0);
  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/40" onClick={onClose}>
      <div className="animate-rise h-full w-full max-w-[480px] overflow-y-auto bg-paper p-5 pt-[max(20px,env(safe-area-inset-top))]" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal aria-label={c.name}>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-ink font-display text-[15px] font-semibold text-beef">{initials(c.name)}</span>
          <div className="min-w-0 flex-1">
            <div className="t-h1 truncate">{c.name}</div>
            <div className="mt-1 text-sm text-ink/60 tabular">{maskPhone(c.phone)}</div>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-paper-line" aria-label="Kapat">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5">
          <StampCard stamps={Math.min(balanceOf(state, c.id), r.stampsRequired)} required={r.stampsRequired} rewardName={state.rewards.find((x) => x.id === r.rewardId)?.name ?? ""} compact />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Kpi label="Ziyaret" value={state.orders.filter((o) => o.customerId === c.id).length} />
          <Kpi label="Ödül" value={grants.length} />
          <Kpi label="Harcama" value={<span className="text-lg">{fmtTL(spent)}</span>} />
        </div>
        <Btn className="mt-4 w-full" size="lg" onClick={() => go(`kasa/${c.id}`)}>
          <ScanLine className="h-5 w-5" /> Kasada işle
        </Btn>
        <div className="mt-5 grid gap-1 rounded-xl bg-white p-4 text-sm ring-1 ring-paper-line">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/50">Üyelik ve izinler</div>
          <div className="flex justify-between"><span className="text-ink/60">Üyelik</span><b>{fmtDate(c.joinedAt)}</b></div>
          <div className="flex justify-between"><span className="text-ink/60">KVKK aydınlatma</span><b>{c.consents.kvkk ? "Onaylı" : "—"}</b></div>
          <div className="flex justify-between"><span className="text-ink/60">Ticari ileti (İYS)</span><b>{c.consents.marketing ? "İzinli" : "İzin yok"}</b></div>
        </div>
        <h3 className="mt-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/50">Ödüller</h3>
        <ul className="mt-2 grid gap-1.5">
          {grants.map((g) => (
            <li key={g.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-paper-line">
              <span className="font-semibold">{state.rewards.find((x) => x.id === g.rewardId)?.name}</span>
              {g.status === "available" ? <Badge tone="beef">Hazır · {daysLeft(g.expiresAt)} gün</Badge> : g.status === "redeemed" ? <Badge tone="ok">Kullanıldı {fmtDate(g.redeemedAt!)}</Badge> : <Badge tone="bad">Süresi doldu</Badge>}
            </li>
          ))}
          {grants.length === 0 && <li className="text-sm text-ink/50">Henüz ödül yok.</li>}
        </ul>
        <h3 className="mt-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/50">Damga defteri</h3>
        <ul className="mt-2 divide-y divide-paper-line rounded-xl bg-white ring-1 ring-paper-line">
          {ledger.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <span className="font-semibold">{TYPE_LABEL[e.type]}</span>
              <span className="ml-auto text-ink/50 tabular">{fmtDateTime(e.createdAt)}</span>
              <span className={`w-10 text-right font-display text-[15px] font-semibold tabular ${e.amount > 0 ? "" : "text-ink/40"}`}>{e.amount > 0 ? `+${e.amount}` : e.amount}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* =========================================================
   SADAKAT İŞLEMLERİ (silinmeyen defter)
   ========================================================= */
const TYPE_LABEL: Record<string, string> = {
  earn: "Damga",
  welcome: "Hoş geldin",
  convert: "Ödüle dönüşüm",
  reversal: "Ters kayıt",
  adjust: "Düzeltme",
  redeem: "Ödül kullanımı",
};

function LedgerTable({ rows, scopeAll, compact, typeFilter = "all" }: { rows?: number; scopeAll?: boolean; compact?: boolean; typeFilter?: string }) {
  const { state, update, toast } = useStore();
  const { can } = useMe();
  const [rev, setRev] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const items = useMemo(() => {
    const led = state.ledger.map((e) => ({ id: e.id, kind: e.type as string, at: e.createdAt, customerId: e.customerId, branchId: e.branchId, staffId: e.staffId, amount: e.amount as number | null, orderId: e.orderId, entry: e }));
    const red = state.grants
      .filter((g) => g.status === "redeemed" && g.redeemedAt)
      .map((g) => ({ id: `rd-${g.id}`, kind: "redeem", at: g.redeemedAt!, customerId: g.customerId, branchId: g.redeemedBranchId ?? "", staffId: g.redeemedBy, amount: null, orderId: undefined, entry: undefined }));
    return [...led, ...red]
      .filter((x) => scopeAll || x.branchId === state.panel.branchId)
      .filter((x) => typeFilter === "all" || x.kind === typeFilter)
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, rows ?? 200);
  }, [state, scopeAll, rows, typeFilter]);
  const orders = new Map(state.orders.map((o) => [o.id, o]));
  return (
    <>
      <div className="overflow-x-auto">
        <table className={`w-full text-sm ${compact ? "min-w-[640px]" : "min-w-[860px]"}`}>
          <thead>
            <tr className="border-b border-paper-line text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/50">
              <th className="px-4 py-2.5">Zaman</th>
              <th className="px-3 py-2.5">İşlem</th>
              <th className="px-3 py-2.5">Üye</th>
              <th className="px-3 py-2.5">Fiş / tutar</th>
              {!compact && <th className="px-3 py-2.5">Personel</th>}
              {!compact && <th className="px-3 py-2.5">Şube</th>}
              <th className="px-3 py-2.5 text-right">Damga</th>
              {!compact && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-line">
            {items.map((x) => {
              const c = state.customers.find((cc) => cc.id === x.customerId);
              const o = x.orderId ? orders.get(x.orderId) : undefined;
              const reversed = x.entry && isReversed(state, x.entry.id);
              return (
                <tr key={x.id} className={reversed ? "text-ink/40" : ""}>
                  <td className="whitespace-nowrap px-4 py-2.5 tabular text-ink/60">{fmtDateTime(x.at)}</td>
                  <td className="px-3 py-2.5">
                    <Badge tone={x.kind === "earn" ? "beef" : x.kind === "redeem" ? "ok" : x.kind === "reversal" ? "bad" : x.kind === "convert" ? "dark" : "neutral"}>{TYPE_LABEL[x.kind]}</Badge>
                    {reversed && <span className="ml-1.5 text-[11px] font-semibold">geri alındı</span>}
                  </td>
                  <td className="px-3 py-2.5 font-semibold">{c?.name}</td>
                  <td className="px-3 py-2.5 tabular text-ink/60">{o ? `${o.receiptNo} · ${fmtTL(o.amount)}` : x.entry?.note ?? "—"}</td>
                  {!compact && <td className="px-3 py-2.5 text-ink/60">{state.staff.find((s) => s.id === x.staffId)?.name ?? "Sistem"}</td>}
                  {!compact && <td className="px-3 py-2.5 text-ink/60">{state.branches.find((b) => b.id === x.branchId)?.name}</td>}
                  <td className="px-3 py-2.5 text-right font-display text-[15px] font-semibold tabular">{x.amount === null ? "—" : x.amount > 0 ? `+${x.amount}` : x.amount}</td>
                  {!compact && (
                    <td className="px-4 py-2.5 text-right">
                      {x.kind === "earn" && !reversed && (
                        <button
                          onClick={() => (can(["admin", "manager"]) ? (setRev(x.id), setNote("")) : toast("Geri alma için şube müdürü veya yönetici yetkisi gerekir.", "bad"))}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-ink/50 hover:bg-bad-soft hover:text-bad"
                        >
                          <Undo2 className="h-3.5 w-3.5" /> Geri al
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {items.length === 0 && <p className="p-6 text-center text-sm text-ink/50">Kayıt yok.</p>}
      {rev && (
        <Modal title="Damgayı geri al" onClose={() => setRev(null)}>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              update((s) => {
                const out = reverseEntry(s, rev, s.panel.staffId, note.trim());
                if (out.result.ok) toast("Ters kayıt eklendi. Orijinal kayıt silinmedi.");
                else toast(out.result.error, "bad");
                return out.state;
              });
              setRev(null);
            }}
          >
            <p className="text-sm text-ink/70">Kayıt silinmez; −1 damgalık bir ters kayıt eklenir ve denetim için gerekçe saklanır.</p>
            <Field label="Gerekçe (zorunlu)" htmlFor="rv-note">
              <input id="rv-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Örn. yanlış müşteriye okutuldu" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Btn tone="ghost" onClick={() => setRev(null)}>
                Vazgeç
              </Btn>
              <Btn tone="danger" type="submit" disabled={note.trim().length < 4}>
                Geri al
              </Btn>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export function LedgerPage() {
  const { can } = useMe();
  const [type, setType] = useState("all");
  const [all, setAll] = useState(false);
  return (
    <div className="grid gap-5">
      <PageHead title="Sadakat işlemleri" sub="Damga defteri silinmez; düzeltmeler ters kayıtla yapılır." />
      <div className="flex flex-wrap items-center gap-2">
        {["all", "earn", "convert", "redeem", "reversal", "welcome"].map((k) => (
          <button key={k} onClick={() => setType(k)} className={`h-10 rounded-xl px-3.5 text-sm font-semibold ${type === k ? "bg-ink text-beef" : "bg-white text-ink/60 ring-1 ring-paper-line"}`}>
            {k === "all" ? "Tümü" : TYPE_LABEL[k]}
          </button>
        ))}
        {can(["admin"]) && (
          <label htmlFor="lg-all" className="ml-auto flex items-center gap-2 text-sm font-semibold text-ink/70">
            <input id="lg-all" type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} className="h-4 w-4 accent-[#e25601]" /> Tüm şubeler
          </label>
        )}
      </div>
      <Card pad={false}>
        <LedgerTable typeFilter={type} scopeAll={all} />
      </Card>
      {!can(["admin", "manager"]) && <Locked>Personel işlemleri görüntüleyebilir; geri alma yetkisi şube müdürü ve yöneticidedir.</Locked>}
    </div>
  );
}

/* =========================================================
   KAMPANYA VE ÖDÜLLER
   ========================================================= */
export function CampaignPage() {
  const { state, update, toast } = useStore();
  const { can } = useMe();
  const editable = can(["admin"]);
  const [draft, setDraft] = useState<ProgramRules>(state.rules);
  useEffect(() => {
    setDraft(state.rules);
  }, [state.rules]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(state.rules);
  // Yazarken serbest; alandan çıkınca izin verilen aralığa çekilir.
  const [raw, setRaw] = useState<Partial<Record<keyof ProgramRules, string>>>({});
  const num = (k: keyof ProgramRules, min: number, max: number) => ({
    id: `cp-${k}`,
    type: "number",
    inputMode: "numeric" as const,
    min,
    max,
    value: raw[k] ?? String(draft[k]),
    disabled: !editable,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setRaw({ ...raw, [k]: e.target.value });
      const n = Number(e.target.value);
      if (e.target.value !== "" && n >= min && n <= max) setDraft({ ...draft, [k]: n });
    },
    onBlur: () => {
      const n = Number(raw[k]);
      if (raw[k] !== undefined) setDraft({ ...draft, [k]: Math.max(min, Math.min(max, Number.isFinite(n) && raw[k] !== "" ? n : (draft[k] as number))) });
      setRaw({ ...raw, [k]: undefined });
    },
    className: `${inputCls} tabular`,
  });
  const reward = state.rewards.find((x) => x.id === draft.rewardId);

  return (
    <div className="grid gap-5">
      <PageHead
        title="Kampanya ve ödüller"
        sub="Program kuralları henüz kesinleşmedi; tüm değerler örnektir."
        action={<Badge tone="beef">Taslak kurallar</Badge>}
      />
      {!editable && <Locked>Kuralları yalnızca yönetici değiştirebilir. Oturumu "Ayşe K. · Yönetici" olarak değiştirerek deneyebilirsiniz.</Locked>}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <Card title="Damga kartı kuralları">
          <form
            className="grid gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              update((s) => ({ ...s, rules: draft }));
              toast("Kurallar kaydedildi. Müşteri uygulaması güncellendi.");
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ödül için gereken damga" htmlFor="cp-stampsRequired" hint={`${draft.stampsRequired} sipariş → ${draft.stampsRequired + 1}. sipariş hediye`}>
                <input {...num("stampsRequired", 3, 20)} />
              </Field>
              <Field label="Kayıt hediyesi damga" htmlFor="cp-welcomeStamps" hint="Kart dolu başlar; tamamlanma oranını artırır">
                <input {...num("welcomeStamps", 0, 5)} />
              </Field>
              <Field label="Minimum sepet (₺)" htmlFor="cp-minSpend">
                <input {...num("minSpend", 0, 5000)} />
              </Field>
              <Field label="Bekleme süresi (dakika)" htmlFor="cp-cooldownMinutes" hint="Aynı hesaba arka arkaya damga verilmesini engeller">
                <input {...num("cooldownMinutes", 0, 1440)} />
              </Field>
              <Field label="Ödül geçerlilik (gün)" htmlFor="cp-rewardExpiryDays">
                <input {...num("rewardExpiryDays", 7, 365)} />
              </Field>
              <Field label="Damga geçerlilik (ay)" htmlFor="cp-stampExpiryMonths">
                <input {...num("stampExpiryMonths", 1, 36)} />
              </Field>
            </div>
            <Field label="Kart dolunca verilecek ödül" htmlFor="cp-reward">
              <select id="cp-reward" value={draft.rewardId} disabled={!editable} onChange={(e) => setDraft({ ...draft, rewardId: e.target.value })} className={inputCls}>
                {state.rewards
                  .filter((x) => x.active)
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name} · tavan {fmtTL(x.cap)}
                    </option>
                  ))}
              </select>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Btn type="submit" disabled={!editable || !dirty}>
                Kaydet
              </Btn>
              <Btn tone="ghost" disabled={!dirty} onClick={() => setDraft(state.rules)}>
                Değişiklikleri geri al
              </Btn>
            </div>
            <p className="text-xs leading-relaxed text-ink/50">
              Gerçek sistemde kural değişiklikleri yeni bir kampanya sürümü olarak kaydedilir; mevcut kartların bu değişiklikten nasıl etkileneceği ayrıca karar verilecek bir konudur.
            </p>
          </form>
        </Card>
        <div className="grid content-start gap-4">
          <Card title="Canlı önizleme">
            <StampCard stamps={Math.min(draft.welcomeStamps, draft.stampsRequired)} required={draft.stampsRequired} name="Yeni üye" rewardName={reward?.name ?? ""} compact />
            <ul className="mt-4 grid gap-1.5 text-sm text-ink/70">
              <li>• Müşterinin gördüğü indirim: %{Math.round((1 / (draft.stampsRequired + 1)) * 100)}</li>
              <li>• Ödül tavanı: {fmtTL(reward?.cap ?? 0)}</li>
              <li>• Yeni üye ilk ödüle {Math.max(0, draft.stampsRequired - draft.welcomeStamps)} sipariş uzakta</li>
            </ul>
          </Card>
        </div>
      </div>
      <Card title="Ödül kataloğu">
        <div className="grid gap-3 md:grid-cols-3">
          {state.rewards.map((rw) => (
            <div key={rw.id} className={`overflow-hidden rounded-xl ring-1 ${rw.active ? "ring-paper-line" : "opacity-60 ring-paper-line"}`}>
              {rw.image ? <img src={asset(rw.image)} alt={rw.name} className="h-36 w-full object-cover object-bottom" /> : <div className="grid h-36 place-items-center bg-beef"><Ticket className="h-10 w-10" /></div>}
              <div className="grid gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{rw.name}</div>
                    <div className="text-xs text-ink/60">{rw.description}</div>
                  </div>
                  {state.rules.rewardId === rw.id && <Badge tone="dark">Kart ödülü</Badge>}
                </div>
                <div className="flex items-end gap-2">
                  <Field label="Fiyat tavanı (₺)" htmlFor={`rw-cap-${rw.id}`}>
                    <input
                      id={`rw-cap-${rw.id}`}
                      type="number"
                      value={rw.cap}
                      disabled={!editable}
                      onChange={(e) => update((s) => ({ ...s, rewards: s.rewards.map((x) => (x.id === rw.id ? { ...x, cap: Number(e.target.value) || 0 } : x)) }))}
                      className={`${inputCls} tabular`}
                    />
                  </Field>
                  <Btn
                    tone={rw.active ? "ghost" : "dark"}
                    size="md"
                    disabled={!editable || state.rules.rewardId === rw.id}
                    onClick={() => update((s) => ({ ...s, rewards: s.rewards.map((x) => (x.id === rw.id ? { ...x, active: !x.active } : x)) }))}
                  >
                    {rw.active ? "Pasifleştir" : "Etkinleştir"}
                  </Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-ink/50">Ürün görselleri @thebeef.burger hesabındaki gönderilerden alınmıştır. Diğer ürünlerin fotoğrafları markadan beklenmektedir.</p>
      </Card>
    </div>
  );
}

/* =========================================================
   ŞUBELER VE PERSONEL
   ========================================================= */
export function BranchesPage() {
  const { state, update, toast } = useStore();
  const { can } = useMe();
  const now = Date.now();
  const stats = (id: string) => ({
    members: state.customers.filter((c) => c.homeBranchId === id).length,
    stamps: state.ledger.filter((e) => e.branchId === id && e.type === "earn" && now - Date.parse(e.createdAt) < 30 * DAY).length,
    redeemed: state.grants.filter((g) => g.redeemedBranchId === id && g.redeemedAt && now - Date.parse(g.redeemedAt) < 30 * DAY).length,
    staff: state.staff.filter((s) => s.branchIds.includes(id) && s.active).length,
  });
  const matrix: [string, Role[]][] = [
    ["QR okutma, damga verme", ["staff", "manager", "admin"]],
    ["Ödül kullandırma", ["staff", "manager", "admin"]],
    ["Müşteri arama (maskeli telefon)", ["staff", "manager", "admin"]],
    ["Damga geri alma (gerekçeli)", ["manager", "admin"]],
    ["Şube istatistikleri", ["manager", "admin"]],
    ["Tüm şubeleri görme", ["admin"]],
    ["Kampanya kuralları ve ödüller", ["admin"]],
    ["Personel ve şube yönetimi", ["admin"]],
    ["Telefon numarasının tamamını görme (demoda kapalı)", ["admin"]],
  ];
  return (
    <div className="grid gap-5">
      <PageHead title="Şubeler ve personel" sub="Franchise yapısına hazır: her şube ayrı izlenir, müşteri kartı tüm şubelerde geçerli." />
      <div className="grid gap-4 md:grid-cols-3">
        {state.branches.map((b) => {
          const s = stats(b.id);
          return (
            <div key={b.id} className={`rounded-xl bg-white p-5 ring-1 ring-paper-line ${b.active ? "" : "opacity-70"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="t-h2">{b.name}</div>
                  <div className="mt-1 text-xs text-ink/60">
                    {b.city} · {b.address}
                  </div>
                </div>
                <Badge tone={b.active ? "ok" : "neutral"}>{b.active ? "Aktif" : "Pasif"}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <MiniStat l="Üye" v={s.members} />
                <MiniStat l="Damga · 30 gün" v={s.stamps} />
                <MiniStat l="Kullanılan ödül" v={s.redeemed} />
                <MiniStat l="Aktif personel" v={s.staff} />
              </div>
              {can(["admin"]) && (
                <Btn
                  tone="ghost"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => {
                    update((st) => ({ ...st, branches: st.branches.map((x) => (x.id === b.id ? { ...x, active: !x.active } : x)) }));
                    toast(`${b.name} şubesi ${b.active ? "pasifleştirildi" : "etkinleştirildi"}.`, "info");
                  }}
                >
                  {b.active ? "Pasifleştir" : "Etkinleştir"}
                </Btn>
              )}
            </div>
          );
        })}
      </div>
      <Card title="Personel" pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-paper-line text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/50">
                <th className="px-4 py-2.5">Ad</th>
                <th className="px-3 py-2.5">Rol</th>
                <th className="px-3 py-2.5">Şube</th>
                <th className="px-3 py-2.5">Durum</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {state.staff.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2.5 font-semibold">{s.name}</td>
                  <td className="px-3 py-2.5">
                    {can(["admin"]) ? (
                      <>
                        <label htmlFor={`st-role-${s.id}`} className="sr-only">
                          Rol
                        </label>
                        <select
                          id={`st-role-${s.id}`}
                          value={s.role}
                          disabled={s.id === state.panel.staffId}
                          onChange={(e) => update((st) => ({ ...st, staff: st.staff.map((x) => (x.id === s.id ? { ...x, role: e.target.value as Role } : x)) }))}
                          className="h-9 rounded-lg bg-paper px-2 text-sm font-semibold ring-1 ring-paper-line"
                        >
                          {(["staff", "manager", "admin"] as Role[]).map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABEL[r]}
                            </option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <Badge>{ROLE_LABEL[s.role]}</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-ink/70">{s.branchIds.map((id) => state.branches.find((b) => b.id === id)?.name).join(", ")}</td>
                  <td className="px-3 py-2.5">{s.active ? <Badge tone="ok">Aktif</Badge> : <Badge>Pasif</Badge>}</td>
                  <td className="px-4 py-2.5 text-right">
                    {can(["admin"]) && s.id !== state.panel.staffId && (
                      <button onClick={() => update((st) => ({ ...st, staff: st.staff.map((x) => (x.id === s.id ? { ...x, active: !x.active } : x)) }))} className="text-xs font-semibold text-ink/50 hover:text-ink">
                        {s.active ? "Erişimi kapat" : "Erişimi aç"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Yetki matrisi" pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-paper-line text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/50">
                <th className="px-4 py-2.5">Yetki</th>
                {(["staff", "manager", "admin"] as Role[]).map((r) => (
                  <th key={r} className="px-3 py-2.5 text-center">
                    {ROLE_LABEL[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {matrix.map(([l, roles]) => (
                <tr key={l}>
                  <td className="px-5 py-2.5 font-semibold">{l}</td>
                  {(["staff", "manager", "admin"] as Role[]).map((r) => (
                    <td key={r} className="px-3 py-2.5 text-center">
                      {roles.includes(r) ? <Check className="mx-auto h-4 w-4 text-ok" strokeWidth={3} /> : <span className="text-ink/20">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {!can(["admin"]) && <Locked>Şube ve personel değişiklikleri yalnızca yönetici yetkisiyle yapılabilir.</Locked>}
    </div>
  );
}

function MiniStat({ l, v }: { l: string; v: number }) {
  return (
    <div className="rounded-xl bg-paper p-2.5">
      <div className="t-num">{v}</div>
      <div className="mt-1 text-[11px] font-semibold text-ink/55">{l}</div>
    </div>
  );
}
