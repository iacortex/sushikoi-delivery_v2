import React, { useEffect, useMemo, useState } from "react";
import {
  ShoppingCart, User, Utensils, Package, DollarSign, TrendingUp, BarChart3, Clock,
  Bell, CheckCircle, XCircle, AlertCircle, Eye, Truck, CreditCard, Wallet, PieChart, LineChart
} from "lucide-react";

import PromotionsGrid from "../cashier/PromotionsGrid";
import { CartPanel } from "../cashier/CartPanel";
import CustomerForm from "../cashier/CustomerForm";
import PayPanel from "../cashier/PayPanel";

import { getMenuItem } from "../../features/menu/catalog";
import { KioskModal } from "../ui/KioskModal";

import { useOrders } from "@/features/orders/useOrders";
import type { OrderMeta } from "@/types";
type OrdersApi = ReturnType<typeof useOrders>;

import { useCashup } from "@/features/cashup/cashupContext";
import CashDrawerControl from "@/features/cashup/CashDrawerControl";

const TOTEM_MODE = true;

/* ===== Tipos UI (locales) ===== */
export interface CartItem {
  id: number;
  name: string;
  description: string;
  items: string[];
  originalPrice: number;
  discountPrice: number;
  discount: number;
  image: string;
  popular: boolean;
  cookingTime: number;
  quantity: number;
}

type CashierTab = "dashboard" | "promotions" | "customer" | "cart" | "pay" | "orders";

type PaymentMethod = "efectivo" | "debito" | "credito" | "transferencia" | "mp";

interface CustomerFormData {
  name: string;
  phone: string;
  rut?: string;
  email?: string;
  street: string;
  number: string;
  sector: string;
  city: string;
  references: string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  dueMethod: string;
  mpChannel?: "delivery" | "local";
}
interface FormErrors { [k: string]: string; }

interface OrderUI {
  id: number;
  publicCode: string;
  name: string;
  phone: string;
  address: string;
  total: number;
  status: "pending" | "cooking" | "ready" | "delivered";
  cart: CartItem[];
  createdAt: number;
  estimatedTime: number;
  paymentMethod: string;
  meta?: OrderMeta;
}

/* ===== Extras ===== */
type ServiceType = "delivery" | "local";
type Protein = "pollo" | "salmon" | "camaron" | "kanikama" | "loco" | "pulpo";
interface ChangeLine { from?: Protein; to?: Protein; fee: number; }
interface SauceLine { qty: number; included?: number; extraFee?: number; feeTotal?: number; }
interface OrderMetaLocal {
  service: ServiceType;
  deliveryZone?: string; deliveryFee?: number; chopsticks?: number;
  changes?: ChangeLine[];
  soy?: SauceLine; ginger?: SauceLine; wasabi?: SauceLine;
  agridulce?: SauceLine; acevichada?: SauceLine;
  extrasTotal?: number; note?: string;
}
interface AddToCartPayload {
  promotionId: number; chopsticks: number; service: ServiceType;
  deliveryZone?: string; deliveryFee?: number;
  changes: ChangeLine[];
  soy?: SauceLine; ginger?: SauceLine; wasabi?: SauceLine; agridulce?: SauceLine; acevichada?: SauceLine;
  note?: string; extrasTotal: number; estimatedTotal: number;
  drinks?: { name: string; price: number; quantity: number }[];
}

/* ===== Helpers ===== */
const formatCLP = (n: number) => new Intl.NumberFormat("es-CL").format(Math.round(n || 0));
const timeAgo = (ts: number) => {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "Ahora"; if (m < 60) return `${m}m`; return `${Math.floor(m / 60)}h`;
};
const EXTRAS_ITEM_ID = -777;
const extrasFromMeta = (m?: OrderMetaLocal) => {
  if (!m) return 0;
  const delivery = m.service === "delivery" ? m.deliveryFee ?? 0 : 0;
  const changes = (m.changes ?? []).reduce((s, c) => s + (c?.fee ?? 0), 0);
  const sauces =
    (m.soy?.extraFee ?? m.soy?.feeTotal ?? 0) +
    (m.ginger?.extraFee ?? m.ginger?.feeTotal ?? 0) +
    (m.wasabi?.extraFee ?? m.wasabi?.feeTotal ?? 0) +
    (m.agridulce?.feeTotal ?? m.agridulce?.extraFee ?? 0) +
    (m.acevichada?.feeTotal ?? m.acevichada?.extraFee ?? 0);
  return delivery + changes + sauces;
};
const buildExtrasLabel = (m?: OrderMetaLocal): string => {
  if (!m) return "Extras (delivery/cambios/salsas)";
  const parts: string[] = [];
  if (m.service === "delivery" && (m.deliveryFee ?? 0) > 0) parts.push("Delivery");
  const changeFee = (m.changes ?? []).reduce((s, c) => s + (c?.fee ?? 0), 0);
  if (changeFee > 0) parts.push("Cambios proteína");
  const saucesFee =
    (m.soy?.extraFee ?? m.soy?.feeTotal ?? 0) +
    (m.ginger?.extraFee ?? m.ginger?.feeTotal ?? 0) +
    (m.wasabi?.extraFee ?? m.wasabi?.feeTotal ?? 0) +
    (m.agridulce?.feeTotal ?? m.agridulce?.extraFee ?? 0) +
    (m.acevichada?.feeTotal ?? m.acevichada?.extraFee ?? 0);
  if (saucesFee > 0) parts.push("Salsas");
  return `Extras (${parts.join(" / ") || "delivery/cambios/salsas"})`;
};

