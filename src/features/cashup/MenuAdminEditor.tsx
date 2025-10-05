// src/features/cashup/MenuAdminEditor.tsx
import React from "react";
import {
  type MenuItem,
  type MenuDB,
  getMenuDB,
  saveMenuDB,
  subscribeMenu,
} from "@/features/menu/catalog";
import { Plus, Save, Trash2 } from "lucide-react";

const CLP = (n: number) => new Intl.NumberFormat("es-CL").format(Math.max(0, Math.round(n)));
const toNum = (v: string) => Number(String(v).replace(/[^\d]/g, "")) || 0;

const blankItem = (): MenuItem => ({
  id: Date.now(),
  type: "individual",
  name: "",
  price: 0,
  time: 12,
  desc: "",
  category: "PRODUCTOS INDIVIDUALES",
  subgroup: "",
  tags: [],
  emoji: "🍣",
});

const MenuAdminEditor: React.FC = () => {
  const initial = React.useMemo<MenuDB>(() => getMenuDB(), []);
  const [items, setItems] = React.useState<MenuItem[]>(initial.items);
  const [filter, setFilter] = React.useState("");
  const [updatedAt, setUpdatedAt] = React.useState<number>(initial.updatedAt);

  // Ejemplo de suscripción (opcional): si otro tab guarda, refresca este editor.
  React.useEffect(() => {
    return subscribeMenu((db) => {
      setUpdatedAt(db.updatedAt);
      setItems(db.items);
    });
  }, []);

  const filtered = React.useMemo<MenuItem[]>(
    () =>
      (filter
        ? items.filter((m: MenuItem) =>
            [m.name, m.desc, m.category, m.subgroup, ...(m.tags || [])]
              .filter(Boolean)
              .some((s: string | undefined) => String(s).toLowerCase().includes(filter.toLowerCase()))
          )
        : items
      ).sort((a: MenuItem, b: MenuItem) => a.name.localeCompare(b.name)),
    [items, filter]
  );

  const onChangeItem = (idx: number, patch: Partial<MenuItem>) =>
    setItems((prev: MenuItem[]) => prev.map((it: MenuItem, i: number) => (i === idx ? { ...it, ...patch } : it)));

  const onDelete = (idx: number) =>
    setItems((prev: MenuItem[]) => prev.filter((_, i: number) => i !== idx));

  const onAdd = () => setItems((prev: MenuItem[]) => [blankItem(), ...prev]);

  const onSave = async () => {
    const db: MenuDB = { items, updatedAt: Date.now() };
    await saveMenuDB(db); // esto notifica a las vistas suscritas
    setUpdatedAt(db.updatedAt);
    alert("Menú guardado ✅ (se aplicó en caliente)");
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">Editor de Menú</h2>
        <div className="text-xs text-gray-500">Última edición: {new Date(updatedAt).toLocaleString()}</div>
      </div>

      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-lg border hover:bg-gray-50 inline-flex items-center gap-1" onClick={onAdd}>
            <Plus size={16}/> Agregar ítem
          </button>
          <button className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center gap-1" onClick={onSave}>
            <Save size={16}/> Guardar cambios
          </button>
        </div>
        <input
          className="w-80 border rounded-lg px-3 py-2"
          placeholder="Buscar por nombre/categoría/subgrupo/tag…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filtered.map((m: MenuItem, i: number) => (
          <div key={m.id} className="border rounded-lg p-3 bg-white">
            <div className="grid grid-cols-12 gap-2 items-center">
              {/* Tipo */}
              <select
                className="col-span-2 border rounded-lg px-2 py-1.5"
                value={m.type}
                onChange={(e) => onChangeItem(i, { type: e.target.value as MenuItem["type"] })}
              >
                <option value="promo">Promoción</option>
                <option value="individual">Individual</option>
              </select>

              {/* Nombre */}
              <input
                className="col-span-4 border rounded-lg px-2 py-1.5"
                placeholder="Nombre"
                value={m.name}
                onChange={(e) => onChangeItem(i, { name: e.target.value })}
              />

              {/* Precio */}
              <input
                className="col-span-2 border rounded-lg px-2 py-1.5"
                placeholder="Precio"
                inputMode="numeric"
                value={m.price}
                onChange={(e) => onChangeItem(i, { price: toNum(e.target.value) })}
              />

              {/* Tiempo */}
              <input
                className="col-span-2 border rounded-lg px-2 py-1.5"
                placeholder="Tiempo (min)"
                inputMode="numeric"
                value={m.time ?? 0}
                onChange={(e) => onChangeItem(i, { time: toNum(e.target.value) })}
              />

              {/* Quitar */}
              <button
                className="col-span-2 text-red-600 hover:text-red-700 inline-flex items-center gap-1 justify-end"
                onClick={() => onDelete(i)}
              >
                <Trash2 size={16}/> Quitar
              </button>

              {/* Categoría / Subgrupo */}
              <input
                className="col-span-3 border rounded-lg px-2 py-1.5"
                placeholder='Categoría (ej. "PROMOCIONES" o "PRODUCTOS INDIVIDUALES")'
                value={m.category}
                onChange={(e) => onChangeItem(i, { category: e.target.value })}
              />
              <input
                className="col-span-3 border rounded-lg px-2 py-1.5"
                placeholder='Subgrupo (ej. "PROMOCIONES DE FRITOS • Fritos Mixtos")'
                value={m.subgroup ?? ""}
                onChange={(e) => onChangeItem(i, { subgroup: e.target.value })}
              />

              {/* Emoji */}
              <input
                className="col-span-1 border rounded-lg px-2 py-1.5"
                placeholder="Emoji"
                value={m.emoji ?? ""}
                onChange={(e) => onChangeItem(i, { emoji: e.target.value })}
              />

              {/* Tags */}
              <input
                className="col-span-5 border rounded-lg px-2 py-1.5"
                placeholder="Tags separados por coma (frito, salmon, veggie, premium, sin arroz…)"
                value={(m.tags || []).join(", ")}
                onChange={(e) => onChangeItem(i, { tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              />

              {/* Descripción */}
              <input
                className="col-span-12 border rounded-lg px-2 py-1.5"
                placeholder="Descripción"
                value={m.desc ?? ""}
                onChange={(e) => onChangeItem(i, { desc: e.target.value })}
              />
            </div>

            <div className="mt-2 text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
              <div><b>Preview:</b> {m.emoji || (m.type === "promo" ? "🎉" : "🍣")} {m.name} — ${CLP(m.price)}</div>
              <div>• {m.category}{m.subgroup ? ` / ${m.subgroup}` : ""}</div>
              {m.tags?.length ? <div>• tags: {m.tags.join(", ")}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuAdminEditor;
