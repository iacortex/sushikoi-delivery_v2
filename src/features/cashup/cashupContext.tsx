import React, { createContext, useContext, useMemo, useRef, useState } from "react";

/** ====== Tipos ====== */
export type SaleMethodKey =
  | "EFECTIVO_SISTEMA"
  | "DEBITO_SISTEMA"
  | "CREDITO_SISTEMA"
  | "POS_DEBITO"
  | "POS_CREDITO"
  | "TRANSFERENCIA"
  | "MERCADO_PAGO";

type Expense = { ts: number; label: string; amount: number; by?: string };
type Tips = { cashTips: number };
type Fiscal = { eboletaAmount: number; eboletaCount: number };

export type SalesRuntime = {
  total: number;
  byMethod: Record<SaleMethodKey | string, number>;
};

type Ops = {
  openingCash: number;
  salesRuntime: SalesRuntime;
  tips: Tips;
  expenses: Expense[];
  withdrawals: number;
  fiscal: Fiscal;
};

export type CashSession = {
  id: string;
  openedAt: number;
  closedAt?: number;
  openedBy?: string;
  closedBy?: string;
  note?: string;
  ops: Ops;
};

type Ctx = {
  current: CashSession | null;
  sessions: CashSession[];
  openSession: (args: { openingCash?: number; openedBy?: string; note?: string }) => CashSession;
  closeSession: (note?: string) => CashSession | null;
  listSessions: () => CashSession[];
  getExpectedCash: (s?: CashSession | null) => number;

  registerSale: (method: SaleMethodKey, amount: number, extra?: { by?: string }) => void;
  addExpense: (e: { amount: number; label: string; by?: string }) => void;
  addWithdrawal: (amount: number, label?: string, extra?: { by?: string }) => void;
  addCashTip: (amount: number, extra?: { by?: string }) => void;

  registerFiscalDoc: (amount: number, count?: number) => void;
  recompute: () => void;
};

const CashupContext = createContext<Ctx | null>(null);
export const useCashup = () => useContext(CashupContext);

/** ====== Persistencia simple en localStorage ====== */
const LS_KEY = "__KOI_CASH_SESSIONS__";

function loadSessions(): CashSession[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveSessions(list: CashSession[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {}
}

function newOps(openingCash = 0): Ops {
  return {
    openingCash,
    salesRuntime: { total: 0, byMethod: {} },
    tips: { cashTips: 0 },
    expenses: [],
    withdrawals: 0,
    fiscal: { eboletaAmount: 0, eboletaCount: 0 },
  };
}

/** ====== Provider ====== */
export const CashupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<CashSession[]>(() => loadSessions());
  const current = useMemo(() => sessions.find((s) => !s.closedAt) || null, [sessions]);
  const saving = useRef(false);

  const commit = (next: CashSession[] | ((p: CashSession[]) => CashSession[])) => {
    setSessions((prev) => {
      const out = typeof next === "function" ? (next as any)(prev) : next;
      if (!saving.current) {
        saving.current = true;
        queueMicrotask(() => {
          saveSessions(out);
          saving.current = false;
        });
      }
      return out;
    });
  };

  const openSession: Ctx["openSession"] = ({ openingCash = 0, openedBy = "Cajero", note }) => {
    const already = sessions.find((s) => !s.closedAt);
    if (already) return already;
    const s: CashSession = {
      id: String(Date.now()),
      openedAt: Date.now(),
      openedBy,
      note,
      ops: newOps(openingCash),
    };
    commit((p) => [s, ...p]);
    return s;
  };

  const closeSession: Ctx["closeSession"] = (note) => {
    if (!current) return null;
    const closed: CashSession = { ...current, closedAt: Date.now(), note: note || current.note };
    commit((p) => [closed, ...p.filter((x) => x.id !== current.id)]);
    return closed;
  };

  const listSessions = () => sessions;

  const registerSale: Ctx["registerSale"] = (method, amount) => {
    if (!current) return;
    commit((p) =>
      p.map((s) => {
        if (s.id !== current.id) return s;
        const byMethod = { ...s.ops.salesRuntime.byMethod };
        byMethod[method] = (byMethod[method] || 0) + Math.max(0, Math.round(amount || 0));
        const total = Object.values(byMethod).reduce((a, b) => a + (b || 0), 0);
        return { ...s, ops: { ...s.ops, salesRuntime: { total, byMethod } } };
      })
    );
  };

  const addExpense: Ctx["addExpense"] = ({ amount, label, by }) => {
    if (!current) return;
    const e = { ts: Date.now(), label, amount: Math.max(0, Math.round(amount || 0)), by };
    commit((p) => p.map((s) => (s.id === current.id ? { ...s, ops: { ...s.ops, expenses: [...s.ops.expenses, e] } } : s)));
  };

  const addWithdrawal: Ctx["addWithdrawal"] = (amount) => {
    if (!current) return;
    const a = Math.max(0, Math.round(amount || 0));
    commit((p) => p.map((s) => (s.id === current.id ? { ...s, ops: { ...s.ops, withdrawals: (s.ops.withdrawals || 0) + a } } : s)));
  };

  const addCashTip: Ctx["addCashTip"] = (amount) => {
    if (!current) return;
    const a = Math.max(0, Math.round(amount || 0));
    commit((p) =>
      p.map((s) => (s.id === current.id ? { ...s, ops: { ...s.ops, tips: { cashTips: (s.ops.tips?.cashTips || 0) + a } } } : s))
    );
  };

  const registerFiscalDoc: Ctx["registerFiscalDoc"] = (amount, count = 1) => {
    if (!current) return;
    const a = Math.max(0, Math.round(amount || 0));
    const c = Math.max(0, Math.round(count || 0));
    commit((p) =>
      p.map((s) =>
        s.id === current.id
          ? {
              ...s,
              ops: {
                ...s.ops,
                fiscal: {
                  eboletaAmount: (s.ops.fiscal?.eboletaAmount || 0) + a,
                  eboletaCount: (s.ops.fiscal?.eboletaCount || 0) + c,
                },
              },
            }
          : s
      )
    );
  };

  const getExpectedCash: Ctx["getExpectedCash"] = (s) => {
    const ss = s ?? current;
    if (!ss) return 0;
    const opening = ss.ops.openingCash || 0;
    const efectivoSistema = ss.ops.salesRuntime.byMethod["EFECTIVO_SISTEMA"] || 0;
    const propinasCash = ss.ops.tips?.cashTips || 0;
    const gastos = ss.ops.expenses.reduce((a, b) => a + (b?.amount || 0), 0);
    const retiros = ss.ops.withdrawals || 0;
    return Math.max(0, Math.round(opening + efectivoSistema + propinasCash - gastos - retiros));
  };

  const recompute = () => commit((p) => [...p]); // tick

  const value: Ctx = {
    current,
    sessions,
    openSession,
    closeSession,
    listSessions,
    getExpectedCash,
    registerSale,
    addExpense,
    addWithdrawal,
    addCashTip,
    registerFiscalDoc,
    recompute,
  };

  return <CashupContext.Provider value={value}>{children}</CashupContext.Provider>;
};
