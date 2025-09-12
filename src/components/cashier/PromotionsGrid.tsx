import React from 'react';
import { Plus, Star, Clock } from 'lucide-react';

interface Promotion {
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
}

interface PromotionsGridProps {
  promotions: Promotion[];
  onAddToCart: (promotionId: number) => void;
}

const formatCLP = (amount: number) => {
  return new Intl.NumberFormat('es-CL').format(amount);
};

export const PromotionsGrid: React.FC<PromotionsGridProps> = ({
  promotions,
  onAddToCart,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          🍣 Promociones Disponibles
        </h3>
        <p className="text-gray-600">
          Selecciona las promociones para agregar al carrito
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((promotion) => (
          <PromotionCard
            key={promotion.id}
            promotion={promotion}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
};

interface PromotionCardProps {
  promotion: Promotion;
  onAddToCart: (promotionId: number) => void;
}

const PromotionCard: React.FC<PromotionCardProps> = ({
  promotion,
  onAddToCart,
}) => {
  const handleAddToCart = () => {
    onAddToCart(promotion.id);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
      {/* Popular Badge */}
      {promotion.popular && (
        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-center py-2 z-10">
          <span className="text-sm font-semibold flex items-center justify-center gap-1">
            <Star size={14} fill="white" />
            MÁS POPULAR
          </span>
        </div>
      )}

      <div className={`p-6 ${promotion.popular ? 'pt-4' : ''}`}>
        {/* Image/Emoji */}
        <div className="text-center mb-4">
          <span 
            className="text-5xl transform group-hover:scale-110 transition-transform duration-300 inline-block"
            role="img"
            aria-label={promotion.name}
          >
            {promotion.image}
          </span>
        </div>

        {/* Title and Description */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
            {promotion.name}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {promotion.description}
          </p>
        </div>

        {/* Items List */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2 text-sm">
            Incluye:
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {promotion.items.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                <span className="line-clamp-1">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="text-gray-400 line-through text-sm">
                ${formatCLP(promotion.originalPrice)}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-red-600">
                  ${formatCLP(promotion.discountPrice)}
                </span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-semibold">
                  -{promotion.discount}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cooking Time */}
        <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
          <Clock size={14} className="text-orange-500" />
          <span>Preparación: {promotion.cookingTime} min</span>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors group-hover:bg-red-600 transform transition-all duration-200 flex items-center justify-center gap-2"
          aria-label={`Agregar ${promotion.name} al carrito`}
        >
          <Plus size={16} />
          Agregar al Carrito
        </button>
      </div>
    </div>
  );
};