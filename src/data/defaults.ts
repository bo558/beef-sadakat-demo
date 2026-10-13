import type { ProgramRules, Staff } from "./types";

/** Onaylanan program: sipariş başına 1 damga, 10 damga = 1 Burger Menü. */
export const DEFAULT_RULES: ProgramRules = {
  stampsRequired: 10,
  rewardName: "Burger Menü",
};

/** Sabit kurallar (ekranda ayar olarak gösterilmez). */
export const REWARD_VALID_DAYS = 90;
/** Aynı müşteriye arka arkaya damga verilmesini engelleyen bekleme süresi. */
export const COOLDOWN_MINUTES = 120;
/** Kasada "Geri al" süresi. */
export const UNDO_WINDOW_MS = 10_000;

/** ÖRNEK PERSONEL — demo PIN'leri giriş ekranında açıkça gösterilir. */
export const DEFAULT_STAFF: Staff[] = [
  { id: "st-can", name: "Can D.", role: "staff", pin: "1111", active: true },
  { id: "st-selin", name: "Selin T.", role: "staff", pin: "2222", active: true },
  { id: "st-ayse", name: "Ayşe K.", role: "admin", pin: "9999", active: true },
  { id: "st-emre", name: "Emre Y.", role: "staff", pin: "3333", active: false },
];

export const ROLE_LABEL: Record<Staff["role"], string> = {
  staff: "Kasa personeli",
  admin: "Yönetici",
};

/** Demo kısayollarıyla yapılan işlemler bu kimlikle kaydedilir (gerçek personel değildir). */
export const DEMO_STAFF_ID = "demo";
