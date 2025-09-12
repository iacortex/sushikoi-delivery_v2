import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, User, Utensils, Package, DollarSign, 
  TrendingUp, BarChart3, Clock, Search, Bell, 
  CheckCircle, XCircle, MapPin, Phone, Plus, Minus,
  Trash2, Edit3, Eye, Calendar, Filter, Download,
  Star, Award, Zap, Timer, AlertCircle, RefreshCw
} from 'lucide-react';

/* ===================== Tipos ===================== */
interface CartItem {
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

interface CustomerFormData {
  name: string;
  phone: string;
  street: string;
  number: string;
  sector: string;
  city: string;
  references: string;
  paymentMethod: 'debito' | 'credito' | 'efectivo' | 'mp'; // ampliado
  paymentStatus: string;
  dueMethod: string; // lo mantenemos por compatibilidad (si lo usas para deuda)
  mpChannel?: 'delivery' | 'local'; // ➕ canal MP
}

interface Order {
  id: number;
  publicCode: string;
  name: string;
  phone: string;
  address: string;
  total: number;
  status: 'pending' | 'cooking' | 'ready' | 'delivered';
  cart: CartItem[];
  createdAt: number;
  estimatedTime: number;
  paymentMethod: 'efectivo' | 'debito' | 'credito' | 'mp'; // ➕
  mpChannel?: 'delivery' | 'local'; // ➕
}

interface FormErrors {
  [key: string]: string;
}

interface Notification {
  id: number;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  timestamp: number;
}

/* ===================== Datos Mock ===================== */
const PROMOTIONS = [
  {
    id: 1,
    name: "Promo Familiar",
    description: "40 piezas variadas + 2 bebidas + salsa extra",
    items: ["20 Makis Salmón", "10 Uramakis California", "10 Nigiris variados", "2 Bebidas 350ml", "Salsa Teriyaki"],
    originalPrice: 18900,
    discountPrice: 14900,
    discount: 21,
    image: "🍣",
    popular: true,
    cookingTime: 25
  },
  {
    id: 2,
    name: "Combo Personal",
    description: "15 piezas variadas + 1 bebida",
    items: ["8 Makis Salmón", "4 Uramakis", "3 Nigiris", "1 Bebida 350ml"],
    originalPrice: 9900,
    discountPrice: 7900,
    discount: 20,
    image: "🍱",
    popular: false,
    cookingTime: 15
  },
  {
    id: 3,
    name: "Mega Promo",
    description: "60 piezas + 4 bebidas + tempura",
    items: ["30 Makis variados", "15 Uramakis", "15 Nigiris", "4 Bebidas", "Tempura de camarón"],
    originalPrice: 29900,
    discountPrice: 24900,
    discount: 17,
    image: "🍤",
    popular: true,
    cookingTime: 35
  },
  {
    id: 4,
    name: "Vegetariano Deluxe",
    description: "Selección premium sin pescado",
    items: ["12 Makis Palta", "8 Uramakis Vegetales", "6 Nigiris Tamago", "1 Bebida", "Edamame"],
    originalPrice: 12900,
    discountPrice: 9900,
    discount: 23,
    image: "🥬",
    popular: false,
    cookingTime: 18
  },
  {
    id: 5,
    name: "Ejecutivo Express",
    description: "Perfecto para almuerzo rápido",
    items: ["10 Makis Salmón", "5 Nigiris", "Sopa Miso", "Té Verde"],
    originalPrice: 8900,
    discountPrice: 6900,
    discount: 22,
    image: "⚡",
    popular: true,
    cookingTime: 12
  },
  {
    id: 6,
    name: "Premium Royal",
    description: "La experiencia más exclusiva",
    items: ["15 Nigiris Premium", "20 Sashimis", "10 Uramakis Especiales", "2 Bebidas", "Wasabi Premium"],
    originalPrice: 39900,
    discountPrice: 32900,
    discount: 18,
    image: "👑",
    popular: false,
    cookingTime: 40
  }
];

/* ===================== Helpers ===================== */
const formatCLP = (amount: number) => new Intl.NumberFormat('es-CL').format(amount);

const generateOrderCode = () => Math.floor(10000 + Math.random() * 90000).toString();

const getTimeAgo = (timestamp: number) => {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
};

type CashierTab = 'dashboard' | 'promotions' | 'customer' | 'cart' | 'orders';

/* ===================== Cards hijas ===================== */
const PromotionCard = ({ promotion, onAddToCart }: { promotion: CartItem, onAddToCart: (id: number) => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    setIsAdding(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    onAddToCart(promotion.id);
    setIsAdding(false);
  };

  return (
    <div 
      className={`relative bg-white rounded-xl shadow-sm border-2 transition-all duration-300 overflow-hidden group ${
        isHovered ? 'border-red-200 shadow-lg scale-[1.02]' : 'border-gray-100'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {promotion.popular && (
        <div className="absolute top-3 left-3 z-10">
          <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
            <Star size={12} fill="currentColor" />
            Popular
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2 transform transition-transform duration-300 group-hover:scale-110">
            {promotion.image}
          </div>
          <h3 className="font-bold text-lg text-gray-900 mb-2">{promotion.name}</h3>
          <p className="text-gray-600 text-sm mb-3">{promotion.description}</p>
        </div>

        <div className="space-y-2 mb-4">
          {promotion.items.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Timer size={14} />
            <span>{promotion.cookingTime} min</span>
          </div>
          <div className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full">
            -{promotion.discount}%
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-400 line-through text-sm">${formatCLP(promotion.originalPrice)}</p>
            <p className="text-2xl font-bold text-green-600">${formatCLP(promotion.discountPrice)}</p>
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={isAdding}
          className={`w-full py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            isAdding 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 hover:bg-red-600 text-white hover:shadow-lg transform hover:scale-[1.02]'
          }`}
        >
          {isAdding ? (
            <>
              <CheckCircle size={18} />
              ¡Agregado!
            </>
          ) : (
            <>
              <Plus size={18} />
              Agregar al Carrito
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const CartItemRow = ({ item, onUpdateQuantity, onRemove }: { 
  item: CartItem, 
  onUpdateQuantity: (id: number, quantity: number) => void,
  onRemove: (id: number) => void 
}) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 group hover:shadow-md transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="text-3xl">{item.image}</div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{item.name}</h4>
          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="font-medium w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-green-100 flex items-center justify-center transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-600">${formatCLP(item.discountPrice * item.quantity)}</p>
              <button
                onClick={() => onRemove(item.id)}
                className="text-red-500 hover:text-red-700 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationToast = ({ notification, onDismiss }: { 
  notification: Notification, 
  onDismiss: (id: number) => void 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle className="text-green-500" size={20} />;
      case 'warning': return <AlertCircle className="text-yellow-500" size={20} />;
      case 'error': return <XCircle className="text-red-500" size={20} />;
      default: return <Bell className="text-blue-500" size={20} />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`${getBgColor()} border rounded-lg p-4 shadow-lg animate-slide-in-right`}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{notification.message}</p>
          <p className="text-xs text-gray-500">{getTimeAgo(notification.timestamp)}</p>
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="text-gray-400 hover:text-gray-600"
        >
          <XCircle size={16} />
        </button>
      </div>
    </div>
  );
};

/* ===================== Componente Principal ===================== */
export default function CashierPanel() {
  const [activeTab, setActiveTab] = useState<CashierTab>('dashboard');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [customerData, setCustomerData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    street: '',
    number: '',
    sector: '',
    city: 'Puerto Montt',
    references: '',
    paymentMethod: 'debito',
    paymentStatus: 'paid',
    dueMethod: 'efectivo',
    mpChannel: undefined,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Load initial mock data
  useEffect(() => {
    const mockOrders: Order[] = [
      {
        id: Date.now() - 1000000,
        publicCode: '12345',
        name: 'Juan Pérez',
        phone: '+56 9 1234 5678',
        address: 'Av. Capitán Ávalos 123',
        total: 14900,
        status: 'pending',
        cart: [{ ...PROMOTIONS[0], quantity: 1 }],
        createdAt: Date.now() - 600000,
        estimatedTime: 25,
        paymentMethod: 'efectivo', // ➕
      },
      {
        id: Date.now() - 800000,
        publicCode: '23456',
        name: 'María García',
        phone: '+56 9 2345 6789',
        address: 'Los Aromos 456',
        total: 7900,
        status: 'cooking',
        cart: [{ ...PROMOTIONS[1], quantity: 1 }],
        createdAt: Date.now() - 300000,
        estimatedTime: 15,
        paymentMethod: 'debito', // ➕
      },
      {
        id: Date.now() - 600000,
        publicCode: '34567',
        name: 'Carlos López',
        phone: '+56 9 3456 7890',
        address: 'Mirasol 789',
        total: 24900,
        status: 'ready',
        cart: [{ ...PROMOTIONS[2], quantity: 1 }],
        createdAt: Date.now() - 100000,
        estimatedTime: 35,
        paymentMethod: 'mp',     // ➕
        mpChannel: 'delivery',   // ➕
      }
    ];
    setOrders(mockOrders);

    setCustomers([
      { name: 'Juan Pérez', phone: '+56 9 1234 5678', street: 'Av. Capitán Ávalos', number: '123', totalOrders: 5, totalSpent: 89500 },
      { name: 'María García', phone: '+56 9 2345 6789', street: 'Los Aromos', number: '456', totalOrders: 3, totalSpent: 45200 }
    ]);
  }, []);

  // Notificaciones
  const addNotification = (type: Notification['type'], message: string) => {
    const notification: Notification = {
      id: Date.now(),
      type,
      message,
      timestamp: Date.now()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Carrito
  const addToCart = (promotionId: number) => {
    const promotion = PROMOTIONS.find(p => p.id === promotionId);
    if (!promotion) return;

    const existingItem = cart.find(item => item.id === promotionId);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === promotionId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...promotion, quantity: 1 }]);
    }

    addNotification('success', `${promotion.name} agregado al carrito`);

    if (cart.length === 0) {
      setTimeout(() => setActiveTab('cart'), 500);
    }
  };

  const removeFromCart = (itemId: number) => {
    const item = cart.find(item => item.id === itemId);
    setCart(cart.filter(item => item.id !== itemId));
    if (item) {
      addNotification('info', `${item.name} eliminado del carrito`);
    }
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(cart.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setCart([]);
    addNotification('info', 'Carrito vaciado');
  };

  const getCartTotal = () => cart.reduce((total, item) => total + (item.discountPrice * item.quantity), 0);
  const getCartItemCount = () => cart.reduce((total, item) => total + item.quantity, 0);
  const getEstimatedCookingTime = () => cart.reduce((max, item) => Math.max(max, item.cookingTime), 0);

  // Cliente
  const selectCustomer = (customer: any) => {
    setCustomerData({
      name: customer.name || '',
      phone: customer.phone || '',
      street: customer.street || '',
      number: customer.number || '',
      sector: customer.sector || '',
      city: customer.city || 'Puerto Montt',
      references: customer.references || '',
      paymentMethod: 'debito',
      paymentStatus: 'paid',
      dueMethod: 'efectivo',
      mpChannel: undefined,
    });
    setActiveTab('customer');
    addNotification('info', `Cliente ${customer.name} seleccionado`);
  };

  // Validación
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!customerData.name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!customerData.phone.trim()) newErrors.phone = 'El teléfono es obligatorio';
    if (!customerData.street.trim()) newErrors.street = 'La calle es obligatoria';
    if (!customerData.number.trim()) newErrors.number = 'El número es obligatorio';
    if (cart.length === 0) newErrors.cart = 'Debe agregar al menos una promoción al carrito';

    // Si el método es MP, pedir canal
    if (customerData.paymentMethod === 'mp' && !customerData.mpChannel) {
      newErrors.paymentMethod = 'Selecciona el canal de Mercado Pago (Delivery o Local)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Crear orden
  const handleCreateOrder = async () => {
    if (!validateForm()) {
      addNotification('error', 'Complete todos los campos requeridos');
      return;
    }

    setIsCreatingOrder(true);
    try {
      const newOrder: Order = {
        id: Date.now(),
        publicCode: generateOrderCode(),
        name: customerData.name,
        phone: customerData.phone,
        address: `${customerData.street} ${customerData.number}${customerData.sector ? `, ${customerData.sector}` : ''}`,
        total: getCartTotal(),
        status: 'pending',
        cart: [...cart],
        createdAt: Date.now(),
        estimatedTime: getEstimatedCookingTime(),
        paymentMethod: customerData.paymentMethod,
        mpChannel: customerData.paymentMethod === 'mp' ? customerData.mpChannel : undefined,
      };

      setOrders(prev => [newOrder, ...prev]);

      // Reset
      setCart([]);
      setCustomerData({
        name: '',
        phone: '',
        street: '',
        number: '',
        sector: '',
        city: 'Puerto Montt',
        references: '',
        paymentMethod: 'debito',
        paymentStatus: 'paid',
        dueMethod: 'efectivo',
        mpChannel: undefined,
      });
      setErrors({});
      setActiveTab('dashboard');

      addNotification('success', `Pedido #${newOrder.publicCode} creado exitosamente`);
    } catch (error) {
      addNotification('error', 'Error al crear el pedido. Intente nuevamente.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  /* ===================== Stats ===================== */
  const todayOrders = orders.length;
  const todayRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const avgOrderValue = todayOrders > 0 ? Math.round(todayRevenue / todayOrders) : 0;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const cookingOrders = orders.filter(o => o.status === 'cooking').length;
  const readyOrders = orders.filter(o => o.status === 'ready').length;

  // ➕ Ventas por método
  const totalsByMethod = orders.reduce(
    (acc, o) => {
      if (o.paymentMethod === 'efectivo') acc.efectivo += o.total;
      if (o.paymentMethod === 'debito')   acc.debito   += o.total;
      if (o.paymentMethod === 'credito')  acc.credito  += o.total;
      if (o.paymentMethod === 'mp') {
        if (o.mpChannel === 'delivery') acc.mpDelivery += o.total;
        if (o.mpChannel === 'local')    acc.mpLocal    += o.total;
      }
      acc.total += o.total;
      return acc;
    },
    { efectivo: 0, debito: 0, credito: 0, mpDelivery: 0, mpLocal: 0, total: 0 }
  );

  // Filtro promociones
  const filteredPromotions = PROMOTIONS.filter(promo =>
    promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promo.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tabs
  const tabs = [
    { key: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
    { key: 'promotions' as const, label: 'Promociones', icon: Utensils },
    { key: 'customer' as const, label: 'Cliente', icon: User },
    { 
      key: 'cart' as const, 
      label: 'Carrito', 
      icon: ShoppingCart, 
      badge: cart.length > 0 ? getCartItemCount() : undefined 
    },
    { key: 'orders' as const, label: 'Órdenes', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map(notification => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onDismiss={removeNotification}
          />
        ))}
      </div>

      <div className="p-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                🍣
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Panel de Cajero/Vendedor
                  <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">En línea</span>
                </h1>
                <p className="text-gray-600">Sistema de gestión con roles, geocodificación exacta y pagos</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Rol: Cajero</p>
              <p className="text-sm text-gray-500">📍 Sushikoi — Av. Capitán Ávalos 6130, Puerto Montt</p>
              <p className="text-xs text-gray-400">🕒 {currentTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6 border border-gray-200">
          <div className="flex border-b border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all duration-300 relative ${
                  activeTab === tab.key
                    ? 'border-red-500 text-red-600 bg-red-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
                {tab.badge && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Órdenes Hoy</p>
                      <p className="text-3xl font-bold text-gray-900">{todayOrders}</p>
                      <p className="text-sm text-green-600">↗ +12% vs ayer</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Package className="text-blue-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Ingresos Hoy</p>
                      <p className="text-3xl font-bold text-green-600">${formatCLP(todayRevenue)}</p>
                      <p className="text-sm text-green-600">↗ +8% vs ayer</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="text-green-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Valor Promedio</p>
                      <p className="text-3xl font-bold text-purple-600">${formatCLP(avgOrderValue)}</p>
                      <p className="text-sm text-purple-600">↗ +5% vs ayer</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="text-purple-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">En Cocina</p>
                      <p className="text-3xl font-bold text-orange-600">{cookingOrders}</p>
                      <p className="text-sm text-orange-600">🔥 Activos</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Clock className="text-orange-600" size={24} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== Ventas por método (NUEVO) ===== */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Efectivo</p>
                      <p className="text-2xl font-bold text-gray-900">${formatCLP(totalsByMethod.efectivo)}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="text-emerald-600" size={22} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Débito</p>
                      <p className="text-2xl font-bold text-gray-900">${formatCLP(totalsByMethod.debito)}</p>
                    </div>
                    <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
                      <span className="text-sky-600 text-xl">💳</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Crédito</p>
                      <p className="text-2xl font-bold text-gray-900">${formatCLP(totalsByMethod.credito)}</p>
                    </div>
                    <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                      <span className="text-violet-600 text-xl">💰</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">MP Delivery</p>
                      <p className="text-2xl font-bold text-gray-900">${formatCLP(totalsByMethod.mpDelivery)}</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <span className="text-indigo-600 text-xl">📦</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">MP Local</p>
                      <p className="text-2xl font-bold text-gray-900">${formatCLP(totalsByMethod.mpLocal)}</p>
                    </div>
                    <div className="w-12 h-12 bg-fuchsia-100 rounded-xl flex items-center justify-center">
                      <span className="text-fuchsia-600 text-xl">🏬</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* ===== /Ventas por método ===== */}

              {/* Quick Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-yellow-800">📋 Pendientes</h4>
                    <div className="w-8 h-8 bg-yellow-200 rounded-lg flex items-center justify-center">
                      <Clock size={16} className="text-yellow-700" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-yellow-700 mb-2">{pendingOrders}</p>
                  <p className="text-sm text-yellow-600">órdenes esperando</p>
                  <div className="w-full bg-yellow-200 rounded-full h-2 mt-3">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{width: `${Math.min(pendingOrders * 20, 100)}%`}}></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-orange-800">👨‍🍳 En Cocina</h4>
                    <div className="w-8 h-8 bg-orange-200 rounded-lg flex items-center justify-center">
                      <Utensils size={16} className="text-orange-700" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-orange-700 mb-2">{cookingOrders}</p>
                  <p className="text-sm text-orange-600">preparándose</p>
                  <div className="w-full bg-orange-200 rounded-full h-2 mt-3">
                    <div className="bg-orange-500 h-2 rounded-full animate-pulse" style={{width: `${Math.min(cookingOrders * 25, 100)}%`}}></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-green-800">✅ Listos</h4>
                    <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center">
                      <CheckCircle size={16} className="text-green-700" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-green-700 mb-2">{readyOrders}</p>
                  <p className="text-sm text-green-600">para entrega</p>
                  <div className="w-full bg-green-200 rounded-full h-2 mt-3">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: `${Math.min(readyOrders * 30, 100)}%`}}></div>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Órdenes Recientes</h3>
                    <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                      <RefreshCw size={16} />
                      Actualizar
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {orders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 group">
                        <div className="flex items-center gap-4">
                          <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                            order.status === 'pending' ? 'bg-yellow-500 animate-pulse' :
                            order.status === 'cooking' ? 'bg-orange-500 animate-pulse' :
                            order.status === 'ready' ? 'bg-green-500' :
                            'bg-blue-500'
                          }`}></div>
                          <div>
                            <p className="font-medium text-gray-900">{order.name} (#{order.publicCode})</p>
                            <p className="text-sm text-gray-600">{order.cart.length} items - {new Date(order.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">${formatCLP(order.total)}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm capitalize text-gray-600">
                              {order.status === 'pending' ? 'Pendiente' :
                               order.status === 'cooking' ? 'En cocina' :
                               order.status === 'ready' ? 'Listo' : 'Entregado'}
                            </p>
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye size={16} className="text-gray-400 hover:text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'promotions' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Buscar promociones..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    <Filter size={18} />
                    Filtros
                  </button>
                </div>
              </div>

              {/* Promotions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPromotions.map(promotion => (
                  <PromotionCard
                    key={promotion.id}
                    promotion={promotion}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>

              {filteredPromotions.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron promociones</h3>
                  <p className="text-gray-600">Intenta con otros términos de búsqueda</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'customer' && (
            <div className="space-y-6">
              {/* Customer Search */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Buscar Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customers.map((customer, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-red-200 hover:bg-red-50 transition-all duration-300 cursor-pointer group"
                         onClick={() => selectCustomer(customer)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-sm text-gray-600">{customer.phone}</p>
                          <p className="text-xs text-gray-500">{customer.street} {customer.number}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">{customer.totalOrders} órdenes</p>
                          <p className="text-xs text-gray-500">${formatCLP(customer.totalSpent)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Form */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Datos del Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo *</label>
                    <input
                      type="text"
                      value={customerData.name}
                      onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                        errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
                      }`}
                      placeholder="Ingrese el nombre completo"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                    <input
                      type="tel"
                      value={customerData.phone}
                      onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                        errors.phone ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
                      }`}
                      placeholder="+56 9 1234 5678"
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Calle *</label>
                    <input
                      type="text"
                      value={customerData.street}
                      onChange={(e) => setCustomerData({...customerData, street: e.target.value})}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                        errors.street ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
                      }`}
                      placeholder="Nombre de la calle"
                    />
                    {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número *</label>
                    <input
                      type="text"
                      value={customerData.number}
                      onChange={(e) => setCustomerData({...customerData, number: e.target.value})}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                        errors.number ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
                      }`}
                      placeholder="123"
                    />
                    {errors.number && <p className="text-red-500 text-sm mt-1">{errors.number}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
                    <input
                      type="text"
                      value={customerData.sector}
                      onChange={(e) => setCustomerData({...customerData, sector: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"
                      placeholder="Barrio o sector"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
                    <select
                      value={customerData.city}
                      onChange={(e) => setCustomerData({...customerData, city: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"
                    >
                      <option value="Puerto Montt">Puerto Montt</option>
                      <option value="Puerto Varas">Puerto Varas</option>
                      <option value="Osorno">Osorno</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Referencias</label>
                  <textarea
                    value={customerData.references}
                    onChange={(e) => setCustomerData({...customerData, references: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"
                    rows={3}
                    placeholder="Referencias para encontrar la dirección..."
                  />
                </div>

                {/* Payment Options */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Método de Pago</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {(['debito', 'credito', 'efectivo', 'mp'] as const).map(method => (
                      <button
                        key={method}
                        onClick={() => setCustomerData({...customerData, paymentMethod: method, mpChannel: undefined})}
                        className={`p-4 border-2 rounded-lg transition-all duration-300 ${
                          customerData.paymentMethod === method
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2">
                            {method === 'debito' ? '💳' : method === 'credito' ? '💰' : method === 'efectivo' ? '💵' : 'Ⓜ️'}
                          </div>
                          <p className="font-medium capitalize">
                            {method === 'mp' ? 'Mercado Pago' : method}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Si es MP, pide canal */}
                  {customerData.paymentMethod === 'mp' && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-700 mb-2">Canal de Mercado Pago *</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setCustomerData({...customerData, mpChannel: 'delivery'})}
                          className={`px-4 py-2 rounded-lg border-2 transition ${
                            customerData.mpChannel === 'delivery' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          Delivery
                        </button>
                        <button
                          onClick={() => setCustomerData({...customerData, mpChannel: 'local'})}
                          className={`px-4 py-2 rounded-lg border-2 transition ${
                            customerData.mpChannel === 'local' ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          Local
                        </button>
                      </div>
                      {errors.paymentMethod && <p className="text-red-500 text-sm mt-2">{errors.paymentMethod}</p>}
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                {cart.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Resumen del Pedido</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-600">Items en carrito:</span>
                        <span className="font-medium">{getCartItemCount()}</span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-600">Tiempo estimado:</span>
                        <span className="font-medium">{getEstimatedCookingTime()} min</span>
                      </div>
                      <div className="flex items-center justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-green-600">${formatCLP(getCartTotal())}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-8 flex gap-4">
                  <button
                    onClick={() => setActiveTab('cart')}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300"
                  >
                    Ver Carrito
                  </button>
                  <button
                    onClick={handleCreateOrder}
                    disabled={isCreatingOrder || cart.length === 0}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                      isCreatingOrder || cart.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-500 hover:bg-red-600 text-white hover:shadow-lg transform hover:scale-[1.02]'
                    }`}
                  >
                    {isCreatingOrder ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Crear Pedido
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cart' && (
            <div className="space-y-6">
              {cart.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <div className="text-6xl mb-4">🛒</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Carrito Vacío</h3>
                  <p className="text-gray-600 mb-6">Agrega algunas promociones deliciosas</p>
                  <button
                    onClick={() => setActiveTab('promotions')}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
                  >
                    Ver Promociones
                  </button>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Carrito ({getCartItemCount()} items)
                        </h3>
                        <button
                          onClick={clearCart}
                          className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          Vaciar
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {cart.map(item => (
                          <CartItemRow
                            key={item.id}
                            item={item}
                            onUpdateQuantity={updateQuantity}
                            onRemove={removeFromCart}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Cart Summary */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">${formatCLP(getCartTotal())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tiempo estimado:</span>
                        <span className="font-medium">{getEstimatedCookingTime()} minutos</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-green-600">${formatCLP(getCartTotal())}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-4">
                      <button
                        onClick={() => setActiveTab('promotions')}
                        className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300"
                      >
                        Seguir Comprando
                      </button>
                      <button
                        onClick={() => setActiveTab('customer')}
                        className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Orders Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Gestión de Órdenes</h3>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                      <Download size={16} />
                      Exportar
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                      <Plus size={16} />
                      Nueva Orden
                    </button>
                  </div>
                </div>
              </div>

              {/* Orders List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${
                              order.status === 'pending' ? 'bg-yellow-500 animate-pulse' :
                              order.status === 'cooking' ? 'bg-orange-500 animate-pulse' :
                              order.status === 'ready' ? 'bg-green-500' :
                              'bg-blue-500'
                            }`}></div>
                            <div>
                              <p className="font-semibold text-gray-900">#{order.publicCode}</p>
                              <p className="text-sm text-gray-600">{order.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">${formatCLP(order.total)}</p>
                            <p className="text-sm text-gray-600 capitalize">
                              {order.status === 'pending' ? 'Pendiente' :
                               order.status === 'cooking' ? 'En cocina' :
                               order.status === 'ready' ? 'Listo' : 'Entregado'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Phone size={14} />
                                {order.phone}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin size={14} />
                                {order.address}
                              </span>
                            </div>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {getTimeAgo(order.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
      `}</style>
    </div>
  );
}
