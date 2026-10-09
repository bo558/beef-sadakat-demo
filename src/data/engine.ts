import type { AppState, Customer, LedgerEntry, RewardGrant } from "./types";

/**
 * Sadakat iş kuralları. Gerçek sistemde bu mantık veritabanı fonksiyonlarında
 * tek bir işlem (transaction) içinde çalışacak; prototipte saf fonksiyonlardır.
 */

let counter = 0;
export const uid = (p: string) =>
  `${p}-${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const DAY = 86_400_000;

export function balanceOf(state: AppState, customerId: string): number {
  return state.ledger.reduce((s, e) => (e.customerId === customerId ? s + e.amount : s), 0);
}

export function grantsOf(state: AppState, customerId: string): RewardGrant[] {
  return state.grants
    .filter((g) => g.customerId === customerId)
    .map((g) => (g.status === "available" && Date.parse(g.expiresAt) < Date.now() ? { ...g, status: "expired" as const } : g));
}

export function availableGrants(state: AppState, customerId: string) {
  return grantsOf(state, customerId).filter((g) => g.status === "available");
}

export function lastEarn(state: AppState, customerId: string): LedgerEntry | undefined {
  let last: LedgerEntry | undefined;
  for (const e of state.ledger) if (e.customerId === customerId && e.type === "earn" && (!last || e.createdAt > last.createdAt)) last = e;
  return last;
}

export function isReversed(state: AppState, entryId: string) {
  return state.ledger.some((e) => e.reversalOf === entryId);
}

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string; code: string };

export interface EarnInput {
  customerId: string;
  branchId: string;
  staffId: string;
  receiptNo: string;
  amount: number;
  ignoreCooldown?: boolean;
  at?: number;
}

/** Sipariş doğrulama + damga. Kart dolarsa aynı işlemde ödül açılır. */
export function earnStamp(state: AppState, input: EarnInput): { state: AppState; result: Result<{ rewardGrantId?: string; balance: number }> } {
  const fail = (code: string, error: string) => ({ state, result: { ok: false as const, code, error } });
  const now = input.at ?? Date.now();
  const r = state.rules;
  const customer = state.customers.find((c) => c.id === input.customerId);
  if (!customer) return fail("not_found", "Müşteri bulunamadı.");
  const receipt = input.receiptNo.trim().toUpperCase();
  if (!receipt) return fail("receipt", "Fiş / adisyon numarası girin.");
  if (!(input.amount > 0)) return fail("amount", "Sipariş tutarını girin.");
  if (input.amount > 20_000) return fail("amount_high", "Tutar olağan dışı yüksek. Fişteki tutarı kontrol edin.");
  if (input.amount < r.minSpend)
    return fail("min_spend", `Damga için en az ${fmtTL(r.minSpend)} tutarında sipariş gerekiyor.`);
  if (state.orders.some((o) => o.branchId === input.branchId && o.receiptNo === receipt))
    return fail("duplicate", `${receipt} numaralı fiş bu şubede zaten işlendi. Aynı siparişe ikinci damga verilemez.`);
  const last = lastEarn(state, customer.id);
  if (last && !input.ignoreCooldown) {
    const diff = now - Date.parse(last.createdAt);
    const wait = r.cooldownMinutes * 60_000 - diff;
    if (wait > 0) return fail("cooldown", `Bu müşteriye ${Math.ceil(diff / 60_000)} dk önce damga verildi. Yeni damga için ${Math.ceil(wait / 60_000)} dk beklenmeli.`);
  }

  const at = new Date(now).toISOString();
  const orderId = uid("or");
  const ledger: LedgerEntry[] = [
    { id: uid("lx"), customerId: customer.id, type: "earn", amount: 1, branchId: input.branchId, staffId: input.staffId, orderId, createdAt: at },
  ];
  const grants: RewardGrant[] = [];
  let balance = balanceOf(state, customer.id) + 1;
  let rewardGrantId: string | undefined;
  while (balance >= r.stampsRequired) {
    const g: RewardGrant = {
      id: uid("gr"),
      customerId: customer.id,
      rewardId: r.rewardId,
      status: "available",
      createdAt: at,
      expiresAt: new Date(now + r.rewardExpiryDays * DAY).toISOString(),
    };
    grants.push(g);
    rewardGrantId = g.id;
    ledger.push({ id: uid("lx"), customerId: customer.id, type: "convert", amount: -r.stampsRequired, branchId: input.branchId, staffId: input.staffId, grantId: g.id, createdAt: at });
    balance -= r.stampsRequired;
  }
  return {
    state: {
      ...state,
      orders: [...state.orders, { id: orderId, customerId: customer.id, branchId: input.branchId, staffId: input.staffId, receiptNo: receipt, amount: input.amount, createdAt: at }],
      ledger: [...state.ledger, ...ledger],
      grants: [...state.grants, ...grants],
    },
    result: { ok: true, rewardGrantId, balance },
  };
}

/** Ödül kullanımı: yalnızca "kullanılabilir" durumdaki ödül tek seferde "kullanıldı" olur. */
export function redeemGrant(state: AppState, grantId: string, staffId: string, branchId: string): { state: AppState; result: Result } {
  const g = grantsOf(state, state.grants.find((x) => x.id === grantId)?.customerId ?? "").find((x) => x.id === grantId);
  if (!g) return { state, result: { ok: false, code: "not_found", error: "Ödül bulunamadı." } };
  if (g.status === "redeemed")
    return { state, result: { ok: false, code: "already", error: `Bu ödül ${fmtDateTime(g.redeemedAt!)} tarihinde zaten kullanıldı.` } };
  if (g.status === "expired") return { state, result: { ok: false, code: "expired", error: "Bu ödülün süresi dolmuş." } };
  const at = new Date().toISOString();
  return {
    state: { ...state, grants: state.grants.map((x) => (x.id === grantId ? { ...x, status: "redeemed", redeemedAt: at, redeemedBranchId: branchId, redeemedBy: staffId } : x)) },
    result: { ok: true },
  };
}

/** Hatalı damgayı geri alma: kayıt silinmez, ters kayıt eklenir. */
export function reverseEntry(state: AppState, entryId: string, staffId: string, note: string): { state: AppState; result: Result } {
  const e = state.ledger.find((x) => x.id === entryId);
  if (!e || e.type !== "earn") return { state, result: { ok: false, code: "invalid", error: "Yalnızca damga kazanım kayıtları geri alınabilir." } };
  if (isReversed(state, entryId)) return { state, result: { ok: false, code: "already", error: "Bu kayıt zaten geri alınmış." } };
  if (balanceOf(state, e.customerId) < 1)
    return { state, result: { ok: false, code: "balance", error: "Damga ödüle dönüşmüş; önce ödülün durumunu kontrol edin." } };
  const rev: LedgerEntry = { id: uid("lx"), customerId: e.customerId, type: "reversal", amount: -1, branchId: e.branchId, staffId, reversalOf: e.id, note, createdAt: new Date().toISOString() };
  return { state: { ...state, ledger: [...state.ledger, rev] }, result: { ok: true } };
}

export function registerCustomer(state: AppState, input: { id?: string; name: string; phone: string; marketing: boolean; branchId: string }): { state: AppState; customer: Customer } {
  const at = new Date().toISOString();
  const customer: Customer = {
    id: input.id ?? uid("cu"),
    name: input.name.trim(),
    phone: input.phone,
    joinedAt: at,
    homeBranchId: input.branchId,
    consents: { kvkk: true, marketing: input.marketing, consentAt: at },
  };
  const ledger: LedgerEntry[] =
    state.rules.welcomeStamps > 0
      ? [{ id: uid("lx"), customerId: customer.id, type: "welcome", amount: state.rules.welcomeStamps, branchId: input.branchId, createdAt: at, note: "Hoş geldin hediyesi" }]
      : [];
  return { state: { ...state, customers: [...state.customers, customer], ledger: [...state.ledger, ...ledger] }, customer };
}

/** QR: 60 sn'lik zaman penceresine bağlı, müşteri kimliğini açıkça taşımayan kod (demo). */
export const QR_WINDOW_MS = 60_000;
export function qrWindow(now = Date.now()) {
  return Math.floor(now / QR_WINDOW_MS);
}
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
export function backupCode(customerId: string, win = qrWindow()) {
  return String(hash(`${customerId}:${win}:demo-secret`) % 1_000_000).padStart(6, "0");
}
export function qrPayload(customerId: string, win = qrWindow()) {
  return `BEEF1.${win.toString(36)}.${hash(`${customerId}:${win}`).toString(36)}.${backupCode(customerId, win)}`;
}
export function resolveCode(state: AppState, code: string): Customer | undefined {
  const c = code.trim();
  const win = qrWindow();
  return state.customers.find((cu) => [win, win - 1].some((w) => backupCode(cu.id, w) === c || qrPayload(cu.id, w) === c));
}

export const fmtTL = (n: number) => `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(n)} ₺`;
export const fmtDate = (iso: string) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
export const fmtDateTime = (iso: string) =>
  new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
export const fmtTime = (iso: string) => new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
export const maskPhone = (p: string) => {
  const d = p.replace(/\D/g, "").slice(-10);
  return `0${d.slice(0, 3)} ••• •• ${d.slice(8, 10)}`;
};
export const daysLeft = (iso: string) => Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / DAY));
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toLocaleUpperCase("tr-TR"))
    .join("");
