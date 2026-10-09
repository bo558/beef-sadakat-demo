export type Role = "staff" | "manager" | "admin";

/** Program kuralları kesinleşmedi: tüm değerler panelden değiştirilebilir. */
export interface ProgramRules {
  stampsRequired: number;
  welcomeStamps: number;
  minSpend: number;
  cooldownMinutes: number;
  rewardExpiryDays: number;
  stampExpiryMonths: number;
  rewardId: string;
}

export interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  active: boolean;
}

export interface Staff {
  id: string;
  name: string;
  role: Role;
  branchIds: string[];
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string; // E.164, örnek veri
  joinedAt: string;
  homeBranchId: string;
  birthday?: string;
  consents: { kvkk: boolean; marketing: boolean; consentAt: string };
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  cap: number; // fiyat tavanı (TL)
  image?: string;
  active: boolean;
}

export interface Order {
  id: string;
  customerId: string;
  branchId: string;
  staffId: string;
  receiptNo: string;
  amount: number;
  createdAt: string;
}

export type LedgerType = "welcome" | "earn" | "convert" | "reversal" | "adjust";

/** Silinmeyen damga defteri. Düzeltmeler ters kayıtla yapılır. */
export interface LedgerEntry {
  id: string;
  customerId: string;
  type: LedgerType;
  amount: number;
  branchId: string;
  staffId?: string;
  orderId?: string;
  grantId?: string;
  reversalOf?: string;
  note?: string;
  createdAt: string;
}

export type GrantStatus = "available" | "redeemed" | "expired";

export interface RewardGrant {
  id: string;
  customerId: string;
  rewardId: string;
  status: GrantStatus;
  createdAt: string;
  expiresAt: string;
  redeemedAt?: string;
  redeemedBranchId?: string;
  redeemedBy?: string;
}

export interface AppState {
  version: number;
  rules: ProgramRules;
  branches: Branch[];
  staff: Staff[];
  customers: Customer[];
  rewards: Reward[];
  orders: Order[];
  ledger: LedgerEntry[];
  grants: RewardGrant[];
  session: {
    customerId: string | null;
    seenGrantIds: string[];
  };
  panel: { staffId: string; branchId: string };
}
