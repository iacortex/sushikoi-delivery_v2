export type DrinkItem = { id: string; name: string; price: number; tags?: string[] };
export type DrinkCategory = { key: string; title: string; items: DrinkItem[]; collapsedByDefault?: boolean };

const mk = (name: string, price: number, tags: string[] = []): DrinkItem => ({
  id: `${name}-${price}`.replace(/\s+/g, "-").toLowerCase(),
  name, price, tags
});

export const DRINKS_CATALOG: DrinkCategory[] = [
  { key: "coca-cola", title: "Gaseosas Coca-Cola", items: [
    mk("Coca Cola Express", 700, ["express"]),
    mk("Coca Cola 220ml", 950, ["220ml"]),
    mk("Coca Cola Sin Azúcar 220ml", 950, ["sin azúcar","220ml"]),
    mk("Coca Cola Botella 350ml", 1000, ["350ml","botella"]),
    mk("Coca Cola 350ml", 1500, ["350ml"]),
    mk("Coca Cola 591ml", 1800, ["591ml"]),
    mk("Coca Cola 1.5L", 2500, ["1.5L"]),
    mk("Coca Cola Sin Azúcar 1.5L", 2500, ["sin azúcar","1.5L"]),
  ]},
  { key: "sprite", title: "Sprite", items: [
    mk("Sprite 220ml", 950, ["220ml"]),
    mk("Sprite Sin Azúcar 220ml", 950, ["sin azúcar","220ml"]),
    mk("Sprite 350ml", 1500, ["350ml"]),
    mk("Sprite Sin Azúcar 350ml", 1500, ["sin azúcar","350ml"]),
    mk("Sprite 591ml", 1800, ["591ml"]),
    mk("Sprite 1.5L", 2500, ["1.5L"]),
    mk("Sprite Sin Azúcar 1.5L", 2500, ["sin azúcar","1.5L"]),
  ]},
  { key: "fanta", title: "Fanta", items: [
    mk("Fanta 220ml", 950, ["220ml"]),
    mk("Fanta 350ml", 1500, ["350ml"]),
    mk("Fanta 591ml", 1800, ["591ml"]),
    mk("Fanta 1.5L", 2500, ["1.5L"]),
  ]},
  { key: "otras-gaseosas", title: "Otras Gaseosas", items: [ mk("Inca Kola 350ml", 1500, ["350ml"]) ]},
  { key: "jugos", title: "Jugos", items: [
    mk("Jugos 200cc (Damasco/Piña/Manzana/Durazno)", 500, ["200cc"]),
    mk("El Valle 400ml (Naranja/Durazno/Multi Frutilla)", 900, ["400ml"]),
    mk("El Valle Lata 340ml (Durazno/Manzana)", 1500, ["340ml","lata"]),
    mk("El Valle Naranja 1.5L", 2200, ["1.5L"]),
    mk("Jugos Guallarauco 1L (Mango/Manzana-Pera/Mango-Piña-Naranja)", 2400, ["1L"]),
    mk("Agua Guallarauco Manzana 1L", 2400, ["1L","agua saborizada"]),
    mk("Agua Guallarauco Limonada Frambuesa 500ml", 1300, ["500ml","limonada"]),
  ]},
  { key: "aguas", title: "Aguas", items: [
    mk("Vital con Gas", 1300, ["con gas"]),
    mk("Vital sin Gas", 1300, ["sin gas"]),
  ]},
  { key: "monster", title: "Bebidas Energéticas Monster 473ml", items: [
    mk("Monster Regular", 2000, ["473ml"]),
    mk("Monster Energy Ultra", 2000, ["473ml"]),
    mk("Monster Limonade", 2000, ["473ml"]),
    mk("Monster Mango Loco", 2000, ["473ml"]),
    mk("Monster Ripper", 2000, ["473ml"]),
    mk("Monster Ultra Gold", 2000, ["473ml"]),
    mk("Monster Ultra Watermelon", 2000, ["473ml"]),
    mk("Monster Zero Sugar", 2000, ["473ml","sin azúcar"]),
  ]},
  { key: "te", title: "Té", items: [ mk("Tetera (Variedad de té para servir)", 2200, ["tetera"]) ], collapsedByDefault: true },
];
