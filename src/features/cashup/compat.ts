// src/features/cashup/compat.ts
export type MethodKey =
  | "EFECTIVO_SISTEMA"
  | "DEBITO_SISTEMA"
  | "CREDITO_SISTEMA"
  | "POS_DEBITO"
  | "POS_CREDITO"
  | "TRANSFERENCIA"
  | "MERCADO_PAGO";

const BASE_FLOAT = 45000;

export function fallbackExpectedCash(current: any) {
  const efectivo = current?.ops?.salesRuntime?.byMethod?.EFECTIVO_SISTEMA ?? 0;
  const tips = current?.ops?.tips?.cashTips ?? 0;
  const gastos = (current?.ops?.expenses ?? []).reduce(
    (a: number, e: any) => a + (e?.amount || 0),
    0
  );
  const retiros = current?.ops?.withdrawals ?? 0;
  return BASE_FLOAT + efectivo + tips - gastos - retiros;
}

export function getCashupCompat(cash: any) {
  return {
    current: cash?.current,
    openSession: cash?.openSession || cash?.openShift || cash?.open || null,
    closeSession: cash?.closeSession || cash?.closeShift || cash?.close || null,
    listSessions: cash?.listSessions || cash?.getSessions || (() => []),
    getExpectedCash: cash?.getExpectedCash || ((cur: any) => fallbackExpectedCash(cur)),
    // ventas y documentos (tolerante a distintos nombres)
    registerSale: cash?.registerSale || cash?.addSale || cash?.logSale || null,
    registerFiscalDoc:
      cash?.registerFiscalDoc ||
      cash?.logFiscalDoc ||
      cash?.createFiscalDoc ||
      null,
    // propinas (cash)
    addCashTip: cash?.addCashTip || cash?.registerTip || cash?.addTip || null,
  };
}
