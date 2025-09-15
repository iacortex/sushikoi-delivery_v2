import React, { useEffect, useMemo, useState } from "react";
import {
  ShoppingCart, User, Utensils, Package, DollarSign,
  TrendingUp, BarChart3, Clock, Bell, CheckCircle,
  XCircle, AlertCircle, Eye
} from "lucide-react";

import PromotionsGrid from "../cashier/PromotionsGrid";
import { CartPanel } from "../cashier/CartPanel";
import { CustomerForm } from "../cashier/CustomerForm";
import { getMenuItem } from "../../features/menu/catalog";
import { KioskModal } from "../ui/KioskModal";

import { useOrders } from "@/features/orders/useOrders";
type OrdersApi = ReturnType<typeof useOrders>;

const TOTEM_MODE = true;

/* ===== Tipos UI ===== */
export interface CartItem {
  id: number; name: string; description: string; items: string[];
  originalPrice: number; discountPrice: number; discount: number;
  image: string; popular: boolean; cookingTime: number; quantity: number;
}
type CashierTab = "dashboard" | "promotions" | "customer" | "cart" | "orders";

interface CustomerFormData {
  name: string; phone: string; street: string; number: string;
  sector: string; city: string; references: string;
  paymentMethod: 'efectivo' | 'debito' | 'credito' | 'transferencia' | 'mp';
  paymentStatus: string; dueMethod: string; mpChannel?: 'delivery' | 'local';
}
interface FormErrors { [k: string]: string; }

interface OrderUI {
  id: number; publicCode: string; name: string; phone: string; address: string;
  total: number; status: "pending"|"cooking"|"ready"|"delivered";
  cart: CartItem[]; createdAt: number; estimatedTime: number; paymentMethod: string;
}

/* ===== Extras ===== */
type ServiceType = "delivery" | "local";
type Protein = "pollo" | "salmon" | "camaron" | "kanikama" | "loco" | "pulpo";
interface ChangeLine { from?: Protein; to?: Protein; fee: number; }
interface SauceLine { qty: number; included?: number; extraFee?: number; feeTotal?: number; }
interface OrderMeta {
  service: ServiceType; deliveryZone?: string; deliveryFee?: number; chopsticks?: number;
  changes?: ChangeLine[]; soy?: SauceLine; ginger?: SauceLine; wasabi?: SauceLine;
  agridulce?: SauceLine; acevichada?: SauceLine; extrasTotal?: number;
}
interface AddToCartPayload {
  promotionId: number; chopsticks: number; service: ServiceType;
  deliveryZone?: string; deliveryFee?: number; changes: ChangeLine[];
  soy?: SauceLine; ginger?: SauceLine; wasabi?: SauceLine; agridulce?: SauceLine; acevichada?: SauceLine;
  extrasTotal: number; estimatedTotal: number;
}

/* ===== Helpers ===== */
const formatCLP = (n: number) => new Intl.NumberFormat("es-CL").format(n);
const timeAgo = (ts: number) => { const m = Math.floor((Date.now()-ts)/60000); if (m<1) return "Ahora"; if (m<60) return `${m}m`; return `${Math.floor(m/60)}h`; };
const extrasFromMeta = (m?: OrderMeta) => {
  if (!m) return 0;
  const delivery = m.service === "delivery" ? (m.deliveryFee ?? 0) : 0;
  const changes  = (m.changes ?? []).reduce((s, c) => s + (c?.fee ?? 0), 0);
  const sauces   = ((m.soy?.extraFee ?? m.soy?.feeTotal) ?? 0)
                 + ((m.ginger?.extraFee ?? m.ginger?.feeTotal) ?? 0)
                 + ((m.wasabi?.extraFee ?? m.wasabi?.feeTotal) ?? 0)
                 + ((m.agridulce?.feeTotal ?? m.agridulce?.extraFee) ?? 0)
                 + ((m.acevichada?.feeTotal ?? m.acevichada?.extraFee) ?? 0);
  return delivery + changes + sauces;
};

