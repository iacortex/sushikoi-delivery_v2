# 🍣 Sushi Delivery Puerto Montt

Sistema moderno de gestión de delivery de sushi con roles, geocodificación exacta, mapas interactivos, ruteo OSRM y seguimiento en tiempo real.

## ✨ Características

- **🏪 Multi-rol**: Cajero, Cocina, Delivery, Cliente + Dashboard ejecutivo
- **🗺️ Geocodificación avanzada**: Nominatim con precisión de numeración
- **📍 Mapas interactivos**: Leaflet con marcadores arrastrables y rutas
- **🛣️ Ruteo inteligente**: OSRM para distancias y tiempos reales
- **📱 QR tracking**: Códigos QR para Waze y seguimiento de pedidos
- **💳 Gestión de pagos**: Múltiples métodos con estados paid/due
- **📊 Dashboard**: Estadísticas, top clientes y métricas en tiempo real
- **💾 Persistencia local**: localStorage para funcionar sin backend
- **♿ Accesible**: ARIA labels y navegación por teclado

## 🛠️ Stack Tecnológico

- **Frontend**: Vite + React 18 + TypeScript
- **Estilos**: Tailwind CSS v3 (no v4)
- **Iconos**: Lucide React
- **Mapas**: Leaflet 1.9.x (carga dinámica)
- **Geocoding**: Nominatim (OpenStreetMap)
- **Ruteo**: OSRM público
- **QR**: api.qrserver.com
- **Persistencia**: localStorage

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- pnpm (recomendado) o npm

### Instalación

```bash
# Clonar el proyecto
git clone <repository-url>
cd sushi-delivery

# Instalar dependencias
pnpm install
# o con npm:
# npm install

# Ejecutar en desarrollo
pnpm dev
# o con npm:
# npm run dev
```

### Scripts Disponibles

```bash
# Desarrollo
pnpm dev          # Servidor de desarrollo en http://localhost:5173

# Construcción
pnpm build        # Build para producción
pnpm preview      # Preview del build

# Linting
pnpm lint         # ESLint + TypeScript check
```

### Variables de Entorno (Opcional)

Crear `.env.local` en la raíz del proyecto:

```env
VITE_APP_TITLE="Sushi Delivery Puerto Montt"
VITE_OSRM_BASE_URL="https://router.project-osrm.org"
VITE_NOMINATIM_BASE_URL="https://nominatim.openstreetmap.org"
```

## 📁 Estructura del Proyecto

