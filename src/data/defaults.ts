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
    image: "brand/burger-ambalaj.jpg",
    active: true,
  },
  {
    id: "rw-burger",
    name: "Burger",
    description: "Menüdeki standart burgerlerden biri",
    cap: 380,
    image: "brand/burger-renkli-duvar.jpg",
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
  { id: "br-bursa", name: "Bursa", city: "Bursa", address: "Örnek adres · Nilüfer", active: true },
  { id: "br-gokceada", name: "Gökçeada", city: "Çanakkale", address: "Örnek adres · Merkez", active: true },
  { id: "br-yeni", name: "Yeni franchise şubesi", city: "—", address: "Açılış planlanıyor (örnek)", active: false },
];

export const DEFAULT_STAFF: Staff[] = [
  { id: "st-ayse", name: "Ayşe K.", role: "admin", branchIds: ["br-bursa", "br-gokceada", "br-yeni"], active: true },
  { id: "st-mert", name: "Mert A.", role: "manager", branchIds: ["br-bursa"], active: true },
  { id: "st-can", name: "Can D.", role: "staff", branchIds: ["br-bursa"], active: true },
  { id: "st-selin", name: "Selin T.", role: "staff", branchIds: ["br-gokceada"], active: true },
  { id: "st-emre", name: "Emre Y.", role: "staff", branchIds: ["br-gokceada"], active: false },
];

export const ROLE_LABEL: Record<Staff["role"], string> = {
  staff: "Personel",
  manager: "Şube müdürü",
  admin: "Yönetici",
};
