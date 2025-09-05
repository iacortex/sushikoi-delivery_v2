import React, { useState, useEffect } from 'react';
import type { CartItem, CustomerFormData, GeocodeResult, Coordinates, FormErrors } from '@/types';
import { useDebounced } from '@/hooks/useDebounced';
import { useGeocoding } from '@/features/geocoding/useGeocoding';
import { useOrders } from '@/features/orders/useOrders';
import { useCustomers } from '@/features/customers/useCustomers';
import { PROMOTIONS } from '@/features/orders/helpers';
import { TabNavigation } from '@/components/layout/TabNavigation';
import { PromotionsGrid } from './PromotionsGrid';
import { CustomerForm } from './CustomerForm';
import { CartPanel } from './CartPanel';
import { ShoppingCart, User, Utensils } from 'lucide-react';

type CashierTab = 'promotions' | 'customer' | 'cart';

export const CashierPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CashierTab>('promotions');
  const [cart, setCart] = useState<CartItem[]>([]);
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
  });
  const [selectedCoords, setSelectedCoords] = useState<Coordinates | null>(null);
  const [geocodedResult, setGeocodedResult] = useState<GeocodeResult | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Hooks
  const orders = useOrders();
  const customers = useCustomers();
  const { geocode, isLoading: isGeocoding } = useGeocoding();

  // Debounced geocoding
  const geocodingKey = `${customerData.street}|${customerData.number}|${customerData.sector}|${customerData.city}`;
  const debouncedGeocodingKey = useDebounced(geocodingKey, 700);

  // Perform geocoding when address changes
  useEffect(() => {
    const performGeocoding = async () => {
      const [street, number, sector, city] = debouncedGeocodingKey.split('|');
      
      if (!street || street.trim().length < 2) {
        setGeocodedResult(null);
        setSelectedCoords(null);
        return;
      }

      try {
        const result = await geocode({
          street: street.trim(),
          number: number?.trim(),
          sector: sector?.trim(),
          city: city?.trim(),
        });

        if (result) {
          setGeocodedResult(result);
          setSelectedCoords({ lat: result.lat, lng: result.lng });
        } else {
          setGeocodedResult(null);
          setSelectedCoords(null);
        }
      } catch (error) {
        console.warn('Geocoding failed:', error);
        setGeocodedResult(null);
        setSelectedCoords(null);
      }
    };

    performGeocoding();
  }, [debouncedGeocodingKey, geocode]);

  // Cart operations
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

    // Auto-navigate to cart if this is the first item
    if (cart.length === 0) {
      setTimeout(() => setActiveTab('cart'), 500);
    }
  };

  const removeFromCart = (itemId: number) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(cart.map(item =>
      item.id === itemId
        ? { ...item, quantity }
        : item
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.discountPrice * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getEstimatedCookingTime = () => {
    return cart.reduce((max, item) => Math.max(max, item.cookingTime), 0);
  };

  // Customer operations
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
    });

    if (customer.coordinates) {
      setSelectedCoords(customer.coordinates);
      setGeocodedResult({
        ...customer.coordinates,
        precision: 'exact',
        matchedNumber: true,
      });
    }

    setActiveTab('customer');
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Customer validation
    if (!customerData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (customerData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!customerData.phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
    } else if (!/^\+?56\s?9\s?[\d\s-]{7,9}$/.test(customerData.phone.trim())) {
      newErrors.phone = 'Formato inválido (ej: +56 9 1234 5678)';
    }

    if (!customerData.street.trim()) {
      newErrors.street = 'La calle es obligatoria';
    }

    if (!customerData.number.trim()) {
      newErrors.number = 'El número es obligatorio';
    }

    // Cart validation
    if (cart.length === 0) {
      newErrors.cart = 'Debe agregar al menos una promoción al carrito';
    }

    // Coordinates validation
    if (!selectedCoords) {
      newErrors.coordinates = 'Debe confirmar la ubicación en el mapa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create order
  const handleCreateOrder = async () => {
    if (!validateForm() || !selectedCoords) return;

    setIsCreatingOrder(true);
    try {
      const newOrder = await orders.createOrder({
        customerData,
        cart,
        coordinates: selectedCoords,
        geocodePrecision: geocodedResult?.precision || 'unknown',
      });

      // Update customer stats
      customers.updateCustomerStats(customerData.phone, getCartTotal());

      // Add/update customer record
      customers.addOrUpdateCustomer({
        name: customerData.name,
        phone: customerData.phone,
        street: customerData.street,
        number: customerData.number,
        sector: customerData.sector,
        city: customerData.city,
        references: customerData.references,
        coordinates: selectedCoords,
      });

      // Reset form
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
      });
      setSelectedCoords(null);
      setGeocodedResult(null);
      setErrors({});
      setActiveTab('promotions');

      // Show success message
      alert(`✅ Pedido creado exitosamente!\n\n` +
            `📋 Cliente: ${newOrder.name}\n` +
            `🔢 Código: ${newOrder.publicCode}\n` +
            `💰 Total: $${getCartTotal().toLocaleString('es-CL')}\n` +
            `⏱️ Tiempo estimado: ${getEstimatedCookingTime()} min`);

    } catch (error) {
      setErrors({ submit: 'Error al crear el pedido. Intente nuevamente.' });
      console.error('Order creation failed:', error);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Tab configuration
  const tabs = [
    {
      key: 'promotions' as const,
      label: 'Promociones',
      icon: Utensils,
    },
    {
      key: 'customer' as const,
      label: 'Cliente',
      icon: User,
    },
    {
      key: 'cart' as const,
      label: 'Carrito',
      icon: ShoppingCart,
      badge: cart.length > 0 ? getCartItemCount() : undefined,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as CashierTab)}
        tabs={tabs}
      />

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'promotions' && (
          <PromotionsGrid
            promotions={PROMOTIONS}
            onAddToCart={addToCart}
          />
        )}

        {activeTab === 'customer' && (
          <CustomerForm
            customerData={customerData}
            onCustomerDataChange={setCustomerData}
            selectedCoords={selectedCoords}
            onCoordsChange={setSelectedCoords}
            geocodedResult={geocodedResult}
            isGeocoding={isGeocoding}
            errors={errors}
            customers={customers}
            onSelectCustomer={selectCustomer}
            cart={cart}
            cartTotal={getCartTotal()}
            estimatedTime={getEstimatedCookingTime()}
            onCreateOrder={handleCreateOrder}
            isCreatingOrder={isCreatingOrder}
          />
        )}

        {activeTab === 'cart' && (
          <CartPanel
            cart={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            total={getCartTotal()}
            estimatedTime={getEstimatedCookingTime()}
            onContinue={() => setActiveTab('customer')}
          />
        )}
      </div>

      {/* Global errors */}
      {errors.submit && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <p className="font-medium">Error</p>
          <p className="text-sm">{errors.submit}</p>
        </div>
      )}
    </div>
  );
};