// src/components/cashier/EditPromotionModal.tsx
import React, { useEffect, useState } from "react";
import { KioskModal } from "../ui/KioskModal";
import { Plus, Minus, X } from "lucide-react";

export interface EditItem {
  id: number;
  name: string;
  discountPrice: number;
  quantity: number;
}

export default function EditPromotionModal({
  open,
  onClose,
  item,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  item?: EditItem | null;
  onSave: (updated: EditItem) => void;
}) {
  const [qty, setQty] = useState(item?.quantity ?? 1);
  useEffect(() => { setQty(item?.quantity ?? 1); }, [item]);

  if (!item || !open) return null;

  const CLP = (n: number) => new Intl.NumberFormat("es-CL").format(Math.max(0, Math.round(n)));

  return (
    <KioskModal
      open={open}
      onClose={onClose}
      title={`Editar: ${item.name}`}
      subtitle={`ID ${item.id} • $${CLP(item.discountPrice)} c/u`}
      designWidth={520}
      designHeight={360}
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-gray-800">Cantidad</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
            >
              <Minus size={14} />
            </button>
            <span className="text-xl font-bold w-10 text-center">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 border rounded-lg p-3">
          <span>Total ítem</span>
          <b className="text-rose-600">
            ${CLP(item.discountPrice * qty)}
          </b>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center gap-1">
            <X size={14}/> Cancelar
          </button>
          <button
            onClick={() => { onSave({ ...item, quantity: qty }); onClose(); }}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </KioskModal>
  );
}
