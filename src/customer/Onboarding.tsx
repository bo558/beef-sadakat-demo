import { ArrowLeft, ArrowRight, Check, Gift, Phone, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { asset, LogoPlaceholder } from "../components/brand";
import { registerCustomer, uid } from "../data/engine";
import { useStore } from "../store/store";

type Step = "welcome" | "phone" | "otp" | "profile" | "gift";
const DEMO_OTP = "123456";

export function Onboarding() {
  const { state, update, loginDemo } = useStore();
  const [step, setStep] = useState<Step>("welcome");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [name, setName] = useState("");
  const [kvkk, setKvkk] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [newId, setNewId] = useState<string | null>(null);
  const r = state.rules;
  const reward = state.rewards.find((x) => x.id === r.rewardId);

  const digits = phone.replace(/\D/g, "");
  const phoneOk = /^5\d{9}$/.test(digits);
  const fmt = (d: string) => [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean).join(" ");

  if (step === "welcome")
    return (
      <div className="relative flex min-h-full flex-col bg-ink">
        <div className="relative h-[58%] min-h-[340px] overflow-hidden">
          <img src={asset("brand/burger-ambalaj.jpg")} alt="BEEF ambalaj kâğıdı üzerinde burger ve patates" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-transparent to-ink" />
          <div className="absolute left-5 top-[max(20px,env(safe-area-inset-top))]">
            <LogoPlaceholder size="sm" />
          </div>
        </div>
        <div className="relative -mt-16 flex flex-1 flex-col px-6 pb-[max(24px,env(safe-area-inset-bottom))]">
          <h1 className="font-display text-[46px] uppercase leading-[1.04] text-balance">
            Her burger
            <br />
            <span className="text-beef">bir damga.</span>
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-smoke">
            {r.stampsRequired} damgayı doldur, {r.stampsRequired + 1}. siparişte <b className="text-white">{reward?.name ?? "ödül"}</b> bizden.
            {r.welcomeStamps > 0 && <> Üye olana ilk {r.welcomeStamps} damga hediye.</>}
          </p>
          <div className="mt-auto grid gap-3 pt-8">
            <button onClick={() => setStep("phone")} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-beef text-[16px] font-extrabold text-ink active:scale-[0.98]">
              Telefonla devam et <ArrowRight className="h-5 w-5" />
            </button>
            <button onClick={loginDemo} className="h-12 rounded-2xl border border-ink-line text-sm font-bold text-white/90 hover:bg-ink-2">
              Örnek üye ile gez (Ece, 7 damga)
            </button>
          </div>
        </div>
      </div>
    );


  if (step === "phone")
    return (
      <Shell title="Numaranı gir" sub="Kartın telefon numarana bağlanır. Sana tek kullanımlık bir doğrulama kodu göndereceğiz." onBack={() => setStep("welcome")}>
        <label htmlFor="ob-phone" className="text-xs font-bold uppercase tracking-[0.14em] text-smoke">
          Cep telefonu
        </label>
        <div className="mt-2 flex h-16 items-center gap-3 rounded-2xl bg-ink-2 px-4 ring-1 ring-ink-line focus-within:ring-2 focus-within:ring-beef">
          <Phone className="h-5 w-5 text-smoke" />
          <span className="font-bold text-smoke">+90</span>
          <input
            id="ob-phone"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="5•• ••• •• ••"
            value={fmt(digits.slice(0, 10))}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").replace(/^0/, "").slice(0, 10))}
            className="h-full min-w-0 flex-1 bg-transparent text-xl font-bold tracking-wider outline-none placeholder:text-ink-line focus-visible:outline-none tabular"
          />
        </div>
        {digits.length > 0 && !phoneOk && <p className="mt-2 text-sm text-wall-orange">5 ile başlayan 10 haneli cep numaranı gir.</p>}
        <div className="mt-4 rounded-xl bg-beef/10 px-4 py-3 text-sm text-beef ring-1 ring-beef/30">
          Demo: gerçek numaranı girmene gerek yok. Bilgiler hiçbir yere gönderilmez, yalnızca bu tarayıcıda kalır.
          <button type="button" onClick={() => setPhone("5000000099")} className="mt-1 block font-extrabold underline underline-offset-4">
            Örnek numara doldur
          </button>
        </div>
        <div className="mt-auto pt-8">
          <button
            disabled={!phoneOk}
            onClick={() => setStep("otp")}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-beef font-extrabold text-ink disabled:bg-ink-3 disabled:text-smoke"
          >
            Kodu gönder <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </Shell>
    );

  if (step === "otp")
    return (
      <Shell title="Kodu gir" sub={`0${fmt(digits)} numarasına gönderilen 6 haneli kodu yaz.`} onBack={() => setStep("phone")}>
        <div className="mb-5 rounded-xl bg-beef/10 px-4 py-3 text-sm text-beef ring-1 ring-beef/30">
          Prototip: SMS gönderilmez. Demo kodu <b className="tabular">{DEMO_OTP}</b>
        </div>
        <OtpInput
          value={otp}
          onChange={(v) => {
            setOtp(v);
            setOtpError("");
          }}
        />
        {otpError && <p className="mt-3 text-sm text-wall-orange">{otpError}</p>}
        <button onClick={() => setOtp(DEMO_OTP)} className="mt-4 self-start text-sm font-bold text-smoke underline underline-offset-4">
          Demo kodunu doldur
        </button>
        <div className="mt-auto pt-8">
          <button
            disabled={otp.length < 6}
            onClick={() => (otp === DEMO_OTP ? setStep("profile") : setOtpError("Kod hatalı. Tekrar dene veya yeni kod iste."))}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-beef font-extrabold text-ink disabled:bg-ink-3 disabled:text-smoke"
          >
            Doğrula <Check className="h-5 w-5" />
          </button>
        </div>
      </Shell>
    );

  if (step === "profile")
    return (
      <Shell title="Seni tanıyalım" sub="Kasada seni adınla karşılayalım." onBack={() => setStep("otp")}>
        <label htmlFor="ob-name" className="text-xs font-bold uppercase tracking-[0.14em] text-smoke">
          Ad soyad
        </label>
        <input
          id="ob-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Adın"
          autoComplete="name"
          className="mt-2 h-14 rounded-2xl bg-ink-2 px-4 text-lg font-bold outline-none ring-1 ring-ink-line placeholder:text-ink-line focus:ring-2 focus:ring-beef"
        />
        <div className="mt-6 grid gap-3">
          <Check2 id="ob-kvkk" checked={kvkk} onChange={setKvkk}>
            <b className="text-white">KVKK Aydınlatma Metni</b>'ni okudum. <span className="text-smoke">(zorunlu)</span>
          </Check2>
          <Check2 id="ob-mkt" checked={marketing} onChange={setMarketing}>
            Kampanya ve fırsatlardan SMS ile haberdar olmak istiyorum. <span className="text-smoke">(isteğe bağlı · İYS)</span>
          </Check2>
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-smoke">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> Hukuki metinler taslak aşamasındadır; bu ekran yalnızca akışı gösterir.
        </p>
        <div className="mt-auto pt-8">
          <button
            disabled={name.trim().length < 2 || !kvkk}
            onClick={() => {
              const id = uid("cu");
              setNewId(id);
              update((s) => registerCustomer(s, { id, name, phone: `+90${digits}`, marketing, branchId: s.panel.branchId }).state);
              setStep("gift");
            }}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-beef font-extrabold text-ink disabled:bg-ink-3 disabled:text-smoke"
          >
            Kartımı oluştur <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </Shell>
    );

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden bg-beef px-6 text-center text-ink">
      <div className="burst absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2" aria-hidden />
      <div className="relative">
        <div className="animate-pop mx-auto grid h-28 w-28 place-items-center rounded-full bg-ink text-beef">
          <Gift className="h-12 w-12" />
        </div>
        <h1 className="mt-6 font-display text-[44px] uppercase leading-[0.95]">
          Hoş geldin
          <br />
          {name.trim().split(" ")[0]}!
        </h1>
        <p className="mx-auto mt-3 max-w-[18rem] text-[15px] font-semibold">
          {r.welcomeStamps > 0 ? `Kartına ${r.welcomeStamps} hediye damga ekledik. ${r.stampsRequired - r.welcomeStamps} damga sonra menü bizden.` : "Kartın hazır. İlk siparişinde QR'ını okut."}
        </p>
        <button
          onClick={() => update((s) => ({ ...s, session: { ...s.session, customerId: newId } }))}
          className="mt-8 h-14 w-full max-w-xs rounded-2xl bg-ink px-6 font-extrabold text-beef"
        >
          Kartıma git
        </button>
      </div>
    </div>
  );
}

