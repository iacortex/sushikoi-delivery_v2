import { useCashup } from "./cashupContext";

export function getCashupCompat(ctx: ReturnType<typeof useCashup> | any) {
  if (!ctx) return {} as any;
  return {
    current: ctx.current || null,
    listSessions: ctx.listSessions?.bind(ctx),
    openSession: ctx.openSession?.bind(ctx),
    closeSession: ctx.closeSession?.bind(ctx),
    getExpectedCash: ctx.getExpectedCash?.bind(ctx),
    registerSale: ctx.registerSale?.bind(ctx),
    registerFiscalDoc: ctx.registerFiscalDoc?.bind(ctx),
    addCashTip: ctx.addCashTip?.bind(ctx),
    addExpense: ctx.addExpense?.bind(ctx),
    addWithdrawal: ctx.addWithdrawal?.bind(ctx),
    recompute: ctx.recompute?.bind(ctx),
  } as any;
}
