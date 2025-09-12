import React from 'react';
import { Plus, Minus, Trash2, ShoppingCart, Clock, ArrowRight } from 'lucide-react';

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

interface CartPanelProps {
  cart: CartItem[];
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemoveItem: (itemId: number) => void;
  onClearCart: () => void;
  total: number;
  estimatedTime: number;
  onContinue: () => void;
}

const formatCLP = (amount: number) => {
  return new Intl.NumberFormat('es-CL').format(amount);
};

export const CartPanel: React.FC<CartPanelProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  total,
  estimatedTime,
  onContinue,
}) => {
  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-12 text-center">
            <ShoppingCart size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              El carrito está vacío
            </h3>
            <p className="text-gray-500 mb-6">
              Agrega algunas promociones para comenzar
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Ver Promociones
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <ShoppingCart className="text-green-500" />
              Carrito de Compras
            </h2>
            <button
              onClick={onClearCart}
              className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 transition-colors"
              aria-label="Vaciar carrito"
            >
              <Trash2 size={16} />
              Vaciar carrito
            </button>
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="space-y-4">
        {cart.map((item) => (
          <CartItemCard
            key={item.id}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="space-y-4">
            {/* Totals */}
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold text-gray-800">
                Total del Pedido:
              </span>
              <span className="text-2xl font-bold text-red-600">
                ${formatCLP(total)}
              </span>
            </div>

            {/* Estimated Time */}
            <div className="flex items-center justify-center gap-2 text-gray-600 bg-gray-50 p-3 rounded-lg">
              <Clock size={18} className="text-orange-500" />
              <span className="font-medium">
                Tiempo estimado de preparación: {estimatedTime} minutos
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClearCart}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Vaciar Carrito
              </button>
              <button
                onClick={onContinue}
                className="flex-2 bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Continuar con Datos del Cliente
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemoveItem: (itemId: number) => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const handleIncrement = () => {
    onUpdateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    onUpdateQuantity(item.id, item.quantity - 1);
  };

  const handleRemove = () => {
    onRemoveItem(item.id);
  };

  const itemTotal = item.discountPrice * item.quantity;

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Item Info */}
          <div className="md:col-span-2 flex items-start gap-4">
            <span className="text-3xl" role="img" aria-label={item.name}>
              {item.image}
            </span>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-1">
                {item.name}
              </h4>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {item.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock size={12} className="text-orange-500" />
                <span>{item.cookingTime} min</span>
                {item.popular && (
                  <>
                    <span>•</span>
                    <span className="text-red-600 font-medium">Popular</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleDecrement}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              aria-label="Disminuir cantidad"
              disabled={item.quantity <= 1}
            >
              <Minus size={14} />
            </button>
            
            <span className="font-semibold text-lg w-8 text-center">
              {item.quantity}
            </span>
            
            <button
              onClick={handleIncrement}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              aria-label="Aumentar cantidad"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Price and Actions */}
          <div className="text-right">
            <div className="mb-2">
              <p className="text-sm text-gray-500">
                ${formatCLP(item.discountPrice)} c/u
              </p>
              <p className="font-bold text-lg text-red-600">
                ${formatCLP(itemTotal)}
              </p>
            </div>
            <button
              onClick={handleRemove}
              className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 ml-auto transition-colors"
              aria-label={`Eliminar ${item.name} del carrito`}
            >
              <Trash2 size={14} />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};