/* ===== Toast ===== */
type NType = "success" | "warning" | "error" | "info";
interface Notification { id: number; type: NType; message: string; timestamp: number; }
const Toast: React.FC<{ n: Notification; onClose: (id: number) => void }> = ({ n, onClose }) => {
  useEffect(() => { const t = setTimeout(() => onClose(n.id), 5000); return () => clearTimeout(t); }, [n.id, onClose]);
  const Icon = () =>
    n.type === "success" ? <CheckCircle className="text-green-600" size={18} /> :
    n.type === "warning" ? <AlertCircle className="text-yellow-600" size={18} /> :
    n.type === "error" ? <XCircle className="text-red-600" size={18} /> :
    <Bell className="text-blue-600" size={18} />;
  const bg = { success: "bg-green-50 border-green-200", warning: "bg-yellow-50 border-yellow-200", error: "bg-red-50 border-red-200", info: "bg-blue-50 border-blue-200" }[n.type];
  return (
    <div className={`${bg} border rounded-lg p-3 shadow-md animate-slide-in-right`}>
      <div className="flex items-start gap-2">
        <Icon />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{n.message}</p>
          <p className="text-xs text-gray-500">{timeAgo(n.timestamp)}</p>
        </div>
        <button onClick={() => onClose(n.id)} className="text-gray-400 hover:text-gray-600"><XCircle size={14} /></button>
      </div>
    </div>
  );
};

/* ===== Guardia de cambios ===== */
function enforceOneProteinChange(
  incoming: ChangeLine[] | undefined,
  confirmFn: (msg: string) => boolean,
  notify: (type: NType, message: string) => void
): ChangeLine[] {
  const list = incoming ?? [];
  if (list.length <= 1) return list;
  const wantsMore = confirmFn("Ya tienes 1 cambio de proteína. ¿Quieres agregar otro cambio?");
  if (wantsMore) { notify("info", "Se agregaron cambios de proteína adicionales."); return list; }
  notify("warning", "Se aplicó solo 1 cambio de proteína."); return [list[0]];
}

/* =========================================================
   MODAL DETALLE — Boleta + Stepper + Extras con cantidades
   ========================================================= */
