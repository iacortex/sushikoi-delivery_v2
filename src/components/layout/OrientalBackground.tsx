import { useMemo, useEffect, useState } from "react";

/**
 * Fondo temático de SUSHI con elementos flotantes
 * - Elementos de sushi realistas flotando
 * - Ingredientes japoneses 
 * - Palillos, wasabi, jengibre
 * - Ambiente de restaurante japonés
 * - Respeta prefers-reduced-motion
 */

type SushiType = "nigiri-salmon" | "nigiri-tuna" | "maki-roll" | "california-roll" | "sashimi" | "temaki" | "onigiri";
type IngredientType = "chopsticks" | "wasabi" | "ginger" | "soy-sauce" | "avocado" | "cucumber" | "nori";
type Dir = "right" | "left" | "up" | "down";

type SushiItem = {
  type: SushiType;
  topPct: number;
  leftPct: number;
  scale: number;
  rotation: number;
  delay: number;
  duration: number;
  direction: Dir;
};

type IngredientItem = {
  type: IngredientType;
  topPct: number;
  leftPct: number;
  scale: number;
  rotation: number;
  delay: number;
  floatDir: Dir;
};

type Props = {
  density?: number;
  showIngredients?: boolean;
  showBubbles?: boolean;
  showPattern?: boolean;
};