```
sushi-delivery/
├── src/
│   ├── app/
│   │   └── App.tsx                 # Componente principal
│   ├── components/
│   │   ├── layout/                 # Header, RoleSelector, TabNavigation
│   │   ├── dashboard/              # Dashboard, StatsCards, TopClientsTable
│   │   ├── cashier/                # PromotionsGrid, CustomerForm, CartPanel
│   │   ├── cook/                   # CookBoard, OrderRow
│   │   ├── delivery/               # DeliveryOrderCard, DeliveryList
│   │   └── client/                 # ClientTracker, TotemBoard
│   ├── features/
│   │   ├── orders/                 # helpers.ts, useOrders.ts, orders.types.ts
│   │   ├── customers/              # useCustomers.ts, customers.types.ts
│   │   ├── geocoding/              # useGeocoding.ts, geocoder.ts
│   │   └── map/                    # LeafletMap.tsx, loadLeaflet.ts
│   ├── hooks/                      # useDebounced, useTicker, useLocalStorage
│   ├── lib/                        # format.ts, qr.ts, urls.ts, constants.ts
│   ├── styles/                     # index.css, tailwind.css
│   ├── types/                      # index.ts
│   ├── main.tsx                    # Punto de entrada
│   └── vite-env.d.ts              # Tipos de Vite
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── postcss.config.cjs
├── tailwind.config.cjs
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎯 Funcionalidades por Rol

### 🏪 Cajero/Vendedor
- **Promociones**: Grid de 6 promociones con descuentos y tiempos
- **Carrito**: Agregar/quitar items con cantidades
- **Clientes**: Formulario con geocodificación y búsqueda de existentes
- **Mapa**: Marcador arrastrable con ruta OSRM automática
- **Validaciones**: Teléfono chileno, dirección, coordenadas confirmadas
- **Pagos**: Métodos múltiples con estados paid/due

### 👨‍🍳 Cocina
- **Kanban**: Estados pending → cooking → ready
- **Cronómetro**: 90 segundos de empaque automático
- **Tiempos**: Estimados por promoción, progreso visual
- **Auto-marcado**: Packed cuando expira el timer

### 🛵 Delivery  
- **Mapas**: Leaflet con ruta y distancia/tiempo OSRM
- **Navegación**: Botones Google Maps + Waze + QR Waze
- **Pagos**: Confirmar pago antes de marcar entregado
- **Estados**: Ready → Delivered con validaciones

### 🙋 Cliente
- **Seguimiento**: Por teléfono o código de 5 dígitos
- **Progreso**: Barra animada con ETA en tiempo real
- **QR Tracking**: Código para compartir seguimiento
- **Modo Tótem**: Grid de pedidos activos con QRs

### 📊 Dashboard
- **Métricas**: Ventas totales, por estado, por cobrar
- **Top Clientes**: Tabla con totales y cantidad de pedidos
- **Tiempo Real**: Actualización automática cada segundo

## 🧩 Arquitectura

### Patrón Domain-Driven Design

- **Features**: Lógica de negocio agrupada por dominio
- **Components**: UI desacoplada y reutilizable  
- **Hooks**: Estado y efectos encapsulados
- **Types**: Interfaces TypeScript centralizadas
- **Lib**: Utilidades puras sin efectos

### Estado Global Descentralizado

- `useOrders`: Gestión completa de pedidos
- `useCustomers`: Base de datos de clientes
- `useGeocoding`: Geocodificación con rate limiting
- `useLocalStorage`: Persistencia automática

### Carga Dinámica

- **Leaflet**: Sin SSR, carga bajo demanda
- **Componentes**: Lazy loading preparado
- **Chunks**: Separación vendor/ui automática

## 🌍 APIs Externas

### Geocodificación (Nominatim)
```typescript
// Búsqueda estructurada con viewbox Puerto Montt
const result = await geocodeSmart({
  street: "Playa Guabil",
  number: "6191", 
  sector: "Mirasol",
  city: "Puerto Montt"
});
// → { lat, lng, precision: 'exact'|'road'|'fallback' }
```

### Ruteo (OSRM)
```typescript
// Ruta optimizada origen → destino
const route = await fetchRoute(-41.4662, -72.9990);
// → { points, distance, duration }
```

### QR Codes
```typescript
// QR para Waze navigation
const qrUrl = generateWazeQR(wazeUrl, 220);

// QR para tracking de pedido  
const trackingQR = generateTrackingQR(trackingUrl, 140);
```

## 🎨 Diseño y UX

### Sistema de Colores
- **Primary**: Rojo #ef4444 (sushi theme)
- **Status**: Amarillo (pending), Naranja (cooking), Verde (ready), Azul (delivered)
- **Success**: Verde #10b981
- **Warning**: Ámbar #f59e0b
- **Error**: Rojo #ef4444

### Responsive Design
- **Mobile First**: Breakpoints sm/md/lg/xl
- **Touch Friendly**: Botones 44px mínimo
- **Mapas**: Adaptables con fitBounds automático

### Accesibilidad
- **ARIA**: Labels, roles, states
- **Navegación**: Tab order lógico
- **Contraste**: WCAG AA compliance
- **Screen Readers**: Textos descriptivos

## 📱 Características Móviles

- **Viewport**: Meta tag optimizado
- **Touch**: Eventos touch y mouse
- **Orientación**: Portrait/landscape adaptable
- **PWA Ready**: Manifest preparado

## 🧪 Testing (Futuro)

```bash
# Unit tests
pnpm test

# E2E tests  
pnpm test:e2e

# Coverage
pnpm test:coverage
```

## 🚀 Deployment

### Build para Producción

```bash
# Generar build optimizado
pnpm build

