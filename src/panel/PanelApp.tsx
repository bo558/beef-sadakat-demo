import { Building2, LayoutDashboard, ListChecks, Menu, ScanLine, Settings, Smartphone, Users, X } from "lucide-react";
import { useState } from "react";
import { LogoPlaceholder, Toasts } from "../components/brand";
import { ROLE_LABEL } from "../data/defaults";
import { useStore } from "../store/store";
import { BranchesPage, CampaignPage, CustomersPage, DashboardPage, LedgerPage, RegisterPage } from "./pages";

const NAV = [
  { key: "kasa", label: "Kasa", icon: ScanLine, hint: "QR okut, damga ver" },
  { key: "", label: "Genel bakış", icon: LayoutDashboard },
  { key: "musteriler", label: "Müşteriler", icon: Users },
  { key: "islemler", label: "Sadakat işlemleri", icon: ListChecks },
  { key: "kampanya", label: "Kampanya ve ödüller", icon: Settings },
  { key: "subeler", label: "Şubeler ve personel", icon: Building2 },
] as const;

export function PanelApp({ sub, param, go }: { sub: string; param?: string; go: (p: string) => void }) {
  const { state, update } = useStore();
  const [drawer, setDrawer] = useState(false);
  const me = state.staff.find((s) => s.id === state.panel.staffId)!;
  const branches = state.branches.filter((b) => me.branchIds.includes(b.id));
  const nav = (k: string) => {
    setDrawer(false);
    go(`panel${k ? `/${k}` : ""}`);
  };
  const page =
    sub === "kasa" ? (
      <RegisterPage preselect={param} />
    ) : sub === "musteriler" ? (
      <CustomersPage go={nav} />
    ) : sub === "islemler" ? (
      <LedgerPage />
    ) : sub === "kampanya" ? (
      <CampaignPage />
    ) : sub === "subeler" ? (
      <BranchesPage />
    ) : (
      <DashboardPage go={nav} />
    );

  const NavList = () => (
    <ul className="grid gap-1">
      {NAV.map((n) => {
        const active = sub === n.key || (!sub && n.key === "");
        const Icon = n.icon;
        return (
          <li key={n.key}>
            <button
              onClick={() => nav(n.key)}
              aria-current={active ? "page" : undefined}
              className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition-colors ${
                active ? "bg-beef text-ink" : "text-white/75 hover:bg-ink-3 hover:text-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="flex-1">{n.label}</span>
              {n.key === "kasa" && !active && <span className="rounded-md bg-beef/15 px-1.5 py-0.5 text-[10px] font-extrabold text-beef">HIZLI</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const Who = () => (
    <div className="rounded-2xl bg-ink-3 p-3">
      <label htmlFor="pn-staff" className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-smoke">
        Oturum (demo)
      </label>
      <select
        id="pn-staff"
        value={me.id}
        onChange={(e) =>
          update((s) => {
            const st = s.staff.find((x) => x.id === e.target.value)!;
            return { ...s, panel: { staffId: st.id, branchId: st.branchIds.includes(s.panel.branchId) ? s.panel.branchId : st.branchIds[0]! } };
          })
        }
        className="mt-1 h-10 w-full rounded-lg bg-ink-2 px-2 text-sm font-bold text-white outline-none ring-1 ring-ink-line"
      >
        {state.staff
          .filter((s) => s.active)
          .map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {ROLE_LABEL[s.role]}
            </option>
          ))}
      </select>
      <p className="mt-2 text-[11px] leading-snug text-smoke">Rol değiştirerek personel ve yönetici yetkilerini karşılaştırın.</p>
    </div>
  );

  return (
    <div className="min-h-[calc(100%-var(--demo-bar))] bg-paper text-ink lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="sticky top-[var(--demo-bar)] hidden h-[calc(100dvh-var(--demo-bar))] flex-col gap-6 overflow-y-auto bg-ink p-5 lg:flex">
        <div className="flex items-center justify-between">
          <LogoPlaceholder size="sm" />
          <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-smoke">Panel</span>
        </div>
        {NavList()}
        <div className="mt-auto grid gap-3">
          {Who()}
          <button onClick={() => go("app")} className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-smoke hover:text-white">
            <Smartphone className="h-4 w-4" /> Müşteri uygulaması
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-[var(--demo-bar)] z-30 border-b border-paper-line bg-paper/90 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawer(true)} className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-beef lg:hidden" aria-label="Menüyü aç">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="hidden text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink/50 sm:block">BEEF Sadakat · İşletme paneli</div>
              <div className="truncate text-sm font-bold">
                {me.name} <span className="font-semibold text-ink/50">· {ROLE_LABEL[me.role]}</span>
              </div>
            </div>
            <label htmlFor="pn-branch" className="sr-only">
              Şube
            </label>
            <select
              id="pn-branch"
              value={state.panel.branchId}
              onChange={(e) => update((s) => ({ ...s, panel: { ...s.panel, branchId: e.target.value } }))}
              className="h-11 max-w-[46%] rounded-xl bg-white px-3 text-sm font-extrabold outline-none ring-1 ring-paper-line"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} disabled={!b.active}>
                  {b.name} şubesi{!b.active ? " (pasif)" : ""}
                </option>
              ))}
            </select>
          </div>
        </header>
        <main className="mx-auto max-w-[1240px] px-4 pb-28 pt-6 lg:px-8 lg:pb-12" key={sub}>
          <div className="animate-rise">{page}</div>
        </main>
      </div>

      {/* Mobil alt menü: en sık kullanılan üç ekran */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-paper-line bg-white/95 px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden" aria-label="Panel menüsü">
        <ul className="grid grid-cols-4 gap-1">
          {NAV.slice(0, 3).map((n) => {
            const Icon = n.icon;
            const active = sub === n.key || (!sub && n.key === "");
            return (
              <li key={n.key}>
                <button onClick={() => nav(n.key)} className={`flex h-14 w-full flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold ${active ? "bg-beef text-ink" : "text-ink/60"}`}>
                  <Icon className="h-5 w-5" />
                  {n.key === "" ? "Özet" : n.label}
                </button>
              </li>
            );
          })}
          <li>
            <button onClick={() => setDrawer(true)} className="flex h-14 w-full flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold text-ink/60">
              <Menu className="h-5 w-5" /> Diğer
            </button>
          </li>
        </ul>
      </nav>

      {drawer && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setDrawer(false)}>
          <div className="animate-rise flex h-full w-[84%] max-w-[320px] flex-col gap-5 overflow-y-auto bg-ink p-5 pt-[max(20px,env(safe-area-inset-top))]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <LogoPlaceholder size="sm" />
              <button onClick={() => setDrawer(false)} className="grid h-10 w-10 place-items-center rounded-full bg-ink-3 text-white" aria-label="Menüyü kapat">
                <X className="h-5 w-5" />
              </button>
            </div>
            {NavList()}
            {Who()}
            <button onClick={() => go("app")} className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-smoke">
              <Smartphone className="h-4 w-4" /> Müşteri uygulaması
            </button>
          </div>
        </div>
      )}
      <Toasts />
    </div>
  );
}