const SvgDefs = () => (
  <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
    <defs>
      {/* Gradientes para sushi */}
      <linearGradient id="salmonGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ff8a80" />
        <stop offset="50%" stopColor="#ff5722" />
        <stop offset="100%" stopColor="#d32f2f" />
      </linearGradient>
      
      <linearGradient id="tunaGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e57373" />
        <stop offset="50%" stopColor="#c62828" />
        <stop offset="100%" stopColor="#b71c1c" />
      </linearGradient>
      
      <linearGradient id="riceGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#f5f5f5" />
        <stop offset="100%" stopColor="#eeeeee" />
      </linearGradient>

      <radialGradient id="sushiGloss" cx="30%" cy="25%" r="60%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity=".5" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>

      {/* === ELEMENTOS DE SUSHI === */}
      
      {/* Nigiri de Salmón */}
      <symbol id="sushi-nigiri-salmon" viewBox="0 0 40 25">
        {/* Base de arroz */}
        <ellipse cx="20" cy="20" rx="16" ry="5" fill="url(#riceGradient)"/>
        <rect x="18" y="19" width="4" height="2" fill="#e0e0e0"/>
        
        {/* Salmón encima */}
        <ellipse cx="20" cy="12" rx="15" ry="6" fill="url(#salmonGradient)"/>
        <ellipse cx="20" cy="12" rx="12" ry="4" fill="url(#sushiGloss)"/>
        
        {/* Nori (alga) */}
        <rect x="12" y="15" width="16" height="2" fill="#2e4057" rx="1"/>
      </symbol>

      {/* Nigiri de Atún */}
      <symbol id="sushi-nigiri-tuna" viewBox="0 0 40 25">
        <ellipse cx="20" cy="20" rx="16" ry="5" fill="url(#riceGradient)"/>
        <ellipse cx="20" cy="12" rx="15" ry="6" fill="url(#tunaGradient)"/>
        <ellipse cx="20" cy="12" rx="12" ry="4" fill="url(#sushiGloss)"/>
        <rect x="12" y="15" width="16" height="2" fill="#2e4057" rx="1"/>
      </symbol>

      {/* Maki Roll */}
      <symbol id="sushi-maki-roll" viewBox="0 0 30 30">
        {/* Nori exterior */}
        <circle cx="15" cy="15" r="14" fill="#2e4057"/>
        
        {/* Arroz */}
        <circle cx="15" cy="15" r="11" fill="url(#riceGradient)"/>
        
        {/* Relleno central */}
        <circle cx="15" cy="15" r="6" fill="#ff5722"/>
        <circle cx="15" cy="15" r="3" fill="#4caf50"/>
        
        {/* Brillos */}
        <ellipse cx="15" cy="15" rx="9" ry="9" fill="url(#sushiGloss)"/>
      </symbol>

      {/* California Roll */}
      <symbol id="sushi-california-roll" viewBox="0 0 30 30">
        <circle cx="15" cy="15" r="14" fill="#f5f5f5"/>
        <circle cx="15" cy="15" r="11" fill="#ff8a65"/>
        <circle cx="15" cy="15" r="7" fill="#4caf50"/>
        <circle cx="15" cy="15" r="3" fill="#2e4057"/>
        <ellipse cx="15" cy="15" rx="9" ry="9" fill="url(#sushiGloss)"/>
        
        {/* Semillas de sésamo */}
        <circle cx="10" cy="8" r="1" fill="#fff8e1"/>
        <circle cx="20" cy="10" r="1" fill="#fff8e1"/>
        <circle cx="12" cy="22" r="1" fill="#fff8e1"/>
        <circle cx="22" cy="20" r="1" fill="#fff8e1"/>
      </symbol>

      {/* Sashimi */}
      <symbol id="sushi-sashimi" viewBox="0 0 35 20">
        <ellipse cx="17.5" cy="10" rx="16" ry="8" fill="url(#salmonGradient)"/>
        <ellipse cx="17.5" cy="8" rx="14" ry="5" fill="url(#sushiGloss)"/>
        
        {/* Líneas de textura */}
        <path d="M5 10 L30 10" stroke="#d32f2f" strokeWidth="0.5" opacity=".6"/>
        <path d="M8 6 L28 6" stroke="#d32f2f" strokeWidth="0.5" opacity=".4"/>
        <path d="M8 14 L28 14" stroke="#d32f2f" strokeWidth="0.5" opacity=".4"/>
      </symbol>

      {/* Temaki (cono) */}
      <symbol id="sushi-temaki" viewBox="0 0 25 35">
        <path d="M12.5 5 L5 30 L20 30 Z" fill="#2e4057"/>
        <path d="M12.5 8 L8 28 L17 28 Z" fill="url(#riceGradient)"/>
        <ellipse cx="12.5" cy="15" rx="3" ry="8" fill="#ff5722"/>
        <ellipse cx="12.5" cy="18" rx="2" ry="5" fill="#4caf50"/>
      </symbol>

      {/* Onigiri */}
      <symbol id="sushi-onigiri" viewBox="0 0 30 35">
        <path d="M15 5 L25 30 L5 30 Z" fill="url(#riceGradient)"/>
        <rect x="10" y="18" width="10" height="4" fill="#2e4057"/>
        <ellipse cx="15" cy="20" rx="10" ry="8" fill="url(#sushiGloss)"/>
      </symbol>

      {/* === INGREDIENTES === */}
      
      {/* Palillos */}
      <symbol id="ingredient-chopsticks" viewBox="0 0 60 8">
        <rect x="0" y="1" width="58" height="2" fill="#deb887" rx="1"/>
        <rect x="0" y="5" width="58" height="2" fill="#deb887" rx="1"/>
        <rect x="54" y="0" width="6" height="1" fill="#cd853f"/>
        <rect x="54" y="7" width="6" height="1" fill="#cd853f"/>
      </symbol>

      {/* Wasabi */}
      <symbol id="ingredient-wasabi" viewBox="0 0 20 15">
        <ellipse cx="10" cy="12" rx="8" ry="3" fill="#8bc34a"/>
        <path d="M10 5 C6 8, 6 12, 10 12 C14 12, 14 8, 10 5 Z" fill="#689f38"/>
        <ellipse cx="10" cy="8" rx="4" ry="3" fill="url(#sushiGloss)"/>
      </symbol>

      {/* Jengibre */}
      <symbol id="ingredient-ginger" viewBox="0 0 25 15">
        <ellipse cx="12.5" cy="10" rx="10" ry="4" fill="#ffcdd2"/>
        <path d="M5 8 C8 6, 12 6, 15 8 C18 6, 22 6, 25 8" 
              stroke="#f8bbd9" strokeWidth="2" fill="none"/>
        <ellipse cx="12.5" cy="8" rx="8" ry="3" fill="url(#sushiGloss)"/>
      </symbol>

      {/* Salsa de soja */}
      <symbol id="ingredient-soy-sauce" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="9" fill="#8d6e63"/>
        <circle cx="10" cy="10" r="7" fill="#3e2723"/>
        <ellipse cx="10" cy="8" rx="5" ry="3" fill="url(#sushiGloss)"/>
      </symbol>

      {/* Aguacate */}
      <symbol id="ingredient-avocado" viewBox="0 0 15 20">
        <ellipse cx="7.5" cy="15" rx="6" ry="4" fill="#689f38"/>
        <ellipse cx="7.5" cy="10" rx="7" ry="8" fill="#8bc34a"/>
        <circle cx="7.5" cy="10" r="3" fill="#ffeb3b"/>
        <ellipse cx="7.5" cy="8" rx="5" ry="6" fill="url(#sushiGloss)"/>
      </symbol>

      {/* Pepino */}
      <symbol id="ingredient-cucumber" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="9" fill="#4caf50"/>
        <circle cx="10" cy="10" r="6" fill="#c8e6c9"/>
        <circle cx="10" cy="10" r="3" fill="#e8f5e8"/>
        <ellipse cx="10" cy="8" rx="6" ry="4" fill="url(#sushiGloss)"/>
      </symbol>

      {/* Nori (alga) */}
      <symbol id="ingredient-nori" viewBox="0 0 25 25">
        <rect x="2" y="2" width="21" height="21" fill="#2e4057" rx="2"/>
        <rect x="4" y="4" width="17" height="17" fill="#37474f" rx="1"/>
        <ellipse cx="12.5" cy="12.5" rx="8" ry="8" fill="url(#sushiGloss)"/>
      </symbol>
    </defs>
  </svg>
);

