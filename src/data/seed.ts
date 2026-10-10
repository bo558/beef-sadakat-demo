import { DEFAULT_BRANCHES, DEFAULT_REWARDS, DEFAULT_RULES, DEFAULT_STAFF } from "./defaults";
import { earnStamp, redeemGrant, uid } from "./engine";
import type { AppState, Customer } from "./types";

/** ÖRNEK VERİ — gerçek müşteri bilgisi değildir. İsimler ve numaralar uydurmadır. */
const PEOPLE: { name: string; visits: number; branch: string; redeemAll?: boolean; joinedDaysAgo: number }[] = [
  { name: "Ece Yılmaz", visits: 15, branch: "br-cerkezkoy", joinedDaysAgo: 120 },
  { name: "Burak Şahin", visits: 9, branch: "br-cerkezkoy", joinedDaysAgo: 75, redeemAll: true },
  { name: "Zeynep Arslan", visits: 26, branch: "br-cerkezkoy", joinedDaysAgo: 210, redeemAll: true },
  { name: "Kerem Öztürk", visits: 4, branch: "br-ornek", joinedDaysAgo: 30 },
  { name: "Selin Kaya", visits: 7, branch: "br-ornek", joinedDaysAgo: 64 },
  { name: "Mehmet Demir", visits: 1, branch: "br-cerkezkoy", joinedDaysAgo: 6 },
  { name: "Ayşegül Çelik", visits: 18, branch: "br-cerkezkoy", joinedDaysAgo: 160 },
  { name: "Onur Aydın", visits: 12, branch: "br-ornek", joinedDaysAgo: 140, redeemAll: true },
  { name: "Derya Koç", visits: 0, branch: "br-cerkezkoy", joinedDaysAgo: 2 },
  { name: "Tolga Güneş", visits: 6, branch: "br-cerkezkoy", joinedDaysAgo: 48 },
  { name: "Elif Yıldız", visits: 22, branch: "br-ornek", joinedDaysAgo: 230 },
  { name: "Hakan Polat", visits: 3, branch: "br-cerkezkoy", joinedDaysAgo: 21 },
];

export const DEMO_CUSTOMER_INDEX = 0;
export const SEED_VERSION = 5;

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function buildSeed(): AppState {
  const rand = rng(42);
  const now = Date.now();
  const DAY = 86_400_000;
  let state: AppState = {
    version: SEED_VERSION,
    rules: { ...DEFAULT_RULES },
    branches: DEFAULT_BRANCHES.map((b) => ({ ...b })),
    staff: DEFAULT_STAFF.map((s) => ({ ...s })),
    rewards: DEFAULT_REWARDS.map((r) => ({ ...r })),
    customers: [],
    orders: [],
    ledger: [],
    grants: [],
    session: { customerId: null, seenGrantIds: [] },
    panel: { staffId: "st-can", branchId: "br-cerkezkoy" },
  };

  PEOPLE.forEach((p, i) => {
    const joined = now - p.joinedDaysAgo * DAY - Math.floor(rand() * 5) * 3_600_000;
    // Açıkça kurgusal numara: 0500 000 00 01, 02, … (gerçek kişilere ait olmaması için)
    const digits = `5000000${String(i + 1).padStart(3, "0")}`;
    const c: Customer = {
      id: `cu-demo-${i + 1}`,
      name: p.name,
      phone: `+90${digits}`,
      joinedAt: new Date(joined).toISOString(),
      homeBranchId: p.branch,
      consents: { kvkk: true, marketing: rand() > 0.35, consentAt: new Date(joined).toISOString() },
    };
    state.customers.push(c);
    state.ledger.push({
      id: uid("lx"),
      customerId: c.id,
      type: "welcome",
      amount: state.rules.welcomeStamps,
      branchId: p.branch,
      createdAt: c.joinedAt,
      note: "Hoş geldin hediyesi",
    });
    const span = (now - joined) / DAY;
    const times = Array.from({ length: p.visits }, (_, k) => joined + ((k + 0.5 + rand() * 0.4) / (p.visits + 0.3)) * span * DAY)
      .map((t) => Math.min(t, now - 3 * 3_600_000))
      .sort((a, b) => a - b);
    times.forEach((t, k) => {
      const hour = new Date(t);
      hour.setHours(12 + Math.floor(rand() * 10), Math.floor(rand() * 60));
      const at = Math.min(hour.getTime(), now - 3 * 3_600_000);
      const staff = p.branch === "br-cerkezkoy" ? (rand() > 0.5 ? "st-can" : "st-mert") : "st-selin";
      const out = earnStamp(state, {
        customerId: c.id,
        branchId: p.branch,
        staffId: staff,
        receiptNo: `${p.branch === "br-cerkezkoy" ? "C" : "O"}-${(48000 + i * 300 + k * 7).toString()}`,
        amount: 320 + Math.round(rand() * 14) * 45,
        ignoreCooldown: true,
        at,
      });
      state = out.state;
    });
    // Geçmiş ödüllerin bir kısmı kullanılmış
    state.grants
      .filter((g) => g.customerId === c.id)
      .forEach((g, gi, arr) => {
        if (p.redeemAll || gi < arr.length - 1) {
          const r = redeemGrant(state, g.id, p.branch === "br-cerkezkoy" ? "st-can" : "st-selin", p.branch);
          if (r.result.ok) {
            const redeemedAt = new Date(Math.min(Date.parse(g.createdAt) + (2 + Math.floor(rand() * 8)) * DAY, now - DAY)).toISOString();
            state = { ...r.state, grants: r.state.grants.map((x) => (x.id === g.id ? { ...x, redeemedAt } : x)) };
          }
        }
      });
  });
  // Tüm geçmiş ödüller "görüldü" sayılır, yalnızca demoda kazanılanlar kutlanır
  state.session.seenGrantIds = state.grants.map((g) => g.id);
  return state;
}