function Shell({ title, sub, onBack, children }: { title: string; sub: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))]">
      <button onClick={onBack} className="-ml-2 grid h-11 w-11 place-items-center rounded-full hover:bg-ink-2" aria-label="Geri">
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="mt-4 font-display text-[36px] uppercase leading-none">{title}</h1>
      <p className="mt-2 text-sm text-smoke">{sub}</p>
      <div className="mt-8 flex flex-1 flex-col">{children}</div>
    </div>
  );
}

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <label className="relative block" htmlFor="ob-otp">
      <input
        ref={ref}
        id="ob-otp"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className="absolute inset-0 opacity-0"
        aria-label="Doğrulama kodu"
      />
      <div className="grid grid-cols-6 gap-2" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className={`grid h-16 place-items-center rounded-2xl bg-ink-2 font-display text-3xl ring-1 tabular ${
              i === value.length ? "ring-2 ring-beef" : "ring-ink-line"
            }`}
          >
            {value[i] ?? ""}
          </div>
        ))}
      </div>
    </label>
  );
}

function Check2({ id, checked, onChange, children }: { id: string; checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-2xl bg-ink-2 p-4 text-sm leading-relaxed ring-1 ring-ink-line">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md ${checked ? "bg-beef text-ink" : "ring-2 ring-smoke/60"}`}>
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span className="text-white/90">{children}</span>
    </label>
  );
}