/* ===== Toast ===== */
type NType = "success"|"warning"|"error"|"info";
interface Notification { id: number; type: NType; message: string; timestamp: number; }
const Toast: React.FC<{ n: Notification; onClose: (id: number) => void }> = ({ n, onClose }) => {
  useEffect(() => { const t = setTimeout(() => onClose(n.id), 5000); return () => clearTimeout(t); }, [n.id, onClose]);
  const Icon = () => n.type === "success" ? <CheckCircle className="text-green-600" size={18}/> :
                   n.type === "warning" ? <AlertCircle className="text-yellow-600" size={18}/> :
                   n.type === "error"   ? <XCircle className="text-red-600" size={18}/> :
                                          <Bell className="text-blue-600" size={18}/>;
  const bg = { success:"bg-green-50 border-green-200", warning:"bg-yellow-50 border-yellow-200", error:"bg-red-50 border-red-200", info:"bg-blue-50 border-blue-200" }[n.type];
  return (
    <div className={`${bg} border rounded-lg p-3 shadow-md animate-slide-in-right`}>
      <div className="flex items-start gap-2">
        <Icon />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{n.message}</p>
          <p className="text-xs text-gray-500">{timeAgo(n.timestamp)}</p>
        </div>
        <button onClick={() => onClose(n.id)} className="text-gray-400 hover:text-gray-600"><XCircle size={14}/></button>
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
  if (wantsMore) { notify("info","Se agregaron cambios de proteína adicionales."); return list; }
  notify("warning","Se aplicó solo 1 cambio de proteína."); return [list[0]];
}

/* ===== Modal detalle ===== */
const OrderDetailModal: React.FC<{ open: boolean; onClose: () => void; order?: OrderUI; }> = ({ open, onClose, order }) => {
  if (!order) return null;
  return (
    <KioskModal open={open} onClose={onClose} title={`Pedido #${order.publicCode} — ${order.name}`} subtitle={`${order.phone} • ${order.address}`} designWidth={1100} designHeight={700}>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-5 space-y-3">
          <div className="border rounded-lg p-3">
            <h4 className="font-semibold text-gray-900 mb-1">Resumen</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <div>Estado: <b className="uppercase">{order.status}</b></div>
              <div>Creado: <span className="text-gray-600">{timeAgo(order.createdAt)}</span></div>
              <div>ETA: <span className="text-gray-600">{order.estimatedTime} min</span></div>
              <div>Método de pago: <span className="text-gray-600">{order.paymentMethod}</span></div>
            </div>
          </div>
          <div className="border rounded-lg p-3"><h4 className="font-semibold text-gray-900 mb-1">Cliente</h4><div className="text-sm text-gray-700 space-y-1"><div><User className="inline mr-1" size={14}/> {order.name}</div><div>📞 {order.phone}</div><div>📍 {order.address}</div></div></div>
          <div className="border rounded-lg p-3 bg-gray-50"><div className="text-sm text-gray-700">Total</div><div className="text-2xl font-bold text-rose-600">${formatCLP(order.total)}</div></div>
        </div>
        <div className="col-span-12 md:col-span-7 space-y-3">
          <h4 className="font-semibold text-gray-900">Items</h4>
          <div className="space-y-2">
            {order.cart.map((it) => (
              <div key={it.id} className="border rounded-lg p-3 flex items-start gap-3">
                <div className="text-2xl">{it.image || "🍣"}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">{it.name}</div>
                    <div className="text-sm text-gray-600">x{it.quantity}</div>
                  </div>
                  {!!it.items?.length && <ul className="mt-1 text-xs text-gray-600 list-disc ml-4">{it.items.map((ln, idx) => <li key={idx}>{ln}</li>)}</ul>}
                </div>
                <div className="text-right">
                  <div className="font-semibold">${formatCLP(it.discountPrice * it.quantity)}</div>
                  {it.discount > 0 && <div className="text-xs text-gray-500 line-through">${formatCLP(it.originalPrice * it.quantity)}</div>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-600 bg-gray-50 border rounded-lg p-3">
            <Clock className="inline mr-1 text-orange-500" size={16}/> Tiempo estimado: <b>{order.estimatedTime} min</b>
          </div>
        </div>
      </div>
    </KioskModal>
  );
};

/* ===================== Componente Principal ===================== */
type Props = {
  ordersApi: OrdersApi;
  onOrderCreated?: () => void; // 👈 callback al crear orden
};

const CashierPanel: React.FC<Props> = ({ ordersApi, onOrderCreated }) => {
  const [activeTab, setActiveTab] = useState<CashierTab>(TOTEM_MODE ? "promotions" : "dashboard");

  // Carrito
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderUI | undefined>(undefined);
  const [showDetail, setShowDetail] = useState(false);

  // Clientes demo
  const [customers, setCustomers] = useState<any[]>([]);
  useEffect(() => {
    const rand = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const first = ["Juan","María","Camila","Javier","Daniela","Felipe","Francisca","Rodrigo","Paula","Ignacio","Valentina","Sebastián","Carolina","Diego","Constanza","Matías","Fernanda","Benjamín","Antonia","Tomás","Isidora","Vicente","Sofía","Gonzalo","Trinidad","Martina","Cristóbal","Joaquín","Josefa","Pedro","Pablo","Andrea","Katherine","Bárbara","Nicole","Álvaro","Verónica","Laura","Rocío","Patricio","Eduardo","Lorena","Marcos","Cecilia","Claudia","Renata","Martín","Agustín","Lucas","Mateo","Emilia","Emma","Amanda","Catalina","Ignacia","Gabriel","Florencia","Josefina","Bruno","Matilde","Julieta","Paz","Alexa","Franco","Gael","Thiago"];
    const last  = ["Pérez","García","Soto","Fuentes","Rojas","Castro","Paredes","Morales","Díaz","Torres","Aguilar","Muñoz","Reyes","Herrera","Vargas","Silva","Navarro","Vega","Flores","Contreras","Araya","Oyarzo","Trujillo","Alvarado","Salinas","Medina","Campos","Almonacid","Lagos","Méndez","Vidal","Bahamonde","Leiva","González"];
    const streets = ["Av. Capitán Ávalos","Los Aromos","Av. Angelmó","Volcán Osorno","Egaña","Av. La Cruz","Las Encinas","Camino La Vara","Lago Llanquihue","Puerto Sur","Cardonal","Av. Austral","Urmeneta","Av. Seminario","Los Notros","Altamira","Miraflores","Valle Volcanes","Alerce Norte","Alerce Sur","Mirasol","Chinquihue","Reloncaví","Presidente Ibáñez","Las Quemas","Coihuin"];
    const sectors = ["Mirasol","Cardonal","Alerce Norte","Alerce Sur","Puerto Sur","Centro","Chinquihue","Mirasol Alto","Valle Volcanes","Mirasol Bajo"];
    const cities  = ["Puerto Montt","Puerto Varas","Osorno","Castro"];
    const mkPhone = (i: number) => `+56 9 9${(9000 + (i % 9000)).toString().padStart(4,"0")} ${(1000 + (i*7)%9000).toString().padStart(4,"0")}`;
    const mkCustomer = (i: number) => ({ name: `${pick(first)} ${pick(last)}`, phone: mkPhone(i), street: pick(streets), number: String(rand(1,2500)), sector: Math.random()<.7?pick(sectors):"", city: pick(cities), references: "" });
    setCustomers(Array.from({ length: 60 }, (_, i) => mkCustomer(i + 1)));
  }, []);

  // Cliente + errores + extras
  const [customerData, setCustomerData] = useState<CustomerFormData>({
    name: "", phone: "", street: "", number: "",
    sector: "", city: "Puerto Montt", references: "",
    paymentMethod: "debito", paymentStatus: "paid", dueMethod: "efectivo",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderMeta, setOrderMeta] = useState<OrderMeta | undefined>(undefined);

  // reloj UI y toasts
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const notify = (t: NType, m: string) => setNotifs(p => [{ id: Date.now(), type: t, message: m, timestamp: Date.now() }, ...p].slice(0,5));
  const dismiss = (id: number) => setNotifs(p => p.filter(n => n.id !== id));

  /* ====== Carrito ====== */
  const addToCart = (promotionId: number, hintedBasePrice?: number) => {
    const item = getMenuItem(promotionId);
    const unitPrice = item?.price ?? hintedBasePrice ?? 0;
    const name = item?.name ?? `Producto #${promotionId}`;
    const time = item?.time ?? 15;
    const description = item?.desc ?? "Item agregado desde Promociones";
    const existing = cart.find((it) => it.id === promotionId);
    if (existing) setCart(cart.map((it) => it.id === promotionId ? { ...it, quantity: it.quantity + 1 } : it));
    else setCart(prev => [...prev, { id: promotionId, name, description, items: [], originalPrice: unitPrice, discountPrice: unitPrice, discount: 0, image: "🍣", popular: false, cookingTime: time, quantity: 1 }]);
    notify("success","Producto agregado al carrito"); setActiveTab("customer");
  };

  const addToCartDetailed = (p: AddToCartPayload) => {
    const item = getMenuItem(p.promotionId);
    const base = Math.max(0, (p.estimatedTotal ?? 0) - (p.extrasTotal ?? 0));
    const unitPrice = item?.price ?? base ?? 0;
    const name = item?.name ?? `Producto #${p.promotionId}`;
    const time = item?.time ?? 15;
    const description = item?.desc ?? "Item agregado desde Promociones";

    const existing = cart.find((it) => it.id === p.promotionId);
    if (existing) setCart(cart.map((it) => it.id === p.promotionId ? { ...it, quantity: it.quantity + 1 } : it));
    else setCart(prev => [...prev, { id: p.promotionId, name, description, items: [], originalPrice: unitPrice, discountPrice: unitPrice, discount: 0, image: "🍣", popular: false, cookingTime: time, quantity: 1 }]);

    const guarded = enforceOneProteinChange(p.changes, window.confirm, notify);
    setOrderMeta(prev => {
      const nextService = p.service || prev?.service || "local";
      const next: OrderMeta = {
        service: nextService,
        deliveryZone: nextService === "delivery" ? (p.deliveryZone ?? prev?.deliveryZone) : undefined,
        deliveryFee: nextService === "delivery" ? (p.deliveryFee ?? prev?.deliveryFee ?? 0) : 0,
        chopsticks: (prev?.chopsticks || 0) + (p.chopsticks || 0),
        changes: [...(prev?.changes || []), ...guarded],
        soy:       { qty: (prev?.soy?.qty || 0) + (p.soy?.qty || 0),       included: (prev?.soy?.included || 0) + (p.soy?.included || 0),       extraFee: (prev?.soy?.extraFee || 0) + (p.soy?.extraFee ?? p.soy?.feeTotal ?? 0) },
        ginger:    { qty: (prev?.ginger?.qty || 0) + (p.ginger?.qty || 0), included: (prev?.ginger?.included || 0) + (p.ginger?.included || 0), extraFee: (prev?.ginger?.extraFee || 0) + (p.ginger?.extraFee ?? p.ginger?.feeTotal ?? 0) },
        wasabi:    { qty: (prev?.wasabi?.qty || 0) + (p.wasabi?.qty || 0), included: (prev?.wasabi?.included || 0) + (p.wasabi?.included || 0), extraFee: (prev?.wasabi?.extraFee || 0) + (p.wasabi?.extraFee ?? p.wasabi?.feeTotal ?? 0) },
        agridulce: { qty: (prev?.agridulce?.qty || 0) + (p.agridulce?.qty || 0), feeTotal: (prev?.agridulce?.feeTotal || 0) + (p.agridulce?.feeTotal ?? p.agridulce?.extraFee ?? 0) },
        acevichada:{ qty: (prev?.acevichada?.qty || 0) + (p.acevichada?.qty || 0), feeTotal: (prev?.acevichada?.feeTotal || 0) + (p.acevichada?.feeTotal ?? p.acevichada?.extraFee ?? 0) },
      };
      const changesFee = (next.changes || []).reduce((s, c) => s + (c.fee || 0), 0);
      const saucesFee  = (next.soy?.extraFee || 0) + (next.ginger?.extraFee || 0) + (next.wasabi?.extraFee || 0) + (next.agridulce?.feeTotal || 0) + (next.acevichada?.feeTotal || 0);
      next.extrasTotal = (next.deliveryFee || 0) + changesFee + saucesFee;
      return next;
    });

    notify("success","Detalle agregado (delivery/cambios/salsas)"); setActiveTab("customer");
  };

  const removeFromCart = (id: number) => { const it = cart.find(i => i.id === id); setCart(cart.filter(i => i.id !== id)); if (it) notify("info", `${it.name} eliminado del carrito`); };
  const updateQuantity = (id: number, q: number) => { if (q <= 0) return removeFromCart(id); setCart(cart.map(i => i.id === id ? { ...i, quantity: q } : i)); };
  const clearCart = () => { setCart([]); setOrderMeta(undefined); notify("info","Carrito vaciado"); };

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
    setErrors(e); return Object.keys(e).length === 0;
  };

  const grandTotal = useMemo(() => cartTotal + extrasFromMeta(orderMeta), [cartTotal, orderMeta]);

  const createOrder = async () => {
    if (!validate()) { notify("error","Complete todos los campos requeridos"); return; }
    setIsCreatingOrder(true);
    try {
      const coords = { lat: -41.4717, lng: -72.9411 };
      const created = await ordersApi.createOrder({
        customerData: customerData as any,
        cart: cart as any,
        coordinates: coords as any,
        geocodePrecision: "approx" as any,
        routeMeta: null,
      });

      // ✅ asegurar estado 'pending' por seguridad
      ordersApi.updateOrderStatus?.(created.id, "pending");

      // ✅ avisar al padre (App) para saltar a Cocina
      onOrderCreated?.();

      setSelectedOrder(created as unknown as OrderUI);
      setShowDetail(true);

      setCart([]); setOrderMeta(undefined);
      setCustomerData({ name: "", phone: "", street: "", number: "", sector: "", city: "Puerto Montt", references: "", paymentMethod: "debito", paymentStatus: "paid", dueMethod: "efectivo" });
      setErrors({}); setActiveTab("orders");

      notify("success", `Pedido #${created.publicCode} creado`);
    } catch {
      notify("error","Error al crear pedido");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  /* ====== Métricas del store ====== */
  const todayOrders = ordersApi.orders.length;
  const todayRevenue = ordersApi.orders.reduce((s, o) => s + o.total, 0);
  const avgOrderValue = todayOrders ? Math.round(todayRevenue / todayOrders) : 0;
  const pending = ordersApi.orders.filter(o => o.status === "pending").length;
  const cooking = ordersApi.orders.filter(o => o.status === "cooking").length;
  const ready   = ordersApi.orders.filter(o => o.status === "ready").length;

  type TabItem = { key: CashierTab; label: string; icon: any; badge?: number };
  const tabs: TabItem[] = [
    { key: "dashboard",  label: "Dashboard",   icon: BarChart3 },
    { key: "promotions", label: "Promociones", icon: Utensils },
    { key: "customer",   label: "Cliente",     icon: User },
    { key: "cart",       label: "Carrito",     icon: ShoppingCart, badge: cartCount || undefined },
    { key: "orders",     label: "Órdenes",     icon: Package },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Toasts */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifs.map((n) => <Toast key={n.id} n={n} onClose={dismiss} />)}
      </div>

      {/* Header */}
      <div className="p-4 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-xl font-bold">🍣</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Panel de Cajero/Vendedor <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">En línea</span>
                </h1>
                <p className="text-gray-600">Flujo: Promociones → Cliente → Crear pedido</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Rol: Cajero</p>
              <p className="text-sm text-gray-500">📍 Sushikoi — Puerto Montt</p>
              <p className="text-xs text-gray-400">🕒 {now.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6 border border-gray-200">
          <div className="flex border-b border-gray-100">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all duration-300 relative ${
                  activeTab === t.key ? "border-red-500 text-red-600 bg-red-50" : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <t.icon size={18} />
                {t.label}
                {typeof t.badge === "number" && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{t.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido por tab */}
        <div className="animate-fade-in">
          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard icon={<Package className="text-blue-600" size={24} />} title="Órdenes Hoy" value={todayOrders} sub="+12% vs ayer" color="blue" />
                <KpiCard icon={<DollarSign className="text-green-600" size={24} />} title="Ingresos Hoy" value={`$${formatCLP(todayRevenue)}`} sub="+8% vs ayer" color="green" />
                <KpiCard icon={<TrendingUp className="text-purple-600" size={24} />} title="Ticket Promedio" value={`$${formatCLP(avgOrderValue)}`} sub="+5% vs ayer" color="purple" />
                <KpiCard icon={<Clock className="text-orange-600" size={24} />} title="En Cocina" value={cooking} sub="Activos" color="orange" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatusCard title="📋 Pendientes" value={pending} barColor="yellow" />
                <StatusCard title="👨‍🍳 En Cocina" value={cooking} barColor="orange" />
                <StatusCard title="✅ Listos" value={ready} barColor="green" />
              </div>
            </div>
          )}

          {/* Promociones */}
          {activeTab === "promotions" && (
            <PromotionsGrid
              onAddToCart={addToCart}
              onAddToCartDetailed={addToCartDetailed}
            />
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
              onContinue={createOrder}
            />
          )}

          {/* Cliente */}
          {activeTab === "customer" && (
            <CustomerForm
              customerData={customerData}
              onCustomerDataChange={setCustomerData}
              errors={errors}
              customers={customers}
              onSelectCustomer={(c) => {
                setCustomerData(prev => ({
                  ...prev,
                  name: c?.name ?? "",
                  phone: c?.phone ?? "",
                  street: c?.street ?? "",
                  number: "",
                  sector: c?.sector ?? "",
                  city: c?.city ?? "Puerto Montt",
                  references: c?.references ?? "",
                }));
                setActiveTab("customer");
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

          {/* Órdenes */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {ordersApi.orders.length === 0 ? (
                <div className="bg-white p-10 rounded-xl text-center text-gray-500 border border-gray-200">
                  No hay órdenes aún
                </div>
              ) : (
                ordersApi.orders.map((o) => (
                  <div key={o.id} className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-sm transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">#{o.publicCode} • {o.status.toUpperCase()}</p>
                        <p className="font-semibold text-gray-900">{o.name} — {o.phone}</p>
                        <p className="text-sm text-gray-600">{o.address}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          className="inline-flex items-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
                          onClick={() => { setSelectedOrder(o as unknown as OrderUI); setShowDetail(true); }}
                          title="Ver detalle"
                        >
                          <Eye size={16}/> Detalle
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
const KpiCard: React.FC<{ icon: React.ReactNode; title: string; value: React.ReactNode; sub?: string; color: "blue"|"green"|"purple"|"orange" }> = ({ icon, title, value, sub, color }) => {
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
const StatusCard: React.FC<{ title: string; value: number; barColor: "yellow"|"orange"|"green" }> = ({ title, value, barColor }) => {
  const bg  = { yellow: "bg-yellow-200", orange: "bg-orange-200", green: "bg-green-200" }[barColor];
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

export default CashierPanel;
