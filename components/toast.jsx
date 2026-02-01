import React from "react";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

export const ToastContainer = ({ toasts }) => {
  if (toasts.length === 0) return null;

  const uniqueToasts = toasts.filter(
    (toast, index, self) =>
      index === self.findIndex((t) => t.message === toast.message),
  );

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-1000 flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4 items-center">
      {uniqueToasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto
            flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-3xl noise
            animate-fade-in transition-all duration-500
            ${
              toast.type === "success"
                ? "bg-white/40 border-green-200/50 text-gray-900"
                : ""
            }
            ${
              toast.type === "error"
                ? "bg-white/40 border-red-200/50 text-red-600"
                : ""
            }
            ${
              toast.type === "info"
                ? "bg-white/40 border-white/60 text-gray-900"
                : ""
            }
          `}
        >
          {toast.type === "success" && (
            <CheckCircle
              size={16}
              strokeWidth={3}
              className="text-green-600 shrink-0"
            />
          )}
          {toast.type === "error" && (
            <AlertCircle
              size={16}
              strokeWidth={3}
              className="text-red-600 shrink-0"
            />
          )}
          {toast.type === "info" && (
            <Info
              size={16}
              strokeWidth={3}
              className="text-blue-600 shrink-0"
            />
          )}
          <span className="text-[12px] font-bold tracking-tight whitespace-nowrap">
            {toast.message}
          </span>
        </div>
      ))}
    </div>
  );
};
