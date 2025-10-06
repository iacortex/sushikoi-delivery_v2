import React from "react";

type Props = {
  open: boolean;
  defaultValue?: "delivery" | "local";
  onSelect: (v: "delivery" | "local") => void;
  onClose: () => void;
};

const ServiceTypeModal: React.FC<Props> = ({ open, defaultValue = "delivery", onSelect, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-[360px] p-5">
        <h3 className="text-lg font-semibold mb-1">¿Cómo será el pedido?</h3>
        <p className="text-sm text-gray-600 mb-4">
          Selecciona el tipo de servicio para calcular el total correctamente.
        </p>
        <div className="grid grid-cols-1 gap-2">
          <button
            className={`px-4 py-3 rounded-lg border hover:bg-gray-50 text-left ${
              defaultValue === "delivery" ? "border-rose-500" : ""
            }`}
            onClick={() => {
              onSelect("delivery");
              onClose();
            }}
          >
            <div className="font-medium">Delivery</div>
            <div className="text-xs text-gray-500">Calculamos automáticamente $500 por km.</div>
          </button>
          <button
            className={`px-4 py-3 rounded-lg border hover:bg-gray-50 text-left ${
              defaultValue === "local" ? "border-rose-500" : ""
            }`}
            onClick={() => {
              onSelect("local");
              onClose();
            }}
          >
            <div className="font-medium">Retiro en local</div>
            <div className="text-xs text-gray-500">No se cobra delivery.</div>
          </button>
        </div>
        <div className="mt-4 text-right">
          <button onClick={onClose} className="text-sm text-gray-600 hover:underline">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceTypeModal;