const OrderDetailModal: React.FC<{ open: boolean; onClose: () => void; order?: OrderUI; }> = ({ open, onClose, order }) => {
  if (!order) return null;
  const STAGES = [
    { key: "pending", label: "Pendiente", icon: Clock },
    { key: "cooking", label: "Cocina", icon: Utensils },
    { key: "assembling", label: "Armando", icon: Package },
    { key: "delivery", label: "Delivery", icon: Truck },
    { key: "ready", label: "Listo", icon: CheckCircle },
  ] as const;
  const statusToStageIndex = (s?: string) => {
    const map: Record<string, number> = { pending: 0, cocina: 1, cooking: 1, assembling: 2, armado: 2, delivery: 3, entregando: 3, ready: 4, delivered: 4, listo: 4 };
    return map[(s || "").toLowerCase()] ?? 0;
  };
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const etaMs = Math.max(1, (order.estimatedTime || 15) * 60_000);
  const elapsed = Math.max(0, now - (order.createdAt || now));
  const percentByTime = Math.min(1, elapsed / etaMs);
  const idxByStatus = statusToStageIndex(order.status);
  const idxByTime = Math.min(4, Math.floor(percentByTime * STAGES.length));
  const currentIdx = Math.max(idxByStatus, idxByTime);

  const meta = order.meta as OrderMetaLocal | undefined;
  const deliveryFee = meta?.service === "delivery" ? meta?.deliveryFee ?? 0 : 0;
  const changes = meta?.changes ?? [];
  const changesCount = changes.length;
  const changesFee = changes.reduce((s, c) => s + (c?.fee ?? 0), 0);
  const soyQtyExtra = Math.max(0, (meta?.soy?.qty || 0) - (meta?.soy?.included || 0));
  const soyFee = meta?.soy?.extraFee ?? meta?.soy?.feeTotal ?? 0;
  const gingerQtyExtra = Math.max(0, (meta?.ginger?.qty || 0) - (meta?.ginger?.included || 0));
  const gingerFee = meta?.ginger?.extraFee ?? meta?.ginger?.feeTotal ?? 0;
  const wasabiQtyExtra = Math.max(0, (meta?.wasabi?.qty || 0) - (meta?.wasabi?.included || 0));
  const wasabiFee = meta?.wasabi?.extraFee ?? meta?.wasabi?.feeTotal ?? 0;
  const agridulceQty = meta?.agridulce?.qty || 0;
  const agridulceFee = meta?.agridulce?.feeTotal || 0;
  const acevichadaQty = meta?.acevichada?.qty || 0;
  const acevichadaFee = meta?.acevichada?.feeTotal || 0;

  const extrasLines = [
    { label: "Delivery", qty: deliveryFee > 0 ? 1 : 0, amount: deliveryFee },
    { label: "Cambio de proteína", qty: changesCount, amount: changesFee },
    { label: "Soya extra", qty: soyQtyExtra, amount: soyFee },
    { label: "Jengibre extra", qty: gingerQtyExtra, amount: gingerFee },
    { label: "Wasabi extra", qty: wasabiQtyExtra, amount: wasabiFee },
    { label: "Agridulce", qty: agridulceQty, amount: agridulceFee },
    { label: "Acevichada", qty: acevichadaQty, amount: acevichadaFee },
  ].filter((l) => (l.qty || 0) > 0 || (l.amount || 0) > 0);

  const extrasTotalMeta = extrasLines.reduce((s, l) => s + (l.amount || 0), 0);
  const cartWithoutExtras = (order.cart || []).filter((it) => it.id !== EXTRAS_ITEM_ID);
  const itemsSubtotal = cartWithoutExtras.reduce((s, it) => s + it.discountPrice * it.quantity, 0);

  const fmt = (n: number) => new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(Math.round(n || 0));
  const dt = new Date(order.createdAt || Date.now()).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
  const computedTotal = itemsSubtotal + extrasTotalMeta;
  const totalToShow = typeof order.total === "number" ? order.total : computedTotal;

  return (
    <KioskModal open={open} onClose={onClose} title={`Pedido #${order.publicCode}`} subtitle={`${order.name} • ${order.phone}`} designWidth={420} designHeight={820}>
      {/* Stepper + barra tiempo */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] text-gray-600 mb-2">
          {STAGES.map((st, i) => {
            const active = i <= currentIdx; const Icon = st.icon;
            return (
              <div key={st.key} className="flex-1 flex items-center">
                <div className="flex flex-col items-center w-full">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${active ? "bg-rose-600" : "bg-gray-300"}`} title={st.label}><Icon size={14} /></div>
                  <span className={`mt-1 ${active ? "text-gray-900" : ""}`}>{st.label}</span>
                </div>
                {i < STAGES.length - 1 && (
                  <div className="w-full h-1 mx-2 bg-gray-200 rounded">
                    <div className={`h-1 rounded ${i < currentIdx ? "bg-rose-600" : "bg-gray-200"}`} style={{ width: "100%" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="w-full bg-gray-200 h-2 rounded">
          <div className="h-2 rounded bg-rose-600 transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, percentByTime * 100))}%` }} />
        </div>
        <div className="flex justify-between text-[11px] text-gray-500 mt-1"><span>Inicio</span><span>ETA: <b className="text-gray-700">{order.estimatedTime} min</b></span></div>
      </div>

      {/* Boleta 80mm */}
      <div className="w-full flex justify-center">
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-4 font-mono text-sm text-gray-900 w-[360px] print:w-[80mm]">
          <div className="text-center">
            <div className="text-lg font-extrabold tracking-widest">SUSHIKOI</div>
            <div className="text-xs text-gray-500">Puerto Montt</div>
            <div className="text-xs text-gray-500">RUT: 76.123.456-K</div>
          </div>
          <div className="my-3 border-t border-dashed border-gray-300" />
          <div className="grid grid-cols-2 gap-y-1 text-xs">
            <div className="text-gray-600">Boleta</div><div className="text-right font-semibold">#{order.publicCode || order.id}</div>
            <div className="text-gray-600">Fecha</div><div className="text-right">{dt}</div>
            <div className="text-gray-600">Estado</div><div className="text-right uppercase">{order.status}</div>
            <div className="text-gray-600">Pago</div><div className="text-right">{order.paymentMethod || "—"}</div>
            <div className="text-gray-600">Cliente</div><div className="text-right truncate">{order.name}</div>
            <div className="text-gray-600">Dirección</div><div className="text-right truncate">{order.address}</div>
          </div>
          <div className="my-3 border-t border-dashed border-gray-300" />
          <div className="mb-1 font-semibold">Ítems</div>
          <div className="space-y-2">
            {cartWithoutExtras.map((it) => (
              <div key={it.id} className="leading-5">
                <div className="flex items-start justify-between">
                  <div className="pr-2">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[210px]">
                        {it.name}
                        {it.items?.length ? ` — ${it.items.slice(0, 2).join(", ")}${it.items.length > 2 ? "…" : ""}` : ""}
                      </span>
                      <span className="text-gray-500">x{it.quantity}</span>
                    </div>
                  </div>
                  <div className="tabular-nums">${formatCLP(it.discountPrice * it.quantity)}</div>
                </div>
                {!!it.discount && it.discount > 0 && (
                  <div className="text-[11px] text-gray-500 flex justify-between">
                    <span>Precio lista</span>
                    <span className="line-through">${formatCLP(it.originalPrice * it.quantity)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="my-3 border-t border-dashed border-gray-300" />
          <div className="space-y-1 text-[13px]">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal ítems</span><span className="tabular-nums">${formatCLP(itemsSubtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Extras</span><span className="tabular-nums">${formatCLP(extrasTotalMeta)}</span></div>
            <div className="flex justify-between text-base font-extrabold mt-2"><span>Total</span><span className="tabular-nums text-rose-600">${formatCLP(totalToShow)}</span></div>
          </div>
          {extrasLines.length > 0 && (
            <>
              <div className="my-3 border-t border-dashed border-gray-300" />
              <div className="mb-1 font-semibold">Detalle extras</div>
              <div className="space-y-1 text-[12px]">
                {extrasLines.map((l, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-gray-600">{l.label}{l.qty ? ` x${l.qty}` : ""}</span>
                    <span className="tabular-nums">${formatCLP(l.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2 print:hidden">
        <button onClick={() => window.print()} className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">Imprimir</button>
        <button onClick={onClose} className="px-3 py-2 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700">Cerrar</button>
      </div>
    </KioskModal>
  );
};

/* ===================== Componente Principal ===================== */
type Props = { ordersApi: OrdersApi; onOrderCreated?: () => void; };

const CashierPanel: React.FC<Props> = ({ ordersApi }) => {
  const [activeTab, setActiveTab] = useState<CashierTab>(TOTEM_MODE ? "promotions" : "dashboard");

  // Carrito
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderUI | undefined>(undefined);
  const [showDetail, setShowDetail] = useState(false);

  // Órdenes recién creadas (buffer local)
  const [recentOrders, setRecentOrders] = useState<OrderUI[]>([]);

  // Cliente + errores + extras
  const [customerData, setCustomerData] = useState<CustomerFormData>({
    name: "", phone: "", rut: "", email: "", street: "", number: "", sector: "",
    city: "Puerto Montt", references: "", paymentMethod: "debito", paymentStatus: "paid",
    dueMethod: "efectivo", mpChannel: undefined,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderMeta, setOrderMeta] = useState<OrderMetaLocal | undefined>(undefined);

  // reloj UI y toasts
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const notify = (t: NType, m: string) => setNotifs((p) => [{ id: Date.now(), type: t, message: m, timestamp: Date.now() }, ...p].slice(0, 5));
  const dismiss = (id: number) => setNotifs((p) => p.filter((n) => n.id !== id));

  /* ====== Carrito ====== */
  const addToCart = (promotionId: number, hintedBasePrice?: number) => {
    const item = getMenuItem(promotionId);
    theAdd:
    {
      const unitPrice = item?.price ?? hintedBasePrice ?? 0;
      const name = item?.name ?? `Producto #${promotionId}`;
      const time = item?.time ?? 15;
      const description = item?.desc ?? "Item agregado desde Promociones";
      const existing = cart.find((it) => it.id === promotionId);
      if (existing) setCart(cart.map((it) => (it.id === promotionId ? { ...it, quantity: it.quantity + 1 } : it)));
      else setCart((prev) => [...prev, { id: promotionId, name, description, items: [], originalPrice: unitPrice, discountPrice: unitPrice, discount: 0, image: "🍣", popular: false, cookingTime: time, quantity: 1 }]);
    }
    notify("success", "Producto agregado al carrito");
  };

  const addToCartDetailed = (p: AddToCartPayload) => {
    const item = getMenuItem(p.promotionId);
    const base = Math.max(0, (p.estimatedTotal ?? 0) - (p.extrasTotal ?? 0));
    const unitPrice = item?.price ?? base ?? 0;
    const name = item?.name ?? `Producto #${p.promotionId}`;
    const time = item?.time ?? 15;
    const description = item?.desc ?? "Item agregado desde Promociones";

    const existing = cart.find((it) => it.id === p.promotionId);
    if (existing) setCart(cart.map((it) => (it.id === p.promotionId ? { ...it, quantity: it.quantity + 1 } : it)));
    else setCart((prev) => [...prev, { id: p.promotionId, name, description, items: [], originalPrice: unitPrice, discountPrice: unitPrice, discount: 0, image: "🍣", popular: false, cookingTime: time, quantity: 1 }]);

    const guarded = enforceOneProteinChange(p.changes, window.confirm, notify);
    setOrderMeta((prev) => {
      const nextService = p.service || prev?.service || "local";
      const next: OrderMetaLocal = {
        service: nextService,
        deliveryZone: nextService === "delivery" ? p.deliveryZone ?? prev?.deliveryZone : undefined,
        deliveryFee: nextService === "delivery" ? p.deliveryFee ?? prev?.deliveryFee ?? 0 : 0,
        chopsticks: (prev?.chopsticks || 0) + (p.chopsticks || 0),
        changes: [...(prev?.changes || []), ...guarded],
        soy: {
          qty: (prev?.soy?.qty || 0) + (p.soy?.qty || 0),
          included: (prev?.soy?.included || 0) + (p.soy?.included || 0),
          extraFee: (prev?.soy?.extraFee || 0) + (p.soy?.extraFee ?? p.soy?.feeTotal ?? 0),
        },
        ginger: {
          qty: (prev?.ginger?.qty || 0) + (p.ginger?.qty || 0),
          included: (prev?.ginger?.included || 0) + (p.ginger?.included || 0),
          extraFee: (prev?.ginger?.extraFee || 0) + (p.ginger?.extraFee ?? p.ginger?.feeTotal ?? 0),
        },
        wasabi: {
          qty: (prev?.wasabi?.qty || 0) + (p.wasabi?.qty || 0),
          included: (prev?.wasabi?.included || 0) + (p.wasabi?.included || 0),
          extraFee: (prev?.wasabi?.extraFee || 0) + (p.wasabi?.extraFee ?? p.wasabi?.feeTotal ?? 0),
        },
        agridulce: {
          qty: (prev?.agridulce?.qty || 0) + (p.agridulce?.qty || 0),
          feeTotal: (prev?.agridulce?.feeTotal || 0) + (p.agridulce?.feeTotal ?? p.agridulce?.extraFee ?? 0),
        },
        acevichada: {
          qty: (prev?.acevichada?.qty || 0) + (p.acevichada?.qty || 0),
          feeTotal: (prev?.acevichada?.feeTotal || 0) + (p.acevichada?.feeTotal ?? p.acevichada?.extraFee ?? 0),
        },
        note: p.note ?? prev?.note,
      };
      const changesFee = (next.changes || []).reduce((s, c) => s + (c.fee || 0), 0);
      const saucesFee =
        (next.soy?.extraFee || 0) +
        (next.ginger?.extraFee || 0) +
        (next.wasabi?.extraFee || 0) +
        (next.agridulce?.feeTotal || 0) +
        (next.acevichada?.feeTotal || 0);
      next.extrasTotal = (next.deliveryFee || 0) + changesFee + saucesFee;
      return next;
    });

    if (Array.isArray(p.drinks)) {
      p.drinks.forEach((d, idx) => {
        if (!d || !d.quantity) return;
        const id = Date.now() + idx;
        const bev: CartItem = { id, name: d.name, description: "Bebida", items: [], originalPrice: d.price, discountPrice: d.price, discount: 0, image: "🥤", popular: false, cookingTime: 0, quantity: d.quantity };
        setCart((prev) => [...prev, bev]);
      });
    }
    notify("success", "Detalle agregado (delivery/cambios/salsas)");
  };

  // 👉 Sincroniza línea "Extras"
  useEffect(() => {
    const totalExtras = extrasFromMeta(orderMeta);
    setCart((prev) => {
      const without = prev.filter((i) => i.id !== EXTRAS_ITEM_ID);
      if (totalExtras <= 0) return without;
      const label = buildExtrasLabel(orderMeta);
      const extraItem: CartItem = { id: EXTRAS_ITEM_ID, name: label, description: "Cargos adicionales (delivery / cambios / salsas)", items: [], originalPrice: totalExtras, discountPrice: totalExtras, discount: 0, image: "➕", popular: false, cookingTime: 0, quantity: 1 };
      return [...without, extraItem];
    });
  }, [orderMeta]);

  const removeFromCart = (id: number) => { const it = cart.find((i) => i.id === id); setCart(cart.filter((i) => i.id !== id)); if (it) notify("info", `${it.name} eliminado del carrito`); };
  const updateQuantity = (id: number, q: number) => { if (q <= 0) return removeFromCart(id); setCart(cart.map((i) => (i.id === id ? { ...i, quantity: q } : i))); };
  const clearCart = () => { setCart([]); setOrderMeta(undefined); notify("info", "Carrito vaciado"); };

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.discountPrice * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const estimatedCooking = useMemo(() => cart.reduce((m, i) => Math.max(m, i.cookingTime), 0), [cart]);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!customerData.name.trim()) e.name = "El nombre es obligatorio";
    if (!customerData.phone.trim()) e.phone = "El teléfono es obligatorio";
    if (!customerData.street.trim()) e.street = "La calle es obligatoria";
    if (!customerData.number.trim()) e.number = "El número es obligatorio";
    if (cart.length === 0) e.cart = "Debe agregar al menos una promoción al carrito";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const grandTotal = useMemo(() => cartTotal, [cartTotal]);

  // Lista en “Órdenes”: recientes + store (únicos)
  const displayedOrders = useMemo(() => {
    const map = new Map<number, OrderUI>();
    for (const o of recentOrders) map.set(o.id, o);
    for (const o of (ordersApi.orders as unknown as OrderUI[])) if (!map.has(o.id)) map.set(o.id, o);
    return Array.from(map.values());
  }, [recentOrders, ordersApi.orders]);

  const createOrder = async () => {
    if (!validate()) { notify("error", "Complete todos los campos requeridos"); setActiveTab("customer"); return; }
    setIsCreatingOrder(true);
    try {
      const coords = { lat: -41.4717, lng: -72.9411 };
      const payload = { customerData: customerData as any, cart: cart as any, coordinates: coords as any, geocodePrecision: "approx" as any, routeMeta: null, meta: orderMeta as OrderMeta | undefined };
      const created = await ordersApi.createOrder(payload as any);
      if (!created || !created.id) { notify("error", "No se pudo crear el pedido (respuesta inválida)"); return; }
      ordersApi.updateOrderStatus?.(created.id, "pending");
      const createdWithMeta = { ...(created as any), meta: created.meta ?? orderMeta } as OrderUI;
      setRecentOrders((prev) => [createdWithMeta, ...prev]); setSelectedOrder(createdWithMeta); setShowDetail(true);
      setCart([]); setOrderMeta(undefined);
      setCustomerData({ name: "", phone: "", rut: "", email: "", street: "", number: "", sector: "", city: "Puerto Montt", references: "", paymentMethod: "debito", paymentStatus: "paid", dueMethod: "efectivo", mpChannel: undefined, });
      setErrors({}); setActiveTab("orders"); notify("success", `Pedido #${created.publicCode} creado`);
      try {
        if (typeof (ordersApi as any)?.fetchOrders === "function") await (ordersApi as any).fetchOrders();
        else if (typeof (ordersApi as any)?.refetch === "function") await (ordersApi as any).refetch();
        else if (typeof (ordersApi as any)?.refresh === "function") await (ordersApi as any).refresh();
      } catch {}
    } catch (err) {
      console.error("createOrder error:", err); notify("error", "Error al crear pedido");
    } finally { setIsCreatingOrder(false); }
  };

  /* ====== Métricas del store de órdenes ====== */
  const todayOrders = ordersApi.orders.length;
  const todayRevenue = ordersApi.orders.reduce((s, o) => s + o.total, 0);
  const avgOrderValue = todayOrders ? Math.round(todayRevenue / todayOrders) : 0;
  const pending = ordersApi.orders.filter((o) => o.status === "pending").length;
  const cooking = ordersApi.orders.filter((o) => o.status === "cooking").length;
  const ready = ordersApi.orders.filter((o) => o.status === "ready").length;

  /* ====== Arqueo (en vivo) ====== */
  const { current, getExpectedCash } = useCashup();
  const by = current?.ops?.salesRuntime?.byMethod || {};
  const totalsByMethod = {
    EFECTIVO_SISTEMA: by.EFECTIVO_SISTEMA || 0,
    DEBITO_SISTEMA: by.DEBITO_SISTEMA || 0,
    CREDITO_SISTEMA: by.CREDITO_SISTEMA || 0,
    POS_DEBITO: by.POS_DEBITO || 0,
    POS_CREDITO: by.POS_CREDITO || 0,
    TRANSFERENCIA: by.TRANSFERENCIA || 0,
    MERCADO_PAGO: by.MERCADO_PAGO || 0,
  };
  const cashExpected = getExpectedCash(current);
  const gastos = (current?.ops?.expenses || []).reduce((acc: number, e: any) => acc + (e?.amount || 0), 0);
  const retiros = current?.ops?.withdrawals || 0;
  const propinas = current?.ops?.tips?.cashTips || 0;
  const eboletaAmount = current?.ops?.fiscal?.eboletaAmount || 0;
  const eboletaCount = current?.ops?.fiscal?.eboletaCount || 0;

  type TabItem = { key: CashierTab; label: string; icon: any; badge?: number };
  const tabs: TabItem[] = [
    { key: "dashboard", label: "Dashboard", icon: BarChart3 },
    { key: "promotions", label: "Promociones", icon: Utensils },
    { key: "customer", label: "Cliente", icon: User },
    { key: "cart", label: "Carrito", icon: ShoppingCart, badge: cartCount || undefined },
    { key: "pay", label: "Pagar", icon: CreditCard },
    { key: "orders", label: "Órdenes", icon: Package, badge: displayedOrders.length || undefined },
  ];

  const goToCreateOrder = () => { setActiveTab("cart"); setTimeout(() => setActiveTab("customer"), 140); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Toasts */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifs.map((n) => (<Toast key={n.id} n={n} onClose={dismiss} />))}
      </div>

      {/* Header + Control de Caja */}
      <div className="p-4 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-xl font-bold">🍣</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Panel de Cajero/Vendedor <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">En línea</span>
                </h1>
                <p className="text-gray-600">Flujo: Promociones → Carrito → Cliente → Pagar</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Rol: Cajero</p>
              <p className="text-sm text-gray-500">📍 Sushikoi — Puerto Montt</p>
              <p className="text-xs text-gray-400">🕒 {now.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>

          {/* Control de Caja */}
          <div className="mt-4">
            <CashDrawerControl />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6 border border-gray-200">
          <div className="flex border-b border-gray-100">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all duration-300 relative ${activeTab === t.key ? "border-red-500 text-red-600 bg-red-50" : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}
              >
                <t.icon size={18} />
                {t.label}
                {typeof t.badge === "number" && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{t.badge}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido por tab */}
        <div className="animate-fade-in">
          {/* Dashboard extendido */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard icon={<Package className="text-blue-600" size={24} />} title="Órdenes Hoy" value={todayOrders} sub="+12% vs ayer" color="blue" />
                <KpiCard icon={<DollarSign className="text-green-600" size={24} />} title="Ingresos Hoy" value={`$${formatCLP(todayRevenue)}`} sub="+8% vs ayer" color="green" />
                <KpiCard icon={<TrendingUp className="text-purple-600" size={24} />} title="Ticket Promedio" value={`$${formatCLP(avgOrderValue)}`} sub="+5% vs ayer" color="purple" />
                <KpiCard icon={<Clock className="text-orange-600" size={24} />} title="En Cocina" value={cooking} sub="Activos" color="orange" />
              </div>

              {/* Estado cocina */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatusCard title="📋 Pendientes" value={pending} barColor="yellow" />
                <StatusCard title="👨‍🍳 En Cocina" value={cooking} barColor="orange" />
                <StatusCard title="✅ Listos" value={ready} barColor="green" />
              </div>

              {/* Arqueo de caja (en vivo) */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Wallet size={18} className="text-rose-600" />
                    <h3 className="font-semibold text-gray-900">Arqueo de Caja (turno actual)</h3>
                  </div>
                  <div className="text-sm text-gray-600">
                    Efectivo esperado: <b className="text-gray-900">${formatCLP(cashExpected)}</b>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <MiniInfo label="Gastos" value={`$${formatCLP(gastos)}`} />
                    <MiniInfo label="Retiros" value={`$${formatCLP(retiros)}`} />
                    <MiniInfo label="Propinas (cash)" value={`$${formatCLP(propinas)}`} />
                  </div>
                  <div className="space-y-2">
                    <MiniInfo label="E-Boletas (monto)" value={`$${formatCLP(eboletaAmount)}`} />
                    <MiniInfo label="E-Boletas (unid.)" value={`${formatCLP(eboletaCount)}`} />
                    <MiniInfo label="Ventas totales" value={`$${formatCLP(Object.values(totalsByMethod).reduce((a, b) => a + b, 0))}`} />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 flex items-center gap-2"><PieChart size={16}/> Ventas por método</div>
                    <MethodBar label="Efectivo (sistema)" value={totalsByMethod.EFECTIVO_SISTEMA} maxHint={totalsByMethodMax(totalsByMethod)} />
                    <MethodBar label="Débito (sistema)" value={totalsByMethod.DEBITO_SISTEMA} maxHint={totalsByMethodMax(totalsByMethod)} />
                    <MethodBar label="Crédito (sistema)" value={totalsByMethod.CREDITO_SISTEMA} maxHint={totalsByMethodMax(totalsByMethod)} />
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-3 mt-4">
                  <MethodBar label="POS Débito" value={totalsByMethod.POS_DEBITO} maxHint={totalsByMethodMax(totalsByMethod)} />
                  <MethodBar label="POS Crédito" value={totalsByMethod.POS_CREDITO} maxHint={totalsByMethodMax(totalsByMethod)} />
                  <MethodBar label="Mercado Pago" value={totalsByMethod.MERCADO_PAGO} maxHint={totalsByMethodMax(totalsByMethod)} />
                  <MethodBar label="Transferencia" value={totalsByMethod.TRANSFERENCIA} maxHint={totalsByMethodMax(totalsByMethod)} />
                </div>

                <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                  <LineChart size={14} /> Los totales se actualizan al confirmar un pago en <b>“Pagar”</b>.
                </div>
              </div>
            </div>
          )}

          {/* Promociones */}
          {activeTab === "promotions" && (
            <PromotionsGrid onAddToCart={addToCart} onAddToCartDetailed={addToCartDetailed} onAfterConfirm={goToCreateOrder} />
          )}

          {/* Carrito */}
          {activeTab === "cart" && (
            <CartPanel
              cart={cart}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              onClearCart={clearCart}
              total={grandTotal}
              estimatedTime={estimatedCooking || 15}
              onContinue={() => {
                const hasMin = !!customerData.name?.trim() && !!customerData.phone?.trim() && !!customerData.street?.trim() && !!customerData.number?.trim();
                if (hasMin) setActiveTab("pay");
                else { setActiveTab("customer"); notify("info", "Completa los datos del cliente para continuar"); }
              }}
            />
          )}

          {/* Cliente */}
          {activeTab === "customer" && (
            <CustomerForm
              customerData={customerData}
              onCustomerDataChange={setCustomerData}
              errors={errors}
              onSelectCustomer={(c) => {
                setCustomerData((prev) => ({
                  ...prev,
                  name: c?.name ?? prev.name, phone: c?.phone ?? prev.phone, street: c?.street ?? prev.street,
                  number: c?.number ?? prev.number, sector: c?.sector ?? prev.sector,
                  city: c?.city ?? prev.city ?? "Puerto Montt", references: c?.references ?? prev.references,
                }));
                notify("info", `Cliente ${c?.name ?? "Sin nombre"} seleccionado`);
              }}
              cart={cart}
              cartTotal={cartTotal}
              estimatedTime={estimatedCooking || 15}
              onCreateOrder={createOrder}
              isCreatingOrder={isCreatingOrder}
              orderMeta={orderMeta}
              onRequestEditExtras={() => setActiveTab("promotions")}
              onGoToCart={() => setActiveTab("cart")}
            />
          )}

          {/* Pagar */}
          {activeTab === "pay" && (
            <PayPanel
              total={grandTotal}
              customerData={{ name: customerData.name, phone: customerData.phone, rut: customerData.rut || "", paymentMethod: customerData.paymentMethod, mpChannel: customerData.mpChannel }}
              onChangeCustomerData={(d) =>
                setCustomerData((prev) => ({
                  ...prev,
                  name: d.name ?? prev.name,
                  phone: d.phone ?? prev.phone,
                  rut: d.rut ?? prev.rut ?? "",
                  paymentMethod: (d.paymentMethod ?? prev.paymentMethod) as PaymentMethod,
                  mpChannel: d.mpChannel ?? prev.mpChannel,
                }))
              }
              isPaying={isCreatingOrder}
              onBackToCart={() => setActiveTab("cart")}
              onConfirmPay={createOrder}
              orderMeta={orderMeta}
            />
          )}

          {/* Órdenes */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {displayedOrders.length === 0 ? (
                <div className="bg-white p-10 rounded-xl text-center text-gray-500 border border-gray-200">No hay órdenes aún</div>
              ) : (
                displayedOrders.map((o) => (
                  <div key={o.id} className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-sm transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">#{o.publicCode} • {o.status.toUpperCase()}</p>
                        <p className="font-semibold text-gray-900">{o.name} — {o.phone}</p>
                        <p className="text-sm text-gray-600">{o.address}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button className="inline-flex items-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50" onClick={() => { setSelectedOrder(o as unknown as OrderUI); setShowDetail(true); }} title="Ver detalle">
                          <Eye size={16} /> Detalle
                        </button>
                        <div className="text-right">
                          <p className="text-xl font-bold text-rose-600">${formatCLP(o.total)}</p>
                          <p className="text-xs text-gray-500">⏱️ {o.estimatedTime} min • {timeAgo(o.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <OrderDetailModal open={showDetail} onClose={() => setShowDetail(false)} order={selectedOrder} />
    </div>
  );
};

/* ===== UI helpers ===== */
const KpiCard: React.FC<{ icon: React.ReactNode; title: string; value: React.ReactNode; sub?: string; color: "blue" | "green" | "purple" | "orange"; }> = ({ icon, title, value, sub, color }) => {
  const bg = { blue: "bg-blue-100", green: "bg-green-100", purple: "bg-purple-100", orange: "bg-orange-100" }[color];
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {sub && <p className={`text-sm ${color === "green" ? "text-green-600" : "text-gray-500"}`}>↗ {sub}</p>}
        </div>
        <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>{icon}</div>
      </div>
    </div>
  );
};

const StatusCard: React.FC<{ title: string; value: number; barColor: "yellow" | "orange" | "green"; }> = ({ title, value, barColor }) => {
  const bg = { yellow: "bg-yellow-200", orange: "bg-orange-200", green: "bg-green-200" }[barColor];
  const bar = { yellow: "bg-yellow-500", orange: "bg-orange-500", green: "bg-green-500" }[barColor];
  return (
    <div className={`bg-gradient-to-br from-${barColor}-50 to-${barColor}-100 border border-${barColor}-200 rounded-xl p-6 hover:shadow-lg transition`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className={`font-semibold text-${barColor}-800`}>{title}</h4>
        <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
          <Clock size={16} className={`text-${barColor}-700`} />
        </div>
      </div>
      <p className={`text-3xl font-bold text-${barColor}-700 mb-2`}>{value}</p>
      <div className={`w-full ${bg} rounded-full h-2`}>
        <div className={`${bar} h-2 rounded-full`} style={{ width: `${Math.min(value * 25, 100)}%` }} />
      </div>
    </div>
  );
};

const MiniInfo: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="px-3 py-2 bg-gray-50 rounded border text-sm flex items-center justify-between">
    <span className="text-gray-600">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

function totalsByMethodMax(obj: Record<string, number>) {
  const vals = Object.values(obj);
  return vals.length ? Math.max(...vals) : 1;
}

const MethodBar: React.FC<{ label: string; value: number; maxHint: number }> = ({ label, value, maxHint }) => {
  const pct = Math.min(100, Math.round((value / (maxHint || 1)) * 100));
  return (
    <div className="text-sm">
      <div className="flex items-center justify-between">
        <span className="text-gray-700">{label}</span>
        <b>${formatCLP(value)}</b>
      </div>
      <div className="w-full bg-gray-100 h-2 rounded">
        <div className="h-2 bg-rose-500 rounded" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default CashierPanel;
