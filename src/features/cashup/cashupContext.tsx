import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

/** ===== Tipos ===== */
export type MethodKey =
  | "EFECTIVO_SISTEMA"
  | "DEBITO_SISTEMA"
  | "CREDITO_SISTEMA"
  | "POS_DEBITO"
  | "POS_CREDITO"
  | "TRANSFERENCIA"
  | "MERCADO_PAGO";

export type CLPDenoms = {
  20000: number;
  10000: number;
  5000: number;
  2000: number;
  1000: number;
  500: number;
  100: number;
  50: number;
  10: number;
};

export type Expense = {
  id: string;
  amount: number;
  category?: string;
  concept?: string;      // 👈 para “tomates”, “gas”, etc.
  note?: string;
  createdAt: number;
};

export type TipsInfo = { cashTips?: number };

export type FiscalInfo = {
  eboletaAmount?: number;
  eboletaCount?: number;
};

export type SalesRuntime = {
  byMethod: Partial<Record<MethodKey, number>>;
  // Si en el futuro vuelves a habilitar mixtos, ya tenemos el tipo
  splitSales: Array<{
    id: string;
    parts: Array<{ method: MethodKey; amount: number }>;
    total: number;
    createdAt: number;
  }>;
};

export type SessionStatus = "OPEN" | "CLOSED";

export type OpenInfo = {
  openedAt: number;
  cashierName: string;
  openingFloat: number;
  openingDenoms?: Partial<CLPDenoms>;
};

export type CloseInfo = {
  closedAt: number;
  countedCash: number;
  countedDenoms?: Partial<CLPDenoms>;
  cashDiff?: number;
  signedBy?: string;
  supervisor?: { name?: string; pinMasked?: string };
  /** Regla: caja debe quedar a 45.000 */
  baselineAdjust?: { toKeep: number; action: "RETIRO" | "INGRESO"; amount: number };
};

export type Ops = {
  salesRuntime: SalesRuntime;
  expenses: Expense[];
  withdrawals?: number;
  tips?: TipsInfo;
  fiscal?: FiscalInfo;
};

export type Session = {
  id: string;
  status: SessionStatus;
  open: OpenInfo;
  ops: Ops;
  close?: CloseInfo;
};

type Store = {
  current: Session | null;
  history: Session[];
};

/** ===== Constantes ===== */
const LS_KEY = "koi_cashup_v1";
const BASELINE = 45000;

/** ===== Utils ===== */
export const totalFromDenoms = (d?: Partial<CLPDenoms>): number => {
  if (!d) return 0;
  const keys = [20000, 10000, 5000, 2000, 1000, 500, 100, 50, 10] as const;
  return keys.reduce((s, k) => s + (Number(d[k] || 0) * Number(k)), 0);
};

const now = () => Date.now();

const load = (): Store => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { current: null, history: [] };
    const parsed: Store = JSON.parse(raw);
    return parsed || { current: null, history: [] };
  } catch {
    return { current: null, history: [] };
  }
};

const save = (s: Store) => {
  localStorage.setItem(LS_KEY, JSON.stringify(s));
};

/** ===== Context ===== */
type Ctx = {
  current: Session | null;
  listSessions: () => Session[];
  openShift: (cashierName: string, openingFloat: number, openingDenoms?: Partial<CLPDenoms>) => void;
  addExpense: (e: Omit<Expense, "id" | "createdAt"> & { amount: number }) => void;
  addTip: (amount: number) => void;
  withdraw: (amount: number, note?: string) => void;
  recordSale: (method: MethodKey, amount: number) => void;
  setFiscal: (changes: Partial<FiscalInfo>) => void;
  getExpectedCash: (s?: Session | null) => number;
  closeShift: (payload: {
    countedDenoms?: Partial<CLPDenoms>;
    countedCash?: number; // si no viene, lo calculo de denoms
    signedBy?: string;
    supervisor?: { name?: string; pinMasked?: string };
  }) => Session;
  resetAll: () => void;
};

const CashupContext = createContext<Ctx | null>(null);