# El directorio dist/ contiene los archivos estáticos
# Servir con cualquier servidor web estático
```

### Variables de Producción

```env
# .env.production
VITE_APP_TITLE="Sushi Delivery Puerto Montt"
VITE_API_BASE_URL="https://api.tusushidelivery.com"
```

### Hosting Recomendado

- **Vercel**: Deploy automático desde Git
- **Netlify**: Drag & drop o Git integration  
- **GitHub Pages**: Para proyectos open source
- **Servidor propio**: Nginx/Apache estático

## 🔧 Personalización

### Cambiar Origen/Restaurante

Editar `src/lib/constants.ts`:

```typescript
export const ORIGIN = {
  lat: -41.46619826299714,    // Tu latitud
  lng: -72.99901571534275,    // Tu longitud  
  name: "Tu Restaurante — Dirección completa",
};
```

### Agregar Promociones

Editar `src/features/orders/helpers.ts`:

```typescript
export const PROMOTIONS: Promotion[] = [
  {
    id: 7,
    name: "Nueva Promo",
    description: "Descripción de la promo",
    items: ["Item 1", "Item 2"],
    originalPrice: 10000,
    discountPrice: 8000,
    discount: 20,
    image: "🍱",
    cookingTime: 18,
    popular: false,
  },
  // ... más promociones
];
```

### Personalizar Estilos

```css
/* src/styles/index.css */
:root {
  --primary-color: #ef4444;    /* Rojo sushi */
  --secondary-color: #10b981;  /* Verde success */
  --accent-color: #f59e0b;     /* Ámbar warning */
}
```

## 🐛 Troubleshooting

### Problemas Comunes

#### Leaflet no carga
```bash
# Verificar que el CSS se carga correctamente
# Revisar la consola por errores de red
# Comprobar que loadLeaflet() se ejecuta
```

#### Geocodificación lenta
```bash
# Nominatim tiene rate limiting
# useGeocoding maneja automáticamente el debounce
# Reducir GEOCODING_DEBOUNCE_MS si es necesario
```

#### LocalStorage lleno
```bash
# Limpiar datos antiguos
localStorage.removeItem('sushi_orders');
localStorage.removeItem('sushi_customers');
```

#### Errores de TypeScript
```bash
# Verificar tipos estrictos
pnpm tsc --noEmit

# Rebuild node_modules si es necesario
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Logs de Debug

Activar en desarrollo:

```typescript
// App.tsx - ya incluido
{process.env.NODE_ENV === 'development' && (
  <div className="debug-info">
    {/* Info de debugging */}
  </div>
)}
```

## 📊 Performance

### Métricas Objetivo

- **FCP**: < 1.5s (First Contentful Paint)
- **LCP**: < 2.5s (Largest Contentful Paint)  
- **CLS**: < 0.1 (Cumulative Layout Shift)
- **FID**: < 100ms (First Input Delay)

### Optimizaciones Implementadas

- **Code Splitting**: Chunks automáticos vendor/ui
- **Lazy Loading**: Leaflet bajo demanda
- **Image Optimization**: QR codes optimizados
- **Bundle Analysis**: Vite bundle analyzer

```bash
# Analizar bundle
pnpm build --analyze
```

## 🔒 Seguridad

### Consideraciones

- **XSS**: Sanitización automática de React
- **CORS**: APIs públicas configuradas
- **CSP**: Content Security Policy recomendado
- **localStorage**: Datos no sensibles únicamente

### Headers Recomendados

```nginx
# Para Nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
```

## 🤝 Contribuir

### Desarrollo Local

```bash
# Fork del repositorio
git clone https://github.com/tu-usuario/sushi-delivery
cd sushi-delivery

# Crear branch para feature
git checkout -b feature/nueva-funcionalidad

# Instalar dependencias
pnpm install

# Desarrollar...
pnpm dev

# Commit y push
git add .
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad
```

### Estándares de Código

- **TypeScript**: Strict mode habilitado
- **ESLint**: Configuración estándar React
- **Prettier**: Formateo automático
- **Conventional Commits**: feat/fix/docs/style/refactor

### Pull Requests

1. Descripción clara del cambio
2. Tests si aplica (futuro)
3. Screenshots para cambios UI
4. Actualizar README si es necesario

## 📝 Changelog

### v1.0.0 (Inicial)
- ✅ Arquitectura modular completa
- ✅ Sistema de roles (4 paneles)
- ✅ Geocodificación avanzada Nominatim
- ✅ Mapas Leaflet con rutas OSRM
- ✅ QR codes para navegación y tracking
- ✅ Dashboard ejecutivo
- ✅ Persistencia localStorage
- ✅ Diseño responsive + accesible

### Roadmap v1.1.0
- [ ] Panel de Cajero completo
- [ ] Panel de Cocina con kanban
- [ ] Panel de Delivery con mapas
- [ ] Panel de Cliente con tracking
- [ ] Tests unitarios
- [ ] PWA completa

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

## 👥 Equipo

- **Arquitecto Frontend Senior**: Diseño de arquitectura y implementación base
- **Puerto Montt, Chile**: Localización y testing regional

## 🆘 Soporte

Para problemas o preguntas:

1. **Issues**: GitHub Issues para bugs y features
2. **Discusiones**: GitHub Discussions para preguntas
3. **Email**: soporte@tusushidelivery.com
4. **Docs**: Esta documentación como referencia

---

🍣 **¡Buen desarrollo y que disfrutes creando el mejor sistema de delivery de sushi!** 🍣