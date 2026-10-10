import { Building2, LayoutDashboard, ListChecks, Menu, ScanLine, Settings, Smartphone, Users, X } from "lucide-react";
import { useState } from "react";
import { BrandLogo, Toasts } from "../components/brand";
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
              className={`flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[13px] font-medium transition-colors ${
                active ? "bg-beef text-ink" : "text-white/75 hover:bg-ink-3 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{n.label}</span>
              {n.key === "kasa" && !active && <span className="rounded bg-beef/15 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-beef">HIZLI</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const Who = () => (
    <div className="rounded-xl bg-ink-3 p-3">
      <label htmlFor="pn-staff" className="t-label text-[10px] text-smoke">
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
        className="mt-1 h-9 w-full rounded-lg bg-ink-2 px-2 text-[13px] font-medium text-white outline-none ring-1 ring-ink-line"
      >
        {state.staff
          .filter((s) => s.active)
          .map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {ROLE_LABEL[s.role]}
            </option>
          ))}
      </select>
      <p className="mt-1.5 text-[10.5px] leading-snug text-smoke">Rol değiştirerek personel ve yönetici yetkilerini karşılaştırın.</p>
    </div>
  );

  return (
    <div className="min-h-[calc(100%-var(--demo-bar))] bg-paper text-ink lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="sticky top-[var(--demo-bar)] hidden h-[calc(100dvh-var(--demo-bar))] flex-col gap-5 overflow-y-auto bg-ink p-4 lg:flex">
        <div className="flex items-center justify-between">
          <BrandLogo size="sm" />
          <span className="t-label text-[10px] text-smoke">Panel</span>
        </div>
        {NavList()}
        <div className="mt-auto grid gap-3">
          {Who()}
          <button onClick={() => go("app")} className="flex h-9 items-center gap-2 rounded-lg px-3 text-[13px] font-medium text-smoke hover:text-white">
            <Smartphone className="h-4 w-4" /> Müşteri uygulaması
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-[var(--demo-bar)] z-30 border-b border-paper-line bg-paper/90 px-4 pb-2.5 pt-[max(10px,env(safe-area-inset-top))] backdrop-blur lg:px-7">
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawer(true)} className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-beef lg:hidden" aria-label="Menüyü aç">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="t-label hidden text-[10px] text-ink/45 sm:block">BEEF Sadakat · İşletme paneli</div>
              <div className="truncate text-[13px] font-semibold">
                {me.name} <span className="font-normal text-ink/50">· {ROLE_LABEL[me.role]}</span>
              </div>
            </div>
            <label htmlFor="pn-branch" className="sr-only">
              Şube
            </label>
            <select
              id="pn-branch"
              value={state.panel.branchId}
              onChange={(e) => update((s) => ({ ...s, panel: { ...s.panel, branchId: e.target.value } }))}
              className="h-10 max-w-[46%] rounded-lg bg-white px-2.5 text-[13px] font-semibold outline-none ring-1 ring-paper-line"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} disabled={!b.active}>
                  {b.name} şubesi{!b.active ? " (pasif)" : ""}
                </option>
              ))}
            </select>
          </div>
        </header>
        <main className="mx-auto max-w-[1200px] px-4 pb-24 pt-5 lg:px-7 lg:pb-10" key={sub}>
          <div className="animate-rise">{page}</div>
        </main>
      </div>

      {/* Mobil alt menü: en sık kullanılan üç ekran */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-paper-line bg-white/95 px-3 pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur lg:hidden" aria-label="Panel menüsü">
        <ul className="grid grid-cols-4 gap-1">
          {NAV.slice(0, 3).map((n) => {
            const Icon = n.icon;
            const active = sub === n.key || (!sub && n.key === "");
            return (
              <li key={n.key}>
                <button onClick={() => nav(n.key)} className={`flex h-12 w-full flex-col items-center justify-center gap-0.5 rounded-lg text-[10.5px] font-medium ${active ? "bg-beef text-ink" : "text-ink/60"}`}>
                  <Icon className="h-[18px] w-[18px]" />
                  {n.key === "" ? "Özet" : n.label}
                </button>
              </li>
            );
          })}
          <li>
            <button onClick={() => setDrawer(true)} className="flex h-12 w-full flex-col items-center justify-center gap-0.5 rounded-lg text-[10.5px] font-medium text-ink/60">
              <Menu className="h-[18px] w-[18px]" /> Diğer
            </button>
          </li>
        </ul>
      </nav>

      {drawer && (
        <div className="fixed inset-x-0 bottom-0 top-[var(--demo-bar)] z-50 bg-black/50 lg:hidden" onClick={() => setDrawer(false)}>
          <div className="animate-rise flex h-full w-[82%] max-w-[300px] flex-col gap-4 overflow-y-auto bg-ink p-4 pt-[max(16px,env(safe-area-inset-top))]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <BrandLogo size="sm" />
              <button onClick={() => setDrawer(false)} className="grid h-10 w-10 place-items-center rounded-full bg-ink-3 text-white" aria-label="Menüyü kapat">
                <X className="h-5 w-5" />
              </button>
            </div>
            {NavList()}
            {Who()}
            <button onClick={() => go("app")} className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-smoke">
              <Smartphone className="h-4 w-4" /> Müşteri uygulaması
            </button>
          </div>
        </div>
      )}
      <Toasts />
    </div>
  );
}
