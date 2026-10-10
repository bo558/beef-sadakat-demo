import type { Branch, ProgramRules, Reward, Staff } from "./types";

/**
 * TASLAK PROGRAM KURALLARI — kesinleşmedi.
 * Panelde "Kampanya ve ödüller" ekranından değiştirilebilir.
 */
export const DEFAULT_RULES: ProgramRules = {
  stampsRequired: 10,
  welcomeStamps: 2,
  minSpend: 300,
  cooldownMinutes: 120,
  rewardExpiryDays: 60,
  stampExpiryMonths: 12,
  rewardId: "rw-burger-menu",
};

export const DEFAULT_REWARDS: Reward[] = [
  {
    id: "rw-burger-menu",
    name: "Burger Menü",
    description: "Menüdeki standart burgerlerden biri + patates + içecek",
    cap: 450,
    image: "brand/burger-yakin.jpg",
    active: true,
  },
  {
    id: "rw-burger",
    name: "Burger",
    description: "Menüdeki standart burgerlerden biri",
    cap: 380,
    image: "brand/double-mexican.jpg",
    active: true,
  },
  {
    id: "rw-patates",
    name: "Patates",
    description: "Porsiyon patates kızartması",
    cap: 120,
    active: false,
  },
];

export const DEFAULT_BRANCHES: Branch[] = [
  { id: "br-cerkezkoy", name: "Çerkezköy", city: "Tekirdağ", address: "Eska Premium Altı · Çerkezköy", active: true },
  { id: "br-ornek", name: "Örnek şube", city: "—", address: "Çok şube özelliğini göstermek için örnek", active: true },
  { id: "br-yeni", name: "Yeni franchise şubesi", city: "—", address: "Açılış planlanıyor (örnek)", active: false },
];

export const DEFAULT_STAFF: Staff[] = [
  { id: "st-ayse", name: "Ayşe K.", role: "admin", branchIds: ["br-cerkezkoy", "br-ornek", "br-yeni"], active: true },
  { id: "st-mert", name: "Mert A.", role: "manager", branchIds: ["br-cerkezkoy"], active: true },
  { id: "st-can", name: "Can D.", role: "staff", branchIds: ["br-cerkezkoy"], active: true },
  { id: "st-selin", name: "Selin T.", role: "staff", branchIds: ["br-ornek"], active: true },
  { id: "st-emre", name: "Emre Y.", role: "staff", branchIds: ["br-ornek"], active: false },
];

export const ROLE_LABEL: Record<Staff["role"], string> = {
  staff: "Personel",
  manager: "Şube müdürü",
  admin: "Yönetici",
};