export const CashupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storeRef = useRef<Store>(load());
  const [, force] = useState(0);
  const rerender = () => force((x) => x + 1);

  const persist = (next: Store) => {
    storeRef.current = next;
    save(next);
    rerender();
  };

  const listSessions = useCallback(() => {
    const { current, history } = storeRef.current;
    // historial más el turno actual (si hay)
    return [...history].concat(current ? [current] : []);
  }, []);

  const openShift = useCallback(
    (cashierName: string, openingFloat: number, openingDenoms?: Partial<CLPDenoms>) => {
      const s = storeRef.current;
      if (s.current) throw new Error("Ya hay un turno abierto");

      const open: OpenInfo = {
        openedAt: now(),
        cashierName,
        openingFloat: openingFloat || BASELINE, // sugerido baseline
        openingDenoms,
      };

      const sess: Session = {
        id: `S${Date.now()}`,
        status: "OPEN",
        open,
        ops: {
          salesRuntime: { byMethod: {}, splitSales: [] },
          expenses: [],
          withdrawals: 0,
          tips: { cashTips: 0 },
          fiscal: { eboletaAmount: 0, eboletaCount: 0 },
        },
      };
      persist({ ...s, current: sess });
    },
    []
  );

  const addExpense = useCallback((e: Omit<Expense, "id" | "createdAt"> & { amount: number }) => {
    const s = storeRef.current;
    if (!s.current) throw new Error("No hay turno abierto");
    const exp: Expense = { id: `E${Date.now()}`, createdAt: now(), ...e };
    const next: Store = {
      ...s,
      current: { ...s.current, ops: { ...s.current.ops, expenses: [...s.current.ops.expenses, exp] } },
    };
    persist(next);
  }, []);

  const addTip = useCallback((amount: number) => {
    const s = storeRef.current;
    if (!s.current) throw new Error("No hay turno abierto");
    const prev = s.current.ops.tips?.cashTips || 0;
    const next: Store = {
      ...s,
      current: { ...s.current, ops: { ...s.current.ops, tips: { cashTips: prev + (amount || 0) } } },
    };
    persist(next);
  }, []);

  const withdraw = useCallback((amount: number) => {
    const s = storeRef.current;
    if (!s.current) throw new Error("No hay turno abierto");
    const prev = s.current.ops.withdrawals || 0;
    const next: Store = {
      ...s,
      current: { ...s.current, ops: { ...s.current.ops, withdrawals: prev + (amount || 0) } },
    };
    persist(next);
  }, []);

  const recordSale = useCallback((method: MethodKey, amount: number) => {
    const s = storeRef.current;
    if (!s.current) throw new Error("No hay turno abierto");
    const by = { ...(s.current.ops.salesRuntime.byMethod || {}) };
    by[method] = (by[method] || 0) + (amount || 0);
    const next: Store = {
      ...s,
      current: {
        ...s.current,
        ops: {
          ...s.current.ops,
          salesRuntime: { ...s.current.ops.salesRuntime, byMethod: by },
        },
      },
    };
    persist(next);
  }, []);

  const setFiscal = useCallback((changes: Partial<FiscalInfo>) => {
    const s = storeRef.current;
    if (!s.current) throw new Error("No hay turno abierto");
    const next: Store = {
      ...s,
      current: {
        ...s.current,
        ops: { ...s.current.ops, fiscal: { ...(s.current.ops.fiscal || {}), ...changes } },
      },
    };
    persist(next);
  }, []);

  const getExpectedCash = useCallback((session?: Session | null): number => {
    const s = session ?? storeRef.current.current;
    if (!s) return 0;
    const by = s.ops.salesRuntime.byMethod || {};
    const cashSales = by.EFECTIVO_SISTEMA || 0;
    const tips = s.ops.tips?.cashTips || 0;
    const withdrawals = s.ops.withdrawals || 0;
    const expenses = (s.ops.expenses || []).reduce((acc, e) => acc + (e.amount || 0), 0);
    const expected = (s.open.openingFloat || 0) + cashSales + tips - expenses - withdrawals;
    return Math.max(0, Math.round(expected));
  }, []);

  const closeShift = useCallback(
    (payload: {
      countedDenoms?: Partial<CLPDenoms>;
      countedCash?: number;
      signedBy?: string;
      supervisor?: { name?: string; pinMasked?: string };
    }): Session => {
      const s = storeRef.current;
      if (!s.current) throw new Error("No hay turno abierto");

      const countedCash =
        (typeof payload.countedCash === "number" ? payload.countedCash : totalFromDenoms(payload.countedDenoms)) || 0;
      const expected = getExpectedCash(s.current);
      const diff = countedCash - expected;

      // Baseline 45.000: registro de ajuste
      let adjust: CloseInfo["baselineAdjust"] | undefined;
      if (countedCash > BASELINE) {
        adjust = { toKeep: BASELINE, action: "RETIRO", amount: countedCash - BASELINE };
      } else if (countedCash < BASELINE) {
        adjust = { toKeep: BASELINE, action: "INGRESO", amount: BASELINE - countedCash };
      } else {
        adjust = { toKeep: BASELINE, action: "RETIRO", amount: 0 }; // neutro
      }

      const closed: Session = {
        ...s.current,
        status: "CLOSED",
        close: {
          closedAt: now(),
          countedCash,
          countedDenoms: payload.countedDenoms,
          cashDiff: diff,
          signedBy: payload.signedBy,
          supervisor: payload.supervisor,
          baselineAdjust: adjust,
        },
      };

      // Persistimos en histórico y limpiamos current
      const history = [...s.history, closed];
      const next: Store = { current: null, history };
      persist(next);
      return closed;
    },
    [getExpectedCash]
  );

  const resetAll = useCallback(() => {
    persist({ current: null, history: [] });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      current: storeRef.current.current,
      listSessions,
      openShift,
      addExpense,
      addTip,
      withdraw,
      recordSale,
      setFiscal,
      getExpectedCash,
      closeShift,
      resetAll,
    }),
    [listSessions, openShift, addExpense, addTip, withdraw, recordSale, setFiscal, getExpectedCash, closeShift, resetAll]
  );

  return <CashupContext.Provider value={value}>{children}</CashupContext.Provider>;
};

export const useCashup = () => {
  const ctx = useContext(CashupContext);
  if (!ctx) throw new Error("useCashup debe usarse dentro de <CashupProvider>");
  return ctx;
};