function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t ^= t << 13; t ^= t >> 17; t ^= t << 5;
    return (t >>> 0) / 4294967295;
  };
}

export default function SushiBackground({ 
  density = 20, 
  showIngredients = true, 
  showPattern = true 
}: Props) {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(mql.matches);
    apply();
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", apply);
      return () => mql.removeEventListener("change", apply);
    }
    (mql as any).addListener?.(apply);
    return () => (mql as any).removeListener?.(apply);
  }, []);

  const sushiItems = useMemo<SushiItem[]>(() => {
    const r = rng(2025);
    const arr: SushiItem[] = [];
    for (let i = 0; i < density; i++) {
      const rv = r();
      const type: SushiType = 
        rv < 0.2 ? "nigiri-salmon" : 
        rv < 0.35 ? "nigiri-tuna" :
        rv < 0.5 ? "maki-roll" :
        rv < 0.65 ? "california-roll" :
        rv < 0.75 ? "sashimi" :
        rv < 0.85 ? "temaki" : "onigiri";
      
      const direction: Dir = 
        rv < 0.3 ? "right" : 
        rv < 0.6 ? "left" :
        rv < 0.8 ? "up" : "down";
      
      arr.push({
        type,
        topPct: 5 + r() * 90,
        leftPct: 5 + r() * 90,
        scale: 0.4 + r() * 0.6,
        rotation: r() * 360,
        delay: r() * 12,
        duration: 8 + r() * 15,
        direction,
      });
    }
    return arr;
  }, [density]);

  const ingredientItems = useMemo<IngredientItem[]>(() => {
    if (!showIngredients) return [];
    const r = rng(1234);
    const arr: IngredientItem[] = [];
    for (let i = 0; i < 15; i++) {
      const rv = r();
      const type: IngredientType = 
        rv < 0.2 ? "chopsticks" : 
        rv < 0.35 ? "wasabi" :
        rv < 0.5 ? "ginger" :
        rv < 0.65 ? "soy-sauce" :
        rv < 0.75 ? "avocado" :
        rv < 0.85 ? "cucumber" : "nori";
      
      const floatDir: Dir = 
        rv < 0.25 ? "right" : 
        rv < 0.5 ? "left" :
        rv < 0.75 ? "up" : "down";
      
      arr.push({
        type,
        topPct: 5 + r() * 90,
        leftPct: 5 + r() * 90,
        scale: 0.3 + r() * 0.5,
        rotation: r() * 360,
        delay: r() * 10,
        floatDir,
      });
    }
    return arr;
  }, [showIngredients]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Fondo degradado estilo restaurante japonés */}
      <div className="absolute inset-0 -z-30 bg-gradient-to-br from-slate-900 via-gray-800 to-stone-900" />
      
      {/* Textura de madera sutil */}
      <div 
        className="absolute inset-0 -z-25 opacity-10"
        style={{
          background: `
            repeating-linear-gradient(
              90deg,
              rgba(139, 69, 19, 0.1) 0px,
              rgba(160, 82, 45, 0.1) 2px,
              rgba(139, 69, 19, 0.1) 4px
            )
          `
        }}
      />

      {/* Patrón japonés sutil */}
      {showPattern && (
        <div
          className="absolute inset-0 -z-20"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20px 15px, rgba(220, 20, 60, .08) 12px, transparent 13px),
              radial-gradient(circle at 0 0, rgba(26, 26, 26, .05) 12px, transparent 13px)
            `,
            backgroundSize: "40px 30px",
            backgroundPosition: "0 0, 20px 15px",
            opacity: 0.6,
          }}
        />
      )}

      <SvgDefs />

      {/* Elementos de sushi flotantes */}
      {sushiItems.map((sushi, i) => {
        const animationName = 
          sushi.direction === "right" ? "float-right" :
          sushi.direction === "left" ? "float-left" :
          sushi.direction === "up" ? "float-up" : "float-down";

        return (
          <div
            key={`sushi-${i}`}
            className="absolute"
            style={{
              top: `${sushi.topPct}%`,
              left: `${sushi.leftPct}%`,
              width: `${50 * sushi.scale}px`,
              height: `${50 * sushi.scale}px`,
              transform: `rotate(${sushi.rotation}deg)`,
              animation: !reduce ? `${animationName} ${sushi.duration}s ease-in-out infinite` : undefined,
              animationDelay: `${sushi.delay}s`,
              opacity: 0.7,
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,.4))",
            }}
          >
            <svg viewBox="0 0 40 35" className="w-full h-full">
              <use href={`#sushi-${sushi.type}`} />
            </svg>
          </div>
        );
      })}

      {/* Ingredientes flotantes */}
      {ingredientItems.map((ingredient, i) => {
        const animationName = 
          ingredient.floatDir === "right" ? "drift-right" :
          ingredient.floatDir === "left" ? "drift-left" :
          ingredient.floatDir === "up" ? "drift-up" : "drift-down";

        return (
          <div
            key={`ingredient-${i}`}
            className="absolute"
            style={{
              top: `${ingredient.topPct}%`,
              left: `${ingredient.leftPct}%`,
              width: `${40 * ingredient.scale}px`,
              height: `${40 * ingredient.scale}px`,
              transform: `rotate(${ingredient.rotation}deg)`,
              animation: !reduce ? `${animationName} ${8 + ingredient.delay}s ease-in-out infinite` : undefined,
              animationDelay: `${ingredient.delay}s`,
              opacity: 0.4,
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,.3))",
            }}
          >
            <svg viewBox="0 0 60 35" className="w-full h-full">
              <use href={`#ingredient-${ingredient.type}`} />
            </svg>
          </div>
        );
      })}

      {/* Animaciones CSS para movimiento suave */}
      <style>{`
        @keyframes float-right {
          0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
          25% { transform: translateX(15px) translateY(-8px) rotate(2deg); }
          50% { transform: translateX(8px) translateY(-15px) rotate(0deg); }
          75% { transform: translateX(-5px) translateY(-5px) rotate(-1deg); }
        }
        
        @keyframes float-left {
          0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
          25% { transform: translateX(-15px) translateY(-8px) rotate(-2deg); }
          50% { transform: translateX(-8px) translateY(-15px) rotate(0deg); }
          75% { transform: translateX(5px) translateY(-5px) rotate(1deg); }
        }
        
        @keyframes float-up {
          0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
          25% { transform: translateX(-8px) translateY(-15px) rotate(1deg); }
          50% { transform: translateX(8px) translateY(-25px) rotate(0deg); }
          75% { transform: translateX(-3px) translateY(-10px) rotate(-1deg); }
        }
        
        @keyframes float-down {
          0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
          25% { transform: translateX(8px) translateY(10px) rotate(-1deg); }
          50% { transform: translateX(-8px) translateY(20px) rotate(0deg); }
          75% { transform: translateX(3px) translateY(8px) rotate(1deg); }
        }
        
        @keyframes drift-right {
          0%, 100% { transform: translateX(0) translateY(0); opacity: 0.5; }
          50% { transform: translateX(25px) translateY(-10px); opacity: 0.8; }
        }
        
        @keyframes drift-left {
          0%, 100% { transform: translateX(0) translateY(0); opacity: 0.5; }
          50% { transform: translateX(-25px) translateY(-10px); opacity: 0.8; }
        }
        
        @keyframes drift-up {
          0%, 100% { transform: translateX(0) translateY(0); opacity: 0.5; }
          50% { transform: translateX(-10px) translateY(-30px); opacity: 0.8; }
        }
        
        @keyframes drift-down {
          0%, 100% { transform: translateX(0) translateY(0); opacity: 0.5; }
          50% { transform: translateX(10px) translateY(25px); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}