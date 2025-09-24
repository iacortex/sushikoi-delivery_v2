export type PaymentMethod =
  | "EFECTIVO_SISTEMA"
  | "DEBITO_SISTEMA"
  | "CREDITO_SISTEMA"
  | "POS_DEBITO"
  | "POS_CREDITO"
  | "TRANSFERENCIA";

export interface CashDenominationLine {
  denom: number;     // 1000, 2000, 5000, 10000, 20000, etc.
  qty: number;
  total: number;     // denom * qty
  kind: "BILL" | "COIN";
}

export interface CashCount {
  lines: CashDenominationLine[];
  countedTotal: number;
}

export interface ExpenseLine {
  id: string;
  createdAt: number;
  concept: string;
  category: string;  // "Insumos", "Cocina", "Delivery", "Otro"
  amount: number;    // CLP
  note?: string;
  byUser?: string;
}

export interface TipsBreakdown {
  cashTips: number;          // propinas en efectivo
  electronicTips: number;    // propinas POS
  distributionNote?: string;
}

export interface EBoletaSummary {
  model: "EBOLETA_SII" | "VOUCHER_POS" | "OTRO";
  emittedCount: number;
  voidedCount: number;
  grossTotal: number; // total con IVA
  net19?: number;
  iva19?: number;
}

export interface SalesTotals {
  byMethod: Record<PaymentMethod, number>;
  expectedCashInDrawer: number; // fondo + efectivo ventas - retiros + propina efectivo - gastos en efectivo
}

export interface ShiftOpen {
  startedAt: number;
  cashierName: string;
  openingFloat: number;
  note?: string;
}

export interface ShiftClose {
  closedAt: number;
  cashCount: CashCount;
  posDeclared: { posDebit: number; posCredit: number };
  bankDeclared: { transfers: number };
  tips: TipsBreakdown;
  eboleta: EBoletaSummary;
  sales: SalesTotals;
  expenses: ExpenseLine[];
  withdrawals: number;
  diff: number;
  diffReason?: string;
  signedBy?: string;
}

export interface ShiftSession {
  id: string;
  status: "OPEN" | "CLOSED";
  open: ShiftOpen;
  ops: {
    expenses: ExpenseLine[];
    withdrawals: number;
    tips: TipsBreakdown;
    salesRuntime: Partial<SalesTotals>;
  };
  close?: ShiftClose;
}
